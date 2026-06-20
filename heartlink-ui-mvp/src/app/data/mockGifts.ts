import type { Gift, GiftOccasion } from "../types";
import { MOCK_GENERATED_COPY, MOCK_GIFT_INPUT } from "./mockCopy";

export const COMPLETION_TEXTS: Record<GiftOccasion, string> = {
  感谢: "这份感谢，已被好好收藏",
  祝福: "祝福已送达，心意已珍藏",
  道歉: "我理解了，谢谢你的勇气",
  鼓励: "谢谢，我会加油的！",
  小心意: "收到啦！爱意增幅 +1000%",
};

export const MOCK_RECEIVED_DATE = "2025 年 6 月 17 日";

export const MOCK_GIFT_TOKEN = "mock-heartlink-a9f2";

export const MOCK_GIFT_URL = "/to/mock-heartlink-a9f2";

export const MOCK_GIFT: Gift = {
  token: MOCK_GIFT_TOKEN,
  giftUrl: MOCK_GIFT_URL,
  recipientName: MOCK_GIFT_INPUT.recipientName,
  senderName: MOCK_GIFT_INPUT.senderName,
  occasion: MOCK_GIFT_INPUT.occasion,
  tone: MOCK_GIFT_INPUT.tone,
  theme: "复古收据",
  originalMessage: MOCK_GIFT_INPUT.originalMessage,
  amountText: MOCK_GIFT_INPUT.amountText,
  copy: {
    title: MOCK_GENERATED_COPY.title,
    body: MOCK_GENERATED_COPY.body,
    quote: MOCK_GENERATED_COPY.quote,
    buttonText: MOCK_GENERATED_COPY.buttonText,
    signoff: MOCK_GENERATED_COPY.signoff,
    coverText: MOCK_GENERATED_COPY.coverText,
    acceptedText: MOCK_GENERATED_COPY.acceptedText,
  },
  status: "link-created",
};

export const MOCK_RECEIVER_GIFT = {
  recipientName: MOCK_GIFT_INPUT.recipientName,
  occasion: MOCK_GIFT_INPUT.occasion,
  title: MOCK_GENERATED_COPY.title,
  bodyParagraphs: [
    "您资助的 200 元流动资金已妥妥到账，瞬间让我的小金库洒满了阳光。这不仅仅是一笔零花钱，更是您对我悄悄流露的纵容与疼爱。",
    "愿岁月的长河里，您始终明朗、温暖，被时光温柔以待！",
  ] as [string, string],
  quote: MOCK_GENERATED_COPY.quote,
  signoff: MOCK_GENERATED_COPY.signoff,
};
