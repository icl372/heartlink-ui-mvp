export type {
  AcceptGiftResult,
  CreateGiftInput,
  CreateGiftResult,
  Gift,
  GiftCopy,
  HeartIntent,
  HeartIntentTag,
  HeartOccasion,
  HeartRecipientRole,
  HeartTonePreference,
  GiftOccasion,
  GiftRecord,
  GiftStatus,
  GiftTheme,
  GiftThemeId,
  GiftTone,
} from "./gift";

export type {
  AiGenerationStatus,
  GenerateCopyInput,
  GenerateCopyResult,
} from "./ai";

export {
  GENERATE_COPY_INPUT_FIELDS,
  GENERATE_COPY_OUTPUT_FIELDS,
  GENERATE_COPY_REQUIRED_TEXT_FIELDS,
} from "./ai";

export type {
  AppMode,
  CopyLinkStatus,
  CreatorProgressStep,
  CreatorStep,
  EditableCopyField,
  LoadingState,
  ReceiverState,
} from "./ui";

export type {
  AiErrorUiStatus,
  AiGenerationError,
  AiGenerationErrorCode,
  AppError,
  AppErrorCode,
  CopyLinkError,
} from "./errors";

export {
  AI_ERROR_UI_STATUS_MAP,
  getAiErrorUiStatus,
  getAppErrorCode,
} from "./errors";
