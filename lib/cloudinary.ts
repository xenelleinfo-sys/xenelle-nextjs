import "server-only";
import { createHash, randomUUID } from "node:crypto";

/*
 * Minimal Cloudinary client (signed uploads via the REST API).
 * Env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

export const CLOUDINARY_FOLDERS = {
  products: "xenelle/products",
  payments: "xenelle/payments",
} as const;

function config() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET)");
  }
  return { cloudName, apiKey, apiSecret };
}

// https://cloudinary.com/documentation/authentication_signatures
function sign(params: Record<string, string>, apiSecret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

export async function uploadImage(file: File, folder: string) {
  const { cloudName, apiKey, apiSecret } = config();
  const params: Record<string, string> = {
    folder,
    // random, unguessable id (payment screenshots must not be enumerable)
    public_id: randomUUID(),
    timestamp: String(Math.floor(Date.now() / 1000)),
    allowed_formats: "jpg,jpeg,png,webp,avif,heic",
  };

  const body = new FormData();
  body.append("file", file);
  for (const [k, v] of Object.entries(params)) body.append(k, v);
  body.append("api_key", apiKey);
  body.append("signature", sign(params, apiSecret));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });
  const json = (await res.json()) as { secure_url?: string; error?: { message: string } };
  if (!res.ok || !json.secure_url) {
    throw new Error(json.error?.message ?? `Cloudinary upload failed (${res.status})`);
  }
  return json.secure_url;
}

/** True when `url` is an image we uploaded into `folder` of our own cloud. */
export function isOwnCloudinaryUrl(url: string, folder: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return false;
  const prefix = `https://res.cloudinary.com/${cloudName}/image/upload/`;
  if (!url.startsWith(prefix)) return false;
  // .../image/upload/v1712345678/xenelle/payments/<uuid>.jpg
  return new RegExp(`^(v\\d+/)?${folder}/[a-f0-9-]{36}\\.[a-z]+$`).test(url.slice(prefix.length));
}
