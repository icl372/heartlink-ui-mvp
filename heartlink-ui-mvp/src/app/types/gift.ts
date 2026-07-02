export type GiftOccasion = "感谢" | "祝福" | "道歉" | "鼓励" | "小心意";

export type GiftTone = "真诚" | "温柔" | "可爱" | "克制" | "正式" | "诗意";

export type GiftTheme = "温柔信纸" | "复古收据" | "诗意卡片" | "简约便签";

export type GiftThemeId = "gentle-letter" | "vintage-receipt" | "poetic-card" | "minimal-note";

export type HeartRecipientRole = "父母" | "伴侣" | "朋友" | "老师" | "同学" | "同事" | "其他";

export type HeartOccasion = "生日" | "感谢" | "道歉" | "鼓励" | "想念" | "表白" | "和好" | "其他";

export type HeartIntentTag = "感谢" | "道歉" | "鼓励" | "想念" | "祝福" | "表白" | "其他";

export type HeartTonePreference =
  | "真诚一点"
  | "温柔一点"
  | "像日常聊天一样"
  | "不要太肉麻"
  | "有仪式感一点";

export interface HeartIntent {
  recipientName: string;
  recipientRole: HeartRecipientRole | null;
  occasion: HeartOccasion;
  story: string;
  intentTag: HeartIntentTag | null;
  coreMessage: string;
  tone: HeartTonePreference;
  senderName: string;
  originalInput: string;
  noInventFacts: {
    recipientName: string;
    recipientRole: HeartRecipientRole | null;
    occasion: HeartOccasion;
    story: string;
    intentTag: HeartIntentTag | null;
    coreMessage: string;
  };
}

export type GiftStatus =
  | "draft"
  | "copy-generated"
  | "link-created"
  | "opened"
  | "accepted"
  | "expired"
  | "not-found";

export interface GiftCopy {
  coverText?: string;
  title: string;
  body: string;
  quote: string;
  buttonText: string;
  signoff: string;
  acceptedText?: string;
}

export interface Gift {
  id?: string;
  token?: string;
  giftUrl?: string;
  recipientName: string;
  senderName: string;
  occasion: GiftOccasion;
  tone: GiftTone;
  theme: GiftTheme;
  originalMessage: string;
  amountText?: string;
  copy: GiftCopy;
  status: GiftStatus;
  createdAt?: string;
  updatedAt?: string;
  openedAt?: string;
  acceptedAt?: string;
  expiresAt?: string | null;
  openedCount?: number;
  acceptedCount?: number;
  heartIntent?: HeartIntent;
  recipientRole?: HeartRecipientRole | null;
  story?: string;
  intentTag?: HeartIntentTag | null;
  coreMessage?: string;
  tonePreference?: HeartTonePreference;
}

export interface GiftRecord {
  id: string;
  token: string;
  recipient_name: string;
  sender_name: string;
  occasion: GiftOccasion;
  tone: GiftTone;
  amount_text: string | null;
  original_message: string;
  cover_text: string | null;
  title: string;
  body: string;
  quote: string;
  button_text: string;
  accepted_text: string | null;
  theme: GiftTheme | GiftThemeId;
  opened_count: number;
  accepted_count: number;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  expires_at: string | null;
  is_deleted: boolean;
}

export interface CreateGiftInput {
  recipientName: string;
  senderName: string;
  occasion: GiftOccasion;
  tone: GiftTone;
  theme: GiftTheme;
  originalMessage: string;
  amountText?: string;
  heartIntent?: HeartIntent;
  recipientRole?: HeartRecipientRole | null;
  story?: string;
  intentTag?: HeartIntentTag | null;
  coreMessage?: string;
  tonePreference?: HeartTonePreference;
  copy: GiftCopy;
}

export interface CreateGiftResult {
  gift: Gift;
  token: string;
  giftUrl: string;
}

export interface AcceptGiftResult {
  token: string;
  acceptedAt: string;
  acceptedCount: number;
  updatedAt: string;
  acceptedText: string;
}
