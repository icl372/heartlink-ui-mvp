import { randomBytes } from "node:crypto";
import type { CreateGiftInput, Gift, GiftCopy, GiftTheme } from "../src/app/types/gift";
import type { AppErrorCode } from "../src/app/types/errors";

declare const process: {
  env: Record<string, string | undefined>;
};

type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (statusCode: number) => VercelResponse;
  json: (payload: unknown) => void;
  setHeader?: (name: string, value: string) => void;
};

type SupabaseInsertResponse = Array<{ id?: string }>;

type CreateGiftPayload = {
  ok: true;
  token: string;
  giftUrl: string;
  gift: Gift;
};

const SUPABASE_TABLE_PATH = "/rest/v1/gifts";
const SAFE_BUTTON_TEXT = "收下心意";
const SAFE_ACCEPTED_TEXT = "这份心意已被珍藏";
const MAX_TOKEN_INSERT_ATTEMPTS = 3;
const MAX_ACCEPTED_TEXT_LENGTH = 12;
const SERVER_TOKEN_LENGTH = 16;
const SERVER_TOKEN_ALPHABET = "23456789abcdefghijkmnopqrstuvwxyz";
const GIFT_OCCASIONS = new Set(["感谢", "祝福", "道歉", "鼓励", "小心意"]);
const GIFT_TONES = new Set(["真诚", "温柔", "可爱", "克制", "正式", "诗意"]);
const GIFT_THEMES = new Set<GiftTheme>(["温柔信纸", "复古收据", "诗意卡片", "简约便签"]);

function sendError(
  response: VercelResponse,
  statusCode: number,
  code: AppErrorCode,
  message: string,
) {
  return response.status(statusCode).json({ ok: false, error: { code, message } });
}

