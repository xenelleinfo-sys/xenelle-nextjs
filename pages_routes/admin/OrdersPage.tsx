"use client";
import Link from "next/link";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { PageHeader, Pager, Panel, Table, useDebounced } from "@/components/admin/ui";
import { Spinner, StatusBadge } from "@/components/ui/misc";
import { AdvanceStatusBadge } from "@/components/shop/advance-status";
import { ORDER_STATUSES, ORDER_STATUS_META, PAYMENT_STATUS_LABEL, type OrderStatusValue } from "@/lib/constants";
import { cn, formatDate, formatPrice } from "@/lib/utils";

export const ADMIN_ORDERS_DEFAULT = { page: 1, limit: 20 } as const;

const OrdersPage = () => {
  const trpc = useTRPC();
  const [status, setStatus] = useState<OrderStatusValue | undefined>();
  const [toVerify, setToVerify] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);

  const { data, isFetching } = useQuery({
    ...trpc.admin.orders.list.queryOptions({
      ...ADMIN_ORDERS_DEFAULT,
      page,
      status,
      advance: toVerify ? "verify" : undefined,
      q: q || undefined,
    }),
    placeholderData: keepPreviousData,
  });

  const total = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0;
  const tabs: { value?: OrderStatusValue; label: string; count: number }[] = [
    { label: "All", count: total },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_META[s].label, count: data?.counts[s] ?? 0 })),
  ];

  return (
    <>
      <PageHeader title="Orders" description="Verify advance payments, then track and update stitching orders" />

      <div className="mb-4 flex gap-1 overflow-x-auto">
        <button
          onClick={() => {
            setToVerify(true);
            setStatus(undefined);
            setPage(1);
          }}
          className={cn(
            "shrink-0 rounded-md px-3 py-1.5 text-sm transition",
            toVerify ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-800 hover:bg-amber-100",
          )}
        >
          Payments to verify <span className="ml-1 text-xs opacity-80">{data?.toVerify ?? 0}</span>
        </button>
        {tabs.map((t) => (
          <button
            key={t.label}
            onClick={() => {
              setToVerify(false);
              setStatus(t.value);
              setPage(1);
            }}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm transition",
              !toVerify && status === t.value ? "bg-foreground text-white" : "bg-white text-muted hover:text-foreground",
            )}
          >
            {t.label} <span className="ml-1 text-xs opacity-70">{t.count}</span>
          </button>
        ))}
      </div>

      <Panel>
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search className="size-4 text-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search order #, customer name or phone"
            className="flex-1 bg-transparent text-sm outline-none"
          />
          {isFetching && <Spinner className="size-4" />}
        </div>
        {!data ? (
          <div className="flex justify-center p-10"><Spinner /></div>
        ) : data.items.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">No orders found.</p>
        ) : (
          <Table>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Items</th><th>Date</th><th>Status</th><th>Payment</th><th className="text-right">Total</th></tr>
            </thead>
            <tbody>
              {data.items.map((o) => (
                <tr key={o.id} className="hover:bg-soft/60">
                  <td><Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{o.orderNumber}</Link></td>
                  <td>
                    <p>{o.shipping.fullName}</p>
                    <p className="text-xs text-muted">{o.shipping.phone} · {o.shipping.city}</p>
                  </td>
                  <td>{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td className="whitespace-nowrap text-muted">{formatDate(o.createdAt, true)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="text-xs">
                    {o.advance && o.paymentStatus !== "PAID" ? (
                      <AdvanceStatusBadge status={o.advance.status} />
                    ) : (
                      <span className={o.paymentStatus === "PAID" ? "text-emerald-700" : "text-muted"}>
                        {PAYMENT_STATUS_LABEL[o.paymentStatus]}
                      </span>
                    )}
                  </td>
                  <td className="text-right font-medium">{formatPrice(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {data && <Pager page={page} totalPages={data.totalPages} onChange={setPage} />}
      </Panel>
    </>
  );
};

export default OrdersPage;
