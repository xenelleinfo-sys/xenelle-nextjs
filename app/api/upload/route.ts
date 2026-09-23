import { getAuthServer } from "@/lib/authoption";
import { CLOUDINARY_FOLDERS, uploadImage } from "@/lib/cloudinary";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic"]);
const MAX_BYTES = 5 * 1024 * 1024;

// Guests can upload payment screenshots, so cap anonymous uploads per IP.
// In-memory = per server instance; good enough to stop casual abuse.
const RATE_LIMIT = { max: 8, windowMs: 10 * 60 * 1000 };
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT.max;
}

/**
 * Image upload to Cloudinary.
 *  - purpose=product (default): admin only, up to 10 files -> xenelle/products
 *  - purpose=payment: anyone at checkout (guest checkout), 1 file -> xenelle/payments
 */
export async function POST(request: Request) {
  const purpose = new URL(request.url).searchParams.get("purpose") === "payment" ? "payment" : "product";

  if (purpose === "product") {
    const session = await getAuthServer();
    if (session?.user?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  } else {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (rateLimited(ip)) {
      return Response.json({ error: "Too many uploads. Please try again in a few minutes." }, { status: 429 });
    }
  }

  const form = await request.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const max = purpose === "payment" ? 1 : 10;
  if (files.length === 0) return Response.json({ error: "No file selected" }, { status: 400 });
  if (files.length > max) return Response.json({ error: `Max ${max} file(s)` }, { status: 400 });

  for (const file of files) {
    if (!ALLOWED.has(file.type)) return Response.json({ error: `${file.name}: only images allowed` }, { status: 400 });
    if (file.size > MAX_BYTES) return Response.json({ error: `${file.name}: max 5MB` }, { status: 400 });
  }

  try {
    const folder = purpose === "payment" ? CLOUDINARY_FOLDERS.payments : CLOUDINARY_FOLDERS.products;
    const urls = await Promise.all(files.map((f) => uploadImage(f, folder)));
    return Response.json({ urls });
  } catch (e) {
    console.error("upload failed", e);
    return Response.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 502 });
  }
}
