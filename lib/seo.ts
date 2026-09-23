import { CONTACT, SITE_DESCRIPTION, SITE_NAME } from "./constants";

/** Public origin used for canonical URLs, sitemap, OG tags and JSON-LD. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Robots for private pages (cart, checkout, account, admin, auth). */
export const NO_INDEX = { index: false, follow: false } as const;

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/brand/logo.png"),
    description: SITE_DESCRIPTION,
    email: CONTACT.email,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: CONTACT.phone,
      email: CONTACT.email,
      areaServed: "PK",
      availableLanguage: ["en", "ur"],
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/shop?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function productJsonLd(p: {
  name: string;
  slug: string;
  sku: string | null;
  description: string;
  images: string[];
  price: number;
  salePrice: number | null;
  fabric: string | null;
  category: { name: string };
}) {
  const price = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.images.map((i) => absoluteUrl(i)),
    sku: p.sku ?? undefined,
    category: p.category.name,
    material: p.fabric ?? undefined,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${p.slug}`),
      priceCurrency: "PKR",
      price,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${SITE_URL}/#organization` },
      acceptedPaymentMethod: "http://purl.org/goodrelations/v1#COD",
    },
  };
}
