import type {
  GiftOccasion,
  GiftTone,
  HeartIntent,
  HeartIntentTag,
  HeartRecipientRole,
  HeartTonePreference,
} from "./gift";

export type GiftRelationship = "妈妈" | "爸爸" | "长辈" | "伴侣" | "朋友" | "孩子" | "老师" | "同事" | "其他";

export interface GenerateCopyInput {
  recipientName: string;
  senderName: string;
  occasion: GiftOccasion;
  tone: GiftTone;
  amountText?: string;
  relationship?: GiftRelationship | null;
  event?: string;
  detail?: string;
  extra?: string;
  nickname?: string;
  originalMessage: string;
  heartIntent?: HeartIntent;
  recipientRole?: HeartRecipientRole | null;
  story?: string;
  intentTag?: HeartIntentTag | null;
  coreMessage?: string;
  tonePreference?: HeartTonePreference;
}

export interface GenerateCopyResult {
  coverText: string;
  title: string;
  body: string;
  quote: string;
  buttonText: string;
  signoff: string;
  acceptedText: string;
}

export const GENERATE_COPY_INPUT_FIELDS = [
  "recipientName",
  "senderName",
  "occasion",
  "tone",
  "amountText",
  "relationship",
  "event",
  "detail",
  "extra",
  "nickname",
  "originalMessage",
  "heartIntent",
  "recipientRole",
  "story",
  "intentTag",
  "coreMessage",
  "tonePreference",
] as const satisfies readonly (keyof GenerateCopyInput)[];

export const GENERATE_COPY_REQUIRED_TEXT_FIELDS = [
  "recipientName",
  "event",
  "detail",
] as const satisfies readonly (keyof GenerateCopyInput)[];

export const GENERATE_COPY_OUTPUT_FIELDS = [
  "coverText",
  "title",
  "body",
  "buttonText",
  "acceptedText",
] as const satisfies readonly (keyof GenerateCopyResult)[];

export type AiGenerationStatus =
  | "idle"
  | "generating"
  | "success"
  | "failed"
  | "network-error";
