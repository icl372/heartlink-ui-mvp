import {
  MOCK_GENERATED_COPY,
  MOCK_GIFT,
  MOCK_GIFT_TOKEN,
} from "../data";
import { createGiftUrl, generateGiftToken } from "../lib";
import { GENERATE_COPY_REQUIRED_TEXT_FIELDS } from "../types";
import type {
  AcceptGiftResult,
  AiGenerationError,
  AppError,
  CreateGiftInput,
  CreateGiftResult,
  GenerateCopyInput,
  GenerateCopyResult,
  Gift,
} from "../types";

const MOCK_DELAY_MS = 120;
const MOCK_GENERATE_COPY_DELAY_MS = 750;
const MOCK_GIFT_STORAGE_KEY = "heartlink_mock_gifts";
const MOCK_AI_NETWORK_ERROR_TRIGGER = "__mock_network_error__";
const MOCK_AI_FAILURE_TRIGGER = "__mock_ai_error__";
const MOCK_AI_EMPTY_CONTENT_TRIGGER = "__mock_empty_content__";
const MOCK_AI_UNAVAILABLE_TRIGGER = "__mock_ai_unavailable__";
const OWNED_GENERATE_COPY_ENDPOINT = "/api/generate-copy";
const OWNED_CREATE_GIFT_ENDPOINT = "/api/create-gift";
// This public flag only selects the owned API route. It is not a provider secret.
const USE_REAL_AI = import.meta.env.VITE_USE_REAL_AI === "true";
// This public flag only selects the owned gift-create route. It is not a database credential.
const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === "true";
export const MOCK_EXPIRED_GIFT_TOKEN = "mock-heartlink-expired";
const mockGiftStore = new Map<string, Gift>([
  [MOCK_GIFT_TOKEN, { ...MOCK_GIFT }],
]);

function delay(ms = MOCK_DELAY_MS) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function createAiGenerationError(code: AiGenerationError["code"], message: string): AiGenerationError {
  return {
    code,
    message,
    retryable: true,
  };
}

function getSafeAiErrorMessage(code: AiGenerationError["code"]) {
  const messages: Record<AiGenerationError["code"], string> = {
    "validation-empty": "Required copy generation input is empty.",
    "ai-generation-failed": "AI generation failed.",
    "ai-content-empty": "AI returned empty copy content.",
    "ai-service-unavailable": "AI service is unavailable.",
    "network-error": "Unable to reach the AI service.",
  };

  return messages[code];
}

function readAiErrorCode(payload: unknown): AiGenerationError["code"] | undefined {
  if (typeof payload !== "object" || payload === null || !("error" in payload)) {
    return undefined;
  }

  const error = payload.error;

  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }

  const code = error.code;
  const supportedCodes: AiGenerationError["code"][] = [
    "validation-empty",
    "ai-generation-failed",
    "ai-content-empty",
    "ai-service-unavailable",
    "network-error",
  ];

  return typeof code === "string" && supportedCodes.includes(code as AiGenerationError["code"])
    ? code as AiGenerationError["code"]
    : undefined;
}

function createAppError(code: AppError["code"], message: string): AppError {
  return { code, message };
}

function readAppErrorCode(payload: unknown): AppError["code"] | undefined {
  if (typeof payload !== "object" || payload === null || !("error" in payload)) {
    return undefined;
  }

  const error = payload.error;

  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }

  const code = error.code;
  const supportedCodes: AppError["code"][] = [
    "validation-empty",
    "network-error",
    "create-gift-failed",
    "unknown",
  ];

  return typeof code === "string" && supportedCodes.includes(code as AppError["code"])
    ? code as AppError["code"]
    : undefined;
}

function isGenerateCopyResult(payload: unknown): payload is GenerateCopyResult {
  if (typeof payload !== "object" || payload === null) return false;

  const fields: (keyof GenerateCopyResult)[] = [
    "coverText",
    "title",
    "body",
    "quote",
    "buttonText",
    "signoff",
    "acceptedText",
  ];

  return fields.every(field => {
    const value = payload[field];
    return typeof value === "string" && Boolean(value.trim());
  });
}

