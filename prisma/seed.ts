/**
 * npm run db:seed
 * Creates the admin user (ADMIN_EMAIL / ADMIN_PASSWORD), the 2 Piece / 3 Piece
 * categories and a few sample stitching designs. Safe to run multiple times.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;

const categories = [
  {
    name: "2 Piece",
    slug: "2-piece",
    description: "Shirt & trouser or shirt & dupatta — stitched to your size.",
    image: img("1583391733956-3750e0ff4e8b"),
    sortOrder: 1,
  },
  {
    name: "3 Piece",
    slug: "3-piece",
    description: "Complete suits with shirt, dupatta and trouser.",
    image: img("1617627143750-d86bc21e42bb"),
    sortOrder: 2,
  },
  {
    name: "Formal",
    slug: "formal",
    description: "Festive and wedding wear with premium finishing.",
    image: img("1594633312681-425c7b97ccd1"),
    sortOrder: 3,
  },
];

const photos = [
  "1583391733956-3750e0ff4e8b",
  "1610030469983-98e550d6193c",
  "1617627143750-d86bc21e42bb",
  "1594633312681-425c7b97ccd1",
  "1595777457583-95e059d581b8",
  "1539008835657-9e8e9680c956",
  "1515372039744-b8f02a3ae446",
  "1572804013309-59a88b7e92f1",
  "1581044777550-4cfa60707c03",
  "1609357605129-26f69add5d6e",
  "1614252235316-8c857d38b5f4",
  "1605763240000-7e93b172d754",
];

const products: {
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  fabric: string;
  includes: string;
  featured?: boolean;
}[] = [
  { name: "Embroidered Lawn Shirt & Trouser", category: "2-piece", price: 3200, fabric: "Lawn", includes: "Shirt, Trouser", featured: true },
  { name: "Printed Cambric Kurta Set", category: "2-piece", price: 2800, salePrice: 2400, fabric: "Cambric", includes: "Shirt, Trouser" },
  { name: "Khaddar Shirt with Dupatta", category: "2-piece", price: 3500, fabric: "Khaddar", includes: "Shirt, Dupatta" },
  { name: "Cotton Straight Shirt Set", category: "2-piece", price: 2600, fabric: "Cotton", includes: "Shirt, Trouser", featured: true },
  { name: "Classic Lawn 3 Piece Suit", category: "3-piece", price: 4500, fabric: "Lawn", includes: "Shirt, Dupatta, Trouser", featured: true },
  { name: "Chikankari Lawn 3 Piece", category: "3-piece", price: 5200, salePrice: 4600, fabric: "Lawn with Chiffon Dupatta", includes: "Shirt, Dupatta, Trouser", featured: true },
  { name: "Winter Khaddar 3 Piece", category: "3-piece", price: 4800, fabric: "Khaddar", includes: "Shirt, Shawl, Trouser" },
  { name: "Jacquard Everyday 3 Piece", category: "3-piece", price: 4200, fabric: "Jacquard", includes: "Shirt, Dupatta, Trouser" },
  { name: "Organza Festive Suit", category: "formal", price: 8500, fabric: "Organza", includes: "Shirt, Dupatta, Trouser", featured: true },
  { name: "Velvet Wedding Ensemble", category: "formal", price: 12500, fabric: "Velvet", includes: "Shirt, Shawl, Trouser" },
  { name: "Chiffon Embellished Maxi", category: "formal", price: 9800, salePrice: 8900, fabric: "Chiffon", includes: "Maxi, Dupatta", featured: true },
  { name: "Silk Angrakha Set", category: "formal", price: 7600, fabric: "Raw Silk", includes: "Shirt, Dupatta, Trouser" },
];

// Wallets customers send the Rs. 1,000 advance to (editable in Admin → Payment Accounts)
const paymentAccounts = [
  { provider: "JAZZCASH" as const, accountTitle: "Xenelle", accountNumber: "0335 5553800", sortOrder: 1 },
  { provider: "EASYPAISA" as const, accountTitle: "Xenelle", accountNumber: "0335 5553800", sortOrder: 2 },
];

function slugify(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s-]+/g, "-");
}

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@xenelle.pk").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "Admin@12345";
  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", isActive: true },
    create: { name: "Admin", email, phone: "03000000000", role: "ADMIN", passwordHash: await bcrypt.hash(password, 10) },
  });
  console.log(`✔ admin: ${email}`);

  const catIds: Record<string, string> = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
    catIds[c.slug] = cat.id;
  }
  console.log(`✔ ${categories.length} categories`);

  for (const [i, p] of products.entries()) {
    const slug = slugify(p.name);
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: p.name,
        slug,
        sku: `XN-${String(i + 1).padStart(3, "0")}`,
        description:
          `Get this ${p.fabric.toLowerCase()} design stitched to perfection by our tailors.\n\n` +
          "• Choose a standard size or give your own measurements\n" +
          "• Neat finishing with quality lining where required\n" +
          "• We call to confirm your order before stitching starts",
        price: p.price,
        salePrice: p.salePrice ?? null,
        images: [img(photos[i % photos.length]), img(photos[(i + 5) % photos.length])],
        fabric: p.fabric,
        includes: p.includes,
        deliveryDays: p.category === "formal" ? 15 : 10,
        isFeatured: !!p.featured,
        categoryId: catIds[p.category],
      },
    });
  }
  console.log(`✔ ${products.length} products`);

  for (const a of paymentAccounts) {
    const exists = await prisma.paymentAccount.findFirst({
      where: { provider: a.provider, accountNumber: a.accountNumber },
    });
    if (!exists) await prisma.paymentAccount.create({ data: a });
  }
  console.log(`✔ payment accounts: ${paymentAccounts.map((a) => `${a.provider} ${a.accountNumber}`).join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
