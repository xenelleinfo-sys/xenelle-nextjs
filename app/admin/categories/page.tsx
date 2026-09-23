import CategoriesPage from "@/pages_routes/admin/CategoriesPage";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata = { title: "Categories" };

export default async function AdminCategories() {
  await prefetch(trpc.admin.categories.list.queryOptions());
  return (
    <HydrateClient>
      <CategoriesPage />
    </HydrateClient>
  );
}
