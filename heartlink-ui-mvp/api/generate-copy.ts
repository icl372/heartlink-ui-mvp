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

type DeepSeekMessage = {
  role: "system" | "user";
  content: string;
};

type ExtractedGiftContext = {
  event: string;
  detail: string;
  relation: string;
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
const PROVIDER_CALL_TIMEOUT_MS = 25_000;
const MAX_GENERATION_RETRIES = 2;
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
const BANNED_COPY_TERMS = [
  "父爱如山",
  "母爱如山",
  "坚实的后盾",
  "温暖如阳光",
  "默默付出",
  "无私奉献",
  "一直陪伴",
  "感恩常在",
  "风雨同舟",
];
const GENERIC_QUOTE_TERMS = [
  "爱",
  "陪伴",
  "感恩",
  "感谢",
  "珍惜",
  "温暖",
  "细节",
  "心意",
  "时光",
  "岁月",
  "美好",
  "幸福",
];
const UNSUPPORTED_FACT_TERMS = [
  "听说",
  "一直",
  "肯定",
  "我知道",
  "这段时间",
  "准备了很久",
  "很努力",
];
const VAGUE_RELATION_TERMS = [
  "收信人与送信人",
  "收信人",
  "送信人",
  "朋友",
  "对方",
  "TA",
  "ta",
  "你们",
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

function normalizeOptionalContext(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const normalizedValue = value.trim();
  const compactValue = normalizedValue.replace(/[\s。！？!?，,.、；;~～…]+/g, "");
  const emptyLikeValues = new Set([
    "没有",
    "无",
    "没",
    "暂无",
    "暂时没有",
    "没有了",
    "没了",
    "无了",
    "不用",
    "不填",
    "不记得",
    "不知道",
  ]);

  if (!normalizedValue || emptyLikeValues.has(compactValue)) {
    return undefined;
  }

  return normalizedValue;
}

function readGenerateCopyInput(body: unknown): GenerateCopyInput | undefined {
  const value = parseRequestBody(body);

  if (!isRecord(value)) return undefined;
  if (
    typeof value.recipientName !== "string"
    || typeof value.senderName !== "string"
    || typeof value.occasion !== "string"
    || typeof value.tone !== "string"
    || (value.originalMessage !== undefined && typeof value.originalMessage !== "string")
    || (value.amountText !== undefined && typeof value.amountText !== "string")
    || (value.event !== undefined && typeof value.event !== "string")
    || (value.detail !== undefined && typeof value.detail !== "string")
    || (value.extra !== undefined && typeof value.extra !== "string")
    || (value.nickname !== undefined && typeof value.nickname !== "string")
  ) {
    return undefined;
  }

  const event = typeof value.event === "string" ? value.event.trim() : undefined;
  const detail = typeof value.detail === "string" ? value.detail.trim() : undefined;
  const extra = normalizeOptionalContext(value.extra);
  const nickname = normalizeOptionalContext(value.nickname);
  const originalMessage = typeof value.originalMessage === "string"
    ? value.originalMessage.trim()
    : [
        event ? `这次是因为：${event}` : "",
        detail ? `关于TA的细节：${detail}` : "",
        extra ? `补充的瞬间或对话：${extra}` : "",
        nickname ? `彼此懂的梗或称呼：${nickname}` : "",
      ].filter(Boolean).join("\n");

  return {
    recipientName: value.recipientName.trim(),
    senderName: value.senderName.trim(),
    occasion: value.occasion as GenerateCopyInput["occasion"],
    tone: value.tone as GenerateCopyInput["tone"],
    amountText: typeof value.amountText === "string" ? value.amountText.trim() : undefined,
    event,
    detail,
    extra,
    nickname,
    originalMessage,
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

function buildExtractionMessages(input: GenerateCopyInput): DeepSeekMessage[] {
  return [
    {
      role: "system",
      content: [
        "You are an information extraction assistant for a Chinese HeartLink blessing-card product.",
        "Only extract structured facts from the user input. Do not write copy, blessings, slogans, titles, quotes, or button text.",
        "Return only one JSON object with these non-empty string keys: event, detail, relation.",
        "event: the concrete cause, occasion, or reason for this HeartLink message.",
        "detail: concrete small details, habits, actions, time, place, or remembered moments from the user input. Preserve the user's own concrete wording when possible.",
        "relation: the relationship label between recipientName and senderName, inferred conservatively from the fields.",
        "If the input is sparse, still extract the most concrete available facts instead of inventing new events.",
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
        event: input.event,
        detail: input.detail,
        extra: input.extra,
        nickname: input.nickname,
        originalMessage: input.originalMessage,
      }),
    },
  ];
}

function buildGenerationMessages(
  input: GenerateCopyInput,
  extractedContext: ExtractedGiftContext,
  bannedTerms: string[],
): DeepSeekMessage[] {
  const sourceDetailLength = getSourceDetailLength(input, extractedContext);
  const isSparseInput = sourceDetailLength <= 30;
  const relationTone = isVagueRelation(extractedContext.relation)
    ? "The relationship is vague. Use a restrained, not overly intimate tone. Do not pretend to deeply know the recipient."
    : "The relationship is available, but still do not invent shared history beyond the provided fields.";

  return [
    {
      role: "system",
      content: [
        "Your task is not to invent a moving letter. Your task is to reorganize only the user's provided information into natural Chinese words that sound like a real person.",
        "Use only facts from originalInput and extracted. Do not add unstated experiences, personality judgments, long-term states, exam/work preparation, relationship knowledge, or private background.",
        "Use the provided extracted JSON as the primary source of truth. Do not ignore the detail field.",
        "The body must naturally mention at least one concrete detail from extracted.detail. Avoid generic thanks or empty blessing templates.",
        "The opening sentence of body should also be grounded in concrete information from extracted.event or extracted.detail. Do not start with broad scene-setting such as seeing someone busy, always being there, or generic family/friendship descriptions.",
        "Avoid a stitched feeling where the first sentence is generic and only the ending mentions a concrete detail.",
        "Motivation recognition rule: the core sentence should not only thank the recipient for what they did, but also show that the sender sees why they may have done it.",
        "A useful shape is \"我知道你不是因为……,而是因为……\" or \"我后来才懂,你……,其实是……\". Do not force this exact wording, but the body should express seeing the unspoken intention behind the detail.",
        "The motivation must come from the user's detail field. Do not invent specific memories, exact words, relationship history, or private reasons that the user did not provide.",
        "If the detail field only states a fact and does not explain motivation, make only a light, common-sense inference close to the scene. For example, asking whether food should be spicy may imply caring about the sender's comfort. Keep it restrained and do not over-interpret.",
        "Do not write claims like \"你一直很XX\", \"你这段时间很XX\", \"听说XX\", \"我知道XX\", or \"你肯定XX\" unless that exact fact is clearly present in originalInput or extracted.",
        "Do not mention any concrete experience, action, preparation, effort, exam, work, habit, or relationship understanding that is not present in the input fields.",
        isSparseInput
          ? "The user provided sparse information. Keep body short: 2-3 plain sentences are enough. Do not stretch it into a full letter."
          : "The user provided richer information. You may write a fuller body, but still stay grounded in the provided facts.",
        relationTone,
        "Write like a real person sending a message, not like an essay. Use varied sentence lengths and plain emotional wording.",
        "Do not use parallel or paired sentence patterns such as \"A的XX和B的XX，都/也YY\". Avoid polished antithesis, slogan-like rhythm, or list-like praise.",
        "Do not end body paragraphs with abstract summary sentences such as \"谢谢你给我的每一个XX\" or \"这些瞬间让我知道XX\". Once the concrete detail lands, you may stop without forced elevation.",
        "Do not ban abstract emotional words such as 心, 牵挂, or 温暖 everywhere. They are acceptable near the ending if concrete details have already supported them. Avoid them only when they replace concrete detail in the opening or core motivation sentence.",
        "Quote extraction rule: if originalInput.extra is present, quote should preserve the user's real moment or dialogue from that field instead of extracting a realization sentence from the generated body.",
        "If originalInput.extra is absent and quote is based on a sentence like \"不是因为……而是因为……\", keep the whole contrast sentence. Do not extract only the latter half, because it can change the emotional meaning out of context.",
        "The quote field must include at least one concrete noun, place, object, action, nickname, or specific phrase from extracted.event or extracted.detail.",
        "The quote field must not be a generic emotional summary made only from words like love, companionship, gratitude, cherishing, warmth, details, time, or happiness.",
        "The quote field should feel specific to this person and this exact moment, not reusable for anyone. Keep quote within 20 Chinese characters and do not write it as a second body paragraph.",
        "The quote field must be a complete emotional or feeling sentence, not a copied noun phrase from detail. It must include at least one verb or emotional word.",
        "Bad quote examples: \"你的爱藏在每个细节里\", \"海河边的世纪钟\", \"你的忙碌和付出，都让我感动\".",
        "Good quote examples: \"你问我要不要辣，我记在心里\", \"你给我的世界比天津还要大\", \"你那天在楼下等我，我到现在都记得\".",
        `Do not use these banned phrases or highly similar expressions: ${bannedTerms.join("、")}.`,
        "Return only one JSON object with these non-empty string keys:",
        "coverText, title, body, quote, buttonText, signoff, acceptedText.",
        "This product is a HeartLink blessing-card experience, not a red-packet, cash, payment, collection, transfer, withdrawal, or reward tool.",
        "Even if the user mentions money, amounts, transfers, or red packets, express only gratitude and care; never imply platform money, receiving money, sending money, or payment.",
        `buttonText is a fixed product interaction label, not creative copy. Set buttonText exactly to \"${SAFE_BUTTON_TEXT}\".`,
        `coverText and acceptedText are short UI labels, not body copy. Each must be at most ${MAX_SHORT_UI_TEXT_LENGTH} Chinese characters.`,
        `Set coverText to exactly one of: \"${[...SAFE_COVER_TEXT_ALLOWLIST].join("\", \"")}\".`,
        `Set acceptedText to exactly one of: \"${[...SAFE_ACCEPTED_TEXT_ALLOWLIST].join("\", \"")}\".`,
        "Put longer blessings only in body. Never use short UI text that implies red packets, cash, receiving money, collection, transfer, payment, withdrawal, benefits, rewards, a letter, or receiving a surprise.",
        `Source detail length is ${sourceDetailLength} Chinese characters or equivalent. Match body length to this information amount instead of padding with invented emotion.`,
        "Keep title concise, quote brief, and body limited to two or three short paragraphs when there is enough source detail.",
        "Do not include markdown fences, explanations, or extra keys.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        originalInput: {
          recipientName: input.recipientName,
          senderName: input.senderName,
          occasion: input.occasion,
          tone: input.tone,
          amountText: input.amountText,
          event: input.event,
          detail: input.detail,
          extra: input.extra,
          nickname: input.nickname,
          originalMessage: input.originalMessage,
        },
        extracted: extractedContext,
        extra: input.extra,
        nickname: input.nickname,
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

function readExtractedGiftContext(payload: unknown): ExtractedGiftContext | undefined {
  if (!isRecord(payload)) return undefined;

  if (
    typeof payload.event !== "string"
    || typeof payload.detail !== "string"
    || typeof payload.relation !== "string"
  ) {
    return undefined;
  }

  const event = payload.event.trim();
  const detail = payload.detail.trim();
  const relation = payload.relation.trim();

  if (!event || !detail || !relation) return undefined;

  return { event, detail, relation };
}

function buildStructuredExtractedContext(input: GenerateCopyInput): ExtractedGiftContext | undefined {
  const event = input.event?.trim();
  const detail = input.detail?.trim();

  if (!event || !detail) return undefined;

  const detailParts = [
    detail,
    input.extra?.trim() ? `补充瞬间或对话：${input.extra.trim()}` : "",
    input.nickname?.trim() ? `彼此懂的梗或称呼：${input.nickname.trim()}` : "",
  ].filter(Boolean);
  const relation = [
    input.recipientName,
    input.senderName ? `和${input.senderName}` : "",
    input.nickname?.trim() ? `，称呼/梗：${input.nickname.trim()}` : "",
  ].filter(Boolean).join("");

  return {
    event,
    detail: detailParts.join("\n"),
    relation: relation || "收信人与送信人",
  };
}

function getProvidedSourceText(input: GenerateCopyInput, extractedContext: ExtractedGiftContext) {
  return [
    input.recipientName,
    input.senderName,
    input.occasion,
    input.tone,
    input.amountText,
    input.event,
    input.detail,
    input.extra,
    input.nickname,
    input.originalMessage,
    extractedContext.event,
    extractedContext.detail,
    extractedContext.relation,
  ].filter(Boolean).join("\n");
}

function getSourceDetailLength(input: GenerateCopyInput, extractedContext: ExtractedGiftContext) {
  const sourceText = [
    input.event,
    input.detail,
    input.extra,
    input.nickname,
    extractedContext.event,
    extractedContext.detail,
  ].filter(Boolean).join("");

  return Array.from(sourceText.replace(/\s/g, "")).length;
}

function isVagueRelation(relation: string) {
  const normalizedRelation = relation.trim();
  if (!normalizedRelation) return true;

  return VAGUE_RELATION_TERMS.some(term => normalizedRelation === term || normalizedRelation.includes(term));
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

function getMatchedBannedTerms(copy: GenerateCopyResult) {
  const text = [
    copy.title,
    copy.body,
    copy.quote,
    copy.signoff,
  ].join("\n");

  return BANNED_COPY_TERMS.filter(term => text.includes(term));
}

function getConcreteQuoteKeywords(extractedContext: ExtractedGiftContext) {
  const sourceText = `${extractedContext.event}\n${extractedContext.detail}`;
  const matches = sourceText.match(/[\p{Script=Han}A-Za-z0-9]{2,}/gu) ?? [];
  const keywords = new Set<string>();

  for (const match of matches) {
    const normalizedMatch = match.trim();
    if (!normalizedMatch || GENERIC_QUOTE_TERMS.includes(normalizedMatch)) continue;

    if (Array.from(normalizedMatch).length <= 4) {
      keywords.add(normalizedMatch);
      continue;
    }

    keywords.add(normalizedMatch);
    for (let length = 2; length <= 4; length += 1) {
      for (let index = 0; index <= normalizedMatch.length - length; index += 1) {
        const keyword = normalizedMatch.slice(index, index + length);
        if (!GENERIC_QUOTE_TERMS.includes(keyword)) {
          keywords.add(keyword);
        }
      }
    }
  }

  return [...keywords];
}

function isQuoteSpecificEnough(quote: string, extractedContext: ExtractedGiftContext) {
  const normalizedQuote = quote.trim();
  if (!normalizedQuote) return false;

  const nonGenericText = GENERIC_QUOTE_TERMS.reduce(
    (text, term) => text.replaceAll(term, ""),
    normalizedQuote,
  ).replace(/[，。！？!?、\s]/g, "");

  if (Array.from(nonGenericText).length < 2) return false;

  return getConcreteQuoteKeywords(extractedContext).some(keyword => normalizedQuote.includes(keyword));
}

function getUnsupportedFactTerms(copy: GenerateCopyResult, input: GenerateCopyInput, extractedContext: ExtractedGiftContext) {
  const sourceText = getProvidedSourceText(input, extractedContext);
  const generatedText = `${copy.body}\n${copy.quote}`;

  return UNSUPPORTED_FACT_TERMS.filter(term => generatedText.includes(term) && !sourceText.includes(term));
}

function getPreferredUserQuote(input: GenerateCopyInput) {
  const extra = input.extra?.trim();
  if (!extra) return undefined;

  return extra;
}

function applyPreferredUserQuote(copy: GenerateCopyResult, input: GenerateCopyInput): GenerateCopyResult {
  const preferredQuote = getPreferredUserQuote(input);
  return preferredQuote ? { ...copy, quote: preferredQuote } : copy;
}

function isQuoteAcceptable(quote: string, input: GenerateCopyInput, extractedContext: ExtractedGiftContext) {
  const preferredQuote = getPreferredUserQuote(input);
  if (preferredQuote) return quote.trim() === preferredQuote;

  return isQuoteSpecificEnough(quote, extractedContext);
}

function buildFallbackQuote(extractedContext: ExtractedGiftContext) {
  const keyword = getConcreteQuoteKeywords(extractedContext)[0];
  const fallbackDetail = keyword || extractedContext.detail.split(/[\n，。！？!?、]/)[0]?.trim() || "这件小事";
  const shortDetail = Array.from(fallbackDetail).slice(0, 10).join("");

  return `关于${shortDetail},我记在心里`;
}

function removeBannedSentences(value: string) {
  const sentencePattern = /[^。！？!?；;\n]+[。！？!?；;]?|\n+/g;
  const parts = value.match(sentencePattern) ?? [value];
  const cleanedParts = parts.filter(part => {
    if (/^\n+$/.test(part)) return true;
    return !BANNED_COPY_TERMS.some(term => part.includes(term));
  });
  const cleaned = cleanedParts.join("").replace(/\n{3,}/g, "\n\n").trim();

  return cleaned || value;
}

function removeUnsupportedFactSentences(value: string, input: GenerateCopyInput, extractedContext: ExtractedGiftContext) {
  const sourceText = getProvidedSourceText(input, extractedContext);
  const sentencePattern = /[^。！？!?；;\n]+[。！？!?；;]?|\n+/g;
  const parts = value.match(sentencePattern) ?? [value];
  const cleanedParts = parts.filter(part => {
    if (/^\n+$/.test(part)) return true;
    return !UNSUPPORTED_FACT_TERMS.some(term => part.includes(term) && !sourceText.includes(term));
  });
  const cleaned = cleanedParts.join("").replace(/\n{3,}/g, "\n\n").trim();

  return cleaned || buildFallbackBody(extractedContext);
}

function buildFallbackBody(extractedContext: ExtractedGiftContext) {
  const event = extractedContext.event.split(/[\n，。！？!?、]/)[0]?.trim();
  const detail = extractedContext.detail.split(/[\n，。！？!?、]/)[0]?.trim();

  return [
    event ? `因为${event}，想把这份心意送给你。` : "想把这份心意送给你。",
    detail ? `${detail}，我记在心里。` : "这件小事，我记在心里。",
  ].join("\n");
}

function removeBannedCopySentences(copy: GenerateCopyResult): GenerateCopyResult {
  return {
    ...copy,
    title: BANNED_COPY_TERMS.some(term => copy.title.includes(term)) ? "把这份心意送给你" : copy.title,
    body: removeBannedSentences(copy.body),
    quote: BANNED_COPY_TERMS.some(term => copy.quote.includes(term)) ? "愿这份心意，被你温柔收下。" : copy.quote,
    signoff: removeBannedSentences(copy.signoff),
  };
}

function removeUnsupportedFactCopy(
  copy: GenerateCopyResult,
  input: GenerateCopyInput,
  extractedContext: ExtractedGiftContext,
): GenerateCopyResult {
  const sourceText = getProvidedSourceText(input, extractedContext);
  const quoteHasUnsupportedTerm = UNSUPPORTED_FACT_TERMS.some(term => copy.quote.includes(term) && !sourceText.includes(term));

  return {
    ...copy,
    body: removeUnsupportedFactSentences(copy.body, input, extractedContext),
    quote: quoteHasUnsupportedTerm ? buildFallbackQuote(extractedContext) : copy.quote,
  };
}

async function callDeepSeekJson(
  apiKey: string,
  model: string,
  messages: DeepSeekMessage[],
): Promise<unknown> {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), PROVIDER_CALL_TIMEOUT_MS);

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
        messages,
        thinking: { type: "disabled" },
        reasoning_effort: "high",
        stream: false,
        response_format: { type: "json_object" },
      }),
      signal: abortController.signal,
    });
  } catch {
    throw new Error("network-error");
  } finally {
    clearTimeout(timeout);
  }

  if (!providerResponse.ok) {
    throw new Error(getProviderErrorCode(providerResponse.status));
  }

  let providerPayload: ProviderResponse;

  try {
    providerPayload = await providerResponse.json() as ProviderResponse;
  } catch {
    throw new Error("ai-generation-failed");
  }

  const content = providerPayload.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("ai-content-empty");
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("ai-content-empty");
  }
}

