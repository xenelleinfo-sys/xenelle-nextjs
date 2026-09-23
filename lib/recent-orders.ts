"use client";

/**
 * Orders placed on this device (mainly for guests), so they can reopen
 * their order page from "Track Order" without an account.
 */
export type RecentOrder = { orderNumber: string; token: string; placedAt: string };

const KEY = "xenelle-recent-orders";

export function getRecentOrders(): RecentOrder[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentOrder[]) : [];
  } catch {
    return [];
  }
}

export function saveRecentOrder(order: Omit<RecentOrder, "placedAt">) {
  try {
    const next = [
      { ...order, placedAt: new Date().toISOString() },
      ...getRecentOrders().filter((o) => o.orderNumber !== order.orderNumber),
    ].slice(0, 10);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

export const orderHref = (orderNumber: string, token?: string | null) =>
  `/order/${encodeURIComponent(orderNumber)}${token ? `?t=${token}` : ""}`;
