import { SORT_OPTIONS, type SortValue } from "./constants";

type SP = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Only allow same-origin relative redirects after login. */
export function safeCallbackUrl(v: string | string[] | undefined) {
  const url = first(v);
  return url && url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\") ? url : "/";
}

export function parseListingParams(sp: SP) {
  const sortRaw = first(sp.sort);
  const sort = SORT_OPTIONS.some((o) => o.value === sortRaw) ? (sortRaw as SortValue) : undefined;
  const page = Math.max(1, Number.parseInt(first(sp.page) ?? "1", 10) || 1);
  const q = first(sp.q)?.trim().slice(0, 100) || undefined;
  return { sort, page, q };
}
