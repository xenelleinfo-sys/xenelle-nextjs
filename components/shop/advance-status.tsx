"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { ADVANCE_STATUS_META, type AdvanceStatusValue, type PaymentProviderValue } from "@/lib/constants";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { AdvanceProofInput } from "@/lib/validators";
import { AdvancePaymentForm, advanceProofError, emptyAdvance, ProviderBadge } from "./advance-payment";

export type AdvanceInfo = {
  amount: number;
  provider: PaymentProviderValue;
  accountTitle: string;
  accountNumber: string;
  transactionId: string | null;
  senderNumber: string | null;
  screenshotUrl: string;
  status: AdvanceStatusValue;
  note: string | null;
  submittedAt: Date | string;
  verifiedAt: Date | string | null;
};

export function AdvanceStatusBadge({ status, className }: { status: AdvanceStatusValue; className?: string }) {
  const meta = ADVANCE_STATUS_META[status];
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset", meta.tone, className)}>
      {meta.label}
    </span>
  );
}

/** Customer view of the advance on an order, with re-upload when rejected. */
export function AdvanceStatusCard({
  orderNumber,
  advance,
  canResubmit,
}: {
  orderNumber: string;
  advance: AdvanceInfo;
  canResubmit: boolean;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [proof, setProof] = useState<AdvanceProofInput>(emptyAdvance);
  const [error, setError] = useState<string>();
  const { data: accounts } = useQuery({ ...trpc.catalog.paymentAccounts.queryOptions(), enabled: editing });

  const resubmit = useMutation(
    trpc.order.resubmitAdvance.mutationOptions({
      onSuccess: async () => {
        toast.success("Screenshot submitted. We'll verify it shortly.");
        setEditing(false);
        setProof(emptyAdvance);
        await queryClient.invalidateQueries({ queryKey: trpc.order.byNumber.queryKey({ orderNumber }) });
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  return (
    <section className="card space-y-4 p-5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-medium uppercase tracking-[0.2em]">Advance Payment</h3>
        <AdvanceStatusBadge status={advance.status} />
      </div>

      <div className="flex gap-4">
        <a href={advance.screenshotUrl} target="_blank" rel="noreferrer" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- payment proof shown as uploaded */}
          <img src={advance.screenshotUrl} alt="Payment screenshot" className="h-24 w-20 border border-line object-cover" />
        </a>
        <div className="space-y-1">
          <p className="font-medium">{formatPrice(advance.amount)}</p>
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <ProviderBadge provider={advance.provider} /> {advance.accountNumber}
          </p>
          {advance.transactionId && <p className="text-xs text-muted">Txn ID: {advance.transactionId}</p>}
          <p className="text-xs text-muted">Submitted {formatDate(advance.submittedAt, true)}</p>
        </div>
      </div>

      {advance.status === "PENDING" && (
        <p className="text-xs text-muted">We are verifying your payment. This usually takes a few hours during working time.</p>
      )}
      {advance.status === "REJECTED" && (
        <p className="border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <strong>We couldn&apos;t verify this payment.</strong> {advance.note}
        </p>
      )}

      {canResubmit && advance.status !== "VERIFIED" && !editing && (
        <Button variant={advance.status === "REJECTED" ? "primary" : "outline"} size="sm" onClick={() => setEditing(true)}>
          Upload new screenshot
        </Button>
      )}

      {editing && (
        <div className="space-y-4 border-t border-line pt-4">
          {accounts ? (
            <AdvancePaymentForm
              accounts={accounts}
              amount={advance.amount}
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
                const err = advanceProofError(proof);
                setError(err ?? undefined);
                if (!err) resubmit.mutate({ orderNumber, advance: proof });
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
