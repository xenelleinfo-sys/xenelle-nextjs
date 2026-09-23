"use client";
import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import type { RouterInputs } from "@/trpc/types";
import { ProductGrid } from "@/components/shop/product-card";
import { CategorySidebar } from "@/components/shop/category-sidebar";
import { SortSelect } from "@/components/shop/sort-select";
import { EmptyState, Pagination } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";

type Input = RouterInputs["catalog"]["products"];

const ShopPage = ({ input }: { input: Input }) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.catalog.products.queryOptions(input));

  const basePath = input.category ? `/category/${input.category}` : "/shop";
  const title = data.category?.name ?? (input.q ? `Search: “${input.q}”` : "All Designs");

  const hrefFor = (page: number) => {
    const params = new URLSearchParams();
    if (input.q) params.set("q", input.q);
    if (input.sort) params.set("sort", input.sort);
    if (page > 1) params.set("page", String(page));
    const s = params.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <div className="container-x py-10 lg:py-14">
      <nav className="eyebrow mb-6 flex gap-2">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <span className="text-foreground">{data.category?.name ?? "Shop"}</span>
      </nav>

      <div className="mb-10 text-center">
        <h1 className="heading-display text-4xl lg:text-5xl">{title}</h1>
        {data.category?.description && (
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">{data.category.description}</p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-12">
        <CategorySidebar active={input.category} q={input.q} sort={input.sort} />

        <div>
          <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
            <p className="text-xs uppercase tracking-wider text-muted">
              {data.total} {data.total === 1 ? "design" : "designs"}
            </p>
            <SortSelect value={input.sort} q={input.q} />
          </div>

          {data.products.length === 0 ? (
            <EmptyState
              icon={<SearchX className="size-10" strokeWidth={1} />}
              title="No designs found"
              description={input.q ? "Try a different search term or browse all categories." : "New designs are coming soon."}
              action={<ButtonLink href="/shop" variant="outline">Browse all</ButtonLink>}
            />
          ) : (
            <>
              <ProductGrid products={data.products} />
              <Pagination page={data.page} totalPages={data.totalPages} hrefFor={hrefFor} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
