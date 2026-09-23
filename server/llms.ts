import "server-only";
import {
  CONTACT,
  FREE_SHIPPING_THRESHOLD,
  ADVANCE_AMOUNT,
  ORDER_FLOW,
  ORDER_STATUS_META,
  SHIPPING_FEE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo";
import { effectivePrice, formatPrice } from "@/lib/utils";
import { getCatalogIndex } from "./catalog";

/**
 * llms.txt (https://llmstxt.org): a Markdown summary of the store for AI
 * assistants. `full` adds every product's description (llms-full.txt).
 */
export async function buildLlmsTxt({ full }: { full: boolean }) {
  const { categories, products } = await getCatalogIndex();
  const lines: string[] = [];

  lines.push(`# ${SITE_NAME}`, "", `> ${SITE_DESCRIPTION}`, "");
  lines.push(
    `${SITE_NAME} (${SITE_TAGLINE}) is a Pakistan-based online store for custom-stitched women's clothing. ` +
      "Customers pick a design, order it in a standard size (XS–XL) or with their own body measurements in inches, " +
      "and our tailors stitch it to order.",
    "",
    "Key facts:",
    `- Payment: a ${formatPrice(ADVANCE_AMOUNT)} advance via JazzCash or EasyPaisa confirms the order (customer uploads the payment screenshot at checkout); the balance is paid cash on delivery.`,
    `- Delivery: nationwide in Pakistan. Shipping ${formatPrice(SHIPPING_FEE)}, free on orders above ${formatPrice(FREE_SHIPPING_THRESHOLD)}.`,
    "- Sizing: standard sizes or custom measurements (chest, waist, hips, shoulder, sleeve, shirt and trouser length, armhole, neck). Stitching instructions can be added per item.",
    "- Stitching time: shown on each product (typically 10–15 days).",
    "- Customers must create an account to check out; the order is confirmed once the advance is verified.",
    `- Order stages: ${ORDER_FLOW.map((s) => ORDER_STATUS_META[s].label).join(" → ")}. Pending orders can be cancelled by the customer.`,
    `- Contact: ${CONTACT.email}, WhatsApp ${CONTACT.whatsapp} (${CONTACT.hours}).`,
    "",
  );

  lines.push("## Shop", "");
  lines.push(`- [All designs](${absoluteUrl("/shop")}): full catalogue with search and sorting`);
  for (const c of categories) {
    lines.push(`- [${c.name}](${absoluteUrl(`/category/${c.slug}`)})${c.description ? `: ${c.description}` : ""}`);
  }
  lines.push("");

  for (const c of categories) {
    const inCat = products.filter((p) => p.category.slug === c.slug);
    if (inCat.length === 0) continue;
    lines.push(`## ${c.name} designs`, "");
    for (const p of inCat) {
      const price = effectivePrice(p);
      const meta = [
        formatPrice(price) + (price < p.price ? ` (was ${formatPrice(p.price)})` : ""),
        p.fabric,
        p.includes,
        `ready in ${p.deliveryDays} days`,
      ]
        .filter(Boolean)
        .join(" · ");
      lines.push(`- [${p.name}](${absoluteUrl(`/product/${p.slug}`)}): ${meta}`);
      if (full) lines.push("", indent(p.description), "");
    }
    lines.push("");
  }

  lines.push("## Customer pages", "");
  lines.push(`- [Track an order](${absoluteUrl("/track")}): enter the order number (requires login)`);
  lines.push(`- [Create an account](${absoluteUrl("/register")})`);
  lines.push("");

  if (!full) {
    lines.push("## Optional", "");
    lines.push(`- [Full catalogue with descriptions](${absoluteUrl("/llms-full.txt")})`);
    lines.push(`- [Sitemap](${absoluteUrl("/sitemap.xml")})`);
    lines.push("");
  }

  return lines.join("\n");
}

function indent(text: string) {
  return text
    .split("\n")
    .map((l) => (l.trim() ? `  ${l}` : ""))
    .join("\n");
}
