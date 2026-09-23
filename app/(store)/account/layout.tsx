import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountNav } from "@/components/layout/account-nav";
import { NO_INDEX } from "@/lib/seo";

export const metadata: Metadata = { robots: NO_INDEX };

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-x py-10 lg:py-14">
      <h1 className="heading-display mb-8 text-4xl lg:text-5xl">My Account</h1>
      <div className="grid gap-8 lg:grid-cols-[200px_1fr] lg:gap-12">
        <Suspense>
          <AccountNav />
        </Suspense>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
