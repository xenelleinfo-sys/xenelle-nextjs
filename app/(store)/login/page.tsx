import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";
import { Suspense } from "react";
import AuthPage from "@/pages_routes/AuthPage";
import { PageLoader } from "@/components/ui/misc";
import { safeCallbackUrl } from "@/lib/search-params";

export const metadata: Metadata = { title: "Login", robots: NO_INDEX };

export default function Login({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginContent({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const sp = await searchParams;
  return <AuthPage mode="login" callbackUrl={safeCallbackUrl(sp.callbackUrl)} expired={sp.expired === "1"} />;
}
