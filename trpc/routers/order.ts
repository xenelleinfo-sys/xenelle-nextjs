import { randomBytes, timingSafeEqual } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CLOUDINARY_FOLDERS, isOwnCloudinaryUrl } from "@/lib/cloudinary";
import { DELIVERY_FEE } from "@/lib/constants";
import { effectivePrice } from "@/lib/utils";
import {
  onlinePaymentProofSchema,
  placeOrderSchema,
  trackOrderSchema,
  type OnlinePaymentProofInput,
} from "@/lib/validators";
import { authProcedure, createTRPCRouter, optionalUserProcedure, type getSessionUser } from "../init";

type SessionUser = Awaited<ReturnType<typeof getSessionUser>>;

function generateOrderNumber() {
  const time = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5).padEnd(3, "X");
  return `XN-${time}${rand}`;
}

const newAccessToken = () => randomBytes(16).toString("hex");

function tokenMatches(expected: string | null, given: string | undefined) {
  if (!expected || !given || expected.length !== given.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(given));
}

/** Compare phone numbers by their last 10 digits (03001234567 == +923001234567). */
const phoneKey = (v: string) => v.replace(/\D/g, "").slice(-10);

/** Validates the payment screenshot and snapshots the account it was sent to. */
async function buildOnlinePayment(proof: OnlinePaymentProofInput, amount: number) {
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

/**
 * Loads an order the caller may see: via the secret link token (guests),
 * as the logged-in owner (same account or same email), or as admin.
 */
async function findAuthorizedOrder(orderNumber: string, token: string | undefined, user: SessionUser) {
  const order = await prisma.order.findUnique({ where: { orderNumber: orderNumber.trim().toUpperCase() } });
  const allowed =
    !!order &&
    (tokenMatches(order.accessToken, token) ||
      (!!user &&
        (user.role === "ADMIN" ||
          order.userId === user.id ||
          (!!order.email && order.email === user.email.toLowerCase()))));
  if (!order || !allowed) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
  return order;
}

const orderRef = z.object({ orderNumber: z.string().trim().max(20), token: z.string().max(64).optional() });

export const orderRouter = createTRPCRouter({
  // Guest or logged-in checkout. Prices are always recomputed from the DB.
  place: optionalUserProcedure.input(placeOrderSchema).mutation(async ({ ctx, input }) => {
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
    const shippingFee = DELIVERY_FEE[input.paymentMethod];
    const total = subtotal + shippingFee;
    const onlinePayment =
      input.paymentMethod === "ONLINE" ? await buildOnlinePayment(input.onlinePayment!, total) : null;
    const user = ctx.user;
    const accessToken = newAccessToken();

    let order;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        order = await prisma.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            userId: user?.id ?? null,
            email: input.email,
            accessToken,
            items,
            shipping: input.shipping,
            subtotal,
            shippingFee,
            total,
            paymentMethod: input.paymentMethod,
            onlinePayment,
            notes: input.notes || null,
            history: [
              {
                status: "PENDING",
                note:
                  input.paymentMethod === "ONLINE"
                    ? "Order placed — payment screenshot submitted for verification"
                    : "Order placed — Cash on Delivery",
                createdAt: new Date(),
              },
            ],
          },
          select: { orderNumber: true, accessToken: true },
        });
        break;
      } catch (e) {
        // retry only on orderNumber collision
        if ((e as { code?: string }).code !== "P2002" || attempt === 2) throw e;
      }
    }

    if (user && input.saveAddress) {
      await prisma.user.update({ where: { id: user.id }, data: { address: { set: input.shipping } } });
    }

    return order!;
  }),

  // Account holders see their own orders plus guest orders placed with their email.
  mine: authProcedure.query(({ ctx }) =>
    prisma.order.findMany({
      where: { OR: [{ userId: ctx.user.id }, { email: ctx.user.email.toLowerCase() }] },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        paymentMethod: true,
        createdAt: true,
        onlinePayment: { select: { status: true } },
        items: { select: { name: true, image: true, quantity: true } },
      },
    }),
  ),

  view: optionalUserProcedure.input(orderRef).query(async ({ ctx, input }) => {
    const order = await findAuthorizedOrder(input.orderNumber, input.token, ctx.user);
    // the token is only ever handed out via checkout / tracking
    return { ...order, accessToken: undefined };
  }),

  // Guest tracking: order number + phone/email used at checkout -> secret link.
  track: optionalUserProcedure.input(trackOrderSchema).mutation(async ({ input }) => {
    const order = await prisma.order.findUnique({
      where: { orderNumber: input.orderNumber },
      select: { id: true, orderNumber: true, email: true, shipping: true, accessToken: true },
    });
    const contact = input.contact.toLowerCase();
    const matches =
      !!order &&
      (contact.includes("@")
        ? order.email === contact
        : phoneKey(contact).length === 10 && phoneKey(contact) === phoneKey(order.shipping.phone));
    if (!order || !matches) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No order found with these details" });
    }
    let token = order.accessToken;
    if (!token) {
      // orders placed before guest checkout existed
      token = newAccessToken();
      await prisma.order.update({ where: { id: order.id }, data: { accessToken: token } });
    }
    return { orderNumber: order.orderNumber, token };
  }),

  // Re-upload the payment screenshot after a rejection (or replace it while pending).
  resubmitPayment: optionalUserProcedure
    .input(orderRef.extend({ onlinePayment: onlinePaymentProofSchema }))
    .mutation(async ({ ctx, input }) => {
      const order = await findAuthorizedOrder(input.orderNumber, input.token, ctx.user);
      if (order.status !== "PENDING" || order.onlinePayment?.status === "VERIFIED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Payment for this order is already verified" });
      }
      const onlinePayment = await buildOnlinePayment(
        input.onlinePayment,
        order.onlinePayment?.amount ?? order.total,
      );
      await prisma.order.update({
        where: { id: order.id },
        data: {
          onlinePayment: { set: onlinePayment },
          history: {
            push: { status: "PENDING", note: "New payment screenshot submitted", createdAt: new Date() },
          },
        },
      });
      return { success: true };
    }),

  cancel: optionalUserProcedure.input(orderRef).mutation(async ({ ctx, input }) => {
    const order = await findAuthorizedOrder(input.orderNumber, input.token, ctx.user);
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
