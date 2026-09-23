"use client";

import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { cn } from "@/lib/utils";

export function CategorySidebar({ active, q, sort }: { active?: string; q?: string; sort?: string }) {
  const trpc = useTRPC();
  const { data: categories } = useSuspenseQuery(trpc.catalog.categories.queryOptions());
  const total = categories.reduce((s, c) => s + c.productCount, 0);

  const qs = (base: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sort) params.set("sort", sort);
    const s = params.toString();
    return s ? `${base}?${s}` : base;
  };

  const links = [
    { href: qs("/shop"), label: "All Designs", count: total, isActive: !active },
    ...categories.map((c) => ({
      href: qs(`/category/${c.slug}`),
      label: c.name,
      count: c.productCount,
      isActive: active === c.slug,
    })),
  ];

  return (
    <aside>
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em]">Categories</p>

      {/* mobile: horizontal chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "shrink-0 border px-4 py-2 text-xs uppercase tracking-wider",
              l.isActive ? "border-foreground bg-foreground text-white" : "border-line",
            )}
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* desktop: list */}
      <ul className="hidden space-y-1 lg:block">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className={cn(
                "flex items-center justify-between border-l-2 py-2 pl-3 text-sm transition",
                l.isActive
                  ? "border-accent font-medium text-foreground"
                  : "border-transparent text-muted hover:border-line hover:text-foreground",
              )}
            >
              {l.label}
              <span className="text-xs text-muted">{l.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
