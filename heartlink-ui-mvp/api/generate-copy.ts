import { createHash } from "node:crypto";
import type { GenerateCopyInput, GenerateCopyResult } from "../src/app/types/ai";
import type { AiGenerationErrorCode } from "../src/app/types/errors";

declare const process: {
  env: Record<string, string | undefined>;
};

type VercelRequest = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  status: (statusCode: number) => VercelResponse;
  json: (payload: unknown) => void;
  setHeader?: (name: string, value: string) => void;
};

type ProviderResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

type RateLimitConfig = {
  enabled: boolean;
  windowMinutes: number;
  windowMaxRequests: number;
  dailyMaxRequests: number;
  globalDailyMaxRequests: number;
  salt?: string;
};

type RateLimitDecision =
  | { allowed: true }
  | { allowed: false; code: "rate-limited" | "ai-service-unavailable"; statusCode: number; message: string };

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";
const SUPPORTED_DEEPSEEK_MODELS = new Set([
  "deepseek-v4-flash",
  "deepseek-v4-pro",
]);
const REQUEST_TIMEOUT_MS = 12_000;
const SUPABASE_RATE_LIMIT_TABLE_PATH = "/rest/v1/ai_usage_events";
const RATE_LIMIT_ROUTE = "generate-copy";
const DEFAULT_RATE_LIMIT_WINDOW_MINUTES = 10;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 5;
const DEFAULT_RATE_LIMIT_DAILY_MAX_REQUESTS = 20;
const DEFAULT_RATE_LIMIT_GLOBAL_DAILY_MAX_REQUESTS = 200;
const SAFE_BUTTON_TEXT = "收下心意";
const SAFE_BUTTON_TEXT_ALLOWLIST = new Set([SAFE_BUTTON_TEXT]);
const SAFE_ACCEPTED_TEXT = "这份心意已被珍藏";
const SAFE_ACCEPTED_TEXT_ALLOWLIST = new Set([
  SAFE_ACCEPTED_TEXT,
  "已收下这份心意",
  "这份心意已送达",
  "心意已被好好收下",
]);
const SAFE_COVER_TEXT = "有一份心意送给你";
const SAFE_COVER_TEXT_ALLOWLIST = new Set([
  SAFE_COVER_TEXT,
  "这是一份小小心意",
  "有人为你准备了心意",
  "打开这份心意",
]);
const MAX_SHORT_UI_TEXT_LENGTH = 12;
const UNSAFE_SHORT_UI_TEXT_TERMS = [
  "红包",
  "现金",
  "提现",
  "收款",
  "转账",
  "付款",
  "领取红包",
  "领红包",
  "收红包",
  "福利",
  "奖励",
  "收钱",
  "领钱",
  "一封家书",
  "一封信",
  "领取惊喜",
];

