import { notFound } from "next/navigation";
import ProductFormPage from "@/pages_routes/admin/ProductFormPage";
import { getQueryClient, HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata = { title: "Edit Product" };

export default async function EditProduct({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/.test(id)) notFound();
  try {
    await Promise.all([
      getQueryClient().fetchQuery(trpc.admin.products.byId.queryOptions({ id })),
      prefetch(trpc.admin.categories.list.queryOptions()),
    ]);
  } catch {
    notFound();
  }
  return (
    <HydrateClient>
      <ProductFormPage id={id} />
    </HydrateClient>
  );
}
