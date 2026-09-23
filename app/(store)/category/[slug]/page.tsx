import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ShopPage from "@/pages_routes/ShopPage";
import { JsonLd } from "@/components/seo/json-ld";
import { PageLoader } from "@/components/ui/misc";
import { SITE_NAME } from "@/lib/constants";
import { parseListingParams } from "@/lib/search-params";
import { breadcrumbJsonLd } from "@/lib/seo";
import { getCategories } from "@/server/catalog";
import { getQueryClient, HydrateClient, prefetch, trpc } from "@/trpc/server";

export async function generateMetadata({ params, searchParams }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = (await getCategories()).find((c) => c.slug === slug);
  if (!category) return { title: "Category not found", robots: { index: false } };

  const { page } = parseListingParams(sp);
  const title = `${category.name} Stitching Designs`;
  const description =
    category.description ??
    `Shop ${category.name.toLowerCase()} designs at ${SITE_NAME}, custom stitched to your size with cash on delivery.`;
  const canonical = `/category/${slug}${page > 1 ? `?page=${page}` : ""}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: canonical,
      ...(category.image ? { images: [{ url: category.image, alt: category.name }] } : {}),
    },
  };
}

export default function CategoryPage(props: PageProps<"/category/[slug]">) {
  return (
    <Suspense fallback={<PageLoader />}>
      <CategoryContent {...props} />
    </Suspense>
  );
}

async function CategoryContent({ params, searchParams }: PageProps<"/category/[slug]">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const input = { ...parseListingParams(sp), category: slug };

  // awaited so we can 404 unknown categories; result comes from the cache
  const [data] = await Promise.all([
    getQueryClient().fetchQuery(trpc.catalog.products.queryOptions(input)),
    prefetch(trpc.catalog.categories.queryOptions()), // sidebar
  ]);
  if (data.notFound || !data.category) notFound();

  return (
    <HydrateClient>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: data.category.name, path: `/category/${slug}` },
        ])}
      />
      <ShopPage input={input} />
    </HydrateClient>
  );
}
