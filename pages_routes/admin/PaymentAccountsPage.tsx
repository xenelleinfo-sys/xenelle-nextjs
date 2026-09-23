"use client";
import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@/trpc/types";
import { Modal, PageHeader, Panel, Table, Toggle } from "@/components/admin/ui";
import { ProviderBadge } from "@/components/shop/online-payment";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { PAYMENT_PROVIDERS, type PaymentProviderValue } from "@/lib/constants";
import { paymentAccountInputSchema, type PaymentAccountInput } from "@/lib/validators";

type Account = RouterOutputs["admin"]["paymentAccounts"]["list"][number];

const empty: PaymentAccountInput = {
  provider: "JAZZCASH",
  accountTitle: "",
  accountNumber: "",
  bankName: "",
  instructions: "",
  isActive: true,
  sortOrder: 0,
};

function toInput(a: Account): PaymentAccountInput {
  return {
    provider: a.provider,
    accountTitle: a.accountTitle,
    accountNumber: a.accountNumber,
    bankName: a.bankName ?? "",
    instructions: a.instructions ?? "",
    isActive: a.isActive,
    sortOrder: a.sortOrder,
  };
}

const PaymentAccountsPage = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: accounts } = useSuspenseQuery(trpc.admin.paymentAccounts.list.queryOptions());
  const [editing, setEditing] = useState<Account | "new" | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: trpc.admin.paymentAccounts.list.queryKey() });
  const remove = useMutation(
    trpc.admin.paymentAccounts.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Account deleted");
        invalidate();
      },
      onError: (e) => toast.error(e.message),
    }),
  );
  const toggle = useMutation(
    trpc.admin.paymentAccounts.update.mutationOptions({ onSuccess: invalidate, onError: (e) => toast.error(e.message) }),
  );

  return (
    <>
      <PageHeader
        title="Payment Accounts"
        description="JazzCash / EasyPaisa accounts shown to customers who choose Online Payment"
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="size-3.5" /> Add Account
          </Button>
        }
      />
      {!accounts.some((a) => a.isActive) && (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          No active account — customers can only choose Cash on Delivery until you add one.
        </p>
      )}
      <Panel>
        {accounts.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">No payment accounts yet.</p>
        ) : (
          <Table>
            <thead>
              <tr><th>Provider</th><th>Account</th><th>Title</th><th>Order</th><th>Active</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td><ProviderBadge provider={a.provider} /></td>
                  <td className="font-mono">{a.accountNumber}</td>
                  <td>
                    {a.accountTitle}
                    {a.bankName && <span className="text-xs text-muted"> · {a.bankName}</span>}
                  </td>
                  <td>{a.sortOrder}</td>
                  <td>
                    <Toggle
                      label="Active"
                      checked={a.isActive}
                      disabled={toggle.isPending}
                      onChange={(isActive) => toggle.mutate({ id: a.id, data: { ...toInput(a), isActive } })}
                    />
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button className="rounded p-2 text-muted hover:bg-soft hover:text-foreground" onClick={() => setEditing(a)} aria-label="Edit">
                        <Pencil className="size-4" />
                      </button>
                      <button
                        className="rounded p-2 text-muted hover:bg-rose-50 hover:text-danger"
                        aria-label="Delete"
                        onClick={() => confirm(`Delete ${a.accountNumber}?`) && remove.mutate({ id: a.id })}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      {editing && (
        <AccountForm
          account={editing === "new" ? null : editing}
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

function AccountForm({ account, onClose, onSaved }: { account: Account | null; onClose: () => void; onSaved: () => void }) {
  const trpc = useTRPC();
  const [form, setForm] = useState<PaymentAccountInput>(account ? toInput(account) : empty);
  const opts = {
    onSuccess: () => {
      toast.success(account ? "Account updated" : "Account added");
      onSaved();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  };
  const create = useMutation(trpc.admin.paymentAccounts.create.mutationOptions(opts));
  const update = useMutation(trpc.admin.paymentAccounts.update.mutationOptions(opts));

  return (
    <Modal open onClose={onClose} title={account ? "Edit Account" : "New Payment Account"}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = paymentAccountInputSchema.safeParse({
            ...form,
            bankName: form.bankName || null,
            instructions: form.instructions || null,
          });
          if (!parsed.success) return toast.error(parsed.error.issues[0].message);
          if (account) update.mutate({ id: account.id, data: parsed.data });
          else create.mutate(parsed.data);
        }}
      >
        <Select
          label="Provider"
          value={form.provider}
          onChange={(e) => setForm({ ...form, provider: e.target.value as PaymentProviderValue })}
        >
          {(Object.keys(PAYMENT_PROVIDERS) as PaymentProviderValue[]).map((p) => (
            <option key={p} value={p}>{PAYMENT_PROVIDERS[p].label}</option>
          ))}
        </Select>
        <Input
          label={form.provider === "BANK" ? "Account number / IBAN" : "Mobile account number"}
          value={form.accountNumber}
          onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
          placeholder={form.provider === "BANK" ? "PK00XXXX0000000000000000" : "0300 1234567"}
          required
        />
        <Input
          label="Account title"
          value={form.accountTitle}
          onChange={(e) => setForm({ ...form, accountTitle: e.target.value })}
          placeholder="Name registered on the account"
          required
        />
        {form.provider === "BANK" && (
          <Input label="Bank name" value={form.bankName ?? ""} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
        )}
        <Textarea
          label="Instructions (optional)"
          rows={2}
          value={form.instructions ?? ""}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          placeholder="e.g. Send via 'Send Money > Mobile Account'"
        />
        <Input
          label="Sort order"
          type="number"
          min={0}
          value={form.sortOrder}
          onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
        />
        <div className="flex items-center justify-between text-sm">
          <span>Show at checkout</span>
          <Toggle checked={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} label="Active" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={create.isPending || update.isPending}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}

export default PaymentAccountsPage;
