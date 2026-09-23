import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CLOUDINARY_FOLDERS, isOwnCloudinaryUrl } from "@/lib/cloudinary";
import { ADVANCE_AMOUNT, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";
import { effectivePrice } from "@/lib/utils";
import { advanceProofSchema, placeOrderSchema, type AdvanceProofInput } from "@/lib/validators";
import { authProcedure, createTRPCRouter } from "../init";

function generateOrderNumber() {
  const time = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5).padEnd(3, "X");
  return `XN-${time}${rand}`;
}

/** Validates the advance proof and snapshots the account it was sent to. */
async function buildAdvance(proof: AdvanceProofInput, amount: number) {
  if (!isOwnCloudinaryUrl(proof.screenshotUrl, CLOUDINARY_FOLDERS.payments)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Please upload the payment screenshot again" });
  }
  const account = await prisma.paymentAccount.findFirst({
    where: { id: proof.accountId, isActive: true },
  });
  if (!account) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Selected payment account is no longer available" });
  }
  return {
    amount,
    provider: account.provider,
    accountTitle: account.accountTitle,
    accountNumber: account.accountNumber,
    transactionId: proof.transactionId || null,
    senderNumber: proof.senderNumber || null,
    screenshotUrl: proof.screenshotUrl,
    status: "PENDING" as const,
    note: null,
    submittedAt: new Date(),
    verifiedAt: null,
  };
}

export const orderRouter = createTRPCRouter({
  // Advance (JazzCash / EasyPaisa) + Cash on Delivery. Prices are always recomputed from the DB.
  place: authProcedure.input(placeOrderSchema).mutation(async ({ ctx, input }) => {
    const ids = [...new Set(input.items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, isActive: true },
      select: { id: true, name: true, slug: true, images: true, price: true, salePrice: true, sizes: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const items = input.items.map((item) => {
      const product = byId.get(item.productId);
      if (!product) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some items in your cart are no longer available. Please review your cart.",
        });
      }
      if (item.sizeType === "STANDARD" && !product.sizes.includes(item.size ?? "")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Invalid size for ${product.name}` });
      }
      return {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: product.images[0] ?? null,
        unitPrice: effectivePrice(product),
        quantity: item.quantity,
        sizeType: item.sizeType,
        size: item.sizeType === "STANDARD" ? item.size : null,
        measurements: item.sizeType === "CUSTOM" ? item.measurements : null,
        notes: item.notes || null,
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = subtotal + shippingFee;
    const advance = await buildAdvance(input.advance, Math.min(ADVANCE_AMOUNT, total));

    let order;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        order = await prisma.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            userId: ctx.user.id,
            items,
            shipping: input.shipping,
            subtotal,
            shippingFee,
            total,
            advance,
            notes: input.notes || null,
            history: [
              {
                status: "PENDING",
                note: "Order placed — advance screenshot submitted for verification",
                createdAt: new Date(),
              },
            ],
          },
          select: { id: true, orderNumber: true },
        });
        break;
      } catch (e) {
        // retry only on orderNumber collision
        if ((e as { code?: string }).code !== "P2002" || attempt === 2) throw e;
      }
    }

    if (input.saveAddress) {
      await prisma.user.update({
        where: { id: ctx.user.id },
        data: { address: { set: input.shipping } },
      });
    }

    return order!;
  }),

  mine: authProcedure.query(({ ctx }) =>
    prisma.order.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        advance: { select: { status: true } },
        items: { select: { name: true, image: true, quantity: true } },
      },
    }),
  ),

  byNumber: authProcedure
    .input(z.object({ orderNumber: z.string().trim().toUpperCase() }))
    .query(async ({ ctx, input }) => {
      const order = await prisma.order.findFirst({
        where: {
          orderNumber: input.orderNumber,
          ...(ctx.user.role === "ADMIN" ? {} : { userId: ctx.user.id }),
        },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      return order;
    }),

  // Customer re-uploads proof after a rejection (or replaces it while pending).
  resubmitAdvance: authProcedure
    .input(z.object({ orderNumber: z.string(), advance: advanceProofSchema }))
    .mutation(async ({ ctx, input }) => {
      const order = await prisma.order.findFirst({
        where: { orderNumber: input.orderNumber, userId: ctx.user.id },
        select: { id: true, status: true, total: true, advance: true },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      if (order.status !== "PENDING" || order.advance?.status === "VERIFIED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Payment for this order is already verified" });
      }
      const advance = await buildAdvance(input.advance, order.advance?.amount ?? Math.min(ADVANCE_AMOUNT, order.total));
      await prisma.order.update({
        where: { id: order.id },
        data: {
          advance: { set: advance },
          history: {
            push: { status: "PENDING", note: "New payment screenshot submitted", createdAt: new Date() },
          },
        },
      });
      return { success: true };
    }),

  cancel: authProcedure
    .input(z.object({ orderNumber: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const order = await prisma.order.findFirst({
        where: { orderNumber: input.orderNumber, userId: ctx.user.id },
        select: { id: true, status: true },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      if (order.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending orders can be cancelled. Please contact us.",
        });
      }
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          history: { push: { status: "CANCELLED", note: "Cancelled by customer", createdAt: new Date() } },
        },
      });
      return { success: true };
    }),
});
