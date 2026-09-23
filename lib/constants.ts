export const SITE_NAME = "Xenelle";
export const SITE_TAGLINE = "Custom Stitching Studio";
export const SITE_DESCRIPTION =
  "Xenelle is an online custom stitching studio in Pakistan. Choose 2 piece, 3 piece and formal dress designs, " +
  "order in a standard size or your own measurements. Confirm with a small JazzCash / EasyPaisa advance and pay the rest cash on delivery.";
export const SITE_KEYWORDS = [
  "Xenelle",
  "custom stitching",
  "dress stitching online",
  "tailor online Pakistan",
  "2 piece stitching",
  "3 piece suit stitching",
  "ladies suit stitching",
  "made to measure dresses",
  "stitched lawn suits",
  "formal dress stitching",
  "cash on delivery Pakistan",
];
export const CONTACT = {
  email: "support@xenelle.pk",
  phone: "+92 300 0000000",
  whatsapp: "0300 0000000",
  hours: "Mon – Sat, 10am – 7pm",
};

export const SHIPPING_FEE = 250;
export const FREE_SHIPPING_THRESHOLD = 10000;
/** Advance sent via JazzCash / EasyPaisa to confirm an order; the rest is cash on delivery. */
export const ADVANCE_AMOUNT = 1000;

export const PAYMENT_PROVIDERS = {
  JAZZCASH: { label: "JazzCash", tone: "bg-red-50 text-red-700 ring-red-200" },
  EASYPAISA: { label: "EasyPaisa", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  BANK: { label: "Bank Transfer", tone: "bg-sky-50 text-sky-700 ring-sky-200" },
} as const;
export type PaymentProviderValue = keyof typeof PAYMENT_PROVIDERS;

export const ADVANCE_STATUS_META = {
  PENDING: { label: "Verifying payment", tone: "bg-amber-50 text-amber-800 ring-amber-200" },
  VERIFIED: { label: "Advance verified", tone: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  REJECTED: { label: "Payment rejected", tone: "bg-rose-50 text-rose-800 ring-rose-200" },
} as const;
export type AdvanceStatusValue = keyof typeof ADVANCE_STATUS_META;

export const PAYMENT_STATUS_LABEL = {
  UNPAID: "Unpaid",
  ADVANCE_PAID: "Advance paid",
  PAID: "Paid",
} as const;

export const PRODUCTS_PER_PAGE = 12;

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "STITCHING",
  "READY",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

// Normal flow of an order, used for the tracking timeline.
export const ORDER_FLOW: OrderStatusValue[] = [
  "PENDING",
  "CONFIRMED",
  "STITCHING",
  "READY",
  "SHIPPED",
  "DELIVERED",
];

export const ORDER_STATUS_META: Record<
  OrderStatusValue,
  { label: string; description: string; tone: string }
> = {
  PENDING: {
    label: "Order Placed",
    description: "We have received your order and are verifying your advance payment.",
    tone: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  CONFIRMED: {
    label: "Confirmed",
    description: "Advance received — your order and measurements are confirmed.",
    tone: "bg-sky-50 text-sky-800 ring-sky-200",
  },
  STITCHING: {
    label: "In Stitching",
    description: "Our tailors are working on your outfit.",
    tone: "bg-violet-50 text-violet-800 ring-violet-200",
  },
  READY: {
    label: "Ready",
    description: "Stitching done, quality checked and packed.",
    tone: "bg-teal-50 text-teal-800 ring-teal-200",
  },
  SHIPPED: {
    label: "Shipped",
    description: "Handed over to the courier. Keep the balance ready in cash.",
    tone: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  },
  DELIVERED: {
    label: "Delivered",
    description: "Delivered and paid. Enjoy your outfit!",
    tone: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  },
  CANCELLED: {
    label: "Cancelled",
    description: "This order has been cancelled.",
    tone: "bg-rose-50 text-rose-800 ring-rose-200",
  },
};

export const MEASUREMENT_FIELDS = [
  { key: "chest", label: "Chest" },
  { key: "waist", label: "Waist" },
  { key: "hips", label: "Hips" },
  { key: "shoulder", label: "Shoulder" },
  { key: "sleeveLength", label: "Sleeve Length" },
  { key: "shirtLength", label: "Shirt Length" },
  { key: "trouserLength", label: "Trouser Length" },
  { key: "armhole", label: "Armhole" },
  { key: "neck", label: "Neck" },
] as const;
export type MeasurementKey = (typeof MEASUREMENT_FIELDS)[number]["key"];

export const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Kashmir",
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name", label: "Name A–Z" },
] as const;
export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
