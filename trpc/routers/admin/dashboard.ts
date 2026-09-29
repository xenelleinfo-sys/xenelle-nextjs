import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { adminProcedure, createTRPCRouter } from "../../init";

export const adminDashboardRouter = createTRPCRouter({
  stats: adminProcedure.query(async () => {
    const [orders, pending, inProgress, delivered, products, customers, recent, toVerify, lowStock, outOfStock] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.order.count({ where: { status: { in: ["CONFIRMED", "STITCHING", "READY", "SHIPPED"] } } }),
        prisma.order.aggregate({ where: { status: "DELIVERED" }, _sum: { total: true }, _count: true }),
        prisma.product.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: "USER" } }),
        prisma.order.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          select: { id: true, orderNumber: true, status: true, total: true, createdAt: true, shipping: true },
        }),
        prisma.order.count({ where: { status: "PENDING", onlinePayment: { is: { status: "PENDING" } } } }),
        prisma.product.count({ where: { isActive: true, stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } } }),
        prisma.product.count({ where: { isActive: true, stock: { lte: 0 } } }),
      ]);

    return {
      orders,
      pending,
      inProgress,
      delivered: delivered._count,
      revenue: delivered._sum.total ?? 0,
      products,
      customers,
      recent,
      toVerify,
      lowStock,
      outOfStock,
    };
  }),
});
