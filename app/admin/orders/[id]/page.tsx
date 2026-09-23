import { notFound } from "next/navigation";
import AdminOrderDetailPage from "@/pages_routes/admin/OrderDetailPage";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

export const metadata = { title: "Order Details" };

export default async function AdminOrderDetail({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/.test(id)) notFound();
  try {
    await getQueryClient().fetchQuery(trpc.admin.orders.byId.queryOptions({ id }));
  } catch {
    notFound();
  }
  return (
    <HydrateClient>
      <AdminOrderDetailPage id={id} />
    </HydrateClient>
  );
}
