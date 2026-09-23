import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import OrderDetailPage from "@/pages_routes/OrderDetailPage";
import { PageLoader } from "@/components/ui/misc";
import { NO_INDEX } from "@/lib/seo";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

export const metadata: Metadata = { title: "Order Details", robots: NO_INDEX };

/**
 * Order page for everyone: guests open it with the secret link (?t=token),
 * account holders see their own orders when logged in.
 */
export default function Order(props: PageProps<"/order/[orderNumber]">) {
  return (
    <Suspense fallback={<PageLoader />}>
      <OrderContent {...props} />
    </Suspense>
  );
}

async function OrderContent({ params, searchParams }: PageProps<"/order/[orderNumber]">) {
  const [p, sp] = await Promise.all([params, searchParams]);
  const orderNumber = decodeURIComponent(p.orderNumber).toUpperCase();
  const token = typeof sp.t === "string" ? sp.t : undefined;
  try {
    await getQueryClient().fetchQuery(trpc.order.view.queryOptions({ orderNumber, token }));
  } catch {
    notFound();
  }

  return (
    <HydrateClient>
      <div className="container-x py-10 lg:py-14">
        <OrderDetailPage orderNumber={orderNumber} token={token} placed={sp.placed === "1"} />
      </div>
    </HydrateClient>
  );
}
