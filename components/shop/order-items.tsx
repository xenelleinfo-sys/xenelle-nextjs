import Link from "next/link";
import { ProductImage } from "@/components/ui/product-image";
import { MEASUREMENT_FIELDS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

type Item = {
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  sizeType: "STANDARD" | "CUSTOM";
  size: string | null;
  measurements: Partial<Record<string, number | null>> | null;
  notes: string | null;
};

export function OrderItems({ items, linkProducts = true }: { items: Item[]; linkProducts?: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((item, idx) => (
        <li key={idx} className="flex gap-4 py-4">
          <div className="relative aspect-[3/4] w-16 shrink-0 bg-soft">
            <ProductImage src={item.image} alt={item.name} fill sizes="64px" />
          </div>
          <div className="min-w-0 flex-1 text-sm">
            {linkProducts ? (
              <Link href={`/product/${item.slug}`} className="font-medium hover:underline">
                {item.name}
              </Link>
            ) : (
              <p className="font-medium">{item.name}</p>
            )}
            <p className="text-xs text-muted">
              {formatPrice(item.unitPrice)} × {item.quantity}
            </p>
            {item.sizeType === "STANDARD" ? (
              <p className="mt-1 text-xs">Size: <strong>{item.size}</strong></p>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs sm:grid-cols-3">
                {MEASUREMENT_FIELDS.filter((f) => item.measurements?.[f.key]).map((f) => (
                  <span key={f.key}>
                    <span className="text-muted">{f.label}:</span> {item.measurements![f.key]}&quot;
                  </span>
                ))}
              </div>
            )}
            {item.notes && <p className="mt-1 text-xs"><span className="text-muted">Notes:</span> {item.notes}</p>}
          </div>
          <span className="text-sm font-medium">{formatPrice(item.unitPrice * item.quantity)}</span>
        </li>
      ))}
    </ul>
  );
}
