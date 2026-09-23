import PaymentAccountsPage from "@/pages_routes/admin/PaymentAccountsPage";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata = { title: "Payment Accounts" };

export default async function AdminPayments() {
  await prefetch(trpc.admin.paymentAccounts.list.queryOptions());
  return (
    <HydrateClient>
      <PaymentAccountsPage />
    </HydrateClient>
  );
}
