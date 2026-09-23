import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import logo from "@/public/brand/logo.png";
import logoWhite from "@/public/brand/logo-white.png";

/** Xenelle wordmark (butterfly "X" + ENELLE). Size it with a width class, e.g. `w-40`. */
export function Logo({
  className,
  variant = "dark",
  priority,
  href = "/",
}: {
  className?: string;
  variant?: "dark" | "light";
  priority?: boolean;
  href?: string | null;
}) {
  const img = (
    <Image
      src={variant === "light" ? logoWhite : logo}
      alt={SITE_NAME}
      priority={priority}
      sizes="(min-width: 1024px) 240px, 160px"
      className="h-auto w-full"
    />
  );
  return href ? (
    <Link href={href} aria-label={`${SITE_NAME} home`} className={cn("block", className)}>
      {img}
    </Link>
  ) : (
    <div className={className}>{img}</div>
  );
}
