export type AppMode = "creator" | "receiver";

export type CreatorStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type CreatorProgressStep = "场景" | "填写" | "生成" | "风格" | "预览";

export type EditableCopyField = "title" | "body" | "quote" | "signoff" | "button";

export type ReceiverState =
  | "loading"
  | "cover"
  | "letter"
  | "received"
  | "not-found"
  | "expired";

export type CopyLinkStatus = "idle" | "success" | "fail";

export type LoadingState = "idle" | "loading" | "success" | "error";
