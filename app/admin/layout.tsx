import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageLoader } from "@/components/ui/misc";
import { NO_INDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: NO_INDEX,
};

// Access is guarded by proxy.ts (optimistic) and adminProcedure (authoritative).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminShell>
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </AdminShell>
    </Suspense>
  );
}
