import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PRODUCTS_PER_PAGE, type SortValue } from "@/lib/constants";
import { TAGS } from "./cache-tags";

/*
 * Public catalog reads. Every function here is cached with `"use cache"`
 * and tagged. Results stay cached indefinitely (`cacheLife("max")`) and are
 * only refetched from MongoDB after an admin write calls invalidate(tag).
 */

const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  salePrice: true,
  images: true,
  fabric: true,
  isFeatured: true,
  createdAt: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ProductSelect;

export type ProductCard = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export async function getCategories() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.categories, TAGS.products);

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });

  return categories.map(({ _count, ...c }) => ({ ...c, productCount: _count.products }));
}

export type ProductListInput = {
  category?: string;
  q?: string;
  sort?: SortValue;
  page?: number;
};

export async function getProducts(input: ProductListInput) {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.products, TAGS.categories);

  const page = Math.max(1, input.page ?? 1);
  const where: Prisma.ProductWhereInput = { isActive: true };

  let category: { id: string; name: string; slug: string; description: string | null } | null =
    null;
  if (input.category) {
    category = await prisma.category.findFirst({
      where: { slug: input.category, isActive: true },
      select: { id: true, name: true, slug: true, description: true },
    });
    if (!category) {
      return { category: null, notFound: true, products: [], total: 0, page, totalPages: 0 };
    }
    where.categoryId = category.id;
  }

  const q = input.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { fabric: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    input.sort === "price-asc"
      ? { price: "asc" }
      : input.sort === "price-desc"
        ? { price: "desc" }
        : input.sort === "name"
          ? { name: "asc" }
          : { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * PRODUCTS_PER_PAGE,
      take: PRODUCTS_PER_PAGE,
      select: productCardSelect,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    category,
    notFound: false,
    products,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE)),
  };
}

export async function getHomeData() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.products, TAGS.categories);

  const [featured, newArrivals] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: productCardSelect,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: productCardSelect,
    }),
  ]);

  return { featured, newArrivals };
}

/** Everything public, for sitemap.xml and llms.txt. */
export async function getCatalogIndex() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.products, TAGS.categories);

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { name: true, slug: true, description: true, updatedAt: true },
    }),
    prisma.product.findMany({
      where: { isActive: true, category: { is: { isActive: true } } },
      orderBy: { createdAt: "desc" },
      select: {
        name: true,
        slug: true,
        description: true,
        price: true,
        salePrice: true,
        images: true,
        fabric: true,
        includes: true,
        deliveryDays: true,
        updatedAt: true,
        category: { select: { name: true, slug: true } },
      },
    }),
  ]);
  return { categories, products };
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.product(slug), TAGS.products);

  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });
  if (!product) return null;

  const related = await prisma.product.findMany({
    where: { isActive: true, categoryId: product.categoryId, id: { not: product.id } },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: productCardSelect,
  });

  return { product, related };
}

/** Active JazzCash / EasyPaisa / bank accounts shown at checkout. */
export async function getPaymentAccounts() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.paymentAccounts);

  return prisma.paymentAccount.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      provider: true,
      accountTitle: true,
      accountNumber: true,
      bankName: true,
      instructions: true,
    },
  });
}
