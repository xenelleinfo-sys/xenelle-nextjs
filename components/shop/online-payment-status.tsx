"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
  ONLINE_PAYMENT_STATUS_META,
  type OnlinePaymentStatusValue,
  type PaymentProviderValue,
} from "@/lib/constants";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { OnlinePaymentProofInput } from "@/lib/validators";
import { emptyOnlinePayment, OnlinePaymentForm, onlinePaymentProofError, ProviderBadge } from "./online-payment";

export type OnlinePaymentInfo = {
  amount: number;
  provider: PaymentProviderValue;
  accountTitle: string;
  accountNumber: string;
  transactionId: string | null;
  senderNumber: string | null;
  screenshotUrl: string;
  status: OnlinePaymentStatusValue;
  note: string | null;
  submittedAt: Date | string;
  verifiedAt: Date | string | null;
};

export function OnlinePaymentStatusBadge({
  status,
  className,
}: {
  status: OnlinePaymentStatusValue;
  className?: string;
}) {
  const meta = ONLINE_PAYMENT_STATUS_META[status];
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset", meta.tone, className)}>
      {meta.label}
    </span>
  );
}

/** Customer view of the online payment on an order, with re-upload when rejected. */
export function OnlinePaymentStatusCard({
  orderNumber,
  token,
  payment,
  canResubmit,
}: {
  orderNumber: string;
  /** secret link token for guest orders */
  token?: string;
  payment: OnlinePaymentInfo;
  canResubmit: boolean;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [proof, setProof] = useState<OnlinePaymentProofInput>(emptyOnlinePayment);
  const [error, setError] = useState<string>();
  const { data: accounts } = useQuery({ ...trpc.catalog.paymentAccounts.queryOptions(), enabled: editing });

  const resubmit = useMutation(
    trpc.order.resubmitPayment.mutationOptions({
      onSuccess: async () => {
        toast.success("Screenshot submitted. We'll verify it shortly.");
        setEditing(false);
        setProof(emptyOnlinePayment);
        await queryClient.invalidateQueries({ queryKey: trpc.order.view.queryKey({ orderNumber, token }) });
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  return (
    <section className="card space-y-4 p-5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-medium uppercase tracking-[0.2em]">Online Payment</h3>
        <OnlinePaymentStatusBadge status={payment.status} />
      </div>

      <div className="flex gap-4">
        <a href={payment.screenshotUrl} target="_blank" rel="noreferrer" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- payment proof shown as uploaded */}
          <img src={payment.screenshotUrl} alt="Payment screenshot" className="h-24 w-20 border border-line object-cover" />
        </a>
        <div className="space-y-1">
          <p className="font-medium">{formatPrice(payment.amount)}</p>
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <ProviderBadge provider={payment.provider} /> {payment.accountNumber}
          </p>
          {payment.transactionId && <p className="text-xs text-muted">Txn ID: {payment.transactionId}</p>}
          <p className="text-xs text-muted">Submitted {formatDate(payment.submittedAt, true)}</p>
        </div>
      </div>

      {payment.status === "PENDING" && (
        <p className="text-xs text-muted">We are verifying your payment. This usually takes a few hours during working time.</p>
      )}
      {payment.status === "REJECTED" && (
        <p className="border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <strong>We couldn&apos;t verify this payment.</strong> {payment.note}
        </p>
      )}

      {canResubmit && payment.status !== "VERIFIED" && !editing && (
        <Button variant={payment.status === "REJECTED" ? "primary" : "outline"} size="sm" onClick={() => setEditing(true)}>
          Upload new screenshot
        </Button>
      )}

      {editing && (
        <div className="space-y-4 border-t border-line pt-4">
          {accounts ? (
            <OnlinePaymentForm
              accounts={accounts}
              amount={payment.amount}
              value={proof}
              onChange={setProof}
              error={error}
            />
          ) : (
            <p className="text-xs text-muted">Loading accounts…</p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              loading={resubmit.isPending}
              onClick={() => {
                const err = onlinePaymentProofError(proof);
                setError(err ?? undefined);
                if (!err) resubmit.mutate({ orderNumber, token, onlinePayment: proof });
              }}
            >
              Submit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
