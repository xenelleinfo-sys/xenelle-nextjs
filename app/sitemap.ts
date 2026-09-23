import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { absoluteUrl } from "@/lib/seo";
import { getCatalogIndex } from "@/server/catalog";

// Rendered on request (so `next build` doesn't need the DB); the catalog
// itself comes from the "use cache" layer and refreshes on admin writes.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const { categories, products } = await getCatalogIndex();

  const latest = [...products.map((p) => p.updatedAt), ...categories.map((c) => c.updatedAt)].sort(
    (a, b) => b.getTime() - a.getTime(),
  )[0];

  return [
    { url: absoluteUrl("/"), lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/shop"), lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({
      url: absoluteUrl(`/category/${c.slug}`),
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: absoluteUrl(`/product/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: p.images.slice(0, 5).map((i) => absoluteUrl(i)),
    })),
    { url: absoluteUrl("/track"), changeFrequency: "yearly", priority: 0.3 },
  ];
}
