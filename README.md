# Xenelle — Custom Stitching Store

Next.js 16 (App Router, Cache Components) · Prisma 6 + MongoDB · tRPC 11 + TanStack Query · next-auth (credentials) · Tailwind 4

## Setup

1. `cp .env.example .env` and fill `DATABASE_URL` (MongoDB **replica set**, e.g. Atlas) and `NEXTAUTH_JWT_SECRET` (`openssl rand -base64 32`).
2. `npm install` (runs `prisma generate`)
3. `npm run db:push` – creates collections & indexes
4. `npm run db:seed` – admin user (`ADMIN_EMAIL` / `ADMIN_PASSWORD`), 2 Piece / 3 Piece / Formal categories, sample products
5. `npm run dev` → http://localhost:3000, admin at `/admin`

> Prisma is pinned to 6.x on purpose: Prisma 7+ does not support MongoDB yet.

## How data flows

- `app/**/page.tsx` are **server components**: they `await prefetch(trpc.x.queryOptions())` and render a client view from `pages_routes/` inside `<HydrateClient>`; the view reads it with `useSuspenseQuery` (no loading flash, no double fetch).
- **Caching**: public catalog reads live in `server/catalog.ts` with `"use cache"` + `cacheTag()` + `cacheLife("max")`. They are served from cache until an admin write in `trpc/routers/admin/*` calls `invalidate(tag)` (`server/cache-tags.ts`), so the next request gets fresh data from MongoDB. User-specific data (orders, account) is never cached on the server.
- **Auth**: `proxy.ts` redirects guests away from `/checkout`, `/account`, `/admin`; `authProcedure` / `adminProcedure` enforce it on every tRPC call.
- **Checkout**: cart lives in localStorage; on "Place Order" the server re-prices every item from the DB and creates a COD order.

## Checkout & payment flow

- **No account needed.** Guests check out with email + phone + address. Every order gets a secret link (`/order/<number>?t=<token>`), shown after checkout and saved on the device; guests can also find it on **/track** with order number + phone or email. Logged-in customers see all their orders (including guest orders placed with the same email) under **My Orders**.
- **Online Payment** (JazzCash / EasyPaisa, full amount, **free delivery**): customer uploads the payment screenshot at checkout. Admin verifies it under **Orders → Payments to verify** → order becomes `CONFIRMED` + `PAID`. **Reject** (with a reason) lets the customer upload a new screenshot from their order page. Online orders can't move past Pending until verified.
- **Cash on Delivery** (full amount + `COD_DELIVERY_FEE` = Rs. 350): admin confirms by phone and moves the order forward; delivered = `PAID`.
- Fees live in `lib/constants.ts` (`DELIVERY_FEE`). Payment accounts are managed in **Admin → Payment Accounts**; without an active account only COD is offered.

## Image uploads (Cloudinary)

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. `app/api/upload/route.ts` does signed uploads (no SDK):
- product / category images (admin only) → `xenelle/products`
- payment screenshots (anyone at checkout, 1 image, 5MB, rate-limited per IP) → `xenelle/payments`, random ids; orders only accept screenshot URLs from this folder of your own cloud.
