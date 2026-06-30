import type { Gift, GiftRecord, GiftTheme, GiftThemeId } from "../src/app/types/gift";
import type { AppErrorCode } from "../src/app/types/errors";

declare const process: {
  env: Record<string, string | undefined>;
};

type VercelRequest = {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  status: (statusCode: number) => VercelResponse;
  json: (payload: unknown) => void;
  setHeader?: (name: string, value: string) => void;
};

const SUPABASE_TABLE_PATH = "/rest/v1/gifts";
const GIFT_TOKEN_PATTERN = /^[a-z0-9_-]{10,16}$/;
const SIGNOFF_QUOTE_PREFIX = "__signoff__:";
const SAFE_BUTTON_TEXT = "收下心意";
const SAFE_COVER_TEXT = "有一份心意送给你";
const SAFE_ACCEPTED_TEXT = "这份心意已被珍藏";
const DEFAULT_THEME: GiftTheme = "简约便签";

const LEGACY_THEME_TO_ID: Record<GiftTheme, GiftThemeId> = {
  温柔信纸: "gentle-letter",
  复古收据: "vintage-receipt",
  诗意卡片: "poetic-card",
  简约便签: "minimal-note",
};

const THEME_BY_ID: Record<GiftThemeId, GiftTheme> = {
  "gentle-letter": "温柔信纸",
  "vintage-receipt": "复古收据",
  "poetic-card": "诗意卡片",
  "minimal-note": "简约便签",
};

function sendError(
  response: VercelResponse,
  statusCode: number,
  code: AppErrorCode,
  message: string,
) {
  return response.status(statusCode).json({ ok: false, error: { code, message } });
}

function getQueryToken(request: VercelRequest) {
  const value = request.query?.token;
  const token = Array.isArray(value) ? value[0] : value;

  return typeof token === "string" ? token.trim().toLowerCase() : "";
}

function getFrontendTheme(value: unknown): GiftTheme {
  if (typeof value !== "string") return DEFAULT_THEME;

  if (value in THEME_BY_ID) {
    return THEME_BY_ID[value as GiftThemeId];
  }

  return value in LEGACY_THEME_TO_ID ? value as GiftTheme : DEFAULT_THEME;
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;

  const expiresAtTime = new Date(expiresAt).getTime();
  return Number.isFinite(expiresAtTime) && expiresAtTime <= Date.now();
}

function isGiftRecord(value: unknown): value is GiftRecord {
  if (typeof value !== "object" || value === null) return false;

  const record = value as Partial<GiftRecord>;

  return typeof record.id === "string"
    && typeof record.token === "string"
    && typeof record.recipient_name === "string"
    && typeof record.sender_name === "string"
    && typeof record.occasion === "string"
    && typeof record.tone === "string"
    && typeof record.original_message === "string"
    && typeof record.title === "string"
    && typeof record.body === "string"
    && typeof record.quote === "string"
    && typeof record.button_text === "string"
    && typeof record.opened_count === "number"
    && typeof record.accepted_count === "number"
    && typeof record.created_at === "string"
    && typeof record.updated_at === "string"
    && typeof record.is_deleted === "boolean";
}

function mapRecordToGift(record: GiftRecord): Gift {
  const acceptedAt = record.accepted_at ?? null;
  const storedSignoff = record.quote.startsWith(SIGNOFF_QUOTE_PREFIX)
    ? record.quote.slice(SIGNOFF_QUOTE_PREFIX.length).trim()
    : "";
  const displaySignoff = storedSignoff || record.sender_name || "一位关心你的人";

  return {
    id: record.id,
    token: record.token,
    giftUrl: `/to/${encodeURIComponent(record.token)}`,
    recipientName: record.recipient_name,
    senderName: record.sender_name,
    occasion: record.occasion,
    tone: record.tone,
    theme: getFrontendTheme(record.theme),
    originalMessage: record.original_message,
    amountText: record.amount_text ?? undefined,
    copy: {
      coverText: record.cover_text?.trim() || SAFE_COVER_TEXT,
      title: record.title,
      body: record.body,
      quote: storedSignoff ? "" : record.quote,
      buttonText: SAFE_BUTTON_TEXT,
      // The current table has no signoff column; keep the receiver signature coherent.
      signoff: displaySignoff,
      acceptedText: record.accepted_text?.trim() || SAFE_ACCEPTED_TEXT,
    },
    status: acceptedAt ? "accepted" : "link-created",
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    acceptedAt,
    expiresAt: record.expires_at,
    openedCount: record.opened_count,
    acceptedCount: record.accepted_count,
  };
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") {
    response.setHeader?.("Allow", "GET");
    return sendError(response, 405, "gift-not-found", "这份心意不存在或已失效。");
  }

  const token = getQueryToken(request);

  if (!GIFT_TOKEN_PATTERN.test(token)) {
    return sendError(response, 404, "gift-not-found", "这份心意不存在或已失效。");
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Supabase gift read is unavailable: missing server configuration.");
    return sendError(response, 503, "network-error", "网络连接失败，请稍后重试。");
  }

  const query = new URLSearchParams({
    select: "id,token,recipient_name,sender_name,occasion,tone,amount_text,original_message,cover_text,title,body,quote,button_text,accepted_text,theme,opened_count,accepted_count,created_at,updated_at,accepted_at,expires_at,is_deleted",
    token: `eq.${token}`,
    limit: "1",
  });

  let supabaseResponse: Response;

  try {
    supabaseResponse = await fetch(`${supabaseUrl}${SUPABASE_TABLE_PATH}?${query.toString()}`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });
  } catch {
    console.error("Supabase gift read request failed before a response.");
    return sendError(response, 503, "network-error", "网络连接失败，请稍后重试。");
  }

  if (!supabaseResponse.ok) {
    console.error("Supabase gift read failed.", { status: supabaseResponse.status });
    return sendError(response, 502, "network-error", "网络连接失败，请稍后重试。");
  }

  let records: unknown;

  try {
    records = await supabaseResponse.json();
  } catch {
    console.error("Supabase gift read returned an invalid response.");
    return sendError(response, 502, "network-error", "网络连接失败，请稍后重试。");
  }

  const record = Array.isArray(records) ? records[0] : undefined;

  if (!isGiftRecord(record) || record.is_deleted) {
    return sendError(response, 404, "gift-not-found", "这份心意不存在或已失效。");
  }

  if (isExpired(record.expires_at)) {
    return sendError(response, 410, "gift-expired", "这份心意已过期。");
  }

  return response.status(200).json({ ok: true, gift: mapRecordToGift(record) });
}