async function generateCopyWithRetries(
  apiKey: string,
  model: string,
  input: GenerateCopyInput,
  extractedContext: ExtractedGiftContext,
) {
  let latestCopy: GenerateCopyResult | undefined;

  for (let attempt = 0; attempt <= MAX_GENERATION_RETRIES; attempt += 1) {
    const generatedPayload = await callDeepSeekJson(
      apiKey,
      model,
      buildGenerationMessages(input, extractedContext, BANNED_COPY_TERMS),
    );
    const generatedCopy = readGeneratedCopy(generatedPayload);

    if (!generatedCopy) {
      throw new Error("ai-content-empty");
    }

    const candidateCopy = applyPreferredUserQuote(generatedCopy, input);
    latestCopy = candidateCopy;

    if (
      getMatchedBannedTerms(candidateCopy).length === 0
      && isQuoteAcceptable(candidateCopy.quote, input, extractedContext)
      && getUnsupportedFactTerms(candidateCopy, input, extractedContext).length === 0
    ) {
      return candidateCopy;
    }
  }

  if (!latestCopy) return undefined;

  const cleanedCopy = removeUnsupportedFactCopy(
    removeBannedCopySentences(latestCopy),
    input,
    extractedContext,
  );

  return isQuoteAcceptable(cleanedCopy.quote, input, extractedContext)
    ? cleanedCopy
    : applyPreferredUserQuote({ ...cleanedCopy, quote: buildFallbackQuote(extractedContext) }, input);
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.setHeader?.("Allow", "POST");
    return sendError(response, 405, "ai-generation-failed", "Method not allowed.");
  }

  const input = readGenerateCopyInput(request.body);

  const hasStructuredInput = Boolean(input?.event?.trim() && input.detail?.trim());

  if (!input?.recipientName || (!input.originalMessage && !hasStructuredInput)) {
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

  try {
    let extractedContext = buildStructuredExtractedContext(input);

    if (!extractedContext) {
      const extractedPayload = await callDeepSeekJson(apiKey, model, buildExtractionMessages(input));
      extractedContext = readExtractedGiftContext(extractedPayload);
    }

    if (!extractedContext) {
      return sendError(response, 502, "ai-content-empty", "AI returned incomplete extracted content.");
    }

    const generatedCopy = await generateCopyWithRetries(apiKey, model, input, extractedContext);

    if (!generatedCopy) {
      return sendError(response, 502, "ai-content-empty", "AI returned incomplete content.");
    }

    return response.status(200).json(generatedCopy);
  } catch (error) {
    const code = error instanceof Error ? error.message : "ai-generation-failed";

    if (code === "network-error") {
      return sendError(response, 503, "network-error", "Unable to reach the AI service.");
    }

    if (code === "ai-content-empty") {
      return sendError(response, 502, "ai-content-empty", "AI returned invalid content.");
    }

    if (code === "ai-service-unavailable") {
      return sendError(response, 502, "ai-service-unavailable", "AI generation is unavailable.");
    }

    return sendError(response, 502, "ai-generation-failed", "AI generation failed.");
  }
}
