import { encodeGiftToken, isValidGiftToken } from "./token";

export const GIFT_ROUTE_PREFIX = "/to";
export const GIFT_PREVIEW_QUERY_KEY = "preview";
export const DEFAULT_LOCAL_APP_ORIGIN = "http://localhost:5173";
export const DEFAULT_PRODUCTION_SITE_ORIGIN = "https://www.xygift.cn";
const GIFT_TOKEN_QUERY_KEYS = ["token", "gift"] as const;

function normalizeOrigin(value: string | undefined) {
  const origin = value?.trim().replace(/\/+$/, "");
  return origin || undefined;
}

function isLocalDevelopmentOrigin(origin: string) {
  try {
    const hostname = new URL(origin).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function isVercelDeploymentOrigin(origin: string) {
  try {
    return new URL(origin).hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

export function getPublicSiteOrigin() {
  // Vite only exposes VITE_* variables to browser code. PUBLIC_SITE_URL and
  // NEXT_PUBLIC_SITE_URL are not valid runtime configuration sources here.
  const configuredOrigin = [
    import.meta.env.VITE_APP_BASE_URL,
    import.meta.env.VITE_SITE_URL,
    import.meta.env.VITE_PUBLIC_SITE_URL,
  ]
    .map(normalizeOrigin)
    .find(origin => origin && !isVercelDeploymentOrigin(origin));

  if (configuredOrigin) return configuredOrigin;

  return isLocalDevelopmentOrigin(getLocalAppOrigin())
    ? undefined
    : DEFAULT_PRODUCTION_SITE_ORIGIN;
}

export function getLocalAppOrigin() {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return DEFAULT_LOCAL_APP_ORIGIN;
}

export function createGiftUrl(token: string, origin = getPublicSiteOrigin() ?? getLocalAppOrigin()) {
  const safeOrigin = origin.replace(/\/+$/, "");
  const tokenSegment = isValidGiftToken(token)
    ? encodeGiftToken(token)
    : encodeURIComponent(token.trim());

  return `${safeOrigin}${GIFT_ROUTE_PREFIX}/${tokenSegment}`;
}

export function createGiftPreviewUrl(token: string, origin = getPublicSiteOrigin() ?? getLocalAppOrigin()) {
  return `${createGiftUrl(token, origin)}?${GIFT_PREVIEW_QUERY_KEY}=1`;
}

export function isGiftPreviewMode(locationLike = typeof window !== "undefined" ? window.location : undefined) {
  if (!locationLike) return false;

  return new URLSearchParams(locationLike.search).get(GIFT_PREVIEW_QUERY_KEY) === "1";
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
