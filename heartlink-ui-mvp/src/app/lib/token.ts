export const GIFT_TOKEN_MIN_LENGTH = 10;
export const GIFT_TOKEN_MAX_LENGTH = 16;
export const DEFAULT_GIFT_TOKEN_LENGTH = 16;

const GIFT_TOKEN_ALPHABET = "23456789abcdefghijkmnopqrstuvwxyz";
const GIFT_TOKEN_PATTERN = /^[a-z0-9_-]{10,16}$/;

function getRandomIndex(maxExclusive: number) {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0] % maxExclusive;
  }

  return Math.floor(Math.random() * maxExclusive);
}

export function isValidGiftToken(token: string) {
  return GIFT_TOKEN_PATTERN.test(token);
}

export function generateGiftToken(length = DEFAULT_GIFT_TOKEN_LENGTH) {
  if (length < GIFT_TOKEN_MIN_LENGTH || length > GIFT_TOKEN_MAX_LENGTH) {
    throw new RangeError(`Gift token length must be between ${GIFT_TOKEN_MIN_LENGTH} and ${GIFT_TOKEN_MAX_LENGTH}.`);
  }

  let token = "";

  for (let i = 0; i < length; i += 1) {
    token += GIFT_TOKEN_ALPHABET[getRandomIndex(GIFT_TOKEN_ALPHABET.length)];
  }

  return token;
}

export function sanitizeGiftToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, GIFT_TOKEN_MAX_LENGTH);
}

export function encodeGiftToken(token: string) {
  const sanitizedToken = sanitizeGiftToken(token);

  if (!isValidGiftToken(sanitizedToken)) {
    throw new Error("Invalid gift token.");
  }

  return encodeURIComponent(sanitizedToken);
}

export function decodeGiftToken(segment: string) {
  try {
    return sanitizeGiftToken(decodeURIComponent(segment));
  } catch {
    return sanitizeGiftToken(segment);
  }
}
