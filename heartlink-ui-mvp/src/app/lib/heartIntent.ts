import type {
  HeartIntent,
  HeartIntentTag,
  HeartOccasion,
  HeartRecipientRole,
  HeartTonePreference,
} from "../types";

export interface BuildHeartIntentInput {
  recipientName: string;
  recipientRole?: HeartRecipientRole | null;
  occasion: HeartOccasion;
  story: string;
  intentTag?: HeartIntentTag | null;
  coreMessage?: string;
  tone: HeartTonePreference;
  senderName?: string;
}

function cleanText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function buildOriginalInput(input: {
  recipientName: string;
  recipientRole: HeartRecipientRole | null;
  occasion: HeartOccasion;
  story: string;
  intentTag: HeartIntentTag | null;
  coreMessage: string;
  tone: HeartTonePreference;
  senderName: string;
}) {
  return [
    input.recipientName ? `这份心意送给谁：${input.recipientName}` : "",
    input.recipientRole ? `TA 是你的谁：${input.recipientRole}` : "",
    input.occasion ? `为什么想送这份心意：${input.occasion}` : "",
    input.story ? `有什么事想放进心意里：${input.story}` : "",
    input.intentTag ? `最想表达的重点：${input.intentTag}` : "",
    input.coreMessage ? `最想让对方知道的话：${input.coreMessage}` : "",
    input.tone ? `想要的感觉：${input.tone}` : "",
    input.senderName ? `署名：${input.senderName}` : "",
  ].filter(Boolean).join("\n");
}

export function buildHeartIntent(input: BuildHeartIntentInput): HeartIntent {
  const recipientName = cleanText(input.recipientName);
  const recipientRole = input.recipientRole ?? null;
  const occasion = input.occasion;
  const story = cleanText(input.story);
  const intentTag = input.intentTag ?? null;
  const coreMessage = cleanText(input.coreMessage);
  const tone = input.tone;
  const senderName = cleanText(input.senderName) || "我";

  const originalInput = buildOriginalInput({
    recipientName,
    recipientRole,
    occasion,
    story,
    intentTag,
    coreMessage,
    tone,
    senderName,
  });

  return {
    recipientName,
    recipientRole,
    occasion,
    story,
    intentTag,
    coreMessage,
    tone,
    senderName,
    originalInput,
    noInventFacts: {
      recipientName,
      recipientRole,
      occasion,
      story,
      intentTag,
      coreMessage,
    },
  };
}