function sendError(
  response: VercelResponse,
  statusCode: number,
  code: AiGenerationErrorCode,
  message: string,
) {
  return response.status(statusCode).json({ ok: false, error: { code, message } });
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

function readGenerateCopyInput(body: unknown): GenerateCopyInput | undefined {
  const value = parseRequestBody(body);

  if (!isRecord(value)) return undefined;
  if (
    typeof value.recipientName !== "string"
    || typeof value.senderName !== "string"
    || typeof value.occasion !== "string"
    || typeof value.tone !== "string"
    || typeof value.originalMessage !== "string"
    || (value.amountText !== undefined && typeof value.amountText !== "string")
  ) {
    return undefined;
  }

  return {
    recipientName: value.recipientName.trim(),
    senderName: value.senderName.trim(),
    occasion: value.occasion as GenerateCopyInput["occasion"],
    tone: value.tone as GenerateCopyInput["tone"],
    amountText: typeof value.amountText === "string" ? value.amountText.trim() : undefined,
    originalMessage: value.originalMessage.trim(),
  };
}

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsedValue = Number.parseInt(value ?? "", 10);
  return Number.isSafeInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function getRateLimitConfig(): RateLimitConfig {
  const enabledValue = process.env.AI_RATE_LIMIT_ENABLED?.trim().toLowerCase();

  return {
    // Production protection is enabled by default. Local development can explicitly set false.
    enabled: enabledValue !== "false",
    windowMinutes: readPositiveInteger(
      process.env.AI_RATE_LIMIT_WINDOW_MINUTES,
      DEFAULT_RATE_LIMIT_WINDOW_MINUTES,
    ),
    windowMaxRequests: readPositiveInteger(
      process.env.AI_RATE_LIMIT_MAX_REQUESTS,
      DEFAULT_RATE_LIMIT_MAX_REQUESTS,
    ),
    dailyMaxRequests: readPositiveInteger(
      process.env.AI_RATE_LIMIT_DAILY_MAX_REQUESTS,
      DEFAULT_RATE_LIMIT_DAILY_MAX_REQUESTS,
    ),
    globalDailyMaxRequests: readPositiveInteger(
      process.env.AI_GLOBAL_DAILY_MAX_REQUESTS,
      DEFAULT_RATE_LIMIT_GLOBAL_DAILY_MAX_REQUESTS,
    ),
    salt: process.env.RATE_LIMIT_SALT?.trim(),
  };
}

function getHeaderValue(request: VercelRequest, headerName: string) {
  const headers = request.headers ?? {};
  const matchingKey = Object.keys(headers).find(key => key.toLowerCase() === headerName);
  const value = matchingKey ? headers[matchingKey] : undefined;

  return Array.isArray(value) ? value[0] : value;
}

function getClientKey(request: VercelRequest, salt: string) {
  const forwardedFor = getHeaderValue(request, "x-forwarded-for");
  const realIp = getHeaderValue(request, "x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "unknown";
  const userAgent = getHeaderValue(request, "user-agent")?.trim() || "unknown";

  // Only the irreversible hash is stored. Raw request identifiers never leave this scope.
  return createHash("sha256").update(`${ip}\n${userAgent}\n${salt}`).digest("hex");
}

function getContentRangeCount(contentRange: string | null) {
  const total = contentRange?.split("/").pop();
  const parsedTotal = total ? Number.parseInt(total, 10) : Number.NaN;
  return Number.isSafeInteger(parsedTotal) && parsedTotal >= 0 ? parsedTotal : undefined;
}

async function countUsageEvents(
  supabaseUrl: string,
  serviceRoleKey: string,
  since: Date,
  clientKey?: string,
) {
  const query = new URLSearchParams({
    select: "id",
    route: `eq.${RATE_LIMIT_ROUTE}`,
    created_at: `gte.${since.toISOString()}`,
    limit: "1",
  });

  if (clientKey) {
    query.set("client_key", `eq.${clientKey}`);
  }

  const usageResponse = await fetch(
    `${supabaseUrl}${SUPABASE_RATE_LIMIT_TABLE_PATH}?${query.toString()}`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: "count=exact",
      },
    },
  );

  if (!usageResponse.ok) {
    throw new Error(`AI rate-limit count failed with status ${usageResponse.status}.`);
  }

  const count = getContentRangeCount(usageResponse.headers.get("content-range"));

  if (count === undefined) {
    throw new Error("AI rate-limit count response omitted content-range.");
  }

  return count;
}

