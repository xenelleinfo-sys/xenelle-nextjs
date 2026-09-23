"use client";

import { useRef, useState } from "react";
import { Check, Copy, ImageUp, RefreshCw, Smartphone, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/misc";
import { PAYMENT_PROVIDERS, type PaymentProviderValue } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";
import type { AdvanceProofInput } from "@/lib/validators";

export type PaymentAccountOption = {
  id: string;
  provider: PaymentProviderValue;
  accountTitle: string;
  accountNumber: string;
  bankName: string | null;
  instructions: string | null;
};

export const emptyAdvance: AdvanceProofInput = {
  accountId: "",
  screenshotUrl: "",
  transactionId: "",
  senderNumber: "",
};

export function ProviderBadge({ provider, className }: { provider: PaymentProviderValue; className?: string }) {
  const meta = PAYMENT_PROVIDERS[provider];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        meta.tone,
        className,
      )}
    >
      {provider === "BANK" ? <Wallet className="size-3" /> : <Smartphone className="size-3" />}
      {meta.label}
    </span>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(value.replace(/\s/g, "")).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted hover:text-foreground"
      aria-label="Copy account number"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/**
 * Step 1: pick an account & send the advance. Step 2: upload the screenshot.
 * Controlled: `value` holds the proof that is submitted with the order.
 */
export function AdvancePaymentForm({
  accounts,
  amount,
  value,
  onChange,
  error,
}: {
  accounts: PaymentAccountOption[];
  amount: number;
  value: AdvanceProofInput;
  onChange: (value: AdvanceProofInput) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Screenshot must be under 5MB");
    const body = new FormData();
    body.append("files", file);
    setUploading(true);
    try {
      const res = await fetch("/api/upload?purpose=payment", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onChange({ ...value, screenshotUrl: json.urls[0] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (accounts.length === 0) {
    return (
      <p className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Online advance accounts are being updated. Please contact us on WhatsApp to place your order.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-sm">
          <span className="font-medium">1.</span> Send <strong>{formatPrice(amount)}</strong> advance to any account
          below:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {accounts.map((a) => {
            const selected = value.accountId === a.id;
            return (
              <div
                key={a.id}
                role="radio"
                aria-checked={selected}
                tabIndex={0}
                onClick={() => onChange({ ...value, accountId: a.id })}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onChange({ ...value, accountId: a.id })}
                className={cn(
                  "cursor-pointer border p-4 text-left transition",
                  selected ? "border-foreground ring-1 ring-foreground" : "border-line hover:border-foreground/40",
                )}
              >
                <div className="flex items-center justify-between">
                  <ProviderBadge provider={a.provider} />
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-full border",
                      selected ? "border-foreground bg-foreground" : "border-line",
                    )}
                  >
                    {selected && <span className="size-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <p className="mt-3 font-mono text-lg tracking-wide">{a.accountNumber}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-xs text-muted">
                    {a.accountTitle}
                    {a.bankName ? ` · ${a.bankName}` : ""}
                  </p>
                  <CopyButton value={a.accountNumber} />
                </div>
                {a.instructions && <p className="mt-2 text-xs text-muted">{a.instructions}</p>}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm">
          <span className="font-medium">2.</span> Upload the payment screenshot / receipt:
        </p>
        <div className="flex flex-wrap items-start gap-4">
          {value.screenshotUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- user proof, shown as-is */}
              <img
                src={value.screenshotUrl}
                alt="Payment screenshot"
                className="h-40 w-auto max-w-[200px] border border-line object-contain"
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-2 inline-flex items-center gap-1 text-xs underline underline-offset-2"
                disabled={uploading}
              >
                <RefreshCw className="size-3" /> Replace
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className={cn(
                "flex h-40 w-40 flex-col items-center justify-center gap-2 border border-dashed text-xs text-muted transition hover:border-foreground hover:text-foreground",
                error && !value.screenshotUrl ? "border-danger" : "border-line",
              )}
            >
              {uploading ? <Spinner className="size-5" /> : <ImageUp className="size-6" strokeWidth={1.5} />}
              {uploading ? "Uploading…" : "Upload screenshot"}
            </button>
          )}
          <div className="grid min-w-56 flex-1 gap-3">
            <Input
              label="Transaction ID (optional)"
              value={value.transactionId ?? ""}
              onChange={(e) => onChange({ ...value, transactionId: e.target.value })}
              placeholder="e.g. 012345678901"
            />
            <Input
              label="Sent from number (optional)"
              value={value.senderNumber ?? ""}
              onChange={(e) => onChange({ ...value, senderNumber: e.target.value })}
              placeholder="03XXXXXXXXX"
              inputMode="tel"
            />
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          hidden
          onChange={(e) => upload(e.target.files?.[0])}
        />
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      </div>
    </div>
  );
}

/** Returns the first problem with the proof, or null when it is complete. */
export function advanceProofError(value: AdvanceProofInput) {
  if (!value.accountId) return "Select the account you sent the advance to";
  if (!value.screenshotUrl) return "Upload the payment screenshot";
  return null;
}
