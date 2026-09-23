import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { categoryInputSchema } from "@/lib/validators";
import { invalidate, TAGS } from "@/server/cache-tags";
import { adminProcedure, createTRPCRouter } from "../../init";

async function assertSlugFree(slug: string, ignoreId?: string) {
  const hit = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
  if (hit && hit.id !== ignoreId) {
    throw new TRPCError({ code: "CONFLICT", message: `Slug "${slug}" is already used` });
  }
}

export const adminCategoriesRouter = createTRPCRouter({
  list: adminProcedure.query(async () => {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    });
    return categories.map(({ _count, ...c }) => ({ ...c, productCount: _count.products }));
  }),

  create: adminProcedure.input(categoryInputSchema).mutation(async ({ input }) => {
    const slug = slugify(input.slug || input.name);
    await assertSlugFree(slug);
    const category = await prisma.category.create({ data: { ...input, slug } });
    invalidate(TAGS.categories);
    return category;
  }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: categoryInputSchema }))
    .mutation(async ({ input }) => {
      const slug = slugify(input.data.slug || input.data.name);
      await assertSlugFree(slug, input.id);
      const category = await prisma.category.update({
        where: { id: input.id },
        data: { ...input.data, slug },
      });
      // product cards embed the category name/slug
      invalidate(TAGS.categories, TAGS.products);
      return category;
    }),

  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const count = await prisma.product.count({ where: { categoryId: input.id } });
    if (count > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Move or delete the ${count} product(s) in this category first`,
      });
    }
    await prisma.category.delete({ where: { id: input.id } });
    invalidate(TAGS.categories);
    return { success: true };
  }),
});
