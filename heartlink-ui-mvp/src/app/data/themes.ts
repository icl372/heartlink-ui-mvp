import type { GiftTheme } from "../types";

export interface ThemeOption {
  label: GiftTheme;
  desc: string;
  sub: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { label: "温柔信纸", desc: "柔和底纹 · 衬线字体 · 典雅排版", sub: "如一封手写的信" },
  { label: "复古收据", desc: "单据美学 · 克制留白 · 仪式感", sub: "RECEIPT STYLE" },
  { label: "诗意卡片", desc: "金边细节 · 诗句引用 · 卡片装帧", sub: "如一张明信片" },
  { label: "简约便签", desc: "极简留白 · 手写质感 · 纯粹表达", sub: "Less is more" },
];

export const DEFAULT_THEME: GiftTheme = "复古收据";
