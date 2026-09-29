import { createTRPCRouter } from "../init";
import { accountRouter } from "./account";
import { adminCategoriesRouter } from "./admin/categories";
import { adminCouponsRouter } from "./admin/coupons";
import { adminDashboardRouter } from "./admin/dashboard";
import { adminOrdersRouter } from "./admin/orders";
import { adminPaymentAccountsRouter } from "./admin/payment-accounts";
import { adminProductsRouter } from "./admin/products";
import { catalogRouter } from "./catalog";
import { orderRouter } from "./order";
import { userRouter } from "./users";

export const appRouter = createTRPCRouter({
  catalog: catalogRouter,
  account: accountRouter,
  order: orderRouter,
  admin: createTRPCRouter({
    dashboard: adminDashboardRouter,
    products: adminProductsRouter,
    categories: adminCategoriesRouter,
    orders: adminOrdersRouter,
    paymentAccounts: adminPaymentAccountsRouter,
    coupons: adminCouponsRouter,
  }),
  // admin: customers
  user: userRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
