import "server-only";
import { revalidateTag } from "next/cache";

export const TAGS = {
  categories: "categories",
  products: "products",
  product: (slug: string) => `product:${slug}`,
  paymentAccounts: "payment-accounts",
} as const;

/**
 * Expire cached catalog data right after a DB write.
 * `expire: 0` => the next request blocks on fresh data instead of
 * serving stale content, so customers never see outdated products.
 * (updateTag() is Server-Action only; tRPC runs inside a Route Handler.)
 */
export function invalidate(...tags: string[]) {
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
}
