"use client";
import Link from "next/link";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Banknote, Clock, Ruler, Scissors } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useCart } from "@/components/cart/cart-context";
import { QuantityInput } from "@/components/cart/quantity-input";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/misc";
import { ProductImage } from "@/components/ui/product-image";
import { ProductGrid } from "@/components/shop/product-card";
import { MeasurementsForm, toMeasurements, type MeasurementValues } from "@/components/shop/measurements-form";
import { cn, effectivePrice } from "@/lib/utils";

const SIZE_CHART = [
  ["XS", "32", "26", "36"],
  ["S", "34", "28", "38"],
  ["M", "36", "30", "40"],
  ["L", "39", "33", "43"],
  ["XL", "42", "36", "46"],
];

const ProductPage = ({ slug }: { slug: string }) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.catalog.product.queryOptions({ slug }));
  const cart = useCart();

  const [imageIndex, setImageIndex] = useState(0);
  const [sizeType, setSizeType] = useState<"STANDARD" | "CUSTOM">("STANDARD");
  const [size, setSize] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementValues>({});
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showChart, setShowChart] = useState(false);

  if (!data) return null;
  const { product, related } = data;

  const addToCart = () => {
    const m = sizeType === "CUSTOM" ? toMeasurements(measurements) : null;
    if (sizeType === "STANDARD" && !size) return toast.error("Please select a size");
    if (sizeType === "CUSTOM" && !m) return toast.error("Please enter at least one measurement");

    cart.add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] ?? null,
      unitPrice: effectivePrice(product),
      quantity,
      sizeType,
      size: sizeType === "STANDARD" ? size : null,
      measurements: m,
      notes: notes.trim() || null,
    });
    toast.success("Added to your bag");
  };

  return (
    <div className="container-x py-8 lg:py-12">
      <nav className="eyebrow mb-6 flex flex-wrap gap-2">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href={`/category/${product.category.slug}`} className="hover:text-foreground">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        {/* Gallery */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {product.images.length > 1 && (
            <div className="flex gap-3 sm:w-20 sm:flex-col">
              {product.images.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => setImageIndex(i)}
                  className={cn(
                    "relative aspect-[3/4] w-16 shrink-0 overflow-hidden bg-soft ring-1 sm:w-full",
                    i === imageIndex ? "ring-foreground" : "ring-transparent opacity-70 hover:opacity-100",
                  )}
                  aria-label={`Show image ${i + 1}`}
                >
                  <ProductImage src={img} alt="" fill sizes="80px" />
                </button>
              ))}
            </div>
          )}
          <div className="relative aspect-[3/4] flex-1 overflow-hidden bg-soft">
            <ProductImage
              src={product.images[imageIndex]}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
        </div>

        {/* Details */}
        <div className="lg:sticky lg:top-44 lg:self-start">
          <p className="eyebrow">{product.category.name}</p>
          <h1 className="heading-display mt-2 text-4xl lg:text-5xl">{product.name}</h1>
          {product.sku && <p className="mt-2 text-xs text-muted">SKU: {product.sku}</p>}
          <Price price={product.price} salePrice={product.salePrice} className="mt-4 text-xl" />
          <p className="mt-1 text-xs text-muted">Stitching included · Rs. 1,000 advance, rest cash on delivery</p>

          {/* Sizing */}
          <div className="mt-8">
            <div className="grid grid-cols-2 border border-line text-xs uppercase tracking-wider">
              {(["STANDARD", "CUSTOM"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSizeType(t)}
                  className={cn("py-3 transition", sizeType === t ? "bg-foreground text-white" : "hover:bg-soft")}
                >
                  {t === "STANDARD" ? "Standard Size" : "Custom Measurements"}
                </button>
              ))}
            </div>

            {sizeType === "STANDARD" ? (
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider">Size{size ? `: ${size}` : ""}</span>
                  <button onClick={() => setShowChart((s) => !s)} className="flex items-center gap-1 text-xs underline underline-offset-2">
                    <Ruler className="size-3.5" /> Size chart
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={cn(
                        "h-11 min-w-12 border px-3 text-sm transition",
                        size === s ? "border-foreground bg-foreground text-white" : "border-line hover:border-foreground",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {showChart && (
                  <table className="mt-4 w-full border border-line text-center text-xs">
                    <thead className="bg-soft uppercase tracking-wider">
                      <tr>
                        <th className="py-2">Size</th>
                        <th>Chest</th>
                        <th>Waist</th>
                        <th>Hips</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SIZE_CHART.map((row) => (
                        <tr key={row[0]} className="border-t border-line">
                          {row.map((c, i) => (
                            <td key={i} className="py-2">{c}{i > 0 && '"'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div className="mt-5">
                <MeasurementsForm values={measurements} onChange={setMeasurements} />
              </div>
            )}

            <label className="mt-5 block">
              <span className="field-label">Stitching instructions (optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="e.g. Add lining, straight trouser, 3/4 sleeves…"
                className="field"
              />
            </label>

            <div className="mt-6 flex gap-3">
              <QuantityInput value={quantity} onChange={setQuantity} />
              <Button onClick={addToCart} size="lg" className="flex-1">
                Add to Bag
              </Button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-2 border-y border-line py-5 text-center text-[11px] uppercase tracking-wider text-muted">
            <div className="flex flex-col items-center gap-2">
              <Clock className="size-4 text-accent" /> Ready in {product.deliveryDays} days
            </div>
            <div className="flex flex-col items-center gap-2">
              <Scissors className="size-4 text-accent" /> Expert stitching
            </div>
            <div className="flex flex-col items-center gap-2">
              <Banknote className="size-4 text-accent" /> Advance + COD
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            {product.fabric && <Detail label="Fabric" value={product.fabric} />}
            {product.includes && <Detail label="Includes" value={product.includes} />}
          </dl>
          <div className="mt-6">
            <p className="field-label">Description</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{product.description}</p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="heading-display mb-10 text-center text-4xl">You May Also Like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-20 shrink-0 text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default ProductPage;
