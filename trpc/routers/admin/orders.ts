import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES } from "@/lib/constants";
import { orderStatusSchema } from "@/lib/validators";
import { adminProcedure, createTRPCRouter } from "../../init";

export const adminOrdersRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        status: orderStatusSchema.optional(),
        // "verify" = advance screenshot waiting for the admin
        advance: z.enum(["verify"]).optional(),
        q: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const where: Prisma.OrderWhereInput = {};
      if (input.status) where.status = input.status;
      if (input.advance === "verify") where.advance = { is: { status: "PENDING" } };
      const q = input.q?.trim();
      if (q) {
        where.OR = [
          { orderNumber: { contains: q, mode: "insensitive" } },
          { shipping: { is: { fullName: { contains: q, mode: "insensitive" } } } },
          { shipping: { is: { phone: { contains: q } } } },
        ];
      }

      const [items, total, grouped, toVerify] = await Promise.all([
        prisma.order.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            total: true,
            createdAt: true,
            shipping: true,
            advance: { select: { status: true, amount: true } },
            items: { select: { quantity: true } },
          },
        }),
        prisma.order.count({ where }),
        prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.order.count({ where: { status: "PENDING", advance: { is: { status: "PENDING" } } } }),
      ]);

      const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<
        (typeof ORDER_STATUSES)[number],
        number
      >;
      for (const g of grouped) counts[g.status] = g._count._all;

      return { items, total, totalPages: Math.max(1, Math.ceil(total / input.limit)), counts, toVerify };
    }),

  byId: adminProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const order = await prisma.order.findUnique({
      where: { id: input.id },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    });
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
    return order;
  }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: orderStatusSchema,
        note: z.string().trim().max(300).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const order = await prisma.order.findUnique({
        where: { id: input.id },
        select: { status: true, advance: { select: { status: true } } },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      if (order.status === input.status) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Order already has this status" });
      }
      // an order is only confirmed once its advance is verified
      if (!["PENDING", "CANCELLED"].includes(input.status) && order.advance?.status !== "VERIFIED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Verify the advance payment before moving this order forward",
        });
      }

      return prisma.order.update({
        where: { id: input.id },
        data: {
          status: input.status,
          // COD: cash is collected on delivery
          ...(input.status === "DELIVERED" ? { paymentStatus: "PAID" as const } : {}),
          history: { push: { status: input.status, note: input.note || null, createdAt: new Date() } },
        },
        select: { id: true, status: true },
      });
    }),

  verifyAdvance: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const order = await prisma.order.findUnique({
      where: { id: input.id },
      select: { status: true, advance: true },
    });
    if (!order?.advance) throw new TRPCError({ code: "NOT_FOUND", message: "No advance payment on this order" });
    if (order.advance.status === "VERIFIED") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Advance is already verified" });
    }
    const confirm = order.status === "PENDING";
    await prisma.order.update({
      where: { id: input.id },
      data: {
        advance: { set: { ...order.advance, status: "VERIFIED", note: null, verifiedAt: new Date() } },
        paymentStatus: "ADVANCE_PAID",
        ...(confirm ? { status: "CONFIRMED" as const } : {}),
        history: {
          push: {
            status: confirm ? "CONFIRMED" : order.status,
            note: `Advance of Rs. ${order.advance.amount.toLocaleString("en-PK")} verified`,
            createdAt: new Date(),
          },
        },
      },
    });
    return { success: true };
  }),

  rejectAdvance: adminProcedure
    .input(z.object({ id: z.string(), reason: z.string().trim().min(3, "Give a reason for the customer").max(300) }))
    .mutation(async ({ input }) => {
      const order = await prisma.order.findUnique({
        where: { id: input.id },
        select: { status: true, advance: true },
      });
      if (!order?.advance) throw new TRPCError({ code: "NOT_FOUND", message: "No advance payment on this order" });
      if (order.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending orders can have their payment rejected" });
      }
      await prisma.order.update({
        where: { id: input.id },
        data: {
          advance: { set: { ...order.advance, status: "REJECTED", note: input.reason, verifiedAt: null } },
          paymentStatus: "UNPAID",
          history: {
            push: { status: "PENDING", note: `Payment not verified: ${input.reason}`, createdAt: new Date() },
          },
        },
      });
      return { success: true };
    }),

  setPayment: adminProcedure
    .input(z.object({ id: z.string(), paymentStatus: z.enum(["PAID", "ADVANCE_PAID", "UNPAID"]) }))
    .mutation(({ input }) =>
      prisma.order.update({
        where: { id: input.id },
        data: { paymentStatus: input.paymentStatus },
        select: { id: true },
      }),
    ),
});
