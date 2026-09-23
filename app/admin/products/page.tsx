import ProductsPage from "@/pages_routes/admin/ProductsPage";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata = { title: "Products" };

export default async function AdminProducts() {
  await Promise.all([
    prefetch(trpc.admin.categories.list.queryOptions()),
    prefetch(trpc.admin.products.list.queryOptions({ page: 1, limit: 20 })),
  ]);
  return (
    <HydrateClient>
      <ProductsPage />
    </HydrateClient>
  );
}
