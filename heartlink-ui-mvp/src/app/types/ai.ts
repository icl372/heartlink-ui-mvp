import type { GiftOccasion, GiftTone } from "./gift";

export interface GenerateCopyInput {
  recipientName: string;
  senderName: string;
  occasion: GiftOccasion;
  tone: GiftTone;
  amountText?: string;
  event?: string;
  detail?: string;
  extra?: string;
  nickname?: string;
  originalMessage: string;
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
  "event",
  "detail",
  "extra",
  "nickname",
  "originalMessage",
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
  "quote",
  "buttonText",
  "acceptedText",
] as const satisfies readonly (keyof GenerateCopyResult)[];

export type AiGenerationStatus =
  | "idle"
  | "generating"
  | "success"
  | "failed"
  | "network-error";
