export type {
  AcceptGiftResult,
  CreateGiftInput,
  CreateGiftResult,
  Gift,
  GiftCopy,
  GiftOccasion,
  GiftStatus,
  GiftTheme,
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
  AiGenerationError,
  AppError,
  AppErrorCode,
  CopyLinkError,
} from "./errors";
