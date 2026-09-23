import { getAuthServer } from "@/lib/authoption";
import { prisma } from "@/lib/prisma";
import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";
import superjson from "superjson";
import { ZodError } from "zod";

export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   * Session is read lazily inside authProcedure / adminProcedure so public
   * (cached) catalog procedures never touch cookies.
   */
  return {};
});

const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const zodError = error.cause instanceof ZodError ? error.cause : null;
    return {
      ...shape,
      // surface the first validation message so toasts are readable
      message: zodError?.issues[0]?.message ?? shape.message,
    };
  },
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

/**
 * Session user re-checked against the DB (cached per request), so deleted or
 * blocked customers and demoted admins lose access immediately even though
 * their JWT cookie is still valid.
 */
const getSessionUser = cache(async () => {
  const session = await getAuthServer();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
  });
  return user?.isActive ? user : null;
});

// Authenticated procedure - calls auth() only when needed
export const authProcedure = baseProcedure.use(async ({ next }) => {
  const user = await getSessionUser();

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Please login to continue" });
  }

  return next({ ctx: { user } });
});

export const adminProcedure = baseProcedure.use(async ({ next }) => {
  const user = await getSessionUser();

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (user.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Administrator Role required",
    });
  }

  return next({ ctx: { user } });
});
