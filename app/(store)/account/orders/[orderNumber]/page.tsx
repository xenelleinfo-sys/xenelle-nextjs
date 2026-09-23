import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import OrderDetailPage from "@/pages_routes/OrderDetailPage";
import { PageLoader } from "@/components/ui/misc";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

export const metadata: Metadata = { title: "Order Details" };

export default function OrderDetail(props: PageProps<"/account/orders/[orderNumber]">) {
  return (
    <Suspense fallback={<PageLoader />}>
      <OrderDetailContent {...props} />
    </Suspense>
  );
}

async function OrderDetailContent({ params, searchParams }: PageProps<"/account/orders/[orderNumber]">) {
  const [params_, sp] = await Promise.all([params, searchParams]);
  const orderNumber = decodeURIComponent(params_.orderNumber).toUpperCase();
  try {
    await getQueryClient().fetchQuery(trpc.order.byNumber.queryOptions({ orderNumber }));
  } catch {
    notFound();
  }

  return (
    <HydrateClient>
      <OrderDetailPage orderNumber={orderNumber} placed={sp.placed === "1"} />
    </HydrateClient>
  );
}
