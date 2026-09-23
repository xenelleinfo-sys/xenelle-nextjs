import ProductFormPage from "@/pages_routes/admin/ProductFormPage";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata = { title: "New Product" };

export default async function NewProduct() {
  await prefetch(trpc.admin.categories.list.queryOptions());
  return (
    <HydrateClient>
      <ProductFormPage />
    </HydrateClient>
  );
}
