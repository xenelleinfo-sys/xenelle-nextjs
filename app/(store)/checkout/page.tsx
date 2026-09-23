import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import CheckoutPage from "@/pages_routes/CheckoutPage";
import { PageLoader } from "@/components/ui/misc";
import { getAuthServer } from "@/lib/authoption";
import { getQueryClient, HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = { title: "Checkout", robots: NO_INDEX };

export default function Checkout() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CheckoutContent />
    </Suspense>
  );
}

async function CheckoutContent() {
  // proxy.ts already redirects guests; this is the server-side guarantee
  const session = await getAuthServer();
  if (!session) redirect("/login?callbackUrl=/checkout");

  try {
    // throws if the account was deleted / blocked since the cookie was issued
    await Promise.all([
      getQueryClient().fetchQuery(trpc.account.me.queryOptions()),
      prefetch(trpc.catalog.paymentAccounts.queryOptions()),
    ]);
  } catch {
    redirect("/login?callbackUrl=/checkout&expired=1");
  }
  return (
    <HydrateClient>
      <CheckoutPage />
    </HydrateClient>
  );
}
