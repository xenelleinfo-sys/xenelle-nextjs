import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { effectivePrice } from "@/lib/utils";
import { trackMetaEvent } from "@/server/meta-capi";
import { createTRPCRouter, optionalUserProcedure } from "../init";

// Browser-triggered Meta Conversions API events. Values come from the DB, never the client.
export const trackingRouter = createTRPCRouter({
  addToCart: optionalUserProcedure
    .input(
      z.object({
        productId: z.string().max(64),
        quantity: z.number().int().min(1).max(10),
        url: z.url().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const product = await prisma.product
        .findFirst({
          where: { id: input.productId, isActive: true },
          select: { id: true, price: true, salePrice: true },
        })
        .catch(() => null); // malformed ObjectId
      if (!product) return { ok: false };

      const price = effectivePrice(product);
      await trackMetaEvent({
        eventName: "AddToCart",
        eventSourceUrl: input.url,
        user: { email: ctx.user?.email, phone: ctx.user?.phone, fullName: ctx.user?.name, externalId: ctx.user?.id },
        customData: {
          currency: "PKR",
          value: price * input.quantity,
          content_type: "product",
          content_ids: [product.id],
          contents: [{ id: product.id, quantity: input.quantity, item_price: price }],
        },
      });
      return { ok: true };
    }),
});
