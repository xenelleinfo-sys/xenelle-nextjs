import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adminProcedure, createTRPCRouter } from "../init";

// Admin: customer management (Prisma / MongoDB)
export const userRouter = createTRPCRouter({
  getUsers: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
        status: z.enum(["active", "deactive"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      const where: Prisma.UserWhereInput = {};
      const search = input.search?.trim();
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ];
      }
      if (input.status) where.isActive = input.status === "active";

      const [users, totalItems, totalUsers, activeUsers] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            _count: { select: { orders: true } },
          },
        }),
        prisma.user.count({ where }),
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
      ]);

      const totalPages = Math.max(1, Math.ceil(totalItems / input.limit));
      return {
        users,
        pagination: {
          currentPage: input.page,
          limit: input.limit,
          totalItems,
          totalPages,
          hasNextPage: input.page < totalPages,
          hasPrevPage: input.page > 1,
        },
        stats: { totalUsers, activeUsers, inactiveUsers: totalUsers - activeUsers },
      };
    }),

  getUserById: adminProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const user = await prisma.user.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        address: true,
        createdAt: true,
        orders: {
          orderBy: { createdAt: "desc" },
          select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
        },
      },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    return user;
  }),

  updateUserStatus: adminProcedure
    .input(z.object({ userId: z.string(), action: z.enum(["activate", "deactivate"]) }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot deactivate yourself" });
      }
      await prisma.user.update({
        where: { id: input.userId },
        data: { isActive: input.action === "activate" },
      });
      return { success: true, message: `User ${input.action}d successfully` };
    }),

  updateUserRole: adminProcedure
    .input(z.object({ userId: z.string(), role: z.enum(["USER", "ADMIN"]) }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot change your own role" });
      }
      await prisma.user.update({ where: { id: input.userId }, data: { role: input.role } });
      return { success: true, message: "User role updated successfully" };
    }),
});

export type UserRouter = typeof userRouter;
