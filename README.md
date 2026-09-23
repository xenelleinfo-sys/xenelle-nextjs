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

## Order & payment flow

1. Customer checks out and sends a **Rs. 1,000 advance** (`ADVANCE_AMOUNT` in `lib/constants.ts`) to one of the JazzCash / EasyPaisa / bank accounts listed at checkout, then uploads the payment screenshot (+ optional transaction ID).
2. Order is created as `PENDING` with the advance `PENDING`. Admin sees it under **Orders → Payments to verify** (also flagged on the dashboard).
3. Admin opens the order, checks the screenshot against the wallet app and clicks **Verify** → order becomes `CONFIRMED`, payment `ADVANCE_PAID`. **Reject** (with a reason) keeps it pending and the customer can upload a new screenshot from their order page.
4. `CONFIRMED → STITCHING → READY → SHIPPED → DELIVERED`; the balance is collected cash on delivery (delivered = `PAID`). An order can't move past Pending until its advance is verified.

Payment accounts are managed in **Admin → Payment Accounts**; checkout is disabled while no account is active.

## Image uploads (Cloudinary)

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. `app/api/upload/route.ts` does signed uploads (no SDK):
- product / category images (admin only) → `xenelle/products`
- advance screenshots (any logged-in customer, 1 image, 5MB) → `xenelle/payments`, random ids; orders only accept screenshot URLs from this folder of your own cloud.
