import type { GiftTheme } from "../types";

export interface ThemeOption {
  id: "gentle-letter" | "vintage-receipt" | "poetic-card" | "minimal-note";
  label: GiftTheme;
  desc: string;
  sub: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: "gentle-letter", label: "温柔信纸", desc: "柔和底纹 · 衬线字体 · 典雅排版", sub: "如一封手写的信" },
  { id: "vintage-receipt", label: "复古收据", desc: "单据美学 · 克制留白 · 仪式感", sub: "RECEIPT STYLE" },
  { id: "poetic-card", label: "诗意卡片", desc: "金边细节 · 诗句引用 · 卡片装帧", sub: "如一张明信片" },
  { id: "minimal-note", label: "简约便签", desc: "极简留白 · 手写质感 · 纯粹表达", sub: "Less is more" },
];

export const DEFAULT_THEME: GiftTheme = "复古收据";

export interface ThemeVisual {
  id: ThemeOption["id"];
  coverBackground: string;
  surfaceBackground: string;
  borderColor: string;
  accentColor: string;
  accentSoftColor: string;
  primaryColor: string;
  topRule: string;
  letterLabel: string;
  previewLabel: string;
  cardRadius: number;
}

export const THEME_VISUALS: Record<GiftTheme, ThemeVisual> = {
  温柔信纸: {
    id: "gentle-letter",
    coverBackground: "#FBF8F0",
    surfaceBackground: "#FFFEFA",
    borderColor: "#E6D9C8",
    accentColor: "#B78978",
    accentSoftColor: "#F1E6DC",
    primaryColor: "#6A5147",
    topRule: "linear-gradient(90deg,#D9B8A4,#F4E5D9,#D9B8A4)",
    letterLabel: "A LETTER FOR YOU",
    previewLabel: "LETTER PREVIEW",
    cardRadius: 20,
  },
  复古收据: {
    id: "vintage-receipt",
    coverBackground: "#FAF7F0",
    surfaceBackground: "#FFFFFF",
    borderColor: "#EAE2D8",
    accentColor: "#C9A66B",
    accentSoftColor: "#FAF7F0",
    primaryColor: "#473B35",
    topRule: "linear-gradient(90deg,#C9A66B,#E8C98A,#C9A66B)",
    letterLabel: "ACKNOWLEDGMENT RECEIPT",
    previewLabel: "RECEIPT PREVIEW",
    cardRadius: 28,
  },
  诗意卡片: {
    id: "poetic-card",
    coverBackground: "#FCF5EE",
    surfaceBackground: "#FFFDF9",
    borderColor: "#E9D2C7",
    accentColor: "#A96E73",
    accentSoftColor: "#F7E9E3",
    primaryColor: "#754D52",
    topRule: "linear-gradient(90deg,#D8A0A1,#F2D8C8,#D8A0A1)",
    letterLabel: "A SMALL POEM",
    previewLabel: "POEM PREVIEW",
    cardRadius: 30,
  },
  简约便签: {
    id: "minimal-note",
    coverBackground: "#FAFBF8",
    surfaceBackground: "#FFFFFF",
    borderColor: "#E1E4DF",
    accentColor: "#7E8A80",
    accentSoftColor: "#F0F3EE",
    primaryColor: "#485149",
    topRule: "#CDD5CC",
    letterLabel: "A SIMPLE NOTE",
    previewLabel: "NOTE PREVIEW",
    cardRadius: 12,
  },
};

export function getThemeVisual(theme: GiftTheme | undefined) {
  return THEME_VISUALS[theme ?? DEFAULT_THEME];
}
