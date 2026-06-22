import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart, Star, MessageCircle, Zap, Gift,
  ArrowLeft, Copy, Check, RefreshCw, Edit3, X,
  AlertCircle, WifiOff, ChevronRight, Mail,
} from "lucide-react";
import {
  DEFAULT_CREATE_GIFT_INPUT,
  DEFAULT_THEME,
  getThemeVisual,
  MOCK_GENERATED_COPY,
  OCCASION_OPTIONS,
  THEME_OPTIONS,
  TONE_OPTIONS as CENTRAL_TONE_OPTIONS,
} from "../data";
import { createGiftPreviewUrl, createGiftUrl } from "../lib";
import { createGift, generateCopy } from "../services";
import { getAiErrorUiStatus, getAppErrorCode } from "../types";
import type {
  AiGenerationStatus,
  CopyLinkStatus,
  CreateGiftInput,
  CreatorStep,
  EditableCopyField,
  GenerateCopyInput,
  GenerateCopyResult,
  GiftOccasion,
  GiftTheme,
  GiftTone,
} from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────
type Scene = GiftOccasion;
type Style = GiftTheme;
type CreateGiftStatus = "idle" | "creating" | "failed" | "network-error";
type Tone = GiftTone;
type AiStatus = AiGenerationStatus;
type CopyStatus = CopyLinkStatus;
type EditingField = EditableCopyField | null;
const MOCK_PREVIEW_TOKEN = "mock-heartlink-a9f2";

interface CreatorFlowProps {
  onViewReceiver: () => void;
}

