"use client";
import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronRight, Package } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, StatusBadge } from "@/components/ui/misc";
import { ProductImage } from "@/components/ui/product-image";
import { AdvanceStatusBadge } from "@/components/shop/advance-status";
import { formatDate, formatPrice } from "@/lib/utils";

const MyOrdersPage = () => {
  const trpc = useTRPC();
  const { data: orders } = useSuspenseQuery(trpc.order.mine.queryOptions());

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Package className="size-12" strokeWidth={1} />}
        title="No orders yet"
        description="When you place an order it will show up here so you can track it."
        action={<ButtonLink href="/shop">Start Shopping</ButtonLink>}
      />
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/account/orders/${o.orderNumber}`} className="card flex items-center gap-4 p-4 transition hover:border-foreground sm:p-5">
            <div className="flex -space-x-4">
              {o.items.slice(0, 3).map((i, idx) => (
                <div key={idx} className="relative aspect-[3/4] w-12 overflow-hidden border-2 border-white bg-soft">
                  <ProductImage src={i.image} alt={i.name} fill sizes="48px" />
                </div>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{o.orderNumber}</p>
                <StatusBadge status={o.status} />
                {o.status === "PENDING" && o.advance && o.advance.status !== "VERIFIED" && (
                  <AdvanceStatusBadge status={o.advance.status} />
                )}
              </div>
              <p className="mt-1 text-xs text-muted">
                {formatDate(o.createdAt)} · {o.items.reduce((s, i) => s + i.quantity, 0)} item(s)
              </p>
            </div>
            <span className="text-sm font-medium">{formatPrice(o.total)}</span>
            <ChevronRight className="size-4 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default MyOrdersPage;
