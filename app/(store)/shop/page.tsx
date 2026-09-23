import type { Metadata } from "next";
import { Suspense } from "react";
import ShopPage from "@/pages_routes/ShopPage";
import { PageLoader } from "@/components/ui/misc";
import { SITE_NAME } from "@/lib/constants";
import { parseListingParams } from "@/lib/search-params";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export async function generateMetadata({ searchParams }: PageProps<"/shop">): Promise<Metadata> {
  const { q, page } = parseListingParams(await searchParams);
  const title = q ? `Search results for “${q}”` : "Shop All Stitching Designs";
  const description = `Browse all ${SITE_NAME} designs — 2 piece, 3 piece and formal suits stitched to your size. Cash on delivery across Pakistan.`;
  // sort/search variants all canonicalise to the listing (paginated pages keep their page)
  const canonical = page > 1 ? `/shop?page=${page}` : "/shop";
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title: `${title} | ${SITE_NAME}`, description, url: canonical },
    // search result pages shouldn't compete with real listings
    ...(q ? { robots: { index: false, follow: true } } : {}),
  };
}

export default function Shop({ searchParams }: PageProps<"/shop">) {
  // searchParams is request data -> stream it behind Suspense
  return (
    <Suspense fallback={<PageLoader />}>
      <ShopContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ShopContent({ searchParams }: Pick<PageProps<"/shop">, "searchParams">) {
  const input = parseListingParams(await searchParams);
  await Promise.all([
    prefetch(trpc.catalog.products.queryOptions(input)),
    prefetch(trpc.catalog.categories.queryOptions()), // sidebar
  ]);
  return (
    <HydrateClient>
      <ShopPage input={input} />
    </HydrateClient>
  );
}
