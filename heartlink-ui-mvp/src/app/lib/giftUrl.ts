import { encodeGiftToken, isValidGiftToken } from "./token";

export const GIFT_ROUTE_PREFIX = "/to";
export const DEFAULT_LOCAL_APP_ORIGIN = "http://localhost:5173";
const GIFT_TOKEN_QUERY_KEYS = ["token", "gift"] as const;

export function getLocalAppOrigin() {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return DEFAULT_LOCAL_APP_ORIGIN;
}

export function createGiftUrl(token: string, origin = getLocalAppOrigin()) {
  const safeOrigin = origin.replace(/\/+$/, "");
  const tokenSegment = isValidGiftToken(token)
    ? encodeGiftToken(token)
    : encodeURIComponent(token.trim());

  return `${safeOrigin}${GIFT_ROUTE_PREFIX}/${tokenSegment}`;
}

function decodeTokenSegment(segment: string) {
  try {
    return decodeURIComponent(segment).trim();
  } catch {
    return segment.trim();
  }
}

export function getGiftTokenFromPathname(pathname: string) {
  const match = pathname.match(/^\/to\/([^/?#]+)\/?$/);
  return match?.[1] ? decodeTokenSegment(match[1]) : undefined;
}

export function getGiftTokenFromSearch(search: string) {
  const params = new URLSearchParams(search);

  for (const key of GIFT_TOKEN_QUERY_KEYS) {
    const value = params.get(key);
    if (value?.trim()) return value.trim();
  }

  return undefined;
}

export function getGiftTokenFromHash(hash: string) {
  const value = hash.replace(/^#/, "");
  if (!value) return undefined;

  if (value.startsWith("?")) {
    return getGiftTokenFromSearch(value);
  }

  return getGiftTokenFromPathname(value.startsWith("/") ? value : `/${value}`);
}

export function getGiftTokenFromLocation(locationLike = typeof window !== "undefined" ? window.location : undefined) {
  if (!locationLike) return undefined;

  return getGiftTokenFromPathname(locationLike.pathname)
    ?? getGiftTokenFromSearch(locationLike.search)
    ?? getGiftTokenFromHash(locationLike.hash);
}
