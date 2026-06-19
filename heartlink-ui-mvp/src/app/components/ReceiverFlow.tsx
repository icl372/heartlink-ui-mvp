import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Star, Zap, Gift, MessageCircle } from "lucide-react";
import {
  COMPLETION_TEXTS as CENTRAL_COMPLETION_TEXTS,
  MOCK_GIFT_TOKEN,
  MOCK_RECEIVED_DATE,
} from "../data";
import { acceptGift, getGiftByToken } from "../services";
import type { AppError, Gift as GiftData, GiftOccasion, ReceiverState } from "../types";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Scene = GiftOccasion;

interface ReceiverFlowProps {
  onBack: () => void;
  token?: string;
}

// ─── Copy constants ───────────────────────────────────────────────────────────
const CENTRAL_RECEIVED_DATE = MOCK_RECEIVED_DATE;

const RECEIVER_STATES = {
  loading: "loading",
  cover: "cover",
  letter: "letter",
  received: "received",
  notFound: "not-found",
  expired: "expired",
} as const satisfies Record<string, ReceiverState>;

function getAppErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? (error as AppError).code
    : "unknown";
}

function getReceiverErrorState(error: unknown): ReceiverState {
  return getAppErrorCode(error) === "gift-expired"
    ? RECEIVER_STATES.expired
    : RECEIVER_STATES.notFound;
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

// ─── Floating particles (received state) ─────────────────────────────────────
function FloatingHearts() {
  const items = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 90,
    y: 5 + Math.random() * 90,
    size: 8 + Math.random() * 10,
    delay: Math.random() * 2.5,
    duration: 2.5 + Math.random() * 2,
    drift: (Math.random() - 0.5) * 24,
  }));

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {items.map(p => (
        <motion.div key={p.id}
          style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%` }}
          animate={{ y: [0, -18, 0], x: [0, p.drift, 0], opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}>
          <Heart size={p.size} color="#C9A66B" fill="#C9A66B" />
        </motion.div>
      ))}
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
  const receiverToken = token ?? MOCK_GIFT_TOKEN;

  const scene = (gift?.occasion ?? "感谢") as Scene;
  const bodyParagraphs = gift?.copy.body.split("\n\n") ?? ["", ""];
  const centralLetterTitle = gift?.copy.title ?? "";
  const centralLetterBodyP1 = bodyParagraphs[0] ?? "";
  const centralLetterBodyP2 = bodyParagraphs[1] ?? "";
  const centralLetterQuote = gift?.copy.quote ?? "";
  const centralLetterSignoff = gift?.copy.signoff ?? "";

  // Load mock gift through the service boundary.
  useEffect(() => {
    let cancelled = false;

    async function loadGift() {
      setState(RECEIVER_STATES.loading);

      try {
        const loadedGift = await getGiftByToken(receiverToken);
        if (cancelled) return;
        setGift(loadedGift);
        setState(RECEIVER_STATES.cover);
      } catch (error) {
        if (cancelled) return;
        setState(getReceiverErrorState(error));
      }
    }

    void loadGift();

    return () => { cancelled = true; };
  }, [receiverToken]);

  const handleOpen = () => {
    setIsOpening(true);
    setTimeout(() => { setState(RECEIVER_STATES.letter); setIsOpening(false); }, 700);
  };

  const handleReceive = async () => {
    try {
      await acceptGift(gift?.token ?? receiverToken);
      setState(RECEIVER_STATES.received);
    } catch (error) {
      setState(getReceiverErrorState(error));
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

  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", justifyContent: "center", background: "#FAF7F0", position: "relative" }}>

      {/* Floating particles for received state */}
      {state === RECEIVER_STATES.received && <FloatingHearts />}

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

              <div style={{ width: "100%", borderRadius: 28, background: "#FFFFFF", boxShadow: "0 12px 60px rgba(63,52,47,0.1)", display: "flex", flexDirection: "column", alignItems: "center", padding: "52px 32px 44px", gap: 0 }}>

                {/* Seal */}
                <div style={{ position: "relative", marginBottom: 32 }}>
                  {/* Outer dashed ring */}
                  <svg width="110" height="110" viewBox="0 0 110 110" style={{ position: "absolute", top: -11, left: -11 }}>
                    <circle cx="55" cy="55" r="50" fill="none" stroke="#C9A66B" strokeWidth="1"
                      strokeDasharray="5 4" opacity="0.4" />
                  </svg>
                  <motion.div
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(140deg,#C9A66B 0%,#DFB87A 60%,#C9A66B 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(201,166,107,0.35)" }}>
                    <SceneIcon scene={scene} size={30} color="#FFFFFF" />
                  </motion.div>
                </div>

                {/* Recipient */}
                <p style={{ fontFamily: "'Lora', serif", color: "#C5BAB2", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", margin: "0 0 10px" }}>
                  A message for you
                </p>
                <h1 style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 22, letterSpacing: 5, textAlign: "center", margin: "0 0 6px", lineHeight: 1.4 }}>
                  致：最亲爱的妈妈
                </h1>

                {/* Ornament */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 14px" }}>
                  <div style={{ width: 20, height: 1, background: "#C9A66B", opacity: 0.4 }} />
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9A66B", opacity: 0.4 }} />
                  <div style={{ width: 20, height: 1, background: "#C9A66B", opacity: 0.4 }} />
                </div>

                <p style={{ fontFamily: "'Noto Serif SC', serif", color: "#9B8E86", fontSize: 14, lineHeight: 2, textAlign: "center", letterSpacing: 1, margin: "0 0 40px" }}>
                  在这琐碎而温热的日常里<br />有一份心意请您亲启
                </p>

                {/* Open button */}
                <motion.button
                  onClick={handleOpen}
                  disabled={isOpening}
                  whileTap={{ scale: 0.97 }}
                  style={{ width: "100%", padding: "16px 0", borderRadius: 99, background: isOpening ? "#C9A66B" : "#473B35", color: "#FFFFFF", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 15, letterSpacing: 4, border: "none", cursor: "pointer", boxShadow: "0 6px 24px rgba(71,59,53,0.25)", transition: "background 0.3s" }}>
                  {isOpening ? "正在开启…" : "点击开启信笺"}
                </motion.button>

                {/* Footer tag */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 20 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#C9A66B", opacity: 0.5 }} />
                  <span style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#C9A66B", fontSize: 11, letterSpacing: 2 }}>
                    心意链接 · HeartLink
                  </span>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#C9A66B", opacity: 0.5 }} />
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

              <div style={{ borderRadius: 28, background: "#FFFFFF", boxShadow: "0 12px 60px rgba(63,52,47,0.09)", overflow: "hidden" }}>

                {/* Letter top border */}
                <div style={{ height: 3, background: "linear-gradient(90deg,#C9A66B,#E8C98A,#C9A66B)" }} />

                {/* Header */}
                <div style={{ padding: "28px 28px 0" }}>
                  <p style={{ fontFamily: "'Lora', serif", color: "#C9A66B", fontSize: 10, letterSpacing: 4, textTransform: "uppercase", margin: "0 0 10px" }}>
                    Acknowledgment Receipt
                  </p>
                  <h1 style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 26, letterSpacing: 4, margin: "0 0 20px", lineHeight: 1.35 }}>
                    {centralLetterTitle}
                  </h1>
                  <div style={{ height: 1, background: "#EAE2D8" }} />
                </div>

                {/* Body */}
                <div style={{ padding: "22px 28px 0", display: "flex", flexDirection: "column", gap: 16 }}>
                  <p style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 15, lineHeight: 2.1, textIndent: "2em", letterSpacing: 0.5, margin: 0 }}>
                    {centralLetterBodyP1}
                  </p>

                  {/* Quote block */}
                  <div style={{ borderLeft: "3px solid #C9A66B", background: "#FAF7F0", borderRadius: "0 12px 12px 0", padding: "14px 18px" }}>
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
                        {CENTRAL_RECEIVED_DATE.split("年")[0]} · 以{scene}之名
                      </span>
                    </div>
                  </div>

                  <div style={{ height: 1, background: "#EAE2D8" }} />
                </div>

                {/* Receive button */}
                <div style={{ padding: "20px 28px 28px" }}>
                  <motion.button
                    onClick={handleReceive}
                    whileTap={{ scale: 0.97 }}
                    style={{ width: "100%", padding: "16px 0", borderRadius: 99, background: "#473B35", color: "#FFFFFF", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 15, letterSpacing: 2, border: "none", cursor: "pointer", boxShadow: "0 6px 24px rgba(71,59,53,0.25)" }}>
                    点击接收我的爱心电波
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

              <div style={{ borderRadius: 28, background: "#FFFFFF", boxShadow: "0 12px 60px rgba(63,52,47,0.09)", overflow: "hidden" }}>
                <div style={{ height: 3, background: "linear-gradient(90deg,#C9A66B,#E8C98A,#C9A66B)" }} />

                <div style={{ padding: "28px 28px 0" }}>
                  <p style={{ fontFamily: "'Lora', serif", color: "#C9A66B", fontSize: 10, letterSpacing: 4, textTransform: "uppercase", margin: "0 0 10px" }}>
                    Acknowledgment Receipt
                  </p>
                  <h1 style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 26, letterSpacing: 4, margin: "0 0 20px", lineHeight: 1.35 }}>
                    {centralLetterTitle}
                  </h1>
                  <div style={{ height: 1, background: "#EAE2D8" }} />
                </div>

                <div style={{ padding: "22px 28px 0", display: "flex", flexDirection: "column", gap: 16 }}>
                  <p style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 15, lineHeight: 2.1, textIndent: "2em", letterSpacing: 0.5, margin: 0 }}>
                    {centralLetterBodyP1}
                  </p>
                  <div style={{ borderLeft: "3px solid #C9A66B", background: "#FAF7F0", borderRadius: "0 12px 12px 0", padding: "14px 18px" }}>
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
                        {CENTRAL_RECEIVED_DATE.split("年")[0]} · 以{scene}之名
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 1, background: "#EAE2D8" }} />
                </div>

                {/* Gold received button */}
                <div style={{ padding: "20px 28px 28px" }}>
                  <motion.button
                    initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 16 }}
                    style={{ width: "100%", padding: "16px 0", borderRadius: 99, background: "linear-gradient(135deg,#C9A66B 0%,#DFB87A 50%,#C9A66B 100%)", color: "#FFFFFF", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 15, letterSpacing: 2, border: "none", cursor: "default", boxShadow: "0 6px 28px rgba(201,166,107,0.4)" }}>
                    {CENTRAL_COMPLETION_TEXTS[scene]}
                  </motion.button>

                  {/* Received confirmation */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, marginTop: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Heart size={10} color="#C9A66B" fill="#C9A66B" />
                      <span style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#C9A66B", fontSize: 12, letterSpacing: 1 }}>
                        已于 {CENTRAL_RECEIVED_DATE} 接收
                      </span>
                      <Heart size={10} color="#C9A66B" fill="#C9A66B" />
                    </div>
                    <p style={{ fontFamily: "'Noto Serif SC', serif", color: "#C5BAB2", fontSize: 12, letterSpacing: 0.5, margin: 0 }}>
                      这份心意已被珍藏
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
