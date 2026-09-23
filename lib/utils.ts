export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const pkr = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

export function formatPrice(amount: number) {
  return `Rs. ${pkr.format(amount)}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(value: Date | string, withTime = false) {
  return new Date(value).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

export function effectivePrice(p: { price: number; salePrice: number | null }) {
  return p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
}

/** Cash still to collect on delivery. */
export function balanceDue(o: {
  total: number;
  paymentMethod: "COD" | "ONLINE";
  paymentStatus: "UNPAID" | "ADVANCE_PAID" | "PAID";
  onlinePayment?: { amount: number; status: string } | null;
}) {
  if (o.paymentStatus === "PAID") return 0;
  // legacy advance orders: the verified advance is deducted
  const paidOnline = o.onlinePayment?.status === "VERIFIED" ? o.onlinePayment.amount : 0;
  return Math.max(0, o.total - paidOnline);
}
