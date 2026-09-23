import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutPage from "@/pages_routes/CheckoutPage";
import { PageLoader } from "@/components/ui/misc";
import { NO_INDEX } from "@/lib/seo";
import { getSessionUser } from "@/trpc/init";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = { title: "Checkout", robots: NO_INDEX };

export default function Checkout() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CheckoutContent />
    </Suspense>
  );
}

// Guest checkout: no login required. Logged-in customers get their details prefilled.
async function CheckoutContent() {
  // null for guests, and for stale sessions (deleted / blocked account)
  const user = await getSessionUser();
  await Promise.all([
    prefetch(trpc.catalog.paymentAccounts.queryOptions()),
    ...(user ? [prefetch(trpc.account.me.queryOptions())] : []),
  ]);
  return (
    <HydrateClient>
      <CheckoutPage loggedIn={!!user} />
    </HydrateClient>
  );
}
