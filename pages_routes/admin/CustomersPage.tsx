"use client";
import Link from "next/link";
import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { PageHeader, Pager, Panel, StatCard, Table, Toggle, useDebounced } from "@/components/admin/ui";
import { Spinner } from "@/components/ui/misc";
import { cn, formatDate } from "@/lib/utils";

const CustomersPage = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);

  const { data, isFetching } = useQuery({
    ...trpc.user.getUsers.queryOptions({ page, limit: 20, search: q || undefined }),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: trpc.user.getUsers.queryKey() });
  const setStatus = useMutation(
    trpc.user.updateUserStatus.mutationOptions({
      onSuccess: (r) => {
        toast.success(r.message);
        invalidate();
      },
      onError: (e) => toast.error(e.message),
    }),
  );
  const setRole = useMutation(
    trpc.user.updateUserRole.mutationOptions({
      onSuccess: (r) => {
        toast.success(r.message);
        invalidate();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  return (
    <>
      <PageHeader title="Customers" description="Registered users" />
      {data && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <StatCard label="Total" value={data.stats.totalUsers} />
          <StatCard label="Active" value={data.stats.activeUsers} />
          <StatCard label="Blocked" value={data.stats.inactiveUsers} />
        </div>
      )}
      <Panel>
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search className="size-4 text-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email or phone"
            className="flex-1 bg-transparent text-sm outline-none"
          />
          {isFetching && <Spinner className="size-4" />}
        </div>
        {!data ? (
          <div className="flex justify-center p-10"><Spinner /></div>
        ) : data.users.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">No customers found.</p>
        ) : (
          <Table>
            <thead>
              <tr><th>Name</th><th>Contact</th><th>Orders</th><th>Joined</th><th>Role</th><th>Active</th></tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id} className="hover:bg-soft/60">
                  <td><Link href={`/admin/customers/${u.id}`} className="font-medium hover:underline">{u.name}</Link></td>
                  <td>
                    <p>{u.email}</p>
                    <p className="text-xs text-muted">{u.phone}</p>
                  </td>
                  <td>{u._count.orders}</td>
                  <td className="whitespace-nowrap text-muted">{formatDate(u.createdAt)}</td>
                  <td>
                    <select
                      value={u.role}
                      disabled={setRole.isPending}
                      onChange={(e) => {
                        const role = e.target.value as "USER" | "ADMIN";
                        if (confirm(`Change ${u.name}'s role to ${role}?`)) setRole.mutate({ userId: u.id, role });
                      }}
                      className={cn("rounded border border-line px-2 py-1 text-xs", u.role === "ADMIN" && "font-semibold text-accent")}
                    >
                      <option value="USER">Customer</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td>
                    <Toggle
                      label="Active"
                      checked={u.isActive}
                      disabled={setStatus.isPending}
                      onChange={(v) => setStatus.mutate({ userId: u.id, action: v ? "activate" : "deactivate" })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {data && <Pager page={page} totalPages={data.pagination.totalPages} onChange={setPage} />}
      </Panel>
    </>
  );
};

export default CustomersPage;
