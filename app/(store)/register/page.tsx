import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";
import { Suspense } from "react";
import AuthPage from "@/pages_routes/AuthPage";
import { PageLoader } from "@/components/ui/misc";
import { safeCallbackUrl } from "@/lib/search-params";

export const metadata: Metadata = { title: "Create Account", robots: NO_INDEX };

export default function Register({ searchParams }: PageProps<"/register">) {
  return (
    <Suspense fallback={<PageLoader />}>
      <RegisterContent searchParams={searchParams} />
    </Suspense>
  );
}

async function RegisterContent({ searchParams }: Pick<PageProps<"/register">, "searchParams">) {
  const sp = await searchParams;
  return <AuthPage mode="register" callbackUrl={safeCallbackUrl(sp.callbackUrl)} />;
}
