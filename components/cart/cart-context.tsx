"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { MeasurementsInput } from "@/lib/validators";

export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  sizeType: "STANDARD" | "CUSTOM";
  size: string | null;
  measurements: MeasurementsInput | null;
  notes: string | null;
};

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  count: number;
  /** delivery depends on the payment method, chosen at checkout */
  subtotal: number;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  add: (item: Omit<CartItem, "key">) => void;
  updateQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "xenelle-cart-v1";
const CartContext = createContext<CartContextValue | null>(null);

// Same product + same sizing = same cart line
function lineKey(i: Omit<CartItem, "key">) {
  return [i.productId, i.sizeType, i.size ?? "", JSON.stringify(i.measurements ?? {}), i.notes ?? ""].join("|");
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, "key">) => {
    const key = lineKey(item);
    setItems((prev) => {
      const hit = prev.find((i) => i.key === key);
      if (hit) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: Math.min(10, i.quantity + item.quantity) } : i,
        );
      }
      return [...prev, { ...item, key }];
    });
    setDrawerOpen(true);
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, Math.min(10, quantity)) } : i)),
    );
  }, []);

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    return {
      items,
      ready,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal,
      drawerOpen,
      setDrawerOpen,
      add,
      updateQuantity,
      remove,
      clear,
    };
  }, [items, ready, drawerOpen, add, updateQuantity, remove, clear]);

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
