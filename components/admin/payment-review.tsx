"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { ProviderBadge } from "@/components/shop/online-payment";
import { OnlinePaymentStatusBadge, type OnlinePaymentInfo } from "@/components/shop/online-payment-status";
import { formatDate, formatPrice } from "@/lib/utils";

/** Admin: check the customer's online payment screenshot and verify / reject it. */
export function PaymentReview({
  orderId,
  orderStatus,
  payment,
  onChanged,
}: {
  orderId: string;
  orderStatus: string;
  payment: OnlinePaymentInfo | null;
  onChanged: (verified: boolean) => Promise<unknown> | void;
}) {
  const trpc = useTRPC();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const verify = useMutation(
    trpc.admin.orders.verifyPayment.mutationOptions({
      onSuccess: async () => {
        toast.success(orderStatus === "PENDING" ? "Payment verified — order confirmed" : "Payment verified");
        await onChanged(true);
      },
      onError: (e) => toast.error(e.message),
    }),
  );
  const reject = useMutation(
    trpc.admin.orders.rejectPayment.mutationOptions({
      onSuccess: async () => {
        toast.success("Payment rejected — customer can upload a new screenshot");
        setRejecting(false);
        setReason("");
        await onChanged(false);
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  if (!payment) return null; // Cash on Delivery order

  return (
    <Panel className={payment.status === "PENDING" ? "p-5 ring-2 ring-amber-300" : "p-5"}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-semibold">Online Payment</h2>
        <OnlinePaymentStatusBadge status={payment.status} />
      </div>

      <a href={payment.screenshotUrl} target="_blank" rel="noreferrer" className="group relative block">
        {/* eslint-disable-next-line @next/next/no-img-element -- payment proof, show unmodified */}
        <img
          src={payment.screenshotUrl}
          alt="Payment screenshot"
          className="max-h-96 w-full rounded border border-line bg-soft object-contain"
        />
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
          Open full size <ExternalLink className="size-3" />
        </span>
      </a>

      <dl className="mt-4 space-y-1.5 text-sm">
        <Row label="Amount" value={<strong>{formatPrice(payment.amount)}</strong>} />
        <Row
          label="Sent to"
          value={
            <span className="flex flex-wrap items-center justify-end gap-2">
              <ProviderBadge provider={payment.provider} />
              {payment.accountNumber}
            </span>
          }
        />
        <Row label="Account title" value={payment.accountTitle} />
        {payment.transactionId && <Row label="Transaction ID" value={<span className="font-mono">{payment.transactionId}</span>} />}
        {payment.senderNumber && <Row label="Sender number" value={payment.senderNumber} />}
        <Row label="Submitted" value={formatDate(payment.submittedAt, true)} />
        {payment.verifiedAt && <Row label="Verified" value={formatDate(payment.verifiedAt, true)} />}
      </dl>

      {payment.status === "REJECTED" && payment.note && (
        <p className="mt-3 rounded bg-rose-50 p-2 text-xs text-rose-800">Rejected: {payment.note}</p>
      )}

      {payment.status !== "VERIFIED" && orderStatus !== "CANCELLED" && (
        <div className="mt-5 space-y-3 border-t border-line pt-4 print:hidden">
          <p className="text-xs text-muted">
            Check the amount and transaction in your {payment.provider === "BANK" ? "bank" : "wallet"} app before verifying.
          </p>
          {!rejecting ? (
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="accent" loading={verify.isPending} onClick={() => verify.mutate({ id: orderId })}>
                <CheckCircle2 className="size-3.5" /> Verify
              </Button>
              {payment.status === "PENDING" && orderStatus === "PENDING" && (
                <Button size="sm" variant="outline" onClick={() => setRejecting(true)}>
                  <XCircle className="size-3.5" /> Reject
                </Button>
              )}
            </div>
          ) : (
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                reject.mutate({ id: orderId, reason: reason.trim() });
              }}
            >
              <Textarea
                label="Reason (shown to customer)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="e.g. Amount not received in our account / screenshot unclear"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" variant="danger" loading={reject.isPending} disabled={reason.trim().length < 3}>
                  Reject payment
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setRejecting(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </Panel>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
