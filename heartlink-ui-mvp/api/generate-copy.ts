import type { GenerateCopyInput, GenerateCopyResult } from "../src/app/types/ai";
import type { AiGenerationErrorCode } from "../src/app/types/errors";

declare const process: {
  env: Record<string, string | undefined>;
};

type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (statusCode: number) => VercelResponse;
  json: (payload: unknown) => void;
  setHeader?: (name: string, value: string) => void;
};

type ProviderResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";
const SUPPORTED_DEEPSEEK_MODELS = new Set([
  "deepseek-v4-flash",
  "deepseek-v4-pro",
]);
const REQUEST_TIMEOUT_MS = 12_000;

function sendError(
  response: VercelResponse,
  statusCode: number,
  code: AiGenerationErrorCode,
  message: string,
) {
  return response.status(statusCode).json({ error: { code, message } });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseRequestBody(body: unknown): unknown {
  if (typeof body !== "string") return body;

  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

function readGenerateCopyInput(body: unknown): GenerateCopyInput | undefined {
  const value = parseRequestBody(body);

  if (!isRecord(value)) return undefined;
  if (
    typeof value.recipientName !== "string"
    || typeof value.senderName !== "string"
    || typeof value.occasion !== "string"
    || typeof value.tone !== "string"
    || typeof value.originalMessage !== "string"
    || (value.amountText !== undefined && typeof value.amountText !== "string")
  ) {
    return undefined;
  }

  return {
    recipientName: value.recipientName.trim(),
    senderName: value.senderName.trim(),
    occasion: value.occasion as GenerateCopyInput["occasion"],
    tone: value.tone as GenerateCopyInput["tone"],
    amountText: typeof value.amountText === "string" ? value.amountText.trim() : undefined,
    originalMessage: value.originalMessage.trim(),
  };
}

function buildMessages(input: GenerateCopyInput) {
  return [
    {
      role: "system",
      content: [
        "You write warm, restrained Chinese gift-letter copy.",
        "Return only one JSON object with these non-empty string keys:",
        "coverText, title, body, quote, buttonText, signoff, acceptedText.",
        "Do not include markdown fences, explanations, or extra keys.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        recipientName: input.recipientName,
        senderName: input.senderName,
        occasion: input.occasion,
        tone: input.tone,
        amountText: input.amountText,
        originalMessage: input.originalMessage,
      }),
    },
  ];
}

function readGeneratedCopy(payload: unknown): GenerateCopyResult | undefined {
  if (!isRecord(payload)) return undefined;

  const fields = [
    "coverText",
    "title",
    "body",
    "quote",
    "buttonText",
    "signoff",
    "acceptedText",
  ] as const;

  if (!fields.every(field => typeof payload[field] === "string" && payload[field].trim())) {
    return undefined;
  }

  return {
    coverText: payload.coverText as string,
    title: payload.title as string,
    body: payload.body as string,
    quote: payload.quote as string,
    buttonText: payload.buttonText as string,
    signoff: payload.signoff as string,
    acceptedText: payload.acceptedText as string,
  };
}

function getProviderErrorCode(status: number): AiGenerationErrorCode {
  if (status === 400 || status === 422) return "ai-generation-failed";
  return "ai-service-unavailable";
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.setHeader?.("Allow", "POST");
    return sendError(response, 405, "ai-generation-failed", "Method not allowed.");
  }

  const input = readGenerateCopyInput(request.body);

  if (!input?.recipientName || !input.originalMessage) {
    return sendError(response, 400, "validation-empty", "Required copy input is empty.");
  }

  if (!input) {
    return sendError(response, 400, "ai-generation-failed", "Invalid copy input.");
  }

  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  const model = process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_DEEPSEEK_MODEL;

  if (!apiKey || !SUPPORTED_DEEPSEEK_MODELS.has(model)) {
    return sendError(response, 503, "ai-service-unavailable", "AI service is unavailable.");
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

  let providerResponse: Response;

  try {
    providerResponse = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: buildMessages(input),
        thinking: { type: "disabled" },
        reasoning_effort: "high",
        stream: false,
        response_format: { type: "json_object" },
      }),
      signal: abortController.signal,
    });
  } catch {
    return sendError(response, 503, "network-error", "Unable to reach the AI service.");
  } finally {
    clearTimeout(timeout);
  }

  if (!providerResponse.ok) {
    const code = getProviderErrorCode(providerResponse.status);
    return sendError(response, 502, code, "AI generation is unavailable.");
  }

  let providerPayload: ProviderResponse;

  try {
    providerPayload = await providerResponse.json() as ProviderResponse;
  } catch {
    return sendError(response, 502, "ai-generation-failed", "AI generation failed.");
  }

  const content = providerPayload.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    return sendError(response, 502, "ai-content-empty", "AI returned empty content.");
  }

  let generatedPayload: unknown;

  try {
    generatedPayload = JSON.parse(content);
  } catch {
    return sendError(response, 502, "ai-content-empty", "AI returned invalid content.");
  }

  const generatedCopy = readGeneratedCopy(generatedPayload);

  if (!generatedCopy) {
    return sendError(response, 502, "ai-content-empty", "AI returned incomplete content.");
  }

  return response.status(200).json(generatedCopy);
}
