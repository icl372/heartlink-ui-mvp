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
const MOCK_EXPIRED_GIFT_TOKEN = "mock-heartlink-expired";
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

export async function generateCopy(input: GenerateCopyInput): Promise<GenerateCopyResult> {
  await delay(MOCK_GENERATE_COPY_DELAY_MS);

  if (!input.recipientName.trim() || !input.originalMessage.trim()) {
    throw createAiGenerationError(
      "ai-generation-failed",
      "Required copy generation input is empty.",
    );
  }

  const normalizedMessage = input.originalMessage.toLowerCase();

  if (normalizedMessage.includes("__mock_network_error__")) {
    throw createAiGenerationError(
      "network-error",
      "Mock network error while generating copy.",
    );
  }

  if (normalizedMessage.includes("__mock_ai_error__")) {
    throw createAiGenerationError(
      "ai-generation-failed",
      "Mock AI generation error.",
    );
  }

  return { ...MOCK_GENERATED_COPY };
}

export async function createGift(input: CreateGiftInput): Promise<CreateGiftResult> {
  await delay();

  const token = MOCK_GIFT_TOKEN;
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

  const gift = mockGiftStore.get(token);

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

  const gift = mockGiftStore.get(token);

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
