import type { Metadata } from "next";
import { Suspense } from "react";
import HomePage from "@/pages_routes/HomePage";
import { JsonLd } from "@/components/seo/json-ld";
import { PageLoader } from "@/components/ui/misc";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  // absolute: skip the "%s | Xenelle" template on the home page
  title: { absolute: `${SITE_NAME} — ${SITE_TAGLINE} | 2 Piece & 3 Piece Dress Stitching Online` },
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <Suspense fallback={<PageLoader />}>
        <HomeContent />
      </Suspense>
    </>
  );
}

async function HomeContent() {
  await Promise.all([
    prefetch(trpc.catalog.home.queryOptions()),
    prefetch(trpc.catalog.categories.queryOptions()),
  ]);
  return (
    <HydrateClient>
      <HomePage />
    </HydrateClient>
  );
}
