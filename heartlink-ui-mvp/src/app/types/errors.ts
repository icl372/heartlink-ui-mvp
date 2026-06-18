export type AppErrorCode =
  | "validation-empty"
  | "ai-generation-failed"
  | "network-error"
  | "copy-link-failed"
  | "gift-not-found"
  | "gift-expired"
  | "unknown";

export interface AppError {
  code: AppErrorCode;
  message: string;
  cause?: unknown;
}

export interface AiGenerationError extends AppError {
  code: "ai-generation-failed" | "network-error";
  retryable: boolean;
}

export interface CopyLinkError extends AppError {
  code: "copy-link-failed";
}
