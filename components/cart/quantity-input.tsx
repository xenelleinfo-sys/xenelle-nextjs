"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityInput({
  value,
  onChange,
  small,
  max = 10,
}: {
  value: number;
  onChange: (value: number) => void;
  small?: boolean;
  /** upper limit, e.g. units left in stock */
  max?: number;
}) {
  const btn = cn("flex items-center justify-center hover:bg-soft disabled:opacity-40", small ? "size-7" : "size-10");
  return (
    <div className="inline-flex items-center border border-line">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease">
        <Minus className="size-3" />
      </button>
      <span className={cn("text-center text-sm tabular-nums", small ? "w-7" : "w-10")}>{value}</span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase">
        <Plus className="size-3" />
      </button>
    </div>
  );
}
