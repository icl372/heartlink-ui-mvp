import type { GenerateCopyInput, GenerateCopyResult } from "../types";

export const DEFAULT_CREATE_GIFT_INPUT: GenerateCopyInput = {
  recipientName: "",
  senderName: "",
  occasion: "感谢",
  tone: "真诚",
  amountText: "",
  relationship: null,
  event: "",
  detail: "",
  extra: "",
  nickname: "",
  originalMessage: "",
};

export const MOCK_GIFT_INPUT: GenerateCopyInput = {
  recipientName: "妈妈",
  senderName: "我",
  occasion: "感谢",
  tone: "真诚",
  amountText: "",
  relationship: "妈妈",
  event: "感谢",
  detail: "妈妈给我买了一台电脑，我很喜欢，它对我帮助很大。",
  extra: "",
  nickname: "",
  originalMessage: "妈妈给我买了一台电脑，我很喜欢，它对我帮助很大，我想谢谢她。",
};

export const MOCK_GENERATED_COPY: GenerateCopyResult = {
  coverText: "有一份心意送给你",
  title: "给妈妈的一份感谢",
  body:
    "妈，谢谢你给我买这台电脑。\n\n我真的很喜欢，它对我也很有帮助。这不只是一个电脑，对我来说，也是你对我的支持。\n\n我想让你知道，这件事对我真的很重要，你的这份心意，我真的收到了。",
  quote: "关于这台电脑，我一直记得。",
  buttonText: "收下心意",
  signoff: "来自 我",
  acceptedText: "这份心意已被珍藏",
};
