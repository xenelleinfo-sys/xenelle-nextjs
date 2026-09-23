"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Phone, Printer } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/field";
import { StatusBadge } from "@/components/ui/misc";
import { OrderItems } from "@/components/shop/order-items";
import { AdvanceReview } from "@/components/admin/advance-review";
import { ORDER_STATUSES, ORDER_STATUS_META, PAYMENT_STATUS_LABEL, type OrderStatusValue } from "@/lib/constants";
import { balanceDue, formatDate, formatPrice } from "@/lib/utils";

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

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground print:hidden">
        <ArrowLeft className="size-4" /> Orders
      </Link>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed ${formatDate(order.createdAt, true)}`}
        actions={
          <>
            <StatusBadge status={order.status} className="self-center text-xs" />
            <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
              <Printer className="size-3.5" /> Print
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Panel className="p-5">
            <h2 className="mb-2 font-semibold">Items & Measurements</h2>
            <OrderItems items={order.items} linkProducts={false} />
            <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{formatPrice(order.shippingFee)}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
              {order.advance && (
                <div className="flex justify-between">
                  <dt className="text-muted">Advance {order.advance.status === "VERIFIED" ? "(verified)" : "(not verified)"}</dt>
                  <dd>− {formatPrice(order.advance.amount)}</dd>
                </div>
              )}
              <div className="flex justify-between font-semibold text-accent-dark">
                <dt>Collect on delivery</dt><dd>{formatPrice(balanceDue(order))}</dd>
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
              <h2 className="mb-3 font-semibold">Customer Account</h2>
              <Link href={`/admin/customers/${order.user.id}`} className="font-medium hover:underline">{order.user.name}</Link>
              <p className="text-muted">{order.user.email}</p>
              {order.user.phone && <p className="text-muted">{order.user.phone}</p>}
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <span>Payment: <strong>{PAYMENT_STATUS_LABEL[order.paymentStatus]}</strong></span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="print:hidden"
                  loading={setPayment.isPending}
                  onClick={() =>
                    setPayment.mutate({
                      id,
                      paymentStatus:
                        order.paymentStatus !== "PAID"
                          ? "PAID"
                          : order.advance?.status === "VERIFIED"
                            ? "ADVANCE_PAID"
                            : "UNPAID",
                    })
                  }
                >
                  {order.paymentStatus === "PAID" ? "Undo fully paid" : "Mark fully paid"}
                </Button>
              </div>
            </Panel>
          </div>
        </div>

        <div className="space-y-6 print:hidden">
          <AdvanceReview
            orderId={id}
            orderStatus={order.status}
            advance={order.advance}
            onChanged={async (verified) => {
              if (verified && order.status === "PENDING") setStatus("CONFIRMED");
              await refresh();
            }}
          />
          <Panel className="p-5">
            <h2 className="mb-4 font-semibold">Update Status</h2>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                updateStatus.mutate({ id, status, note: note.trim() || undefined });
              }}
            >
              <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatusValue)} label="Status">
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{ORDER_STATUS_META[s].label}</option>
                ))}
              </Select>
              <Textarea
                label="Note (visible to customer)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="e.g. Courier: TCS, tracking #123456"
                maxLength={300}
              />
              <Button type="submit" className="w-full" loading={updateStatus.isPending} disabled={status === order.status}>
                Update
              </Button>
              {order.advance?.status !== "VERIFIED" && !["PENDING", "CANCELLED"].includes(status) && (
                <p className="text-xs text-danger">Verify the advance payment first.</p>
              )}
              {status === "DELIVERED" && order.status !== "DELIVERED" && (
                <p className="text-xs text-muted">Delivered orders are automatically marked as paid (cash collected).</p>
              )}
            </form>
          </Panel>

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
