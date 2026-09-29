import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { couponInputSchema } from "@/lib/validators";
import { adminProcedure, createTRPCRouter } from "../../init";

async function assertCodeFree(code: string, ignoreId?: string) {
  const hit = await prisma.coupon.findUnique({ where: { code }, select: { id: true } });
  if (hit && hit.id !== ignoreId) {
    throw new TRPCError({ code: "CONFLICT", message: `Coupon "${code}" already exists` });
  }
}

// Discount codes: a percentage off the order subtotal (see server/coupons.ts for the rules).
export const adminCouponsRouter = createTRPCRouter({
  list: adminProcedure.query(() => prisma.coupon.findMany({ orderBy: { createdAt: "desc" } })),

  create: adminProcedure.input(couponInputSchema).mutation(async ({ input }) => {
    await assertCodeFree(input.code);
    return prisma.coupon.create({ data: input });
  }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: couponInputSchema }))
    .mutation(async ({ input }) => {
      await assertCodeFree(input.data.code, input.id);
      return prisma.coupon.update({ where: { id: input.id }, data: input.data });
    }),

  setActive: adminProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(({ input }) =>
      prisma.coupon.update({ where: { id: input.id }, data: { isActive: input.isActive }, select: { id: true } }),
    ),

  // Orders keep their own snapshot of the code and percentage, so deleting is safe.
  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    await prisma.coupon.delete({ where: { id: input.id } });
    return { success: true };
  }),
});
