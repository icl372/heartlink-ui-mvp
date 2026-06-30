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
  recipientName: "最亲爱的妈妈",
  senderName: "您的专属宝贝",
  occasion: "感谢",
  tone: "真诚",
  amountText: "200",
  relationship: "妈妈",
  event: "妈妈给我转了 200 元",
  detail: "她总是在我需要支持的时候，第一时间给我回应。",
  extra: "",
  nickname: "",
  originalMessage: "妈妈给我转了200元，我想感谢她对我的疼爱和支持。",
};

export const MOCK_GENERATED_COPY: GenerateCopyResult = {
  coverText: "在这琐碎而温热的日常里\n有一份心意请您亲启",
  title: "妈妈，谢谢您。",
  body:
    "您资助的 200 元流动资金已妥妥到账，瞬间让我的小金库洒满了阳光。这不仅仅是一笔零花钱，更是您对我悄悄流露的纵容与疼爱。\n\n感谢您总是在细微处给予我满满的安全感。每一分资金我都会合理规划。愿岁月的长河里，您始终明朗、温暖，被时光温柔以待！",
  quote: "水中之灯，照亮夜航；人间词话，不及母爱之长。",
  buttonText: "点击接收我的爱心电波",
  signoff: "您的专属宝贝 敬呈",
  acceptedText: "这份感谢，已被好好收藏",
};
