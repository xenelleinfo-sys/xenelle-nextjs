import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { after } from "next/server";

/**
 * Meta Conversions API: sends conversion events from the server.
 * https://developers.facebook.com/docs/marketing-api/conversions-api
 */

const GRAPH_VERSION = "v24.0";

type UserInput = {
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
  city?: string | null;
  externalId?: string | null;
};

export type MetaEvent = {
  eventName: "AddToCart" | "InitiateCheckout" | "Purchase" | "ViewContent";
  eventId?: string;
  eventSourceUrl?: string | null;
  user?: UserInput;
  customData?: {
    currency?: string;
    value?: number;
    content_ids?: string[];
    content_type?: "product";
    contents?: { id: string; quantity: number; item_price?: number }[];
    num_items?: number;
    order_id?: string;
  };
};

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
const norm = (v: string | null | undefined) => v?.trim().toLowerCase() || undefined;
const hashed = (v: string | undefined) => (v ? [sha256(v)] : undefined);

/** Pakistani numbers to E.164 digits without "+": 03001234567 -> 923001234567. */
function normPhone(v: string | null | undefined) {
  const d = v?.replace(/\D/g, "");
  if (!d) return undefined;
  if (d.startsWith("92")) return d;
  if (d.startsWith("0")) return `92${d.slice(1)}`;
  return d.length === 10 ? `92${d}` : d;
}

/** Click id from the _fbc cookie, or built from ?fbclid= on the page URL. */
function clickId(fbcCookie: string | undefined, url: string | null | undefined) {
  if (fbcCookie) return fbcCookie;
  try {
    const fbclid = url ? new URL(url).searchParams.get("fbclid") : null;
    return fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Queues an event to Meta after the response is sent, so checkout never waits
 * on (or fails because of) Meta. Call from a request scope (tRPC procedure,
 * route handler, server action). No-op when the env vars are missing.
 */
export async function trackMetaEvent(event: MetaEvent) {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) return;

  // read request data now; it's not available inside after()
  const [h, c] = await Promise.all([headers(), cookies()]);
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;
  const sourceUrl = event.eventSourceUrl || h.get("referer") || undefined;
  const u = event.user ?? {};
  const [firstName, ...rest] = (norm(u.fullName) ?? "").split(/\s+/);

  const payload = {
    data: [
      {
        event_name: event.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId ?? randomUUID(),
        action_source: "website",
        event_source_url: sourceUrl,
        user_data: {
          client_ip_address: ip,
          client_user_agent: h.get("user-agent") || undefined,
          fbp: c.get("_fbp")?.value,
          fbc: clickId(c.get("_fbc")?.value, sourceUrl),
          em: hashed(norm(u.email)),
          ph: hashed(normPhone(u.phone)),
          fn: hashed(firstName || undefined),
          ln: hashed(rest.join("") || undefined),
          ct: hashed(norm(u.city)?.replace(/[^a-z]/g, "")),
          country: hashed("pk"),
          external_id: hashed(norm(u.externalId)),
        },
        custom_data: event.customData,
      },
    ],
    ...(process.env.META_CAPI_TEST_EVENT_CODE ? { test_event_code: process.env.META_CAPI_TEST_EVENT_CODE } : {}),
  };

  after(async () => {
    try {
      const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) console.error(`[meta-capi] ${event.eventName} failed`, res.status, await res.text());
    } catch (e) {
      console.error(`[meta-capi] ${event.eventName} failed`, e);
    }
  });
}