async function recordUsageEvent(
  supabaseUrl: string,
  serviceRoleKey: string,
  clientKey: string,
  blocked: boolean,
  reason: string | null,
) {
  const usageResponse = await fetch(`${supabaseUrl}${SUPABASE_RATE_LIMIT_TABLE_PATH}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_key: clientKey,
      route: RATE_LIMIT_ROUTE,
      blocked,
      reason,
    }),
  });

  if (!usageResponse.ok) {
    throw new Error(`AI rate-limit event insert failed with status ${usageResponse.status}.`);
  }
}

async function checkRateLimit(request: VercelRequest): Promise<RateLimitDecision> {
  const config = getRateLimitConfig();

  if (!config.enabled) return { allowed: true };

  const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!config.salt || !supabaseUrl || !serviceRoleKey) {
    console.error("AI rate limiting is unavailable: missing server configuration.");
    return {
      allowed: false,
      code: "ai-service-unavailable",
      statusCode: 503,
      message: "AI service is temporarily unavailable.",
    };
  }

  const clientKey = getClientKey(request, config.salt);
  const now = Date.now();
  const windowStart = new Date(now - config.windowMinutes * 60_000);
  const dailyStart = new Date(now - 24 * 60 * 60_000);

  try {
    const [windowCount, dailyCount, globalDailyCount] = await Promise.all([
      countUsageEvents(supabaseUrl, serviceRoleKey, windowStart, clientKey),
      countUsageEvents(supabaseUrl, serviceRoleKey, dailyStart, clientKey),
      countUsageEvents(supabaseUrl, serviceRoleKey, dailyStart),
    ]);
    const blockedReason = windowCount >= config.windowMaxRequests
      ? "client-window-limit"
      : dailyCount >= config.dailyMaxRequests
        ? "client-daily-limit"
        : globalDailyCount >= config.globalDailyMaxRequests
          ? "global-daily-limit"
          : null;

    await recordUsageEvent(supabaseUrl, serviceRoleKey, clientKey, Boolean(blockedReason), blockedReason);

    if (blockedReason) {
      return {
        allowed: false,
        code: "rate-limited",
        statusCode: 429,
        message: "AI generation is temporarily limited. Please try again later.",
      };
    }
  } catch {
    console.error("AI rate limiting is unavailable: Supabase usage storage failed.");
    return {
      allowed: false,
      code: "ai-service-unavailable",
      statusCode: 503,
      message: "AI service is temporarily unavailable.",
    };
  }

  return { allowed: true };
}

function buildMessages(input: GenerateCopyInput) {
  return [
    {
      role: "system",
      content: [
        "You write warm, restrained Chinese gift-letter copy.",
        "Return only one JSON object with these non-empty string keys:",
        "coverText, title, body, quote, buttonText, signoff, acceptedText.",
        "This product is a HeartLink blessing-card experience, not a red-packet, cash, payment, collection, transfer, withdrawal, or reward tool.",
        "Even if the user mentions money, amounts, transfers, or red packets, express only gratitude and care; never imply platform money, receiving money, sending money, or payment.",
        `buttonText is a fixed product interaction label, not creative copy. Set buttonText exactly to \"${SAFE_BUTTON_TEXT}\".`,
        `coverText and acceptedText are short UI labels, not body copy. Each must be at most ${MAX_SHORT_UI_TEXT_LENGTH} Chinese characters.`,
        `Set coverText to exactly one of: \"${[...SAFE_COVER_TEXT_ALLOWLIST].join("\", \"")}\".`,
        `Set acceptedText to exactly one of: \"${[...SAFE_ACCEPTED_TEXT_ALLOWLIST].join("\", \"")}\".`,
        "Put longer blessings only in body. Never use short UI text that implies red packets, cash, receiving money, collection, transfer, payment, withdrawal, benefits, rewards, a letter, or receiving a surprise.",
        "Keep title concise, quote brief, and body limited to two or three short paragraphs.",
        "Do not include markdown fences, explanations, or extra keys.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        recipientName: input.recipientName,
        senderName: input.senderName,
        occasion: input.occasion,
        tone: input.tone,
        amountText: input.amountText,
        originalMessage: input.originalMessage,
      }),
    },
  ];
}

function sanitizeButtonText(value: unknown): string {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  const containsUnsafeTerm = UNSAFE_SHORT_UI_TEXT_TERMS.some(term => normalizedValue.includes(term));

  if (!normalizedValue || containsUnsafeTerm || !SAFE_BUTTON_TEXT_ALLOWLIST.has(normalizedValue)) {
    return SAFE_BUTTON_TEXT;
  }

  // The MVP uses one fixed product CTA, even when the provider returns the allowed text.
  return SAFE_BUTTON_TEXT;
}

