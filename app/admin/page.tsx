import DashboardPage from "@/pages_routes/admin/DashboardPage";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default async function AdminDashboard() {
  await prefetch(trpc.admin.dashboard.stats.queryOptions());
  return (
    <HydrateClient>
      <DashboardPage />
    </HydrateClient>
  );
}
