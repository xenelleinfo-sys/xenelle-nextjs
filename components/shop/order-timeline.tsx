import { Check, X } from "lucide-react";
import { ORDER_FLOW, ORDER_STATUS_META, type OrderStatusValue } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";

type History = { status: OrderStatusValue; note: string | null; createdAt: Date | string }[];

/** Step tracker: Placed → Confirmed → Stitching → Ready → Shipped → Delivered */
export function OrderTimeline({ status, history }: { status: OrderStatusValue; history: History }) {
  const reachedAt = (s: OrderStatusValue) => [...history].reverse().find((h) => h.status === s)?.createdAt;

  if (status === "CANCELLED") {
    const at = reachedAt("CANCELLED");
    return (
      <div className="flex items-center gap-3 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        <X className="size-5" />
        <div>
          <p className="font-medium">This order was cancelled</p>
          {at && <p className="text-xs">{formatDate(at, true)}</p>}
        </div>
      </div>
    );
  }

  const current = ORDER_FLOW.indexOf(status);
  return (
    <ol className="relative">
      {ORDER_FLOW.map((s, i) => {
        const done = i <= current;
        const at = reachedAt(s);
        const meta = ORDER_STATUS_META[s];
        return (
          <li key={s} className="relative flex gap-4 pb-7 last:pb-0">
            {i < ORDER_FLOW.length - 1 && (
              <span className={cn("absolute left-[11px] top-6 h-[calc(100%-1.5rem)] w-px", i < current ? "bg-accent" : "bg-line")} />
            )}
            <span
              className={cn(
                "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px]",
                done ? "border-accent bg-accent text-white" : "border-line bg-white text-muted",
                i === current && "ring-4 ring-accent/20",
              )}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <div className="-mt-0.5">
              <p className={cn("text-sm font-medium", !done && "text-muted")}>{meta.label}</p>
              {i === current && <p className="mt-0.5 text-xs text-muted">{meta.description}</p>}
              {at && done && <p className="mt-0.5 text-xs text-muted">{formatDate(at, true)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
