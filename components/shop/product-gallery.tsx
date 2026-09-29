"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductImage } from "@/components/ui/product-image";
import { cn } from "@/lib/utils";

/**
 * Product images: main 3:4 image + thumbnails.
 * - sm and up: thumbnails in a left column that is exactly as tall as the main
 *   image and scrolls, so any number of images never stretches the layout.
 * - mobile: horizontal, swipeable thumbnail strip under the image.
 */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className={cn("relative aspect-[3/4] overflow-hidden bg-soft", count > 1 && "sm:ml-[88px]")}>
        <ProductImage
          key={images[index]}
          src={images[index]}
          alt={count > 1 ? `${alt} — image ${index + 1} of ${count}` : alt}
          fill
          priority={index === 0}
          sizes="(min-width: 1024px) 45vw, (min-width: 640px) 36rem, 100vw"
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 shadow transition hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 shadow transition hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight className="size-4" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div
          className={cn(
            // mobile: horizontal strip below the image
            "mt-3 flex gap-2 overflow-x-auto pb-1",
            // sm+: vertical column beside the image, same height, scrolls
            "sm:absolute sm:inset-y-0 sm:left-0 sm:mt-0 sm:w-[76px] sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden sm:pb-0",
          )}
        >
          {images.map((img, i) => (
            <button
              key={img + i}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "relative aspect-[3/4] w-16 shrink-0 overflow-hidden bg-soft ring-1 ring-inset transition sm:w-full",
                i === index ? "ring-2 ring-foreground" : "ring-transparent opacity-70 hover:opacity-100",
              )}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
            >
              <ProductImage src={img} alt="" fill sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
