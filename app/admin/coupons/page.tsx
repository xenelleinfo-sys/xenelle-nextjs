import CouponsPage from "@/pages_routes/admin/CouponsPage";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata = { title: "Coupons" };

export default async function AdminCoupons() {
  await prefetch(trpc.admin.coupons.list.queryOptions());
  return (
    <HydrateClient>
      <CouponsPage />
    </HydrateClient>
  );
}
