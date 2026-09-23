"use client";
import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { PageHeader, Panel, Table } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/misc";
import { formatDate, formatPrice } from "@/lib/utils";

const CustomerDetailPage = ({ id }: { id: string }) => {
  const trpc = useTRPC();
  const { data: user } = useSuspenseQuery(trpc.user.getUserById.queryOptions({ id }));
  const spent = user.orders.filter((o) => o.status === "DELIVERED").reduce((s, o) => s + o.total, 0);

  return (
    <>
      <Link href="/admin/customers" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" /> Customers
      </Link>
      <PageHeader title={user.name} description={`Customer since ${formatDate(user.createdAt)}`} />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Panel className="space-y-3 p-5 text-sm">
          <div><p className="text-xs text-muted">Email</p><p>{user.email}</p></div>
          <div><p className="text-xs text-muted">Phone</p><p>{user.phone ?? "—"}</p></div>
          <div><p className="text-xs text-muted">Role / Status</p><p>{user.role} · {user.isActive ? "Active" : "Blocked"}</p></div>
          <div><p className="text-xs text-muted">Total spent (delivered)</p><p className="font-semibold">{formatPrice(spent)}</p></div>
          {user.address && (
            <div>
              <p className="text-xs text-muted">Saved address</p>
              <p>{user.address.addressLine}, {user.address.city}</p>
            </div>
          )}
        </Panel>
        <Panel>
          <h2 className="border-b border-line px-4 py-3 font-semibold">Orders ({user.orders.length})</h2>
          {user.orders.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">No orders yet.</p>
          ) : (
            <Table>
              <thead><tr><th>Order</th><th>Date</th><th>Status</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {user.orders.map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{o.orderNumber}</Link></td>
                    <td className="text-muted">{formatDate(o.createdAt)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="text-right">{formatPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
};

export default CustomerDetailPage;
