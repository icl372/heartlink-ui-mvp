import {
  MOCK_GENERATED_COPY,
  MOCK_GIFT,
  MOCK_GIFT_TOKEN,
} from "../data";
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

function getMockBaseUrl() {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return "http://localhost:5173";
}

function createMockGiftUrl(token: string) {
  return `${getMockBaseUrl()}/to/${token}`;
}

function createMockGiftToken() {
  return `mock-heartlink-${Date.now().toString(36)}`;
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
      giftUrl: createMockGiftUrl(MOCK_GIFT_TOKEN),
    };
    mockGiftStore.set(token, defaultGift);
    return defaultGift;
  }

  return undefined;
}

export async function generateCopy(input: GenerateCopyInput): Promise<GenerateCopyResult> {
  await delay(MOCK_GENERATE_COPY_DELAY_MS);

  if (!input.recipientName.trim() || !input.originalMessage.trim()) {
    throw createAiGenerationError(
      "ai-generation-failed",
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

  if (normalizedMessage.includes(MOCK_AI_FAILURE_TRIGGER)) {
    throw createAiGenerationError(
      "ai-generation-failed",
      "Mock AI generation error.",
    );
  }

  return { ...MOCK_GENERATED_COPY };
}

export async function createGift(input: CreateGiftInput): Promise<CreateGiftResult> {
  await delay();

  const token = createMockGiftToken();
  const giftUrl = createMockGiftUrl(token);

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

  return {
    token,
    acceptedAt: new Date().toISOString(),
    acceptedText: gift.copy.acceptedText ?? "",
  };
}
