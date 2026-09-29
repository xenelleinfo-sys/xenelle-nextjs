"use client";
import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@/trpc/types";
import { Modal, PageHeader, Panel, Table, Toggle } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { couponInputSchema } from "@/lib/validators";

type Coupon = RouterOutputs["admin"]["coupons"]["list"][number];

type FormState = {
  code: string;
  description: string;
  percent: string;
  minSubtotal: string;
  maxUses: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
};

const empty: FormState = {
  code: "",
  description: "",
  percent: "10",
  minSubtotal: "",
  maxUses: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

// <input type="date"> works with yyyy-mm-dd in local time
const toDateInput = (d: Date | string | null) => {
  if (!d) return "";
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

function couponState(c: Coupon) {
  const now = Date.now();
  if (!c.isActive) return { label: "Disabled", tone: "bg-zinc-100 text-zinc-600 ring-zinc-200" };
  if (c.expiresAt && new Date(c.expiresAt).getTime() <= now) return { label: "Expired", tone: "bg-rose-50 text-rose-700 ring-rose-200" };
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return { label: "Scheduled", tone: "bg-sky-50 text-sky-700 ring-sky-200" };
  if (c.maxUses != null && c.usedCount >= c.maxUses) return { label: "Used up", tone: "bg-amber-50 text-amber-800 ring-amber-200" };
  return { label: "Live", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
}

const CouponsPage = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: coupons } = useSuspenseQuery(trpc.admin.coupons.list.queryOptions());
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: trpc.admin.coupons.list.queryKey() });
  const remove = useMutation(
    trpc.admin.coupons.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Coupon deleted");
        invalidate();
      },
      onError: (e) => toast.error(e.message),
    }),
  );
  const setActive = useMutation(
    trpc.admin.coupons.setActive.mutationOptions({ onSuccess: invalidate, onError: (e) => toast.error(e.message) }),
  );

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Discount codes customers enter at checkout — a percentage off the order subtotal"
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="size-3.5" /> Add Coupon
          </Button>
        }
      />
      <Panel>
        {coupons.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">No coupons yet. Create one, e.g. EID20 for 20% off.</p>
        ) : (
          <Table>
            <thead>
              <tr><th>Code</th><th>Discount</th><th>Rules</th><th>Used</th><th>Status</th><th>Active</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const state = couponState(c);
                return (
                  <tr key={c.id}>
                    <td>
                      <p className="font-mono font-semibold">{c.code}</p>
                      {c.description && <p className="text-xs text-muted">{c.description}</p>}
                    </td>
                    <td className="font-semibold">{c.percent}% off</td>
                    <td className="text-xs text-muted">
                      {c.minSubtotal != null && <p>Min. order {formatPrice(c.minSubtotal)}</p>}
                      {c.startsAt && <p>From {formatDate(c.startsAt)}</p>}
                      {c.expiresAt && <p>Until {formatDate(c.expiresAt)}</p>}
                      {c.minSubtotal == null && !c.startsAt && !c.expiresAt && <p>No limits</p>}
                    </td>
                    <td className="whitespace-nowrap">
                      {c.usedCount}
                      {c.maxUses != null && <span className="text-muted"> / {c.maxUses}</span>}
                    </td>
                    <td>
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset", state.tone)}>
                        {state.label}
                      </span>
                    </td>
                    <td>
                      <Toggle
                        label="Active"
                        checked={c.isActive}
                        disabled={setActive.isPending}
                        onChange={(isActive) => setActive.mutate({ id: c.id, isActive })}
                      />
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button className="rounded p-2 text-muted hover:bg-soft hover:text-foreground" onClick={() => setEditing(c)} aria-label="Edit">
                          <Pencil className="size-4" />
                        </button>
                        <button
                          className="rounded p-2 text-muted hover:bg-rose-50 hover:text-danger"
                          aria-label="Delete"
                          onClick={() => confirm(`Delete coupon ${c.code}? Past orders keep their discount.`) && remove.mutate({ id: c.id })}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Panel>

      {editing && (
        <CouponForm
          coupon={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            invalidate();
          }}
        />
      )}
    </>
  );
};

function CouponForm({ coupon, onClose, onSaved }: { coupon: Coupon | null; onClose: () => void; onSaved: () => void }) {
  const trpc = useTRPC();
  const [form, setForm] = useState<FormState>(
    coupon
      ? {
          code: coupon.code,
          description: coupon.description ?? "",
          percent: String(coupon.percent),
          minSubtotal: coupon.minSubtotal == null ? "" : String(coupon.minSubtotal),
          maxUses: coupon.maxUses == null ? "" : String(coupon.maxUses),
          startsAt: toDateInput(coupon.startsAt),
          expiresAt: toDateInput(coupon.expiresAt),
          isActive: coupon.isActive,
        }
      : empty,
  );
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const opts = {
    onSuccess: () => {
      toast.success(coupon ? "Coupon updated" : "Coupon created");
      onSaved();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  };
  const create = useMutation(trpc.admin.coupons.create.mutationOptions(opts));
  const update = useMutation(trpc.admin.coupons.update.mutationOptions(opts));

  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  return (
    <Modal open onClose={onClose} title={coupon ? `Edit ${coupon.code}` : "New Coupon"}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = couponInputSchema.safeParse({
            code: form.code,
            description: form.description.trim() || null,
            percent: Number(form.percent),
            minSubtotal: num(form.minSubtotal),
            maxUses: num(form.maxUses),
            // start of day / end of day in local time
            startsAt: form.startsAt ? new Date(`${form.startsAt}T00:00:00`) : null,
            expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`) : null,
            isActive: form.isActive,
          });
          if (!parsed.success) return toast.error(parsed.error.issues[0].message);
          if (coupon) update.mutate({ id: coupon.id, data: parsed.data });
          else create.mutate(parsed.data);
        }}
      >
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <Input
            label="Code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, "") })}
            placeholder="EID20"
            className="[&_input]:font-mono"
            required
          />
          <Input label="Discount %" type="number" min={1} max={100} value={form.percent} onChange={set("percent")} required />
        </div>
        <Input label="Description (optional)" value={form.description} onChange={set("description")} placeholder="Eid sale — 20% off everything" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Min. order (Rs.)" type="number" min={0} value={form.minSubtotal} onChange={set("minSubtotal")} hint="Optional" />
          <Input label="Max uses" type="number" min={1} value={form.maxUses} onChange={set("maxUses")} hint="Optional, total" />
          <Input label="Starts" type="date" value={form.startsAt} onChange={set("startsAt")} hint="Optional" />
          <Input label="Expires" type="date" value={form.expiresAt} onChange={set("expiresAt")} hint="Optional, end of day" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Active</span>
          <Toggle checked={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} label="Active" />
        </div>
        {coupon && (
          <p className="text-xs text-muted">Used {coupon.usedCount} time(s). Changes apply to new orders only.</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={create.isPending || update.isPending}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}

export default CouponsPage;
