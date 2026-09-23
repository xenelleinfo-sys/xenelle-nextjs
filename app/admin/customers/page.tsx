import CustomersPage from "@/pages_routes/admin/CustomersPage";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata = { title: "Customers" };

export default async function AdminCustomers() {
  await prefetch(trpc.user.getUsers.queryOptions({ page: 1, limit: 20 }));
  return (
    <HydrateClient>
      <CustomersPage />
    </HydrateClient>
  );
}
