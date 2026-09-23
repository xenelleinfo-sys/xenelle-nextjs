import { z } from "zod";
import { SORT_OPTIONS } from "@/lib/constants";
import {
  getCategories,
  getHomeData,
  getPaymentAccounts,
  getProductBySlug,
  getProducts,
} from "@/server/catalog";
import { baseProcedure, createTRPCRouter } from "../init";

const sortValues = SORT_OPTIONS.map((s) => s.value) as [string, ...string[]];

export const productListInput = z.object({
  category: z.string().optional(),
  q: z.string().max(100).optional(),
  sort: z.enum(sortValues).optional(),
  page: z.number().int().min(1).default(1),
});

// Public, read-only procedures backed by the `"use cache"` data layer.
export const catalogRouter = createTRPCRouter({
  categories: baseProcedure.query(() => getCategories()),

  home: baseProcedure.query(() => getHomeData()),

  products: baseProcedure
    .input(productListInput)
    .query(({ input }) =>
      getProducts({ ...input, sort: input.sort as (typeof SORT_OPTIONS)[number]["value"] }),
    ),

  paymentAccounts: baseProcedure.query(() => getPaymentAccounts()),

  product: baseProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(({ input }) => getProductBySlug(input.slug)),
});
