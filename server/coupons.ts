import "server-only";
import type { Coupon } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/prisma";
import { couponDiscount, formatPrice } from "@/lib/utils";

/** Why a coupon can't be used right now, or null if it can. */
export function couponProblem(coupon: Coupon | null, subtotal: number, now = new Date()) {
  if (!coupon || !coupon.isActive) return "This coupon code is not valid";
  if (coupon.startsAt && coupon.startsAt > now) return "This coupon is not active yet";
  if (coupon.expiresAt && coupon.expiresAt <= now) return "This coupon has expired";
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return "This coupon has reached its usage limit";
  if (coupon.minSubtotal != null && subtotal < coupon.minSubtotal) {
    return `Add items worth ${formatPrice(coupon.minSubtotal - subtotal)} more to use this coupon (minimum ${formatPrice(coupon.minSubtotal)})`;
  }
  return null;
}

/** Looks up a code and returns the coupon + discount, or throws a user-facing error. */
export async function resolveCoupon(code: string, subtotal: number) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  const problem = couponProblem(coupon, subtotal);
  if (problem) throw new TRPCError({ code: "BAD_REQUEST", message: problem });
  return { coupon: coupon!, discount: couponDiscount(subtotal, coupon!.percent) };
}
