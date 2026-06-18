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

export async function generateCopy(input: GenerateCopyInput): Promise<GenerateCopyResult> {
  await delay();

  if (!input.recipientName.trim() || !input.originalMessage.trim()) {
    const error: AiGenerationError = {
      code: "ai-generation-failed",
      message: "Required copy generation input is empty.",
      retryable: true,
    };
    throw error;
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
