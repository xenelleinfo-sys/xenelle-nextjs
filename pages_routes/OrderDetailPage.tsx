"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ArrowLeft, CheckCircle2, Copy, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/misc";
import { OrderTimeline } from "@/components/shop/order-timeline";
import { OrderItems } from "@/components/shop/order-items";
import { OnlinePaymentStatusCard } from "@/components/shop/online-payment-status";
import { PAYMENT_METHODS } from "@/lib/constants";
import { orderHref } from "@/lib/recent-orders";
import { balanceDue, formatDate, formatPrice } from "@/lib/utils";

const OrderDetailPage = ({
  orderNumber,
  token,
  placed,
}: {
  orderNumber: string;
  /** secret link token (guest orders) */
  token?: string;
  placed?: boolean;
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { status: sessionStatus } = useSession();
  const { data: order } = useSuspenseQuery(trpc.order.view.queryOptions({ orderNumber, token }));
  const [copied, setCopied] = useState(false);

  const cancel = useMutation(
    trpc.order.cancel.mutationOptions({
      onSuccess: () => {
        toast.success("Order cancelled");
        queryClient.invalidateQueries({ queryKey: trpc.order.view.queryKey({ orderNumber, token }) });
        if (sessionStatus === "authenticated") queryClient.invalidateQueries({ queryKey: trpc.order.mine.queryKey() });
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const isOnline = order.paymentMethod === "ONLINE";
  const due = balanceDue(order);

  const copyLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}${orderHref(order.orderNumber, token)}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="space-y-8">
      <Link
        href={sessionStatus === "authenticated" ? "/account/orders" : "/track"}
        className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> {sessionStatus === "authenticated" ? "My orders" : "Track an order"}
      </Link>

      {placed && (
        <div className="flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">Thank you! Your order {order.orderNumber} has been placed.</p>
            <p className="mt-1 text-sm">
              {isOnline
                ? "We've received your payment screenshot and will confirm your order as soon as the payment is verified."
                : `Please keep ${formatPrice(order.total)} cash ready on delivery.`}{" "}
              We may call you on <strong>{order.shipping.phone}</strong> to confirm your measurements.
            </p>
          </div>
        </div>
      )}

      {token && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-soft p-4 text-sm">
          <p className="flex items-start gap-2">
            <Link2 className="mt-0.5 size-4 shrink-0 text-accent" />
            <span>
              Save this page to track your order. You can also find it anytime from{" "}
              <Link href="/track" className="underline underline-offset-2">Track Order</Link> with your order number
              and phone number.
            </span>
          </p>
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="size-3.5" /> {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Order</p>
          <h1 className="heading-display text-3xl lg:text-4xl">{order.orderNumber}</h1>
          <p className="mt-1 text-xs text-muted">Placed on {formatDate(order.createdAt, true)}</p>
        </div>
        <StatusBadge status={order.status} className="text-xs" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-8">
          <section className="card p-5">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em]">Items</h2>
            <OrderItems items={order.items} />
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              {order.coupon && !!order.discount && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Coupon {order.coupon.code} ({order.coupon.percent}%)</dt>
                  <dd>− {formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Delivery</dt><dd>{order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}</dd>
              </div>
              <div className="flex justify-between text-base font-medium">
                <dt>Total</dt><dd>{formatPrice(order.total)}</dd>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <dt>Payment</dt><dd>{PAYMENT_METHODS[order.paymentMethod].label}</dd>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <dt>{isOnline ? "Balance" : "Pay on delivery"}</dt>
                <dd>{due === 0 ? "Paid" : formatPrice(due)}</dd>
              </div>
            </dl>
          </section>

          <section className="card p-5 text-sm">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.2em]">Delivery Address</h2>
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
            <h2 className="mb-5 text-xs font-medium uppercase tracking-[0.2em]">Track Order</h2>
            <OrderTimeline status={order.status} history={order.history} />
          </section>
          {order.onlinePayment && (
            <OnlinePaymentStatusCard
              orderNumber={order.orderNumber}
              token={token}
              payment={order.onlinePayment}
              canResubmit={order.status === "PENDING"}
            />
          )}
          {order.status === "PENDING" && (
            <Button
              variant="outline"
              className="w-full"
              loading={cancel.isPending}
              onClick={() => {
                if (confirm("Cancel this order?")) cancel.mutate({ orderNumber: order.orderNumber, token });
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
