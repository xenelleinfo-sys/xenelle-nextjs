import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { productInputSchema } from "@/lib/validators";
import { invalidate, TAGS } from "@/server/cache-tags";
import { adminProcedure, createTRPCRouter } from "../../init";

async function uniqueProductSlug(base: string, ignoreId?: string) {
  const root = slugify(base) || "product";
  let slug = root;
  for (let i = 2; ; i++) {
    const hit = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === ignoreId) return slug;
    slug = `${root}-${i}`;
  }
}

export const adminProductsRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        q: z.string().optional(),
        categoryId: z.string().optional(),
        status: z.enum(["active", "inactive"]).optional(),
        stock: z.enum(["low", "out"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      const where: Prisma.ProductWhereInput = {};
      if (input.q?.trim()) {
        where.OR = [
          { name: { contains: input.q.trim(), mode: "insensitive" } },
          { sku: { contains: input.q.trim(), mode: "insensitive" } },
        ];
      }
      if (input.categoryId) where.categoryId = input.categoryId;
      if (input.status) where.isActive = input.status === "active";
      if (input.stock === "out") where.stock = { lte: 0 };
      if (input.stock === "low") where.stock = { gt: 0, lte: LOW_STOCK_THRESHOLD };

      const [items, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: { category: { select: { name: true } } },
        }),
        prisma.product.count({ where }),
      ]);
      return { items, total, totalPages: Math.max(1, Math.ceil(total / input.limit)) };
    }),

  byId: adminProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const product = await prisma.product.findUnique({ where: { id: input.id } });
    if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
    return product;
  }),

  create: adminProcedure.input(productInputSchema).mutation(async ({ input }) => {
    const { slug, ...data } = input;
    const product = await prisma.product.create({
      data: { ...data, slug: await uniqueProductSlug(slug || input.name) },
    });
    invalidate(TAGS.products);
    return product;
  }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: productInputSchema }))
    .mutation(async ({ input }) => {
      const existing = await prisma.product.findUnique({
        where: { id: input.id },
        select: { slug: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });

      const { slug, ...data } = input.data;
      const nextSlug =
        slug && slug !== existing.slug ? await uniqueProductSlug(slug, input.id) : existing.slug;
      const product = await prisma.product.update({
        where: { id: input.id },
        data: { ...data, slug: nextSlug },
      });
      invalidate(TAGS.products, TAGS.product(existing.slug), TAGS.product(nextSlug));
      return product;
    }),

  toggle: adminProcedure
    .input(z.object({ id: z.string(), field: z.enum(["isActive", "isFeatured"]), value: z.boolean() }))
    .mutation(async ({ input }) => {
      const product = await prisma.product.update({
        where: { id: input.id },
        data: { [input.field]: input.value },
        select: { slug: true },
      });
      invalidate(TAGS.products, TAGS.product(product.slug));
      return { success: true };
    }),

  // quick stock edit from the products table (null = stop tracking)
  setStock: adminProcedure
    .input(z.object({ id: z.string(), stock: z.number().int().min(0).max(100000).nullable() }))
    .mutation(async ({ input }) => {
      const product = await prisma.product.update({
        where: { id: input.id },
        data: { stock: input.stock },
        select: { slug: true, stock: true },
      });
      invalidate(TAGS.products, TAGS.product(product.slug));
      return product;
    }),

  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    // Orders keep their own snapshot of item name/price/image, so deleting is safe.
    const product = await prisma.product.delete({ where: { id: input.id }, select: { slug: true } });
    invalidate(TAGS.products, TAGS.product(product.slug));
    return { success: true };
  }),
});
