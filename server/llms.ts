import "server-only";
import {
  CONTACT,
  COD_DELIVERY_FEE,
  ORDER_FLOW,
  ORDER_STATUS_META,
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
    "- Payment: either Online Payment (JazzCash / EasyPaisa — the customer uploads the payment screenshot at checkout and the order is confirmed once it is verified) or Cash on Delivery.",
    `- Delivery: nationwide in Pakistan. Free with online payment; ${formatPrice(COD_DELIVERY_FEE)} with cash on delivery.`,
    "- Sizing: standard sizes or custom measurements (chest, waist, hips, shoulder, sleeve, shirt and trouser length, armhole, neck). Stitching instructions can be added per item.",
    "- Stitching time: shown on each product (typically 10–15 days).",
    "- No account needed: guests can check out and track orders with their order number and phone number or email. An account shows all past orders in one place.",
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
