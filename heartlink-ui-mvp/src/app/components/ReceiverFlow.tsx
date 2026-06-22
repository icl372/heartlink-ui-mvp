import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Star, Zap, Gift, MessageCircle } from "lucide-react";
import {
  isGiftPreviewMode,
} from "../lib";
import {
  getThemeVisual,
  MOCK_GIFT_TOKEN,
} from "../data";
import { acceptGift, getGiftByToken, markGiftOpened } from "../services";
import type { AppError, Gift as GiftData, GiftOccasion, ReceiverState } from "../types";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Scene = GiftOccasion;

interface ReceiverFlowProps {
  onBack: () => void;
  token?: string;
}

const RECEIVER_STATES = {
  loading: "loading",
  cover: "cover",
  letter: "letter",
  received: "received",
  notFound: "not-found",
  expired: "expired",
  networkError: "network-error",
} as const satisfies Record<string, ReceiverState>;

function getAppErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? (error as AppError).code
    : "unknown";
}

function getReceiverErrorState(error: unknown): ReceiverState {
  const code = getAppErrorCode(error);

  if (code === "network-error") return RECEIVER_STATES.networkError;
  return code === "gift-expired" ? RECEIVER_STATES.expired : RECEIVER_STATES.notFound;
}

function getCreatedDateLabel(createdAt: string | undefined, scene: Scene) {
  if (!createdAt) return `以${scene}之名`;

  const year = new Date(createdAt).getFullYear();
  return Number.isFinite(year) ? `${year} · 以${scene}之名` : `以${scene}之名`;
}

