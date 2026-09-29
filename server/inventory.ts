import "server-only";
import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

type Tx = Prisma.TransactionClient;
type Line = { productId: string; quantity: number };

/** Sum quantities per product (same design can be in the cart in several sizes). */
export function quantitiesByProduct(items: Line[]) {
  const map = new Map<string, number>();
  for (const i of items) map.set(i.productId, (map.get(i.productId) ?? 0) + i.quantity);
  return map;
}

/**
 * Atomically takes stock for tracked products (stock != null).
 * The conditional update (stock >= qty) prevents overselling under concurrency.
 * Must run inside a transaction so a failure rolls back earlier decrements.
 */
export async function reserveStock(
  tx: Tx,
  items: Line[],
  products: Map<string, { name: string; stock: number | null }>,
) {
  for (const [productId, qty] of quantitiesByProduct(items)) {
    const product = products.get(productId);
    if (!product || product.stock == null) continue; // not tracked
    const res = await tx.product.updateMany({
      where: { id: productId, stock: { gte: qty } },
      data: { stock: { decrement: qty } },
    });
    if (res.count === 0) {
      const fresh = await tx.product.findUnique({ where: { id: productId }, select: { stock: true } });
      const left = fresh?.stock ?? 0;
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          left > 0
            ? `Only ${left} left of "${product.name}". Please reduce the quantity in your bag.`
            : `"${product.name}" is out of stock. Please remove it from your bag.`,
      });
    }
  }
}

/** Gives stock + coupon usage back when an order is cancelled. */
export async function releaseOrder(
  tx: Tx,
  order: { items: Line[]; coupon: { couponId: string } | null },
) {
  for (const [productId, qty] of quantitiesByProduct(order.items)) {
    // only products that track stock (stock >= 0); untracked ones have null
    await tx.product.updateMany({
      where: { id: productId, stock: { gte: 0 } },
      data: { stock: { increment: qty } },
    });
  }
  if (order.coupon) {
    await tx.coupon.updateMany({
      where: { id: order.coupon.couponId, usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
  }
}
