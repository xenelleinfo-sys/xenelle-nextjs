import Link from "next/link";
import type { ProductCard as ProductCardData } from "@/server/catalog";
import { Price } from "@/components/ui/misc";
import { ProductImage } from "@/components/ui/product-image";

export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const onSale = product.salePrice != null && product.salePrice < product.price;
  const soldOut = product.stock != null && product.stock <= 0;
  const [first, second] = product.images;
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-soft">
        <ProductImage
          src={first}
          alt={product.name}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="transition duration-700 group-hover:scale-105"
        />
        {second && (
          <ProductImage
            src={second}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="opacity-0 transition duration-700 group-hover:opacity-100"
          />
        )}
        {soldOut ? (
          <span className="absolute left-3 top-3 bg-foreground px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
            Sold out
          </span>
        ) : (
          onSale && (
            <span className="absolute left-3 top-3 bg-danger px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
              Sale
            </span>
          )
        )}
      </div>
      <div className="mt-3 space-y-1">
        <p className="eyebrow text-[10px]">{product.category.name}</p>
        <h3 className="line-clamp-1 text-sm group-hover:underline group-hover:underline-offset-4">{product.name}</h3>
        <Price price={product.price} salePrice={product.salePrice} className="text-sm" />
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:gap-x-6 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}
