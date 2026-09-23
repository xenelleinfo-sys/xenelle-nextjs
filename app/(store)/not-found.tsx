import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="The page or design you are looking for doesn't exist or is no longer available."
      action={<ButtonLink href="/shop">Browse Designs</ButtonLink>}
    />
  );
}
