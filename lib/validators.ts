import { z } from "zod";
import { ORDER_STATUSES } from "./constants";

const pkPhone = z
  .string()
  .trim()
  .regex(/^(\+92|0)?3\d{2}[- ]?\d{7}$/, "Enter a valid mobile number, e.g. 03001234567");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email: z.email("Enter a valid email").trim().toLowerCase(),
  phone: pkPhone,
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(80),
  phone: pkPhone,
  addressLine: z.string().trim().min(8, "Enter your complete address").max(300),
  city: z.string().trim().min(2, "City is required").max(60),
  province: z.string().trim().max(60).optional().nullable(),
  postalCode: z.string().trim().max(10).optional().nullable(),
});

const measurement = z.number().positive().max(200).optional().nullable();

export const measurementsSchema = z.object({
  chest: measurement,
  waist: measurement,
  hips: measurement,
  shoulder: measurement,
  sleeveLength: measurement,
  shirtLength: measurement,
  trouserLength: measurement,
  armhole: measurement,
  neck: measurement,
});

export const cartItemSchema = z
  .object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(10),
    sizeType: z.enum(["STANDARD", "CUSTOM"]),
    size: z.string().max(10).optional().nullable(),
    measurements: measurementsSchema.optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
  })
  .refine((i) => (i.sizeType === "STANDARD" ? !!i.size : !!i.measurements), {
    message: "Select a size or enter your measurements",
  });

export const onlinePaymentProofSchema = z.object({
  accountId: z.string().min(1, "Select the account you sent the payment to"),
  screenshotUrl: z.url("Upload the payment screenshot"),
  transactionId: z.string().trim().max(40).optional().nullable(),
  senderNumber: z.string().trim().max(20).optional().nullable(),
});

export const placeOrderSchema = z
  .object({
    items: z.array(cartItemSchema).min(1, "Your cart is empty").max(30),
    // guests give an email so they can be contacted / find the order later
    email: z.email("Enter a valid email").trim().toLowerCase(),
    shipping: addressSchema,
    paymentMethod: z.enum(["COD", "ONLINE"]),
    onlinePayment: onlinePaymentProofSchema.optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
    saveAddress: z.boolean().default(true),
  })
  .refine((o) => o.paymentMethod === "COD" || !!o.onlinePayment, {
    message: "Upload your payment screenshot or choose Cash on Delivery",
    path: ["onlinePayment"],
  });

/** Guest tracking: order number + the phone or email used at checkout. */
export const trackOrderSchema = z.object({
  orderNumber: z.string().trim().toUpperCase().min(4, "Enter your order number").max(20),
  contact: z.string().trim().min(5, "Enter the phone number or email used for the order").max(120),
});

export const productInputSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    slug: z.string().trim().max(140).optional(),
    sku: z.string().trim().max(40).optional().nullable(),
    description: z.string().trim().min(10).max(5000),
    price: z.number().int().min(0),
    salePrice: z.number().int().min(0).optional().nullable(),
    images: z.array(z.string().trim().min(1)).min(1, "Add at least one image").max(10),
    fabric: z.string().trim().max(120).optional().nullable(),
    includes: z.string().trim().max(200).optional().nullable(),
    deliveryDays: z.number().int().min(1).max(90),
    sizes: z.array(z.string().trim().min(1).max(10)).min(1),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    categoryId: z.string().min(1, "Select a category"),
  })
  .refine((p) => p.salePrice == null || p.salePrice < p.price, {
    message: "Sale price must be lower than the price",
    path: ["salePrice"],
  });

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  image: z.string().trim().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).max(999),
  isActive: z.boolean(),
});

export const paymentAccountInputSchema = z.object({
  provider: z.enum(["JAZZCASH", "EASYPAISA", "BANK"]),
  accountTitle: z.string().trim().min(2, "Account title is required").max(80),
  accountNumber: z.string().trim().min(5, "Account number is required").max(40),
  bankName: z.string().trim().max(60).optional().nullable(),
  instructions: z.string().trim().max(300).optional().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
});

export const orderStatusSchema = z.enum(ORDER_STATUSES);

export type RegisterInput = z.infer<typeof registerSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type MeasurementsInput = z.infer<typeof measurementsSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type OnlinePaymentProofInput = z.infer<typeof onlinePaymentProofSchema>;
export type PaymentAccountInput = z.infer<typeof paymentAccountInputSchema>;
