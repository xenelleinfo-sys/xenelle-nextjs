"use client";

import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import { cn, formatPrice } from "@/lib/utils";
import { QuantityInput } from "./quantity-input";
import { useCart } from "./cart-context";

export function CartDrawer() {
  const { items, subtotal, drawerOpen, setDrawerOpen, updateQuantity, remove } = useCart();
  const pathname = usePathname();
  const close = () => setDrawerOpen(false);

  // close when navigating
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname, setDrawerOpen]);

  return (
    <div className={cn("fixed inset-0 z-50", !drawerOpen && "pointer-events-none")} aria-hidden={!drawerOpen}>
      <div
        className={cn("absolute inset-0 bg-black/40 transition-opacity", drawerOpen ? "opacity-100" : "opacity-0")}
        onClick={close}
      />
      <aside
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white transition-transform duration-300",
          drawerOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em]">Your Bag ({items.length})</h2>
          <button onClick={close} aria-label="Close cart" className="p-1">
            <X className="size-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <ShoppingBag className="size-10 text-muted" strokeWidth={1} />
            <p className="text-sm text-muted">Your bag is empty.</p>
            <ButtonLink href="/shop" variant="outline" onClick={close}>
              Start Shopping
            </ButtonLink>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 py-5">
                  <Link href={`/product/${item.slug}`} className="relative aspect-[3/4] w-20 shrink-0 bg-soft">
                    <ProductImage src={item.image} alt={item.name} fill sizes="80px" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link href={`/product/${item.slug}`} className="line-clamp-2 text-sm">
                      {item.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      {item.sizeType === "STANDARD" ? `Size: ${item.size}` : "Custom measurements"}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <QuantityInput value={item.quantity} onChange={(q) => updateQuantity(item.key, q)} small />
                      <span className="text-sm">{formatPrice(item.unitPrice * item.quantity)}</span>
                    </div>
                    <button
                      onClick={() => remove(item.key)}
                      className="mt-2 self-start text-[11px] uppercase tracking-wider text-muted underline-offset-2 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-line p-5">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-muted">Shipping calculated at checkout. Rs. 1,000 advance via JazzCash / EasyPaisa, rest cash on delivery.</p>
              <div className="grid grid-cols-2 gap-2">
                <ButtonLink href="/cart" variant="outline" onClick={close}>
                  View Bag
                </ButtonLink>
                <ButtonLink href="/checkout" onClick={close}>
                  Checkout
                </ButtonLink>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
