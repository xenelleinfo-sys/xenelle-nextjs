"use client";
import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Banknote, Clock, Package, Scissors, ShoppingCart, Users } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { PageHeader, Panel, StatCard, Table } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/misc";
import { formatDate, formatPrice } from "@/lib/utils";

const DashboardPage = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.admin.dashboard.stats.queryOptions());

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of your stitching orders" />
      {data.toVerify > 0 && (
        <Link
          href="/admin/orders"
          className="mb-4 flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:bg-amber-100"
        >
          <span>
            <strong>{data.toVerify}</strong> advance payment{data.toVerify === 1 ? "" : "s"} waiting for verification
          </span>
          <span className="font-medium">Review →</span>
        </Link>
      )}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <StatCard label="Revenue" value={formatPrice(data.revenue)} hint={`${data.delivered} delivered`} icon={<Banknote className="size-4" />} />
        <StatCard label="Total Orders" value={data.orders} icon={<ShoppingCart className="size-4" />} />
        <StatCard label="Pending" value={data.pending} hint="Awaiting confirmation" icon={<Clock className="size-4" />} />
        <StatCard label="In Progress" value={data.inProgress} hint="Confirmed → Shipped" icon={<Scissors className="size-4" />} />
        <StatCard label="Products" value={data.products} hint="Active designs" icon={<Package className="size-4" />} />
        <StatCard label="Customers" value={data.customers} icon={<Users className="size-4" />} />
      </div>

      <Panel className="mt-6">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-semibold">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-accent hover:underline">View all</Link>
        </div>
        {data.recent.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">No orders yet.</p>
        ) : (
          <Table>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th className="text-right">Total</th></tr>
            </thead>
            <tbody>
              {data.recent.map((o) => (
                <tr key={o.id} className="hover:bg-soft/60">
                  <td><Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{o.orderNumber}</Link></td>
                  <td>
                    <p>{o.shipping.fullName}</p>
                    <p className="text-xs text-muted">{o.shipping.city}</p>
                  </td>
                  <td className="whitespace-nowrap text-muted">{formatDate(o.createdAt)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="text-right font-medium">{formatPrice(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
};

export default DashboardPage;
