"use client";

import { useState } from "react";
import { TicketPercent, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** "Have a coupon?" input for the checkout summary. */
export function CouponBox({
  applied,
  loading,
  onApply,
  onRemove,
}: {
  applied: { code: string; percent: number } | null;
  loading: boolean;
  onApply: (code: string) => void;
  onRemove: () => void;
}) {
  const [code, setCode] = useState("");

  if (applied) {
    return (
      <div className="mt-6 flex items-center justify-between border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
        <span className="flex items-center gap-2">
          <TicketPercent className="size-4" />
          <span>
            <strong className="font-mono">{applied.code}</strong> · {applied.percent}% off
          </span>
        </span>
        <button type="button" onClick={onRemove} className="p-1 hover:text-emerald-950" aria-label="Remove coupon">
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <label htmlFor="coupon" className="field-label">
        Coupon code
      </label>
      <div className="flex gap-2">
        <input
          id="coupon"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
          onKeyDown={(e) => {
            // Enter applies the coupon instead of submitting the order form
            if (e.key === "Enter") {
              e.preventDefault();
              if (code.length >= 3) onApply(code);
            }
          }}
          placeholder="Enter code"
          className="field min-w-0 flex-1 bg-white font-mono uppercase"
          autoComplete="off"
        />
        <Button type="button" variant="outline" loading={loading} disabled={code.length < 3} onClick={() => onApply(code)}>
          Apply
        </Button>
      </div>
    </div>
  );
}
