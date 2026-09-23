"use client";
import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { QuantityInput } from "@/components/cart/quantity-input";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageLoader } from "@/components/ui/misc";
import { ProductImage } from "@/components/ui/product-image";
import { COD_DELIVERY_FEE, MEASUREMENT_FIELDS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

const CartPage = () => {
  const { items, ready, subtotal, updateQuantity, remove } = useCart();

  if (!ready) return <PageLoader />;
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-12" strokeWidth={1} />}
        title="Your bag is empty"
        description="Browse our designs and add something you love."
        action={<ButtonLink href="/shop">Continue Shopping</ButtonLink>}
      />
    );
  }

  return (
    <div className="container-x py-10 lg:py-14">
      <h1 className="heading-display mb-10 text-center text-4xl lg:text-5xl">Shopping Bag</h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-line border-y border-line">
          {items.map((item) => (
            <li key={item.key} className="flex gap-4 py-6 sm:gap-6">
              <Link href={`/product/${item.slug}`} className="relative aspect-[3/4] w-24 shrink-0 bg-soft sm:w-32">
                <ProductImage src={item.image} alt={item.name} fill sizes="128px" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <Link href={`/product/${item.slug}`} className="heading-display text-xl leading-tight">
                    {item.name}
                  </Link>
                  <button onClick={() => remove(item.key)} aria-label="Remove item" className="self-start p-1 text-muted hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-muted">{formatPrice(item.unitPrice)}</p>
                <div className="mt-2 space-y-1 text-xs text-muted">
                  {item.sizeType === "STANDARD" ? (
                    <p>Size: <span className="text-foreground">{item.size}</span></p>
                  ) : (
                    <p>
                      Custom:{" "}
                      <span className="text-foreground">
                        {MEASUREMENT_FIELDS.filter((f) => item.measurements?.[f.key])
                          .map((f) => `${f.label} ${item.measurements![f.key]}"`)
                          .join(" · ")}
                      </span>
                    </p>
                  )}
                  {item.notes && <p>Notes: <span className="text-foreground">{item.notes}</span></p>}
                </div>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <QuantityInput value={item.quantity} onChange={(q) => updateQuantity(item.key, q)} small />
                  <span className="font-medium">{formatPrice(item.unitPrice * item.quantity)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit bg-soft p-6 lg:sticky lg:top-44">
          <h2 className="text-xs font-medium uppercase tracking-[0.2em]">Order Summary</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
            <div className="space-y-1 text-xs text-muted">
              <div className="flex justify-between">
                <dt>Delivery with online payment</dt><dd className="text-emerald-700">Free</dd>
              </div>
              <div className="flex justify-between">
                <dt>Delivery with cash on delivery</dt><dd>{formatPrice(COD_DELIVERY_FEE)}</dd>
              </div>
            </div>
          </dl>
          <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">Proceed to Checkout</ButtonLink>
          <p className="mt-3 text-center text-xs text-muted">No account needed · choose payment at checkout</p>
        </aside>
      </div>
    </div>
  );
};

export default CartPage;