function formatAcceptedDate(acceptedAt: string | null | undefined) {
  if (!acceptedAt) return "";

  const date = new Date(acceptedAt);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

// ─── Scene icons (for decorative use) ────────────────────────────────────────
function SceneIcon({ scene, size = 28, color = "#FFFFFF" }: { scene: Scene; size?: number; color?: string }) {
  const props = { size, color, strokeWidth: 1.5 };
  if (scene === "感谢") return <Heart {...props} fill={color} />;
  if (scene === "祝福") return <Star {...props} fill={color} />;
  if (scene === "道歉") return <MessageCircle {...props} />;
  if (scene === "鼓励") return <Zap {...props} fill={color} />;
  return <Gift {...props} />;
}

// ─── Received-state decoration ───────────────────────────────────────────────
function ReceivedDecor({ color }: { color: string }) {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      <Heart size={11} color={color} fill={color} style={{ position: "absolute", left: "12%", top: "18%", opacity: 0.32 }} />
      <Heart size={8} color={color} fill={color} style={{ position: "absolute", right: "14%", top: "72%", opacity: 0.24 }} />
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonBlock({ width = "100%", height = 14, radius = 99, style }: { width?: string | number; height?: number; radius?: number; style?: React.CSSProperties }) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      style={{ width, height, borderRadius: radius, background: "#EAE2D8", ...style }}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ReceiverFlow({ onBack, token }: ReceiverFlowProps) {
  const [state, setState] = useState<ReceiverState>(RECEIVER_STATES.loading);
  const [gift, setGift] = useState<GiftData | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const openedTokenRef = useRef<string | null>(null);
  const acceptingTokenRef = useRef<string | null>(null);
  const receiverToken = token ?? MOCK_GIFT_TOKEN;
  const isPreviewMode = isGiftPreviewMode();
  const themeVisual = getThemeVisual(gift?.theme);

  const scene = (gift?.occasion ?? "感谢") as Scene;
  const bodyParagraphs = gift?.copy.body.split("\n\n") ?? ["", ""];
  const centralLetterTitle = gift?.copy.title ?? "";
  const centralLetterBodyP1 = bodyParagraphs[0] ?? "";
  const centralLetterBodyP2 = bodyParagraphs[1] ?? "";
  const centralLetterQuote = gift?.copy.quote ?? "";
  const centralLetterSignoff = gift?.copy.signoff ?? "";
  const coverText = gift?.copy.coverText ?? "";
  const receiverButtonText = gift?.copy.buttonText?.trim() || "收下心意";
  // Keep the received-state CTA distinct from the token-specific completion detail.
  const receivedPrimaryText = "已收下这份心意";
  const receivedDetailText = gift?.copy.acceptedText?.trim() || "这份心意已被珍藏";
  const createdDateLabel = getCreatedDateLabel(gift?.createdAt, scene);
  const acceptedDateLabel = formatAcceptedDate(gift?.acceptedAt);

  // Load mock gift through the service boundary.
  useEffect(() => {
    let cancelled = false;

    async function loadGift() {
      setState(RECEIVER_STATES.loading);

      try {
        const loadedGift = await getGiftByToken(receiverToken);
        if (cancelled) return;
        setGift(loadedGift);
        setState(isPreviewMode || !loadedGift.acceptedAt
          ? RECEIVER_STATES.cover
          : RECEIVER_STATES.received);

        const loadedToken = loadedGift.token ?? receiverToken;
        if (!isPreviewMode && openedTokenRef.current !== loadedToken) {
          openedTokenRef.current = loadedToken;
          void markGiftOpened(loadedToken).catch(() => {
            // Open analytics is intentionally best-effort and must not block readable gifts.
            openedTokenRef.current = null;
          });
        }
      } catch (error) {
        if (cancelled) return;
        setState(getReceiverErrorState(error));
      }
    }

    void loadGift();

    return () => { cancelled = true; };
  }, [receiverToken, loadAttempt, isPreviewMode]);

  const handleOpen = () => {
    setIsOpening(true);
    setTimeout(() => { setState(RECEIVER_STATES.letter); setIsOpening(false); }, 700);
  };

  const handleReceive = async () => {
    if (isPreviewMode) {
      setState(RECEIVER_STATES.received);
      return;
    }

    const giftToken = gift?.token ?? receiverToken;

    if (isReceiving || acceptingTokenRef.current === giftToken) return;

    acceptingTokenRef.current = giftToken;
    setIsReceiving(true);

    try {
      const result = await acceptGift(giftToken);
      setGift(currentGift => currentGift
        ? {
          ...currentGift,
          status: "accepted",
          acceptedAt: result.acceptedAt,
          acceptedCount: result.acceptedCount,
          updatedAt: result.updatedAt,
        }
        : currentGift);
      setState(RECEIVER_STATES.received);
    } catch (error) {
      setState(getReceiverErrorState(error));
    } finally {
      acceptingTokenRef.current = null;
      setIsReceiving(false);
    }
  };

  const handleViewSample = async () => {
    setState(RECEIVER_STATES.loading);

    try {
      const loadedGift = await getGiftByToken(MOCK_GIFT_TOKEN);
      setGift(loadedGift);
      setState(RECEIVER_STATES.cover);
    } catch {
      setState(RECEIVER_STATES.notFound);
    }
  };

  const handleRetryLoad = () => {
    setLoadAttempt(currentAttempt => currentAttempt + 1);
  };

  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", justifyContent: "center", background: themeVisual.coverBackground, position: "relative" }}>

      {/* Keep received-state decoration intentionally light. */}
      {state === RECEIVER_STATES.received && <ReceivedDecor color={themeVisual.acceptedDecorColor} />}

      {/* ── Content ── */}
      <div style={{ width: "100%", maxWidth: 390, position: "relative", zIndex: 1 }}>
        <AnimatePresence mode="wait">

          {/* ── Loading ──────────────────────────────────────────────────── */}
          {state === RECEIVER_STATES.loading && (
            <motion.div key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "0 32px" }}>
              <div style={{ width: "100%", maxWidth: 340, borderRadius: 28, background: "#FFFFFF", padding: 32, display: "flex", flexDirection: "column", gap: 18, boxShadow: "0 8px 48px rgba(63,52,47,0.09)" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingBottom: 16, borderBottom: "1px solid #EAE2D8" }}>
                  <SkeletonBlock width={52} height={52} radius={99} />
                  <SkeletonBlock width={140} height={16} />
                  <SkeletonBlock width={100} height={12} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[160, 120, 140, 90, 130].map((w, i) => (
                    <SkeletonBlock key={i} width={w} height={10} />
                  ))}
                </div>
                <SkeletonBlock width="100%" height={44} radius={99} />
              </div>
              <p style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#C5BAB2", fontSize: 12, letterSpacing: 1, marginTop: 20 }}>
                正在加载心意…
              </p>
            </motion.div>
          )}

          {/* ── Cover ────────────────────────────────────────────────────── */}
          {state === RECEIVER_STATES.cover && (
            <motion.div key="cover"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.5 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "60px 28px 60px" }}>

              <div style={{ width: "100%", borderRadius: themeVisual.cardRadius, background: themeVisual.surfaceBackground, border: `1px solid ${themeVisual.borderColor}`, boxShadow: "0 12px 60px rgba(63,52,47,0.1)", display: "flex", flexDirection: "column", alignItems: "center", padding: "52px 32px 44px", gap: 0 }}>

                {/* Seal */}
                <div style={{ position: "relative", marginBottom: 32 }}>
                  {/* A light, theme-aware ring keeps the cover gift-like without ticket cues. */}
                  <svg width="110" height="110" viewBox="0 0 110 110" style={{ position: "absolute", top: -11, left: -11 }}>
                    <circle cx="55" cy="55" r="50" fill="none" stroke={themeVisual.accentColor} strokeWidth="1" opacity="0.28" />
                  </svg>
                  <motion.div
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: 88, height: 88, borderRadius: themeVisual.iconBorderRadius, background: themeVisual.iconBackground, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 32px ${themeVisual.accentSoftColor}` }}>
                    <SceneIcon scene={scene} size={30} color="#FFFFFF" />
                  </motion.div>
                </div>

                {/* Recipient */}
                <p style={{ fontFamily: "'Lora', serif", color: "#C5BAB2", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", margin: "0 0 10px" }}>
                  A message for you
                </p>
                <h1 style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 22, letterSpacing: 5, textAlign: "center", margin: "0 0 6px", lineHeight: 1.4 }}>
                  致：{gift?.recipientName ?? ""}
                </h1>

                {/* Ornament */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 14px" }}>
                  <div style={{ width: 20, height: 1, background: themeVisual.accentColor, opacity: 0.4 }} />
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: themeVisual.accentColor, opacity: 0.4 }} />
                  <div style={{ width: 20, height: 1, background: themeVisual.accentColor, opacity: 0.4 }} />
                </div>

                <p style={{ fontFamily: "'Noto Serif SC', serif", color: "#9B8E86", fontSize: 14, lineHeight: 2, textAlign: "center", letterSpacing: 1, margin: "0 0 40px", whiteSpace: "pre-line" }}>
                  {coverText}
                </p>

                {/* Open button */}
                <motion.button
                  onClick={handleOpen}
                  disabled={isOpening}
                  whileTap={{ scale: 0.97 }}
                  style={{ width: "100%", padding: "16px 0", borderRadius: 99, background: isOpening ? themeVisual.accentColor : themeVisual.primaryColor, color: "#FFFFFF", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 15, letterSpacing: 4, border: "none", cursor: "pointer", boxShadow: "0 6px 24px rgba(71,59,53,0.25)", transition: "background 0.3s" }}>
                  {isOpening ? "正在开启…" : "点击开启信笺"}
                </motion.button>

                {/* Footer tag */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 20 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: themeVisual.footerColor, opacity: 0.5 }} />
                  <span style={{ fontFamily: "'Noto Sans SC', sans-serif", color: themeVisual.footerColor, fontSize: 11, letterSpacing: 2 }}>
                    心意链接 · HeartLink
                  </span>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: themeVisual.footerColor, opacity: 0.5 }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Letter ───────────────────────────────────────────────────── */}
          {state === RECEIVER_STATES.letter && (
            <motion.div key="letter"
              initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ padding: "72px 24px 48px", display: "flex", flexDirection: "column", gap: 0 }}>

              <div style={{ borderRadius: themeVisual.cardRadius, background: themeVisual.surfaceBackground, border: `1px solid ${themeVisual.borderColor}`, boxShadow: "0 12px 60px rgba(63,52,47,0.09)", overflow: "hidden" }}>

                {/* Letter top border */}
                <div style={{ height: 3, background: themeVisual.topRule }} />

                {/* Header */}
                <div style={{ padding: "28px 28px 0" }}>
                  <p style={{ fontFamily: "'Lora', serif", color: themeVisual.accentColor, fontSize: 10, letterSpacing: 4, textTransform: "uppercase", margin: "0 0 10px" }}>
                    {themeVisual.letterLabel}
                  </p>
                  <h1 style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 26, letterSpacing: 4, margin: "0 0 20px", lineHeight: 1.35 }}>
                    {centralLetterTitle}
                  </h1>
                  <div style={{ height: 1, background: themeVisual.borderColor }} />
                </div>

                {/* Body */}
                <div style={{ padding: "22px 28px 0", display: "flex", flexDirection: "column", gap: 16 }}>
                  <p style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 15, lineHeight: 2.1, textIndent: "2em", letterSpacing: 0.5, margin: 0 }}>
                    {centralLetterBodyP1}
                  </p>

                  {/* Quote block */}
                  <div style={{ borderLeft: `3px solid ${themeVisual.accentColor}`, background: themeVisual.accentSoftColor, borderRadius: "0 12px 12px 0", padding: "14px 18px" }}>
                    <p style={{ fontFamily: "'Lora', serif", color: "#9B8E86", fontSize: 14, lineHeight: 1.9, fontStyle: "italic", margin: 0, letterSpacing: 0.3 }}>
                      "{centralLetterQuote}"
                    </p>
                  </div>

                  <p style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 15, lineHeight: 2.1, textIndent: "2em", letterSpacing: 0.5, margin: 0 }}>
                    {centralLetterBodyP2}
                  </p>

                  {/* Signoff */}
                  <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4, paddingBottom: 4 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                      <span style={{ fontFamily: "'Noto Serif SC', serif", color: "#9B8E86", fontSize: 13, letterSpacing: 2 }}>
                        — {centralLetterSignoff}
                      </span>
                      <span style={{ fontFamily: "'Lora', serif", color: "#C5BAB2", fontSize: 11, letterSpacing: 1 }}>
                        {createdDateLabel}
                      </span>
                    </div>
                  </div>

                  <div style={{ height: 1, background: themeVisual.borderColor }} />
                </div>

                {/* Receive button */}
                <div style={{ padding: "20px 28px 28px" }}>
                  <motion.button
                    onClick={handleReceive}
                    disabled={isReceiving}
                    whileTap={{ scale: 0.97 }}
                    style={{ width: "100%", padding: "16px 0", borderRadius: 99, background: themeVisual.primaryColor, color: "#FFFFFF", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 15, letterSpacing: 2, border: "none", cursor: isReceiving ? "default" : "pointer", opacity: isReceiving ? 0.8 : 1, boxShadow: "0 6px 24px rgba(71,59,53,0.25)" }}>
                    {receiverButtonText}
                  </motion.button>
                  <p style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#C5BAB2", fontSize: 11, textAlign: "center", letterSpacing: 1, margin: "12px 0 0" }}>
                    这份心意只为你准备
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Received ─────────────────────────────────────────────────── */}
          {state === RECEIVER_STATES.received && (
            <motion.div key="received"
              initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ padding: "72px 24px 48px", display: "flex", flexDirection: "column", gap: 0, position: "relative", zIndex: 1 }}>

              <div style={{ borderRadius: themeVisual.cardRadius, background: themeVisual.surfaceBackground, border: `1px solid ${themeVisual.borderColor}`, boxShadow: "0 12px 60px rgba(63,52,47,0.09)", overflow: "hidden" }}>
                <div style={{ height: 3, background: themeVisual.topRule }} />

                <div style={{ padding: "28px 28px 0" }}>
                  <p style={{ fontFamily: "'Lora', serif", color: themeVisual.accentColor, fontSize: 10, letterSpacing: 4, textTransform: "uppercase", margin: "0 0 10px" }}>
                    {themeVisual.letterLabel}
                  </p>
                  <h1 style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 26, letterSpacing: 4, margin: "0 0 20px", lineHeight: 1.35 }}>
                    {centralLetterTitle}
                  </h1>
                  <div style={{ height: 1, background: themeVisual.borderColor }} />
                </div>

                <div style={{ padding: "22px 28px 0", display: "flex", flexDirection: "column", gap: 16 }}>
                  <p style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 15, lineHeight: 2.1, textIndent: "2em", letterSpacing: 0.5, margin: 0 }}>
                    {centralLetterBodyP1}
                  </p>
                  <div style={{ borderLeft: `3px solid ${themeVisual.accentColor}`, background: themeVisual.accentSoftColor, borderRadius: "0 12px 12px 0", padding: "14px 18px" }}>
                    <p style={{ fontFamily: "'Lora', serif", color: "#9B8E86", fontSize: 14, lineHeight: 1.9, fontStyle: "italic", margin: 0 }}>
                      "{centralLetterQuote}"
                    </p>
                  </div>
                  <p style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 15, lineHeight: 2.1, textIndent: "2em", letterSpacing: 0.5, margin: 0 }}>
                    {centralLetterBodyP2}
                  </p>
                  <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4, paddingBottom: 4 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                      <span style={{ fontFamily: "'Noto Serif SC', serif", color: "#9B8E86", fontSize: 13, letterSpacing: 2 }}>— {centralLetterSignoff}</span>
                      <span style={{ fontFamily: "'Lora', serif", color: "#C5BAB2", fontSize: 11, letterSpacing: 1 }}>
                        {createdDateLabel}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 1, background: themeVisual.borderColor }} />
                </div>

                {/* Theme-aware received button */}
                <div style={{ padding: "20px 28px 28px" }}>
                  <motion.button
                    initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 16 }}
                    style={{ width: "100%", padding: "16px 0", borderRadius: 99, background: themeVisual.primaryColor, color: "#FFFFFF", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 15, letterSpacing: 2, border: "none", cursor: "default", boxShadow: `0 6px 28px ${themeVisual.accentSoftColor}` }}>
                    {receivedPrimaryText}
                  </motion.button>

                  {/* Received confirmation */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, marginTop: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Heart size={10} color={themeVisual.acceptedDecorColor} fill={themeVisual.acceptedDecorColor} />
                      <span style={{ fontFamily: "'Noto Sans SC', sans-serif", color: themeVisual.footerColor, fontSize: 12, letterSpacing: 1 }}>
                        {acceptedDateLabel ? `已于 ${acceptedDateLabel} 接收` : "这份心意已被好好收藏"}
                      </span>
                      <Heart size={10} color={themeVisual.acceptedDecorColor} fill={themeVisual.acceptedDecorColor} />
                    </div>
                    <p style={{ fontFamily: "'Noto Serif SC', serif", color: "#C5BAB2", fontSize: 12, letterSpacing: 0.5, margin: 0 }}>
                      {receivedDetailText}
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Not Found ─────────────────────────────────────────────────── */}
          {state === RECEIVER_STATES.notFound && (
            <motion.div key="not-found"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "0 28px" }}>
              <div style={{ width: "100%", borderRadius: 28, background: "#FFFFFF", boxShadow: "0 12px 60px rgba(63,52,47,0.09)", padding: "52px 32px 44px", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>

                {/* Icon */}
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#F7F2EA", border: "1.5px dashed #EAE2D8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C5BAB2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4l16 16M4 20L20 4" />
                  </svg>
                </div>

                <p style={{ fontFamily: "'Lora', serif", color: "#C9A66B", fontSize: 10, letterSpacing: 4, textTransform: "uppercase", margin: "0 0 10px", textAlign: "center" }}>404 · Not Found</p>
                <h2 style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 21, letterSpacing: 3, textAlign: "center", margin: "0 0 8px", lineHeight: 1.5 }}>
                  这封信似乎迷路了
                </h2>
                <div style={{ width: 24, height: 1, background: "#C9A66B", margin: "8px auto 16px", opacity: 0.5 }} />
                <p style={{ fontFamily: "'Noto Serif SC', serif", color: "#9B8E86", fontSize: 14, lineHeight: 2, textAlign: "center", letterSpacing: 0.5, margin: "0 0 36px" }}>
                  链接可能不存在<br />请向发件人重新索取
                </p>

                <button onClick={() => { void handleViewSample(); }}
                  style={{ width: "100%", padding: "14px 0", borderRadius: 99, background: "#473B35", color: "#FFFFFF", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 14, letterSpacing: 2, border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(71,59,53,0.2)" }}>
                  查看示例效果
                </button>

                <p style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#C9A66B", fontSize: 11, letterSpacing: 2, marginTop: 20 }}>
                  心意链接 · HeartLink
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Expired ───────────────────────────────────────────────────── */}
          {state === RECEIVER_STATES.networkError && (
            <motion.div key="network-error"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "0 28px" }}>
              <div style={{ width: "100%", borderRadius: 28, background: "#FFFFFF", boxShadow: "0 12px 60px rgba(63,52,47,0.09)", padding: "52px 32px 44px", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#F7F2EA", border: "1px solid #EAE2D8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C5BAB2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12a7 7 0 0 1 13-3M19 12a7 7 0 0 1-13 3" />
                    <path d="M18 5v4h-4M6 19v-4h4" />
                  </svg>
                </div>
                <p style={{ fontFamily: "'Lora', serif", color: "#C9A66B", fontSize: 10, letterSpacing: 4, textTransform: "uppercase", margin: "0 0 10px", textAlign: "center" }}>Connection Error</p>
                <h2 style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 21, letterSpacing: 3, textAlign: "center", margin: "0 0 8px", lineHeight: 1.5 }}>
                  暂时无法打开这份心意
                </h2>
                <div style={{ width: 24, height: 1, background: "#C9A66B", margin: "8px auto 16px", opacity: 0.5 }} />
                <p style={{ fontFamily: "'Noto Serif SC', serif", color: "#9B8E86", fontSize: 14, lineHeight: 2, textAlign: "center", letterSpacing: 0.5, margin: "0 0 36px" }}>
                  网络连接似乎不稳定<br />请稍后再试
                </p>
                <button onClick={handleRetryLoad}
                  style={{ width: "100%", padding: "14px 0", borderRadius: 99, background: "#473B35", color: "#FFFFFF", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 14, letterSpacing: 2, border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(71,59,53,0.2)" }}>
                  重新尝试
                </button>
              </div>
            </motion.div>
          )}

          {state === RECEIVER_STATES.expired && (
            <motion.div key="expired"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "0 28px" }}>
              <div style={{ width: "100%", borderRadius: 28, background: "#FFFFFF", boxShadow: "0 12px 60px rgba(63,52,47,0.09)", padding: "52px 32px 44px", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>

                {/* Clock icon */}
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#F7F2EA", border: "1.5px dashed #EAE2D8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C5BAB2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 15 15" />
                  </svg>
                </div>

                <p style={{ fontFamily: "'Lora', serif", color: "#C9A66B", fontSize: 10, letterSpacing: 4, textTransform: "uppercase", margin: "0 0 10px", textAlign: "center" }}>Link Expired</p>
                <h2 style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 21, letterSpacing: 3, textAlign: "center", margin: "0 0 8px", lineHeight: 1.5 }}>
                  这份心意已过期
                </h2>
                <div style={{ width: 24, height: 1, background: "#C9A66B", margin: "8px auto 16px", opacity: 0.5 }} />
                <p style={{ fontFamily: "'Noto Serif SC', serif", color: "#9B8E86", fontSize: 14, lineHeight: 2, textAlign: "center", letterSpacing: 0.5, margin: "0 0 36px" }}>
                  链接有效期已过<br />请联系发件人重新生成一份
                </p>

                <button onClick={() => { void handleViewSample(); }}
                  style={{ width: "100%", padding: "14px 0", borderRadius: 99, background: "#473B35", color: "#FFFFFF", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 14, letterSpacing: 2, border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(71,59,53,0.2)" }}>
                  查看示例效果
                </button>

                <p style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#C9A66B", fontSize: 11, letterSpacing: 2, marginTop: 20 }}>
                  心意链接 · HeartLink
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
