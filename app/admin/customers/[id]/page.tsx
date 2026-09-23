import { notFound } from "next/navigation";
import CustomerDetailPage from "@/pages_routes/admin/CustomerDetailPage";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

export const metadata = { title: "Customer" };

export default async function AdminCustomer({ params }: PageProps<"/admin/customers/[id]">) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/.test(id)) notFound();
  try {
    await getQueryClient().fetchQuery(trpc.user.getUserById.queryOptions({ id }));
  } catch {
    notFound();
  }
  return (
    <HydrateClient>
      <CustomerDetailPage id={id} />
    </HydrateClient>
  );
}
