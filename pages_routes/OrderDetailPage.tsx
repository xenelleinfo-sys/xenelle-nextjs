"use client";
import Link from "next/link";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/misc";
import { OrderTimeline } from "@/components/shop/order-timeline";
import { OrderItems } from "@/components/shop/order-items";
import { AdvanceStatusCard } from "@/components/shop/advance-status";
import { balanceDue, formatDate, formatPrice } from "@/lib/utils";

const OrderDetailPage = ({ orderNumber, placed }: { orderNumber: string; placed?: boolean }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: order } = useSuspenseQuery(trpc.order.byNumber.queryOptions({ orderNumber }));

  const cancel = useMutation(
    trpc.order.cancel.mutationOptions({
      onSuccess: () => {
        toast.success("Order cancelled");
        queryClient.invalidateQueries({ queryKey: trpc.order.byNumber.queryKey({ orderNumber }) });
        queryClient.invalidateQueries({ queryKey: trpc.order.mine.queryKey() });
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  return (
    <div className="space-y-8">
      <Link href="/account/orders" className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted hover:text-foreground">
        <ArrowLeft className="size-3.5" /> All orders
      </Link>

      {placed && (
        <div className="flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">Thank you! Your order has been placed.</p>
            <p className="mt-1 text-sm">
              We&apos;ve received your advance screenshot and will confirm your order as soon as the payment is
              verified. We may call you on <strong>{order.shipping.phone}</strong> to confirm your measurements.
              {order.advance && (
                <> The balance of {formatPrice(order.total - order.advance.amount)} is payable in cash on delivery.</>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Order</p>
          <h2 className="heading-display text-3xl">{order.orderNumber}</h2>
          <p className="mt-1 text-xs text-muted">Placed on {formatDate(order.createdAt, true)}</p>
        </div>
        <StatusBadge status={order.status} className="text-xs" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <section className="card p-5">
            <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.2em]">Items</h3>
            <OrderItems items={order.items} />
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              <div className="flex justify-between">
                <dt>Shipping</dt><dd>{order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}</dd>
              </div>
              <div className="flex justify-between text-base font-medium">
                <dt>Total</dt><dd>{formatPrice(order.total)}</dd>
              </div>
              {order.advance && (
                <div className="flex justify-between text-xs text-muted">
                  <dt>Advance ({order.advance.status === "VERIFIED" ? "verified" : "not verified yet"})</dt>
                  <dd>{formatPrice(order.advance.amount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-xs text-muted">
                <dt>Cash on delivery</dt>
                <dd>{order.paymentStatus === "PAID" ? "Paid" : formatPrice(balanceDue(order))}</dd>
              </div>
            </dl>
          </section>

          <section className="card p-5 text-sm">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.2em]">Delivery Address</h3>
            <p className="font-medium">{order.shipping.fullName}</p>
            <p className="text-muted">{order.shipping.phone}</p>
            <p className="mt-1">
              {order.shipping.addressLine}, {order.shipping.city}
              {order.shipping.province ? `, ${order.shipping.province}` : ""}
              {order.shipping.postalCode ? ` ${order.shipping.postalCode}` : ""}
            </p>
            {order.notes && <p className="mt-3 text-xs"><span className="text-muted">Notes:</span> {order.notes}</p>}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <h3 className="mb-5 text-xs font-medium uppercase tracking-[0.2em]">Track Order</h3>
            <OrderTimeline status={order.status} history={order.history} />
          </section>
          {order.advance && (
            <AdvanceStatusCard
              orderNumber={order.orderNumber}
              advance={order.advance}
              canResubmit={order.status === "PENDING"}
            />
          )}
          {order.status === "PENDING" && (
            <Button
              variant="outline"
              className="w-full"
              loading={cancel.isPending}
              onClick={() => {
                if (confirm("Cancel this order?")) cancel.mutate({ orderNumber: order.orderNumber });
              }}
            >
              Cancel Order
            </Button>
          )}
        </aside>
      </div>
    </div>
  );
};

export default OrderDetailPage;
