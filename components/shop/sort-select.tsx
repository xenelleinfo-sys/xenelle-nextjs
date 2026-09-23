"use client";

import { usePathname, useRouter } from "next/navigation";
import { SORT_OPTIONS } from "@/lib/constants";

export function SortSelect({ value, q }: { value?: string; q?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <label className="flex items-center gap-2 text-xs uppercase tracking-wider">
      <span className="hidden text-muted sm:inline">Sort</span>
      <select
        value={value ?? "newest"}
        onChange={(e) => {
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          if (e.target.value !== "newest") params.set("sort", e.target.value);
          const s = params.toString();
          router.push(s ? `${pathname}?${s}` : pathname);
        }}
        className="border border-line bg-white px-3 py-2 text-xs uppercase tracking-wider outline-none focus:border-foreground"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
