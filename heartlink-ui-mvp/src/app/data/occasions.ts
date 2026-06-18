import type { GiftOccasion } from "../types";

export interface OccasionOption {
  label: GiftOccasion;
  iconName: "heart" | "star" | "message-circle" | "zap" | "gift";
  desc: string;
}

export const OCCASION_OPTIONS: OccasionOption[] = [
  { label: "感谢", iconName: "heart", desc: "表达内心的感激" },
  { label: "祝福", iconName: "star", desc: "送上美好祝愿" },
  { label: "道歉", iconName: "message-circle", desc: "化解心中的歉意" },
  { label: "鼓励", iconName: "zap", desc: "点燃前行的力量" },
  { label: "小心意", iconName: "gift", desc: "一份小支持与心意" },
];

export const DEFAULT_OCCASION: GiftOccasion = "感谢";
