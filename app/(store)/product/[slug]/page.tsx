import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProductPage from "@/pages_routes/ProductPage";
import { JsonLd } from "@/components/seo/json-ld";
import { PageLoader } from "@/components/ui/misc";
import { SITE_NAME } from "@/lib/constants";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo";
import { effectivePrice, formatPrice } from "@/lib/utils";
import { getProductBySlug } from "@/server/catalog";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) return { title: "Product not found", robots: { index: false } };

  const { product } = data;
  const price = formatPrice(effectivePrice(product));
  const summary = product.description.replace(/\s+/g, " ").trim();
  const description = `${product.name} — ${price}. ${[product.fabric, product.includes].filter(Boolean).join(", ")}. Custom stitched in your size, cash on delivery. ${summary}`.slice(0, 160);
  const canonical = `/product/${product.slug}`;
  const images = product.images.slice(0, 4).map((url) => ({ url, alt: product.name }));

  return {
    title: `${product.name} (${product.category.name})`,
    description,
    alternates: { canonical },
    openGraph: { title: `${product.name} | ${SITE_NAME}`, description, url: canonical, images },
    twitter: { card: "summary_large_image", title: product.name, description, images: images.map((i) => i.url) },
    other: {
      "product:price:amount": String(effectivePrice(product)),
      "product:price:currency": "PKR",
      "product:availability": "in stock",
    },
  };
}

export default function Product(props: PageProps<"/product/[slug]">) {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProductContent {...props} />
    </Suspense>
  );
}

async function ProductContent({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const data = await getQueryClient().fetchQuery(trpc.catalog.product.queryOptions({ slug }));
  if (!data) notFound();
  const { product } = data;

  return (
    <HydrateClient>
      <JsonLd
        data={[
          productJsonLd(product),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: product.category.name, path: `/category/${product.category.slug}` },
            { name: product.name, path: `/product/${product.slug}` },
          ]),
        ]}
      />
      <ProductPage slug={slug} />
    </HydrateClient>
  );
}
