import type { GiftOccasion, GiftTone } from "./gift";

export interface GenerateCopyInput {
  recipientName: string;
  senderName: string;
  occasion: GiftOccasion;
  tone: GiftTone;
  amountText?: string;
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

export type AiGenerationStatus =
  | "idle"
  | "generating"
  | "success"
  | "failed"
  | "network-error";