async function copyTextToClipboard(text: string) {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back for mobile browsers that expose Clipboard API but reject it.
  }

  if (
    typeof document === "undefined"
    || !document.body
    || typeof document.execCommand !== "function"
  ) {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  textarea.style.fontSize = "16px";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CENTRAL_SCENE_ICON_MAP: Record<Scene, React.ReactNode> = {
  感谢: <Heart size={20} />,
  祝福: <Star size={20} />,
  道歉: <MessageCircle size={20} />,
  鼓励: <Zap size={20} />,
  小心意: <Gift size={20} />,
};

const CENTRAL_SCENE_OPTIONS = OCCASION_OPTIONS.map(opt => ({
  ...opt,
  icon: CENTRAL_SCENE_ICON_MAP[opt.label],
}));

const CENTRAL_STYLE_OPTIONS = THEME_OPTIONS;

const CREATOR_STEPS = {
  home: 0,
  occasion: 1,
  details: 2,
  aiGenerating: 3,
  aiResult: 4,
  theme: 5,
  preview: 6,
  success: 7,
} as const satisfies Record<string, CreatorStep>;

const FIRST_PROGRESS_STEP = CREATOR_STEPS.occasion;
const LAST_PROGRESS_STEP = CREATOR_STEPS.preview;

const PROGRESS_MAP: Partial<Record<CreatorStep, { label: string; index: number }>> = {
  1: { label: "场景", index: 1 },
  2: { label: "填写", index: 2 },
  3: { label: "生成", index: 3 },
  4: { label: "生成", index: 3 },
  5: { label: "风格", index: 4 },
  6: { label: "预览", index: 5 },
};

// ─── Style Thumbnails ─────────────────────────────────────────────────────────
function getPreviousCreatorStep(currentStep: CreatorStep): CreatorStep {
  if (currentStep === CREATOR_STEPS.aiGenerating || currentStep === CREATOR_STEPS.aiResult) {
    return CREATOR_STEPS.details;
  }

  if (currentStep === CREATOR_STEPS.home) {
    return CREATOR_STEPS.home;
  }

  return (currentStep - 1) as CreatorStep;
}

function StyleThumbnail({ style, selected }: { style: Style; selected: boolean }) {
  const theme = getThemeVisual(style);
  return (
    <div style={{ width: 60, height: 76, borderRadius: 10, background: theme.surfaceBackground, border: `1.5px solid ${selected ? theme.primaryColor : theme.borderColor}`, overflow: "hidden", flexShrink: 0 }}>
      <div style={{ height: 3, background: theme.topRule }} />
      <div style={{ padding: "8px 9px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ width: 11, height: 11, borderRadius: theme.iconBorderRadius, background: theme.iconBackground, opacity: 0.8 }} />
        <div style={{ width: 34, height: 1.5, borderRadius: 99, background: theme.accentColor, opacity: 0.35 }} />
        {[28, 22, 31, 18].map((width, index) => (
          <div key={index} style={{ width, height: 1.5, borderRadius: 99, background: theme.accentColor, opacity: 0.18 }} />
        ))}
      </div>
    </div>
  );
}

// ─── Toast Notification ───────────────────────────────────────────────────────
function Toast({ status }: { status: CopyStatus }) {
  return (
    <AnimatePresence>
      {status !== "idle" && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            position: "fixed", top: 24, left: 0, right: 0, margin: "0 auto",
            width: "fit-content", maxWidth: "calc(100vw - 32px)",
            zIndex: 999, display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 99, boxSizing: "border-box",
            background: status === "success" ? "#473B35" : "#d4183d",
            boxShadow: "0 4px 24px rgba(0,0,0,0.15)"
          }}>
          {status === "success"
            ? <Check size={14} color="#fff" />
            : <X size={14} color="#fff" />}
          <span style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#FFFFFF", fontSize: 13, letterSpacing: 1 }}>
            {status === "success" ? "链接已复制到剪贴板" : "复制失败，请手动复制"}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function CreatorFlow({ onViewReceiver }: CreatorFlowProps) {
  const [step, setStep] = useState<CreatorStep>(CREATOR_STEPS.home);
  const [scene, setScene] = useState<Scene>(DEFAULT_CREATE_GIFT_INPUT.occasion);
  const [recipient, setRecipient] = useState(DEFAULT_CREATE_GIFT_INPUT.recipientName);
  const [sender, setSender] = useState(DEFAULT_CREATE_GIFT_INPUT.senderName);
  const [message, setMessage] = useState(DEFAULT_CREATE_GIFT_INPUT.originalMessage);
  const [amount, setAmount] = useState(DEFAULT_CREATE_GIFT_INPUT.amountText ?? "");
  const [tone, setTone] = useState<Tone>(DEFAULT_CREATE_GIFT_INPUT.tone);
  const [selectedStyle, setSelectedStyle] = useState<Style>(DEFAULT_THEME);
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  // Editable AI fields
  const [editTitle, setEditTitle] = useState(MOCK_GENERATED_COPY.title);
  const [editBody, setEditBody] = useState(MOCK_GENERATED_COPY.body);
  const [editQuote, setEditQuote] = useState(MOCK_GENERATED_COPY.quote);
  const [editSignoff, setEditSignoff] = useState(MOCK_GENERATED_COPY.signoff);
  const [editButtonText, setEditButtonText] = useState(MOCK_GENERATED_COPY.buttonText);
  const [generatedCoverText, setGeneratedCoverText] = useState(MOCK_GENERATED_COPY.coverText);
  const [generatedAcceptedText, setGeneratedAcceptedText] = useState(MOCK_GENERATED_COPY.acceptedText);
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [generatedLink, setGeneratedLink] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");
  const [createGiftStatus, setCreateGiftStatus] = useState<CreateGiftStatus>("idle");
  const generateRequestIdRef = useRef(0);

  const fallbackLink = createGiftUrl(MOCK_PREVIEW_TOKEN);
  const successLink = generatedLink || fallbackLink;
  const previewLink = createGiftPreviewUrl(generatedToken || MOCK_PREVIEW_TOKEN);
  const previewTheme = getThemeVisual(selectedStyle);

  // Go back, clamped to 0
  const goBack = () => {
    setStep(currentStep => {
      if (currentStep === CREATOR_STEPS.aiGenerating || currentStep === CREATOR_STEPS.aiResult) {
        generateRequestIdRef.current += 1;
        setAiStatus("idle");
      }

      return getPreviousCreatorStep(currentStep);
    });
  };

  const buildGenerateCopyInput = (): GenerateCopyInput => ({
    recipientName: recipient,
    senderName: sender,
    occasion: scene,
    tone,
    amountText: amount.trim() ? amount : undefined,
    originalMessage: message,
  });

  const applyGeneratedCopy = (copy: GenerateCopyResult) => {
    setEditTitle(copy.title);
    setEditBody(copy.body);
    setEditQuote(copy.quote);
    setEditSignoff(copy.signoff);
    setEditButtonText(copy.buttonText);
    setGeneratedCoverText(copy.coverText);
    setGeneratedAcceptedText(copy.acceptedText);
  };

  const resolveAiStatusFromError = (error: unknown): AiStatus => {
    return getAiErrorUiStatus(error);
  };

  const runGenerateCopy = async () => {
    const requestId = generateRequestIdRef.current + 1;
    generateRequestIdRef.current = requestId;
    setAiStatus("generating");
    setStep(CREATOR_STEPS.aiGenerating);

    try {
      const generatedCopy = await generateCopy(buildGenerateCopyInput());
      if (generateRequestIdRef.current !== requestId) return;
      applyGeneratedCopy(generatedCopy);
      setAiStatus("success");
      setStep(CREATOR_STEPS.aiResult);
    } catch (error) {
      if (generateRequestIdRef.current !== requestId) return;
      setAiStatus(resolveAiStatusFromError(error));
      setStep(CREATOR_STEPS.aiResult);
    }
  };

  const handleGenerate = () => {
    if (!isReadyToGenerate) return;
    void runGenerateCopy();
  };

  const handleRetry = () => {
    void runGenerateCopy();
  };

  const buildCreateGiftInput = (): CreateGiftInput => ({
    recipientName: recipient,
    senderName: sender,
    occasion: scene,
    tone,
    theme: selectedStyle,
    originalMessage: message,
    amountText: amount.trim() ? amount : undefined,
    copy: {
      coverText: generatedCoverText,
      title: editTitle,
      body: editBody,
      quote: editQuote,
      buttonText: editButtonText,
      signoff: editSignoff,
      acceptedText: generatedAcceptedText,
    },
  });

  const handleCreateGift = async () => {
    if (createGiftStatus === "creating") return;

    setCreateGiftStatus("creating");

    try {
      const result = await createGift(buildCreateGiftInput());
      setGeneratedLink(result.giftUrl);
      setGeneratedToken(result.token);
      setCreateGiftStatus("idle");
      setStep(CREATOR_STEPS.success);
    } catch (error) {
      setCreateGiftStatus(getAppErrorCode(error) === "network-error" ? "network-error" : "failed");
    }
  };

  const handleCopy = async () => {
    const copied = await copyTextToClipboard(successLink);
    setCopyStatus(copied ? "success" : "fail");
    setTimeout(() => setCopyStatus("idle"), 2500);
  };

  const handleOpenPreview = () => {
    if (typeof window !== "undefined") {
      window.open(previewLink, "_blank", "noopener,noreferrer");
    }
  };

  const isReadyToGenerate = Boolean(message.trim() && recipient.trim());
  const showProgress = step >= FIRST_PROGRESS_STEP && step <= LAST_PROGRESS_STEP;
  const progressInfo = PROGRESS_MAP[step];

  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", background: "#FAF7F0" }}>
      <Toast status={copyStatus} />
      <div style={{ width: "100%", maxWidth: 390, display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative" }}>

        {/* Progress Header */}
        {showProgress && (
          <div style={{ padding: "44px 24px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <button onClick={goBack} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: "#9B8E86", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 13, letterSpacing: 0.5 }}>
                <ArrowLeft size={14} />
                <span>返回</span>
              </button>
              <div style={{ display: "flex", gap: 6 }}>
                {["场景", "填写", "生成", "风格", "预览"].map((label, i) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      fontFamily: "'Noto Sans SC', sans-serif", fontSize: 11, letterSpacing: 0.5,
                      color: i + 1 === progressInfo?.index ? "#3F342F" : i + 1 < progressInfo?.index ? "#C9A66B" : "#C5BAB2"
                    }}>
                      {label}
                    </span>
                    {i < 4 && <div style={{ width: 8, height: 1, background: "#EAE2D8" }} />}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width: "100%", height: 2, borderRadius: 99, background: "#EAE2D8" }}>
              <div style={{ height: 2, borderRadius: 99, background: "linear-gradient(90deg,#C9A66B,#E8C98A)", transition: "width 0.5s ease", width: `${((progressInfo?.index || 1) / 5) * 100}%` }} />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── Step 0: Home ─────────────────────────────────────────────── */}
          {step === CREATOR_STEPS.home && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", minHeight: "100vh", padding: "0 28px 52px" }}>

              {/* Brand */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 96, gap: 18 }}>
                <motion.div
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  style={{ width: 62, height: 62, borderRadius: "50%", background: "linear-gradient(135deg,#C9A66B 0%,#E8C98A 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(201,166,107,0.3)" }}>
                  <Mail size={24} color="#FFFFFF" strokeWidth={1.5} />
                </motion.div>
                <div style={{ textAlign: "center" }}>
                  <h1 style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 26, fontWeight: 500, letterSpacing: 5, margin: 0 }}>
                    心意链接
                  </h1>
                  <p style={{ fontFamily: "'Lora', serif", color: "#C9A66B", fontSize: 11, letterSpacing: 3, marginTop: 6, textTransform: "uppercase" }}>
                    HeartLink
                  </p>
                </div>
              </div>

              {/* Center card */}
              <div style={{ width: "100%", borderRadius: 26, background: "#FFFFFF", padding: "42px 30px 34px", boxShadow: "0 4px 40px rgba(63,52,47,0.07)", textAlign: "center", marginTop: 34 }}>
                <p style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 18, lineHeight: 2.05, letterSpacing: 1, margin: "0 0 30px" }}>
                  写下想说的话，<br />
                  <span style={{ color: "#C9A66B" }}>让它变成一份可以被打开的小礼物。</span>
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  {["填写", "→", "生成", "→", "分享"].map((s, i) => (
                    <span key={i} style={{
                      fontFamily: "'Noto Sans SC', sans-serif",
                      fontSize: 12,
                      color: s === "→" ? "#C9A66B" : "#C5BAB2",
                      letterSpacing: 1
                    }}>{s}</span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginTop: 30 }}>
                <button onClick={() => setStep(CREATOR_STEPS.occasion)}
                  style={{ width: "100%", padding: "16px 0", borderRadius: 99, background: "#473B35", color: "#FFFFFF", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 15, letterSpacing: 4, border: "none", cursor: "pointer", boxShadow: "0 6px 24px rgba(71,59,53,0.25)", transition: "transform 0.1s" }}
                  onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
                  onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}>
                  开始创建心意 →
                </button>
                <button onClick={onViewReceiver}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9B8E86", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 13, letterSpacing: 1, display: "flex", alignItems: "center", gap: 4, textDecoration: "underline", textDecorationColor: "transparent", paddingBottom: 1 }}>
                  先看看对方会收到什么
                  <ChevronRight size={12} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 1: Scene Selection ───────────────────────────────────── */}
          {step === CREATOR_STEPS.occasion && (
            <motion.div key="scene" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              style={{ padding: "8px 24px 40px", display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <h2 style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 22, fontWeight: 500, letterSpacing: 2, margin: "0 0 6px" }}>
                  这份心意的场景
                </h2>
                <p style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#9B8E86", fontSize: 13, letterSpacing: 0.5, margin: 0 }}>
                  选择一个最贴近心意的场景
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {CENTRAL_SCENE_OPTIONS.slice(0, 4).map(opt => {
                  const active = scene === opt.label;
                  return (
                    <button key={opt.label} onClick={() => setScene(opt.label)}
                      style={{ borderRadius: 18, padding: "18px 16px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, cursor: "pointer", transition: "all 0.15s", background: active ? "#473B35" : "#FFFFFF", border: `1.5px solid ${active ? "#473B35" : "#EAE2D8"}`, boxShadow: active ? "0 4px 16px rgba(71,59,53,0.2)" : "none" }}>
                      <div style={{ color: active ? "#E8C98A" : "#C9A66B" }}>{opt.icon}</div>
                      <div>
                        <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 15, color: active ? "#FFFFFF" : "#3F342F", letterSpacing: 2, marginBottom: 2 }}>{opt.label}</div>
                        <div style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: 11, color: active ? "rgba(255,255,255,0.55)" : "#9B8E86", letterSpacing: 0.3 }}>{opt.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 小心意 — full width */}
              {(() => {
                const opt = CENTRAL_SCENE_OPTIONS[4];
                const active = scene === opt.label;
                return (
                  <button onClick={() => setScene(opt.label)}
                    style={{ borderRadius: 18, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "all 0.15s", background: active ? "#473B35" : "#FFFFFF", border: `1.5px solid ${active ? "#473B35" : "#EAE2D8"}`, boxShadow: active ? "0 4px 16px rgba(71,59,53,0.2)" : "none" }}>
                    <div style={{ color: active ? "#E8C98A" : "#C9A66B" }}>{opt.icon}</div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 15, color: active ? "#FFFFFF" : "#3F342F", letterSpacing: 2 }}>{opt.label}</div>
                      <div style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: 11, color: active ? "rgba(255,255,255,0.55)" : "#9B8E86", letterSpacing: 0.3, marginTop: 2 }}>{opt.desc}</div>
                    </div>
                    {active && <Check size={16} color="#E8C98A" style={{ marginLeft: "auto" }} />}
                  </button>
                );
              })()}

              <button onClick={() => setStep(CREATOR_STEPS.details)}
                style={{ width: "100%", padding: "16px 0", borderRadius: 99, background: "#473B35", color: "#FFFFFF", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 15, letterSpacing: 3, border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(71,59,53,0.25)", marginTop: 4 }}>
                下一步：填写信息
              </button>
            </motion.div>
          )}

          {/* ── Step 2: Form ──────────────────────────────────────────────── */}
          {step === CREATOR_STEPS.details && (
            <motion.div key="form" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              style={{ padding: "8px 24px 40px", display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ padding: "3px 10px", borderRadius: 99, background: "#F3EDE3", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: "#C9A66B" }}>{CENTRAL_SCENE_OPTIONS.find(s => s.label === scene)?.icon}</span>
                    <span style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#9B8E86", fontSize: 12, letterSpacing: 1 }}>{scene}</span>
                  </div>
                </div>
                <h2 style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 22, fontWeight: 500, letterSpacing: 2, margin: 0 }}>
                  填写信息
                </h2>
              </div>

              {/* Fields */}
              <FormField label="收信人" required>
                <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="例如：妈妈 / 朋友 / 小林"
                  style={inputStyle} />
              </FormField>

              <FormField label="署名">
                <input value={sender} onChange={e => setSender(e.target.value)} placeholder="例如：你的名字 / 我 / 老朋友"
                  style={inputStyle} />
              </FormField>

              <FormField label="想说的话" required hint={`${message.length} 字 · 建议 30–150 字`}>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="例如：祝你天天开心，顺顺利利。谢谢你一直以来的照顾。"
                  rows={5} style={{ ...inputStyle, resize: "none", lineHeight: 1.9 }} />
                <p style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#9B8E86", fontSize: 11, lineHeight: 1.7, letterSpacing: 0.2, margin: "2px 0 0" }}>
                  请不要填写身份证号、手机号、银行卡号、住址、密码、医疗信息等敏感信息。<br />
                  生成内容会用于创建并分享这份心意链接，请只分享给你信任的人。
                </p>
              </FormField>

              {scene === "小心意" && (
                <FormField label="金额（仅用于文案展示）">
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "'Noto Sans SC', sans-serif", color: "#9B8E86", fontSize: 14 }}>¥</span>
                    <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="例如：心意金额" type="number"
                      style={{ ...inputStyle, paddingLeft: 32 }} />
                  </div>
                </FormField>
              )}

              <FormField label="语气风格">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {CENTRAL_TONE_OPTIONS.map(t => (
                    <button key={t} onClick={() => setTone(t)}
                      style={{ padding: "6px 14px", borderRadius: 99, fontFamily: "'Noto Sans SC', sans-serif", fontSize: 13, letterSpacing: 1, cursor: "pointer", transition: "all 0.15s", background: tone === t ? "#473B35" : "#FFFFFF", color: tone === t ? "#FFFFFF" : "#9B8E86", border: `1px solid ${tone === t ? "#473B35" : "#EAE2D8"}` }}>
                      {t}
                    </button>
                  ))}
                </div>
              </FormField>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                <button onClick={handleGenerate}
                  disabled={!isReadyToGenerate}
                  style={{ width: "100%", padding: "16px 0", borderRadius: 99, background: isReadyToGenerate ? "#473B35" : "#9B8E86", color: "#FFFFFF", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 15, letterSpacing: 3, border: "none", cursor: isReadyToGenerate ? "pointer" : "not-allowed", boxShadow: isReadyToGenerate ? "0 4px 20px rgba(71,59,53,0.25)" : "none", opacity: isReadyToGenerate ? 1 : 0.5, transition: "all 0.2s" }}>
                  AI 生成专属文案
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Generating ────────────────────────────────────────── */}
          {step === CREATOR_STEPS.aiGenerating && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 80px)", gap: 32, padding: "0 40px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  style={{ width: 56, height: 56, borderRadius: "50%", border: "2px solid #EAE2D8", borderTop: "2px solid #C9A66B" }}
                />
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 18, letterSpacing: 3, margin: "0 0 8px" }}>
                    正在生成文案
                  </p>
                  <p style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#9B8E86", fontSize: 13, letterSpacing: 1, margin: 0 }}>
                    AI 正在为您润色这份心意…
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                    style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9A66B" }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Step 4: AI Result / Error ─────────────────────────────────── */}
          {step === CREATOR_STEPS.aiResult && (
            <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ padding: "8px 24px 40px", display: "flex", flexDirection: "column", gap: 16 }}>

              {aiStatus === "failed" || aiStatus === "network-error" ? (
                /* Error state */
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ borderRadius: 24, background: "#FFFFFF", padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center", border: "1px solid #EAE2D8" }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#FFF4F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {aiStatus === "network-error" ? <WifiOff size={22} color="#9B8E86" /> : <AlertCircle size={22} color="#9B8E86" />}
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 18, letterSpacing: 2, margin: "0 0 8px" }}>
                        {aiStatus === "network-error" ? "网络连接失败" : "文案生成失败"}
                      </p>
                      <p style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#9B8E86", fontSize: 13, lineHeight: 1.8, letterSpacing: 0.5, margin: 0 }}>
                        {aiStatus === "network-error"
                          ? "请检查网络后重试，或手动填写文案继续"
                          : "AI 服务暂时不可用，您可以重试或手动编辑文案"}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                      <button onClick={handleRetry}
                        style={{ width: "100%", padding: "14px 0", borderRadius: 99, background: "#473B35", color: "#FFFFFF", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 14, letterSpacing: 2, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <RefreshCw size={14} />
                        重新生成
                      </button>
                      <button onClick={() => { setAiStatus("success"); }}
                        style={{ width: "100%", padding: "12px 0", borderRadius: 99, background: "transparent", color: "#9B8E86", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 13, letterSpacing: 1, border: "1.5px solid #EAE2D8", cursor: "pointer" }}>
                        手动填写文案继续
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Success state — editable result */
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 99, background: "#F3EDE3", marginBottom: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9A66B" }} />
                        <span style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#C9A66B", fontSize: 11, letterSpacing: 1 }}>AI 已生成</span>
                      </div>
                      <h2 style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 20, fontWeight: 500, letterSpacing: 2, margin: 0 }}>
                        文案已就绪
                      </h2>
                      <p style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#9B8E86", fontSize: 12, letterSpacing: 0.5, margin: "6px 0 0" }}>
                        标题、正文、引用和按钮文案均可点击修改
                      </p>
                    </div>
                    <button onClick={handleRetry}
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", borderRadius: 99, background: "transparent", color: "#9B8E86", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 12, letterSpacing: 0.5, border: "1.5px solid #EAE2D8", cursor: "pointer" }}>
                      <RefreshCw size={12} />
                      重新生成
                    </button>
                  </div>

                  {/* Editable result card */}
                  <div style={{ borderRadius: 24, background: "#FFFFFF", border: "1px solid #EAE2D8", overflow: "hidden", boxShadow: "0 2px 20px rgba(63,52,47,0.06)" }}>
                    {/* Receipt header label */}
                    <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <p style={{ fontFamily: "'Lora', serif", color: "#C9A66B", fontSize: 10, letterSpacing: 4, textTransform: "uppercase", margin: "0 0 8px" }}>
                        Acknowledgment Receipt
                      </p>
                      <span style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#C9A66B", fontSize: 11, letterSpacing: 1, padding: "3px 8px", borderRadius: 99, background: "#FAF7F0" }}>点击可修改</span>
                    </div>

                    {/* Editable title */}
                    <EditableField
                      value={editTitle}
                      editing={editingField === "title"}
                      onEdit={() => setEditingField("title")}
                      onDone={() => setEditingField(null)}
                      onChange={setEditTitle}
                      renderDisplay={v => (
                        <h3 style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 22, letterSpacing: 3, margin: 0, lineHeight: 1.4, padding: "0 24px" }}>{v}</h3>
                      )}
                      inputStyle={{ ...inputStyle, fontFamily: "'Noto Serif SC', serif", fontSize: 20, letterSpacing: 2, margin: "0 24px", width: "calc(100% - 48px)" }}
                    />

                    <div style={{ height: 1, background: "#EAE2D8", margin: "16px 24px" }} />

                    {/* Editable body */}
                    <EditableField
                      value={editBody}
                      editing={editingField === "body"}
                      onEdit={() => setEditingField("body")}
                      onDone={() => setEditingField(null)}
                      onChange={setEditBody}
                      multiline
                      renderDisplay={v => (
                        <div style={{ padding: "0 24px" }}>
                          {v.split("\n\n").map((p, i) => (
                            <p key={i} style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 14, lineHeight: 2, textIndent: "2em", letterSpacing: 0.5, margin: i === 0 ? "0 0 12px" : 0 }}>{p}</p>
                          ))}
                        </div>
                      )}
                      inputStyle={{ ...inputStyle, fontFamily: "'Noto Serif SC', serif", fontSize: 14, lineHeight: "2", resize: "none", margin: "0 24px", width: "calc(100% - 48px)", minHeight: 100 }}
                    />

                    {/* Editable quote */}
                    <div style={{ margin: "14px 24px" }}>
                      <EditableField
                        value={editQuote}
                        editing={editingField === "quote"}
                        onEdit={() => setEditingField("quote")}
                        onDone={() => setEditingField(null)}
                        onChange={setEditQuote}
                        renderDisplay={v => (
                          <div style={{ padding: "12px 14px", borderLeft: "3px solid #C9A66B", background: "#FAF7F0", borderRadius: "0 10px 10px 0" }}>
                            <p style={{ fontFamily: "'Lora', serif", color: "#9B8E86", fontSize: 13, lineHeight: 1.8, fontStyle: "italic", margin: 0 }}>"{v}"</p>
                          </div>
                        )}
                        inputStyle={{ ...inputStyle, fontFamily: "'Lora', serif", fontSize: 13, fontStyle: "italic" }}
                      />
                    </div>

                    {/* Editable sign-off */}
                    <div style={{ padding: "4px 24px 20px", display: "flex", justifyContent: "flex-end" }}>
                      <EditableField
                        value={editSignoff}
                        editing={editingField === "signoff"}
                        onEdit={() => setEditingField("signoff")}
                        onDone={() => setEditingField(null)}
                        onChange={setEditSignoff}
                        renderDisplay={v => (
                          <span style={{ fontFamily: "'Noto Serif SC', serif", color: "#9B8E86", fontSize: 13, letterSpacing: 2 }}>— {v}</span>
                        )}
                        inputStyle={{ ...inputStyle, fontFamily: "'Noto Serif SC', serif", fontSize: 13, width: 160, textAlign: "right" }}
                      />
                    </div>

                    {/* Editable receive button text */}
                    <div style={{ padding: "0 24px 24px" }}>
                      <EditableField
                        value={editButtonText}
                        editing={editingField === "button"}
                        onEdit={() => setEditingField("button")}
                        onDone={() => setEditingField(null)}
                        onChange={setEditButtonText}
                        renderDisplay={v => (
                          <div style={{ width: "100%", padding: "13px 0", borderRadius: 99, background: "#473B35", textAlign: "center", boxShadow: "0 4px 16px rgba(71,59,53,0.16)" }}>
                            <span style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#FFFFFF", fontSize: 13, letterSpacing: 2 }}>{v}</span>
                          </div>
                        )}
                        inputStyle={{ ...inputStyle, fontFamily: "'Noto Sans SC', sans-serif", fontSize: 13, textAlign: "center" }}
                      />
                    </div>
                  </div>

                  <p style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#C5BAB2", fontSize: 11, textAlign: "center", letterSpacing: 1, margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <Edit3 size={10} />
                    点击字段右侧图标可直接编辑
                  </p>

                  <button onClick={() => setStep(CREATOR_STEPS.theme)}
                    style={{ width: "100%", padding: "16px 0", borderRadius: 99, background: "#473B35", color: "#FFFFFF", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 15, letterSpacing: 3, border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(71,59,53,0.25)" }}>
                    使用这份文案 →
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* ── Step 5: Style Selection ───────────────────────────────────── */}
          {step === CREATOR_STEPS.theme && (
            <motion.div key="style" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              style={{ padding: "8px 24px 40px", display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <h2 style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 22, fontWeight: 500, letterSpacing: 2, margin: "0 0 6px" }}>
                  选择风格
                </h2>
                <p style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#9B8E86", fontSize: 13, letterSpacing: 0.5, margin: 0 }}>
                  为这份心意选一个适合的外衣
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {CENTRAL_STYLE_OPTIONS.map(opt => {
                  const active = selectedStyle === opt.label;
                  const theme = getThemeVisual(opt.label);
                  return (
                    <button key={opt.label} onClick={() => setSelectedStyle(opt.label)}
                      style={{ borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "all 0.15s", background: active ? theme.primaryColor : theme.surfaceBackground, border: `1.5px solid ${active ? theme.primaryColor : theme.borderColor}`, boxShadow: active ? `0 4px 16px ${theme.accentSoftColor}` : "none" }}>
                      <StyleThumbnail style={opt.label} selected={active} />
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, color: active ? "#FFFFFF" : "#3F342F", letterSpacing: 2, marginBottom: 4 }}>{theme.displayName}</div>
                        <div style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: 11, color: active ? "rgba(255,255,255,0.55)" : "#9B8E86", letterSpacing: 0.3, marginBottom: 3 }}>{opt.desc}</div>
                        <div style={{ fontFamily: "'Lora', serif", fontSize: 10, color: active ? theme.accentSoftColor : theme.accentColor, fontStyle: "italic", letterSpacing: 1 }}>{opt.sub}</div>
                      </div>
                      {active && <Check size={16} color={theme.accentSoftColor} style={{ flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>

              <button onClick={() => setStep(CREATOR_STEPS.preview)}
                style={{ width: "100%", padding: "16px 0", borderRadius: 99, background: "#473B35", color: "#FFFFFF", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 15, letterSpacing: 3, border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(71,59,53,0.25)", marginTop: 4 }}>
                预览效果 →
              </button>
            </motion.div>
          )}

          {/* ── Step 6: Preview ───────────────────────────────────────────── */}
          {step === CREATOR_STEPS.preview && (
            <motion.div key="preview" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              style={{ padding: "8px 24px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <h2 style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 22, fontWeight: 500, letterSpacing: 2, margin: "0 0 6px" }}>
                  预览效果
                </h2>
                <p style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#9B8E86", fontSize: 13, letterSpacing: 0.5, margin: 0 }}>
                  对方打开链接时看到的样子
                </p>
              </div>

              {/* Framed preview */}
              <div style={{ borderRadius: previewTheme.cardRadius, overflow: "hidden", border: `1px solid ${previewTheme.borderColor}`, boxShadow: "0 8px 40px rgba(63,52,47,0.1)" }}>
                {/* Cover preview section */}
                <div style={{ background: previewTheme.coverBackground, padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: previewTheme.iconBorderRadius, background: previewTheme.iconBackground, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 6px ${previewTheme.accentSoftColor}` }}>
                    <Heart size={18} color="#FFFFFF" fill="#FFFFFF" />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 16, letterSpacing: 3, margin: "0 0 6px" }}>致：{recipient}</p>
                    <p style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#9B8E86", fontSize: 11, lineHeight: 1.9, letterSpacing: 0.5, margin: 0 }}>在这琐碎而温热的日常里<br />有一份心意请您亲启</p>
                  </div>
                  <div style={{ padding: "6px 18px", borderRadius: 99, border: `1px solid ${previewTheme.accentColor}` }}>
                    <span style={{ fontFamily: "'Noto Sans SC', sans-serif", color: previewTheme.accentColor, fontSize: 11, letterSpacing: 2 }}>点击开启信笺</span>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", background: previewTheme.surfaceBackground }}>
                  <div style={{ flex: 1, height: 1, background: previewTheme.borderColor }} />
                  <span style={{ fontFamily: "'Lora', serif", color: previewTheme.accentColor, fontSize: 9, letterSpacing: 2 }}>{previewTheme.previewLabel}</span>
                  <div style={{ flex: 1, height: 1, background: previewTheme.borderColor }} />
                </div>

                {/* Letter preview */}
                <div style={{ background: previewTheme.surfaceBackground, padding: "16px 20px 20px" }}>
                  <p style={{ fontFamily: "'Lora', serif", color: previewTheme.accentColor, fontSize: 9, letterSpacing: 3, textTransform: "uppercase", margin: "0 0 6px" }}>{previewTheme.letterLabel}</p>
                  <p style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 17, letterSpacing: 3, margin: "0 0 10px" }}>{editTitle}</p>
                  <div style={{ height: 1, background: previewTheme.borderColor, margin: "0 0 10px" }} />
                  <p style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 12, lineHeight: 1.9, textIndent: "2em", letterSpacing: 0.3, margin: "0 0 10px" }}>
                    {editBody.split("\n\n")[0].slice(0, 60)}…
                  </p>
                  <div style={{ padding: "8px 10px", borderLeft: `2.5px solid ${previewTheme.accentColor}`, background: previewTheme.accentSoftColor, borderRadius: "0 8px 8px 0", margin: "0 0 12px" }}>
                    <p style={{ fontFamily: "'Lora', serif", color: "#9B8E86", fontSize: 11, fontStyle: "italic", margin: 0 }}>"{editQuote.slice(0, 30)}…"</p>
                  </div>
                  <div style={{ width: "100%", padding: "11px 0", borderRadius: 99, background: previewTheme.primaryColor, textAlign: "center" }}>
                    <span style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#FFFFFF", fontSize: 12, letterSpacing: 2 }}>{editButtonText}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                <span style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#9B8E86", fontSize: 12, letterSpacing: 0.5 }}>风格：{previewTheme.displayName}</span>
                <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#EAE2D8" }} />
                <span style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#9B8E86", fontSize: 12, letterSpacing: 0.5 }}>场景：{scene}</span>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep(CREATOR_STEPS.theme)}
                  style={{ flex: 1, padding: "14px 0", borderRadius: 99, background: "transparent", color: "#9B8E86", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 13, letterSpacing: 1, border: "1.5px solid #EAE2D8", cursor: "pointer" }}>
                  调整风格
                </button>
                <button onClick={() => { void handleCreateGift(); }} disabled={createGiftStatus === "creating"}
                  style={{ flex: 2, padding: "14px 0", borderRadius: 99, background: createGiftStatus === "creating" ? "#9B8E86" : "#473B35", color: "#FFFFFF", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 14, letterSpacing: 2, border: "none", cursor: createGiftStatus === "creating" ? "wait" : "pointer", boxShadow: "0 4px 20px rgba(71,59,53,0.25)" }}>
                  {createGiftStatus === "creating" ? "正在生成链接…" : "生成链接"}
                </button>
              </div>
              {createGiftStatus === "failed" && (
                <p role="alert" style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#B85C5C", fontSize: 12, textAlign: "center", letterSpacing: 0.5, margin: "2px 0 0" }}>
                  创建失败，请稍后再试。
                </p>
              )}
              {createGiftStatus === "network-error" && (
                <p role="alert" style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#B85C5C", fontSize: 12, textAlign: "center", letterSpacing: 0.5, margin: "2px 0 0" }}>
                  网络连接失败，请稍后重试。
                </p>
              )}
            </motion.div>
          )}

          {/* ── Step 7: Success ───────────────────────────────────────────── */}
          {step === CREATOR_STEPS.success && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "0 28px 48px", gap: 28 }}>

              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 18 }}
                style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#C9A66B,#E8C98A)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 14px rgba(201,166,107,0.1), 0 8px 32px rgba(201,166,107,0.3)" }}>
                <Mail size={28} color="#FFFFFF" strokeWidth={1.5} />
              </motion.div>

              <div style={{ textAlign: "center" }}>
                <h2 style={{ fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 24, fontWeight: 500, letterSpacing: 4, margin: "0 0 10px" }}>
                  心意已封存
                </h2>
                <p style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#9B8E86", fontSize: 13, lineHeight: 1.9, letterSpacing: 0.5, margin: 0 }}>
                  专属链接已生成<br />分享给 {recipient}，静待亲启
                </p>
              </div>

              {/* Link card */}
              <div style={{ width: "100%", borderRadius: 18, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, background: "#FFFFFF", border: "1.5px solid #EAE2D8", boxShadow: "0 2px 12px rgba(63,52,47,0.06)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#9B8E86", fontSize: 10, letterSpacing: 1, margin: "0 0 3px" }}>专属链接</p>
                  <p style={{ fontFamily: "monospace", color: "#3F342F", fontSize: 12, letterSpacing: 0.3, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {successLink}
                  </p>
                </div>
                <button onClick={handleCopy}
                  style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 10, background: "#473B35", color: "#FFFFFF", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 12, letterSpacing: 1, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <Copy size={12} />
                  复制
                </button>
              </div>

              {/* Actions */}
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={handleOpenPreview}
                  style={{ width: "100%", padding: "14px 0", borderRadius: 99, background: "transparent", color: "#3F342F", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 14, letterSpacing: 2, border: "1.5px solid #EAE2D8", cursor: "pointer" }}>
                  打开预览效果
                </button>
                <button onClick={() => { setStep(CREATOR_STEPS.home); setAiStatus("idle"); setGeneratedLink(""); setGeneratedToken(""); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9B8E86", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 13, letterSpacing: 1, textAlign: "center", borderBottom: "1px solid #EAE2D8", paddingBottom: 1, margin: "0 auto" }}>
                  再创建一份
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9A66B" }} />
                <span style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#C5BAB2", fontSize: 11, letterSpacing: 0.5, lineHeight: 1.7, textAlign: "center" }}>拥有链接的人都可以查看，请只分享给你想分享的人。</span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Helper: FormField ─────────────────────────────────────────────────────────
function FormField({ label, children, required, hint }: { label: string; children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <label style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#3F342F", fontSize: 13, letterSpacing: 0.5, fontWeight: 500 }}>
          {label}{required && <span style={{ color: "#C9A66B", marginLeft: 2 }}>*</span>}
        </label>
        {hint && <span style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#C5BAB2", fontSize: 11, letterSpacing: 0.3 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// ─── Helper: EditableField ─────────────────────────────────────────────────────
function EditableField({ value, editing, onEdit, onDone, onChange, renderDisplay, inputStyle: iStyle, multiline }: {
  value: string;
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
  onChange: (v: string) => void;
  renderDisplay: (v: string) => React.ReactNode;
  inputStyle?: React.CSSProperties;
  multiline?: boolean;
}) {
  return (
    <div style={{ position: "relative", padding: "6px 0" }}>
      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {multiline
            ? <textarea value={value} onChange={e => onChange(e.target.value)} autoFocus rows={4}
              style={{ ...iStyle, background: "#FAF7F0", border: "1.5px solid #C9A66B", borderRadius: 10, padding: "10px 12px", outline: "none", fontFamily: "'Noto Serif SC', serif", color: "#3F342F", fontSize: 14 }} />
            : <input value={value} onChange={e => onChange(e.target.value)} autoFocus
              style={{ ...iStyle, background: "#FAF7F0", border: "1.5px solid #C9A66B", borderRadius: 10, padding: "8px 12px", outline: "none", fontFamily: "'Noto Serif SC', serif", color: "#3F342F" }} />
          }
          <button onClick={onDone}
            style={{ alignSelf: "flex-end", padding: "4px 12px", borderRadius: 99, background: "#473B35", color: "#FFFFFF", border: "none", cursor: "pointer", fontFamily: "'Noto Sans SC', sans-serif", fontSize: 12, letterSpacing: 1, display: "flex", alignItems: "center", gap: 4 }}>
            <Check size={11} /> 完成
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <div style={{ flex: 1 }}>{renderDisplay(value)}</div>
          <button onClick={onEdit}
            style={{ flexShrink: 0, marginTop: 2, width: 28, height: 28, borderRadius: "50%", background: "#F3EDE3", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Edit3 size={12} color="#9B8E86" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Shared input style ────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 14,
  background: "#FFFFFF",
  border: "1.5px solid #EAE2D8",
  fontFamily: "'Noto Serif SC', serif",
  color: "#3F342F",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  letterSpacing: 0.5,
  transition: "border-color 0.15s",
};
