"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      title="Something went wrong"
      description={error.message || "Please try again."}
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
