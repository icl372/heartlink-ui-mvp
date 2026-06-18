export type GiftOccasion = "感谢" | "祝福" | "道歉" | "鼓励" | "小心意";

export type GiftTone = "真诚" | "温柔" | "可爱" | "克制" | "正式" | "诗意";

export type GiftTheme = "温柔信纸" | "复古收据" | "诗意卡片" | "简约便签";

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
  openedAt?: string;
  acceptedAt?: string;
  expiresAt?: string;
}

export interface CreateGiftInput {
  recipientName: string;
  senderName: string;
  occasion: GiftOccasion;
  tone: GiftTone;
  theme: GiftTheme;
  originalMessage: string;
  amountText?: string;
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
  acceptedText: string;
}
