"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** PageView on the first load comes from the base code in the document head. This covers later client navigations. */
export function MetaPixel() {
  return (
    <Suspense fallback={null}>
      <MetaPageView />
    </Suspense>
  );
}

function MetaPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const skipInitial = useRef(true);

  useEffect(() => {
    if (skipInitial.current) {
      skipInitial.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname, searchParams]);

  return null;
}