function sanitizeShortUiText(
  value: unknown,
  allowlist: Set<string>,
  fallback: string,
): string {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  const isTooLong = Array.from(normalizedValue).length > MAX_SHORT_UI_TEXT_LENGTH;
  const containsUnsafeTerm = UNSAFE_SHORT_UI_TEXT_TERMS.some(term => normalizedValue.includes(term));

  if (!normalizedValue || isTooLong || containsUnsafeTerm || !allowlist.has(normalizedValue)) {
    return fallback;
  }

  return normalizedValue;
}

function sanitizeAcceptedText(value: unknown): string {
  return sanitizeShortUiText(value, SAFE_ACCEPTED_TEXT_ALLOWLIST, SAFE_ACCEPTED_TEXT);
}

function sanitizeCoverText(value: unknown): string {
  return sanitizeShortUiText(value, SAFE_COVER_TEXT_ALLOWLIST, SAFE_COVER_TEXT);
}

function readGeneratedCopy(payload: unknown): GenerateCopyResult | undefined {
  if (!isRecord(payload)) return undefined;

  const fields = [
    "title",
    "body",
    "quote",
    "signoff",
  ] as const;

  if (!fields.every(field => typeof payload[field] === "string" && payload[field].trim())) {
    return undefined;
  }

  return {
    coverText: sanitizeCoverText(payload.coverText),
    title: payload.title as string,
    body: payload.body as string,
    quote: payload.quote as string,
    buttonText: sanitizeButtonText(payload.buttonText),
    signoff: payload.signoff as string,
    acceptedText: sanitizeAcceptedText(payload.acceptedText),
  };
}

function getProviderErrorCode(status: number): AiGenerationErrorCode {
  if (status === 400 || status === 422) return "ai-generation-failed";
  return "ai-service-unavailable";
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.setHeader?.("Allow", "POST");
    return sendError(response, 405, "ai-generation-failed", "Method not allowed.");
  }

  const input = readGenerateCopyInput(request.body);

  if (!input?.recipientName || !input.originalMessage) {
    return sendError(response, 400, "validation-empty", "Required copy input is empty.");
  }

  if (!input) {
    return sendError(response, 400, "ai-generation-failed", "Invalid copy input.");
  }

  const rateLimitDecision = await checkRateLimit(request);

  if (!rateLimitDecision.allowed) {
    return sendError(
      response,
      rateLimitDecision.statusCode,
      rateLimitDecision.code,
      rateLimitDecision.message,
    );
  }

  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  const model = process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_DEEPSEEK_MODEL;

  if (!apiKey || !SUPPORTED_DEEPSEEK_MODELS.has(model)) {
    return sendError(response, 503, "ai-service-unavailable", "AI service is unavailable.");
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

  let providerResponse: Response;

  try {
    providerResponse = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: buildMessages(input),
        thinking: { type: "disabled" },
        reasoning_effort: "high",
        stream: false,
        response_format: { type: "json_object" },
      }),
      signal: abortController.signal,
    });
  } catch {
    return sendError(response, 503, "network-error", "Unable to reach the AI service.");
  } finally {
    clearTimeout(timeout);
  }

  if (!providerResponse.ok) {
    const code = getProviderErrorCode(providerResponse.status);
    return sendError(response, 502, code, "AI generation is unavailable.");
  }

  let providerPayload: ProviderResponse;

  try {
    providerPayload = await providerResponse.json() as ProviderResponse;
  } catch {
    return sendError(response, 502, "ai-generation-failed", "AI generation failed.");
  }

  const content = providerPayload.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    return sendError(response, 502, "ai-content-empty", "AI returned empty content.");
  }

  let generatedPayload: unknown;

  try {
    generatedPayload = JSON.parse(content);
  } catch {
    return sendError(response, 502, "ai-content-empty", "AI returned invalid content.");
  }

  const generatedCopy = readGeneratedCopy(generatedPayload);

  if (!generatedCopy) {
    return sendError(response, 502, "ai-content-empty", "AI returned incomplete content.");
  }

  return response.status(200).json(generatedCopy);
}
