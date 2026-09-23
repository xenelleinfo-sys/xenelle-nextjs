import Image, { type ImageProps } from "next/image";
import { Shirt } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIMIZABLE = [/^https:\/\/images\.unsplash\.com\//, /^https:\/\/res\.cloudinary\.com\//];

/**
 * next/image wrapper: optimizes known hosts, and falls back to an
 * unoptimized image for any other URL an admin pastes in.
 */
export function ProductImage({
  src,
  alt,
  className,
  ...rest
}: Omit<ImageProps, "src"> & { src?: string | null }) {
  if (!src) {
    return (
      <div className={cn("flex size-full items-center justify-center bg-soft text-muted", className)}>
        <Shirt className="size-8" strokeWidth={1} />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      unoptimized={!OPTIMIZABLE.some((r) => r.test(src))}
      className={cn("object-cover", className)}
      {...rest}
    />
  );
}
