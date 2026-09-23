import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="h-[114px] border-b border-line lg:h-[176px]" />}>
        <StoreHeader />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
      <Suspense>
        <CartDrawer />
      </Suspense>
    </>
  );
}

async function StoreHeader() {
  // served from the "use cache" layer, not the DB
  await prefetch(trpc.catalog.categories.queryOptions());
  return (
    <HydrateClient>
      <Header />
    </HydrateClient>
  );
}
