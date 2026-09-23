import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ORDER_STATUS_META, type OrderStatusValue } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";

export function Price({
  price,
  salePrice,
  className,
}: {
  price: number;
  salePrice?: number | null;
  className?: string;
}) {
  const onSale = salePrice != null && salePrice < price;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn(onSale && "text-danger")}>{formatPrice(onSale ? salePrice! : price)}</span>
      {onSale && <span className="text-[0.85em] text-muted line-through">{formatPrice(price)}</span>}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: OrderStatusValue; className?: string }) {
  const meta = ORDER_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        meta.tone,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      {icon && <div className="mb-4 text-muted">{icon}</div>}
      <h3 className="heading-display text-2xl">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn("size-6 animate-spin rounded-full border-2 border-line border-t-foreground", className)}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner />
    </div>
  );
}

/** Link-based pagination (works for server-rendered listing pages). */
export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );
  const cell = "flex size-9 items-center justify-center border text-sm transition";
  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 && (
        <Link href={hrefFor(page - 1)} className={cn(cell, "border-line hover:border-foreground")} aria-label="Previous">
          <ChevronLeft className="size-4" />
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
          <Link
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              cell,
              p === page ? "border-foreground bg-foreground text-white" : "border-line hover:border-foreground",
            )}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages && (
        <Link href={hrefFor(page + 1)} className={cn(cell, "border-line hover:border-foreground")} aria-label="Next">
          <ChevronRight className="size-4" />
        </Link>
      )}
    </nav>
  );
}