async function generateCopyFromOwnedApi(input: GenerateCopyInput): Promise<GenerateCopyResult> {
  let response: Response;

  try {
    response = await fetch(OWNED_GENERATE_COPY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw createAiGenerationError("network-error", getSafeAiErrorMessage("network-error"));
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw createAiGenerationError("ai-generation-failed", getSafeAiErrorMessage("ai-generation-failed"));
  }

  if (!response.ok) {
    const code = readAiErrorCode(payload) ?? "ai-generation-failed";
    throw createAiGenerationError(code, getSafeAiErrorMessage(code));
  }

  if (!isGenerateCopyResult(payload)) {
    throw createAiGenerationError("ai-content-empty", getSafeAiErrorMessage("ai-content-empty"));
  }

  return payload;
}

type CreateGiftApiResult = CreateGiftResult & { ok: true };

function isCreateGiftResult(payload: unknown): payload is CreateGiftApiResult {
  if (typeof payload !== "object" || payload === null) return false;

  const value = payload as Partial<CreateGiftApiResult>;

  return value.ok === true
    && typeof value.token === "string"
    && Boolean(value.token.trim())
    && typeof value.giftUrl === "string"
    && Boolean(value.giftUrl.trim())
    && typeof value.gift === "object"
    && value.gift !== null
    && typeof value.gift.recipientName === "string"
    && typeof value.gift.originalMessage === "string"
    && typeof value.gift.copy === "object"
    && value.gift.copy !== null;
}

async function createGiftFromOwnedApi(input: CreateGiftInput): Promise<CreateGiftApiResult> {
  let response: Response;

  try {
    response = await fetch(OWNED_CREATE_GIFT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw createAppError("network-error", "Unable to create the gift.");
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw createAppError("unknown", "Unable to create the gift.");
  }

  if (!response.ok) {
    const code = readAppErrorCode(payload) ?? "create-gift-failed";
    throw createAppError(code, "创建失败，请稍后再试。");
  }

  if (!isCreateGiftResult(payload)) {
    throw createAppError("create-gift-failed", "创建失败，请稍后再试。");
  }

  return payload;
}

function readStoredMockGifts(): Record<string, Gift> {
  if (typeof window === "undefined") return {};

  try {
    const storedGifts = window.localStorage.getItem(MOCK_GIFT_STORAGE_KEY);
    return storedGifts ? JSON.parse(storedGifts) as Record<string, Gift> : {};
  } catch {
    return {};
  }
}

function readStoredMockGift(token: string) {
  return readStoredMockGifts()[token];
}

function writeStoredMockGift(gift: Gift) {
  if (typeof window === "undefined") return;

  try {
    // Local mock preview storage only. This is not production link storage;
    // a later Supabase phase will replace this persistence boundary.
    const storedGifts = readStoredMockGifts();
    storedGifts[gift.token] = gift;
    window.localStorage.setItem(MOCK_GIFT_STORAGE_KEY, JSON.stringify(storedGifts));
  } catch {
    // Keep the in-memory mock flow usable even if browser storage is unavailable.
  }
}

function getStoredOrDefaultGift(token: string) {
  const storedGift = mockGiftStore.get(token) ?? readStoredMockGift(token);

  if (storedGift) {
    mockGiftStore.set(token, storedGift);
    return storedGift;
  }

  if (token === MOCK_GIFT_TOKEN) {
    const defaultGift = {
      ...MOCK_GIFT,
      giftUrl: createGiftUrl(MOCK_GIFT_TOKEN),
    };
    mockGiftStore.set(token, defaultGift);
    return defaultGift;
  }

  return undefined;
}

export async function generateCopy(input: GenerateCopyInput): Promise<GenerateCopyResult> {
  await delay(MOCK_GENERATE_COPY_DELAY_MS);

  const hasMissingRequiredText = GENERATE_COPY_REQUIRED_TEXT_FIELDS.some(field => {
    const value = input[field];
    return typeof value === "string" && !value.trim();
  });

  if (hasMissingRequiredText) {
    throw createAiGenerationError(
      "validation-empty",
      "Required copy generation input is empty.",
    );
  }

  const normalizedMessage = input.originalMessage.toLowerCase();

  if (normalizedMessage.includes(MOCK_AI_NETWORK_ERROR_TRIGGER)) {
    throw createAiGenerationError(
      "network-error",
      "Mock network error while generating copy.",
    );
  }

  if (normalizedMessage.includes(MOCK_AI_EMPTY_CONTENT_TRIGGER)) {
    throw createAiGenerationError(
      "ai-content-empty",
      "Mock AI returned empty copy content.",
    );
  }

  if (normalizedMessage.includes(MOCK_AI_UNAVAILABLE_TRIGGER)) {
    throw createAiGenerationError(
      "ai-service-unavailable",
      "Mock AI service is unavailable.",
    );
  }

  if (normalizedMessage.includes(MOCK_AI_FAILURE_TRIGGER)) {
    throw createAiGenerationError(
      "ai-generation-failed",
      "Mock AI generation error.",
    );
  }

  if (USE_REAL_AI) {
    return generateCopyFromOwnedApi(input);
  }

  return { ...MOCK_GENERATED_COPY };
}

export async function createGift(input: CreateGiftInput): Promise<CreateGiftResult> {
  await delay();

  if (USE_SUPABASE) {
    const createdGift = await createGiftFromOwnedApi(input);
    const giftUrl = createGiftUrl(createdGift.token);
    const gift: Gift = {
      ...createdGift.gift,
      token: createdGift.token,
      giftUrl,
    };

    // Preserve same-browser preview until TODO-038 reads real tokens from Supabase.
    mockGiftStore.set(createdGift.token, gift);
    writeStoredMockGift(gift);

    return {
      gift,
      token: createdGift.token,
      giftUrl,
    };
  }

  const token = generateGiftToken();
  const giftUrl = createGiftUrl(token);
  const now = new Date().toISOString();

  const gift: Gift = {
    ...MOCK_GIFT,
    recipientName: input.recipientName,
    senderName: input.senderName,
    occasion: input.occasion,
    tone: input.tone,
    theme: input.theme,
    originalMessage: input.originalMessage,
    amountText: input.amountText,
    copy: input.copy,
    token,
    giftUrl,
    status: "link-created",
    createdAt: now,
    updatedAt: now,
    expiresAt: null,
    openedCount: 0,
    acceptedCount: 0,
    acceptedAt: null,
  };

  mockGiftStore.set(token, gift);
  writeStoredMockGift(gift);

  return {
    gift,
    token,
    giftUrl,
  };
}

export async function getGiftByToken(token: string): Promise<Gift> {
  await delay();

  if (token === MOCK_EXPIRED_GIFT_TOKEN) {
    const error: AppError = {
      code: "gift-expired",
      message: "Gift token is expired in mock data.",
    };
    throw error;
  }

  const gift = getStoredOrDefaultGift(token);

  if (!gift) {
    const error: AppError = {
      code: "gift-not-found",
      message: "Gift token was not found in mock data.",
    };
    throw error;
  }

  return { ...gift };
}

export async function acceptGift(token: string): Promise<AcceptGiftResult> {
  await delay();

  if (token === MOCK_EXPIRED_GIFT_TOKEN) {
    const error: AppError = {
      code: "gift-expired",
      message: "Gift token is expired in mock data.",
    };
    throw error;
  }

  const gift = getStoredOrDefaultGift(token);

  if (!gift) {
    const error: AppError = {
      code: "gift-not-found",
      message: "Gift token was not found in mock data.",
    };
    throw error;
  }

  const acceptedAt = new Date().toISOString();
  const acceptedGift: Gift = {
    ...gift,
    status: "accepted",
    acceptedAt,
    acceptedCount: (gift.acceptedCount ?? 0) + 1,
    updatedAt: acceptedAt,
  };

  mockGiftStore.set(token, acceptedGift);
  writeStoredMockGift(acceptedGift);

  return {
    token,
    acceptedAt,
    acceptedText: gift.copy.acceptedText ?? "",
  };
}