function generateServerToken() {
  return Array.from(
    randomBytes(SERVER_TOKEN_LENGTH),
    byte => SERVER_TOKEN_ALPHABET[byte & 31],
  ).join("");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseRequestBody(body: unknown): unknown {
  if (typeof body !== "string") return body;

  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

function readGiftCopy(value: unknown): GiftCopy | undefined {
  if (!isRecord(value)) return undefined;

  const requiredFields = ["title", "body", "quote", "buttonText", "signoff"] as const;

  if (!requiredFields.every(field => typeof value[field] === "string" && value[field].trim())) {
    return undefined;
  }

  const acceptedText = typeof value.acceptedText === "string" ? value.acceptedText.trim() : "";

  return {
    coverText: typeof value.coverText === "string" ? value.coverText.trim() : undefined,
    title: value.title.trim(),
    body: value.body.trim(),
    quote: value.quote.trim(),
    buttonText: SAFE_BUTTON_TEXT,
    signoff: value.signoff.trim(),
    acceptedText: acceptedText && Array.from(acceptedText).length <= MAX_ACCEPTED_TEXT_LENGTH
      ? acceptedText
      : SAFE_ACCEPTED_TEXT,
  };
}

function readCreateGiftInput(body: unknown): CreateGiftInput | undefined {
  const value = parseRequestBody(body);

  if (!isRecord(value)) return undefined;
  if (
    typeof value.recipientName !== "string"
    || typeof value.senderName !== "string"
    || typeof value.occasion !== "string"
    || typeof value.tone !== "string"
    || typeof value.theme !== "string"
    || typeof value.originalMessage !== "string"
    || (value.amountText !== undefined && typeof value.amountText !== "string")
  ) {
    return undefined;
  }

  const copy = readGiftCopy(value.copy);

  if (
    !copy
    || !GIFT_OCCASIONS.has(value.occasion)
    || !GIFT_TONES.has(value.tone)
    || !GIFT_THEMES.has(value.theme as GiftTheme)
  ) {
    return undefined;
  }

  return {
    recipientName: value.recipientName.trim(),
    senderName: value.senderName.trim(),
    occasion: value.occasion as CreateGiftInput["occasion"],
    tone: value.tone as CreateGiftInput["tone"],
    theme: value.theme as GiftTheme,
    originalMessage: value.originalMessage.trim(),
    amountText: typeof value.amountText === "string" ? value.amountText.trim() : undefined,
    copy,
  };
}

function createGiftPayload(input: CreateGiftInput, token: string, now: string, id?: string): CreateGiftPayload {
  const giftUrl = `/to/${encodeURIComponent(token)}`;
  const gift: Gift = {
    id,
    token,
    giftUrl,
    recipientName: input.recipientName,
    senderName: input.senderName,
    occasion: input.occasion,
    tone: input.tone,
    theme: input.theme,
    originalMessage: input.originalMessage,
    amountText: input.amountText,
    copy: input.copy,
    status: "link-created",
    createdAt: now,
    updatedAt: now,
    expiresAt: null,
    openedCount: 0,
    acceptedCount: 0,
    acceptedAt: null,
  };

  return { ok: true, token, giftUrl, gift };
}

function buildSupabaseRecord(input: CreateGiftInput, token: string, now: string) {
  return {
    token,
    recipient_name: input.recipientName,
    sender_name: input.senderName,
    occasion: input.occasion,
    tone: input.tone,
    amount_text: input.amountText || null,
    original_message: input.originalMessage,
    cover_text: input.copy.coverText || null,
    title: input.copy.title,
    body: input.copy.body,
    quote: input.copy.quote,
    button_text: SAFE_BUTTON_TEXT,
    accepted_text: input.copy.acceptedText || SAFE_ACCEPTED_TEXT,
    theme: input.theme,
    opened_count: 0,
    accepted_count: 0,
    created_at: now,
    updated_at: now,
    accepted_at: null,
    expires_at: null,
    is_deleted: false,
  };
}

async function insertGift(
  supabaseUrl: string,
  serviceRoleKey: string,
  record: ReturnType<typeof buildSupabaseRecord>,
) {
  return fetch(`${supabaseUrl}${SUPABASE_TABLE_PATH}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(record),
  });
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.setHeader?.("Allow", "POST");
    return sendError(response, 405, "create-gift-failed", "创建失败，请稍后再试。");
  }

  const input = readCreateGiftInput(request.body);

  if (!input?.recipientName || !input.originalMessage) {
    return sendError(response, 400, "validation-empty", "请补充必要内容后再创建。");
  }

  if (!input) {
    return sendError(response, 400, "create-gift-failed", "创建失败，请稍后再试。");
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Supabase gift creation is unavailable: missing server configuration.");
    return sendError(response, 503, "create-gift-failed", "创建失败，请稍后再试。");
  }

  for (let attempt = 0; attempt < MAX_TOKEN_INSERT_ATTEMPTS; attempt += 1) {
    const token = generateServerToken();
    const now = new Date().toISOString();

    let supabaseResponse: Response;

    try {
      supabaseResponse = await insertGift(
        supabaseUrl,
        serviceRoleKey,
        buildSupabaseRecord(input, token, now),
      );
    } catch {
      console.error("Supabase gift insert request failed before a response.");
      return sendError(response, 503, "network-error", "网络连接失败，请稍后重试。");
    }

    if (supabaseResponse.ok) {
      let insertedRows: SupabaseInsertResponse = [];

      try {
        insertedRows = await supabaseResponse.json() as SupabaseInsertResponse;
      } catch {
        console.error("Supabase gift insert returned an invalid success response.");
        return sendError(response, 502, "create-gift-failed", "创建失败，请稍后再试。");
      }

      return response.status(201).json(
        createGiftPayload(input, token, now, insertedRows[0]?.id),
      );
    }

    // A unique-token collision is safe to retry; all other provider failures stay private.
    if (supabaseResponse.status !== 409) {
      console.error("Supabase gift insert failed.", { status: supabaseResponse.status });
      return sendError(response, 502, "create-gift-failed", "创建失败，请稍后再试。");
    }
  }

  console.error("Supabase gift token collision retry limit reached.");
  return sendError(response, 503, "create-gift-failed", "创建失败，请稍后再试。");
}
