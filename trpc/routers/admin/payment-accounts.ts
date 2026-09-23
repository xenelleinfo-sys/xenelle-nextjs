import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { paymentAccountInputSchema } from "@/lib/validators";
import { invalidate, TAGS } from "@/server/cache-tags";
import { adminProcedure, createTRPCRouter } from "../../init";

// JazzCash / EasyPaisa / bank accounts customers send the advance to.
export const adminPaymentAccountsRouter = createTRPCRouter({
  list: adminProcedure.query(() =>
    prisma.paymentAccount.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  ),

  create: adminProcedure.input(paymentAccountInputSchema).mutation(async ({ input }) => {
    const account = await prisma.paymentAccount.create({ data: input });
    invalidate(TAGS.paymentAccounts);
    return account;
  }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: paymentAccountInputSchema }))
    .mutation(async ({ input }) => {
      const account = await prisma.paymentAccount.update({ where: { id: input.id }, data: input.data });
      invalidate(TAGS.paymentAccounts);
      return account;
    }),

  // Orders keep a snapshot of the account, so deleting is safe.
  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    await prisma.paymentAccount.delete({ where: { id: input.id } });
    invalidate(TAGS.paymentAccounts);
    return { success: true };
  }),
});
