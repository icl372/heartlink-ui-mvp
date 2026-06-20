import type { GiftTheme } from "../types";

export interface ThemeOption {
  id: "gentle-letter" | "vintage-receipt" | "poetic-card" | "minimal-note";
  label: GiftTheme;
  desc: string;
  sub: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: "minimal-note", label: "简约便签", desc: "干净、安静、恰到好处", sub: "A SIMPLE NOTE" },
  { id: "gentle-letter", label: "温柔信纸", desc: "温柔、亲近、带一点暖意", sub: "A NOTE FOR YOU" },
  { id: "poetic-card", label: "诗意卡片", desc: "诗意、轻柔、适合想念", sub: "A SMALL POEM" },
  { id: "vintage-receipt", label: "复古收据", desc: "温暖、明亮、给人力量", sub: "A WARM NOTE" },
];

export const DEFAULT_THEME: GiftTheme = "简约便签";

export interface ThemeVisual {
  id: ThemeOption["id"];
  displayName: string;
  coverBackground: string;
  surfaceBackground: string;
  borderColor: string;
  accentColor: string;
  accentSoftColor: string;
  primaryColor: string;
  topRule: string;
  iconBackground: string;
  iconBorderRadius: number | string;
  footerColor: string;
  acceptedDecorColor: string;
  letterLabel: string;
  previewLabel: string;
  cardRadius: number;
}

export const THEME_VISUALS: Record<GiftTheme, ThemeVisual> = {
  简约便签: {
    id: "minimal-note",
    displayName: "简约便签",
    coverBackground: "#F7F8F5",
    surfaceBackground: "#FFFFFF",
    borderColor: "#DCE2DA",
    accentColor: "#82957F",
    accentSoftColor: "#EEF2EC",
    primaryColor: "#465A4D",
    topRule: "#82957F",
    iconBackground: "#82957F",
    iconBorderRadius: 14,
    footerColor: "#82957F",
    acceptedDecorColor: "#A9B8A5",
    letterLabel: "A SIMPLE NOTE",
    previewLabel: "NOTE PREVIEW",
    cardRadius: 16,
  },
  温柔信纸: {
    id: "gentle-letter",
    displayName: "柔粉信笺",
    coverBackground: "#FCF6F4",
    surfaceBackground: "#FFFEFC",
    borderColor: "#E8D8D2",
    accentColor: "#B8837A",
    accentSoftColor: "#F7E9E4",
    primaryColor: "#74534E",
    topRule: "#B8837A",
    iconBackground: "#D6A49A",
    iconBorderRadius: "50%",
    footerColor: "#B8837A",
    acceptedDecorColor: "#E1BDB4",
    letterLabel: "A NOTE FOR YOU",
    previewLabel: "LETTER PREVIEW",
    cardRadius: 16,
  },
  诗意卡片: {
    id: "poetic-card",
    displayName: "雾紫诗笺",
    coverBackground: "#F7F5FA",
    surfaceBackground: "#FFFEFF",
    borderColor: "#DED8EA",
    accentColor: "#8A789E",
    accentSoftColor: "#F0EDF6",
    primaryColor: "#5C506C",
    topRule: "#8A789E",
    iconBackground: "#A99ABE",
    iconBorderRadius: 20,
    footerColor: "#8A789E",
    acceptedDecorColor: "#C4B9D3",
    letterLabel: "A SMALL POEM",
    previewLabel: "POEM PREVIEW",
    cardRadius: 16,
  },
  复古收据: {
    id: "vintage-receipt",
    displayName: "日光便签",
    coverBackground: "#FCF7EF",
    surfaceBackground: "#FFFEFB",
    borderColor: "#E9DCC8",
    accentColor: "#B68755",
    accentSoftColor: "#F8EEDB",
    primaryColor: "#73553D",
    topRule: "#B68755",
    iconBackground: "#D2A873",
    iconBorderRadius: "50%",
    footerColor: "#B68755",
    acceptedDecorColor: "#E2C69E",
    letterLabel: "A WARM NOTE",
    previewLabel: "WARM NOTE PREVIEW",
    cardRadius: 16,
  },
};

export function getThemeVisual(theme: GiftTheme | undefined) {
  return THEME_VISUALS[theme ?? DEFAULT_THEME];
}
