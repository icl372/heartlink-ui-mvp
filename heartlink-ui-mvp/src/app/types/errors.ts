export type AppErrorCode =
  | "validation-empty"
  | "ai-generation-failed"
  | "ai-content-empty"
  | "ai-service-unavailable"
  | "rate-limited"
  | "network-error"
  | "create-gift-failed"
  | "copy-link-failed"
  | "gift-not-found"
  | "gift-expired"
  | "unknown";

export type AiGenerationErrorCode =
  | "validation-empty"
  | "ai-generation-failed"
  | "ai-content-empty"
  | "ai-service-unavailable"
  | "rate-limited"
  | "network-error";

export type AiErrorUiStatus = "failed" | "network-error";

export const AI_ERROR_UI_STATUS_MAP = {
  "validation-empty": "failed",
  "ai-generation-failed": "failed",
  "ai-content-empty": "failed",
  "ai-service-unavailable": "failed",
  "rate-limited": "failed",
  "network-error": "network-error",
} as const satisfies Record<AiGenerationErrorCode, AiErrorUiStatus>;

export interface AppError {
  code: AppErrorCode;
  message: string;
  cause?: unknown;
}

export interface AiGenerationError extends AppError {
  code: AiGenerationErrorCode;
  retryable: boolean;
}

export interface CopyLinkError extends AppError {
  code: "copy-link-failed";
}

export function getAppErrorCode(error: unknown): AppErrorCode {
  return typeof error === "object" && error !== null && "code" in error
    ? ((error as { code?: AppErrorCode }).code ?? "unknown")
    : "unknown";
}

export function getAiErrorUiStatus(error: unknown): AiErrorUiStatus {
  const code = getAppErrorCode(error);

  return code in AI_ERROR_UI_STATUS_MAP
    ? AI_ERROR_UI_STATUS_MAP[code as AiGenerationErrorCode]
    : "failed";
}
