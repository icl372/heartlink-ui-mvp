import {
  MOCK_GENERATED_COPY,
  MOCK_GIFT,
  MOCK_GIFT_TOKEN,
  MOCK_GIFT_URL,
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

export async function generateCopy(input: GenerateCopyInput): Promise<GenerateCopyResult> {
  await delay();

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
    token: MOCK_GIFT_TOKEN,
    giftUrl: MOCK_GIFT_URL,
    status: "link-created",
  };

  return {
    gift,
    token: MOCK_GIFT_TOKEN,
    giftUrl: MOCK_GIFT_URL,
  };
}

export async function getGiftByToken(token: string): Promise<Gift> {
  await delay();

  if (token !== MOCK_GIFT_TOKEN) {
    const error: AppError = {
      code: "gift-not-found",
      message: "Gift token was not found in mock data.",
    };
    throw error;
  }

  return { ...MOCK_GIFT };
}

export async function acceptGift(token: string): Promise<AcceptGiftResult> {
  await delay();

  if (token !== MOCK_GIFT_TOKEN) {
    const error: AppError = {
      code: "gift-not-found",
      message: "Gift token was not found in mock data.",
    };
    throw error;
  }

  return {
    token,
    acceptedAt: new Date().toISOString(),
    acceptedText: MOCK_GIFT.copy.acceptedText ?? "",
  };
}
