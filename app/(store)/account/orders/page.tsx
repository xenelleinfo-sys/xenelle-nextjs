import type { Metadata } from "next";
import { Suspense } from "react";
import MyOrdersPage from "@/pages_routes/MyOrdersPage";
import { PageLoader } from "@/components/ui/misc";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = { title: "My Orders" };

export default function MyOrders() {
  return (
    <Suspense fallback={<PageLoader />}>
      <MyOrdersContent />
    </Suspense>
  );
}

// Per-user data: never cached on the server, always fresh from the DB.
async function MyOrdersContent() {
  await prefetch(trpc.order.mine.queryOptions());
  return (
    <HydrateClient>
      <MyOrdersPage />
    </HydrateClient>
  );
}
