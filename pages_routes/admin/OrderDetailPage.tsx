"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, Phone, Printer } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { PageHeader, Panel } from "@/components/admin/ui";
import { PaymentReview } from "@/components/admin/payment-review";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/misc";
import { OrderItems } from "@/components/shop/order-items";
import {
  ORDER_STATUSES,
  ORDER_STATUS_META,
  PAYMENT_METHODS,
  PAYMENT_STATUS_LABEL,
  type OrderStatusValue,
} from "@/lib/constants";
import { balanceDue, cn, formatDate, formatPrice } from "@/lib/utils";

const AdminOrderDetailPage = ({ id }: { id: string }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: order } = useSuspenseQuery(trpc.admin.orders.byId.queryOptions({ id }));

  const [status, setStatus] = useState<OrderStatusValue>(order.status);
  const [note, setNote] = useState("");

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.admin.orders.byId.queryKey({ id }) }),
      queryClient.invalidateQueries({ queryKey: trpc.admin.orders.list.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.admin.dashboard.stats.queryKey() }),
    ]);

  const updateStatus = useMutation(
    trpc.admin.orders.updateStatus.mutationOptions({
      onSuccess: async () => {
        toast.success("Order status updated");
        setNote("");
        await refresh();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const setPayment = useMutation(
    trpc.admin.orders.setPayment.mutationOptions({
      onSuccess: async () => {
        toast.success("Payment status updated");
        await refresh();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const isOnline = order.paymentMethod === "ONLINE";
  // online orders move past Pending only after their payment is verified
  const needsVerification = isOnline && order.onlinePayment?.status !== "VERIFIED";
  const blocked = needsVerification && !["PENDING", "CANCELLED"].includes(status);
  const customerName = order.user?.name ?? order.shipping.fullName;
  const customerEmail = order.user?.email ?? order.email;

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground print:hidden">
        <ArrowLeft className="size-4" /> Orders
      </Link>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed ${formatDate(order.createdAt, true)} · ${PAYMENT_METHODS[order.paymentMethod].label}`}
        actions={
          <>
            <StatusBadge status={order.status} className="self-center text-xs" />
            <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
              <Printer className="size-3.5" /> Print
            </Button>
          </>
        }
      />

      {/* Update status: always at the top so it's visible on every screen size */}
      <Panel className="mb-6 p-4 print:hidden">
        <form
          className="flex flex-col gap-3 md:flex-row md:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            updateStatus.mutate({ id, status, note: note.trim() || undefined });
          }}
        >
          <label className="block md:w-52">
            <span className="field-label">Order status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatusValue)}
              className="field"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{ORDER_STATUS_META[s].label}</option>
              ))}
            </select>
          </label>
          <label className="block flex-1">
            <span className="field-label">Note for customer (optional)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              placeholder="e.g. Courier: TCS, tracking #123456"
              className="field"
            />
          </label>
          <Button
            type="submit"
            className="md:w-40"
            loading={updateStatus.isPending}
            disabled={status === order.status || blocked}
          >
            Update Status
          </Button>
        </form>
        {blocked && (
          <p className="mt-2 text-xs text-danger">
            Verify the online payment (below) before moving this order forward.
          </p>
        )}
        {!blocked && status === "DELIVERED" && order.status !== "DELIVERED" && (
          <p className="mt-2 text-xs text-muted">Delivered orders are automatically marked as paid.</p>
        )}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <Panel className="p-5">
            <h2 className="mb-2 font-semibold">Items & Measurements</h2>
            <OrderItems items={order.items} linkProducts={false} />
            <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              {order.coupon && !!order.discount && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Coupon <span className="font-mono">{order.coupon.code}</span> ({order.coupon.percent}%)</dt>
                  <dd>− {formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd>{order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}</dd>
              </div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
              <div className={cn("flex justify-between font-semibold", balanceDue(order) > 0 ? "text-accent-dark" : "text-emerald-700")}>
                <dt>{isOnline ? "Balance to collect" : "Collect on delivery"}</dt>
                <dd>{balanceDue(order) === 0 ? "Nothing — paid" : formatPrice(balanceDue(order))}</dd>
              </div>
            </dl>
          </Panel>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel className="p-5 text-sm">
              <h2 className="mb-3 font-semibold">Delivery</h2>
              <p className="font-medium">{order.shipping.fullName}</p>
              <a href={`tel:${order.shipping.phone}`} className="inline-flex items-center gap-1 text-accent hover:underline">
                <Phone className="size-3.5" /> {order.shipping.phone}
              </a>
              <p className="mt-2">{order.shipping.addressLine}</p>
              <p>
                {order.shipping.city}
                {order.shipping.province ? `, ${order.shipping.province}` : ""} {order.shipping.postalCode ?? ""}
              </p>
              {order.notes && (
                <p className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-900"><strong>Customer note:</strong> {order.notes}</p>
              )}
            </Panel>
            <Panel className="p-5 text-sm">
              <h2 className="mb-3 font-semibold">Customer</h2>
              {order.user ? (
                <Link href={`/admin/customers/${order.user.id}`} className="font-medium hover:underline">{customerName}</Link>
              ) : (
                <p className="font-medium">
                  {customerName} <span className="ml-1 rounded bg-soft px-1.5 py-0.5 text-[11px] font-normal text-muted">Guest</span>
                </p>
              )}
              {customerEmail && (
                <a href={`mailto:${customerEmail}`} className="mt-1 flex items-center gap-1 text-muted hover:text-foreground">
                  <Mail className="size-3.5" /> {customerEmail}
                </a>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <span>Payment: <strong>{PAYMENT_STATUS_LABEL[order.paymentStatus]}</strong></span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="print:hidden"
                  loading={setPayment.isPending}
                  onClick={() => setPayment.mutate({ id, paymentStatus: order.paymentStatus === "PAID" ? "UNPAID" : "PAID" })}
                >
                  {order.paymentStatus === "PAID" ? "Mark unpaid" : "Mark paid"}
                </Button>
              </div>
            </Panel>
          </div>
        </div>

        <div className="space-y-6 print:hidden">
          <PaymentReview
            orderId={id}
            orderStatus={order.status}
            payment={order.onlinePayment}
            onChanged={async (verified) => {
              if (verified && order.status === "PENDING") setStatus("CONFIRMED");
              await refresh();
            }}
          />
          <Panel className="p-5">
            <h2 className="mb-4 font-semibold">History</h2>
            <ol className="space-y-4">
              {[...order.history].reverse().map((h, i) => (
                <li key={i} className="border-l-2 border-line pl-3 text-sm">
                  <StatusBadge status={h.status} />
                  {h.note && <p className="mt-1">{h.note}</p>}
                  <p className="mt-0.5 text-xs text-muted">{formatDate(h.createdAt, true)}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </>
  );
};

export default AdminOrderDetailPage;
