import { encodeGiftToken, isValidGiftToken } from "./token";

export const GIFT_ROUTE_PREFIX = "/to";
export const DEFAULT_LOCAL_APP_ORIGIN = "http://localhost:5173";

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
