import OrdersPage from "@/pages_routes/admin/OrdersPage";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata = { title: "Orders" };

export default async function AdminOrders() {
  // matches the client's initial query input -> instant first paint
  await prefetch(trpc.admin.orders.list.queryOptions({ page: 1, limit: 20 }));
  return (
    <HydrateClient>
      <OrdersPage />
    </HydrateClient>
  );
}
