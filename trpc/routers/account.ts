import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { addressSchema, registerSchema } from "@/lib/validators";
import { authProcedure, baseProcedure, createTRPCRouter } from "../init";

export const accountRouter = createTRPCRouter({
  register: baseProcedure.input(registerSchema).mutation(async ({ input }) => {
    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) {
      throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists" });
    }
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash: await bcrypt.hash(input.password, 10),
      },
      select: { id: true, email: true },
    });
    return user;
  }),

  me: authProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { id: true, name: true, email: true, phone: true, address: true, createdAt: true },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return user;
  }),

  updateProfile: authProcedure
    .input(
      z.object({
        name: registerSchema.shape.name,
        phone: registerSchema.shape.phone,
        address: addressSchema.optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          name: input.name,
          phone: input.phone,
          ...(input.address ? { address: { set: input.address } } : {}),
        },
        select: { id: true, name: true, phone: true },
      });
    }),

  changePassword: authProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: registerSchema.shape.password,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({ where: { id: ctx.user.id } });
      if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Current password is incorrect" });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await bcrypt.hash(input.newPassword, 10) },
      });
      return { success: true };
    }),
});
