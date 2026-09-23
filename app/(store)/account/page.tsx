import type { Metadata } from "next";
import { Suspense } from "react";
import AccountPage from "@/pages_routes/AccountPage";
import { PageLoader } from "@/components/ui/misc";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

export const metadata: Metadata = { title: "My Account" };

export default function Account() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AccountContent />
    </Suspense>
  );
}

async function AccountContent() {
  await connection();
  try {
    await getQueryClient().fetchQuery(trpc.account.me.queryOptions());
  } catch {
    redirect("/login?callbackUrl=/account&expired=1");
  }
  return (
    <HydrateClient>
      <AccountPage />
    </HydrateClient>
  );
}
