import type { AppErrorCode } from "../src/app/types/errors";

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

type GiftStatusEvent = "opened" | "accepted";

type GiftStatusRecord = {
  token: string;
  opened_count: number;
  accepted_count: number;
  accepted_at: string | null;
  updated_at: string;
  expires_at: string | null;
  is_deleted: boolean;
};

const SUPABASE_TABLE_PATH = "/rest/v1/gifts";
const GIFT_TOKEN_PATTERN = /^[a-z0-9_-]{10,16}$/;
const STATUS_FIELDS = "token,opened_count,accepted_count,accepted_at,updated_at,expires_at,is_deleted";

function sendError(
  response: VercelResponse,
  statusCode: number,
  code: AppErrorCode,
  message: string,
) {
  return response.status(statusCode).json({ ok: false, error: { code, message } });
}

function parseRequestBody(body: unknown): unknown {
  if (typeof body !== "string") return body;

  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

function getStatusRequest(body: unknown): { token: string; event: GiftStatusEvent } | undefined {
  const value = parseRequestBody(body);

  if (typeof value !== "object" || value === null) return undefined;

  const { token, event } = value as { token?: unknown; event?: unknown };
  const normalizedToken = typeof token === "string" ? token.trim().toLowerCase() : "";

  if (!GIFT_TOKEN_PATTERN.test(normalizedToken) || (event !== "opened" && event !== "accepted")) {
    return undefined;
  }

  return { token: normalizedToken, event };
}

function isGiftStatusRecord(value: unknown): value is GiftStatusRecord {
  if (typeof value !== "object" || value === null) return false;

  const record = value as Partial<GiftStatusRecord>;

  return typeof record.token === "string"
    && typeof record.opened_count === "number"
    && typeof record.accepted_count === "number"
    && (typeof record.accepted_at === "string" || record.accepted_at === null)
    && typeof record.updated_at === "string"
    && (typeof record.expires_at === "string" || record.expires_at === null)
    && typeof record.is_deleted === "boolean";
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;

  const expiresAtTime = new Date(expiresAt).getTime();
  return Number.isFinite(expiresAtTime) && expiresAtTime <= Date.now();
}

function toStatusPayload(record: GiftStatusRecord) {
  return {
    ok: true,
    token: record.token,
    openedCount: record.opened_count,
    acceptedCount: record.accepted_count,
    acceptedAt: record.accepted_at,
    updatedAt: record.updated_at,
  };
}

async function readGiftStatus(supabaseUrl: string, serviceRoleKey: string, token: string) {
  const query = new URLSearchParams({
    select: STATUS_FIELDS,
    token: `eq.${token}`,
    limit: "1",
  });

  return fetch(`${supabaseUrl}${SUPABASE_TABLE_PATH}?${query.toString()}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });
}

async function updateGiftStatus(
  supabaseUrl: string,
  serviceRoleKey: string,
  token: string,
  payload: Record<string, unknown>,
  extraFilters: Record<string, string> = {},
) {
  const query = new URLSearchParams({
    select: STATUS_FIELDS,
    token: `eq.${token}`,
    is_deleted: "eq.false",
    ...extraFilters,
  });

  return fetch(`${supabaseUrl}${SUPABASE_TABLE_PATH}?${query.toString()}`, {
    method: "PATCH",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.setHeader?.("Allow", "POST");
    return sendError(response, 405, "network-error", "Unable to update the gift status.");
  }

  const statusRequest = getStatusRequest(request.body);

  if (!statusRequest) {
    return sendError(response, 400, "network-error", "Unable to update the gift status.");
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Supabase gift status update is unavailable: missing server configuration.");
    return sendError(response, 503, "network-error", "Unable to update the gift status.");
  }

  let readResponse: Response;

  try {
    readResponse = await readGiftStatus(supabaseUrl, serviceRoleKey, statusRequest.token);
  } catch {
    console.error("Supabase gift status read failed before a response.");
    return sendError(response, 503, "network-error", "Unable to update the gift status.");
  }

  if (!readResponse.ok) {
    console.error("Supabase gift status read failed.", { status: readResponse.status });
    return sendError(response, 502, "network-error", "Unable to update the gift status.");
  }

  let records: unknown;

  try {
    records = await readResponse.json();
  } catch {
    console.error("Supabase gift status read returned an invalid response.");
    return sendError(response, 502, "network-error", "Unable to update the gift status.");
  }

  const record = Array.isArray(records) ? records[0] : undefined;

  if (!isGiftStatusRecord(record) || record.is_deleted) {
    return sendError(response, 404, "gift-not-found", "This gift does not exist or is unavailable.");
  }

  if (isExpired(record.expires_at)) {
    return sendError(response, 410, "gift-expired", "This gift link has expired.");
  }

  if (statusRequest.event === "accepted" && record.accepted_at) {
    return response.status(200).json(toStatusPayload(record));
  }

  const now = new Date().toISOString();
  const updatePayload = statusRequest.event === "opened"
    ? { opened_count: record.opened_count + 1, updated_at: now }
    : { accepted_at: now, accepted_count: record.accepted_count + 1, updated_at: now };
  const extraFilters = statusRequest.event === "accepted" ? { accepted_at: "is.null" } : {};

  let updateResponse: Response;

  try {
    updateResponse = await updateGiftStatus(
      supabaseUrl,
      serviceRoleKey,
      statusRequest.token,
      updatePayload,
      extraFilters,
    );
  } catch {
    console.error("Supabase gift status update failed before a response.");
    return sendError(response, 503, "network-error", "Unable to update the gift status.");
  }

  if (!updateResponse.ok) {
    console.error("Supabase gift status update failed.", { status: updateResponse.status });
    return sendError(response, 502, "network-error", "Unable to update the gift status.");
  }

  let updatedRecords: unknown;

  try {
    updatedRecords = await updateResponse.json();
  } catch {
    console.error("Supabase gift status update returned an invalid response.");
    return sendError(response, 502, "network-error", "Unable to update the gift status.");
  }

  const updatedRecord = Array.isArray(updatedRecords) ? updatedRecords[0] : undefined;

  if (isGiftStatusRecord(updatedRecord)) {
    return response.status(200).json(toStatusPayload(updatedRecord));
  }

  // A concurrent accept may have won the conditional accepted_at=is.null update.
  if (statusRequest.event === "accepted") {
    let latestResponse: Response;

    try {
      latestResponse = await readGiftStatus(supabaseUrl, serviceRoleKey, statusRequest.token);
    } catch {
      console.error("Supabase gift accepted-status re-read failed before a response.");
      return sendError(response, 503, "network-error", "Unable to update the gift status.");
    }

    if (!latestResponse.ok) {
      console.error("Supabase gift accepted-status re-read failed.", { status: latestResponse.status });
      return sendError(response, 502, "network-error", "Unable to update the gift status.");
    }

    try {
      const latestRecords = await latestResponse.json();
      const latestRecord = Array.isArray(latestRecords) ? latestRecords[0] : undefined;

      if (isGiftStatusRecord(latestRecord) && !latestRecord.is_deleted && latestRecord.accepted_at) {
        return response.status(200).json(toStatusPayload(latestRecord));
      }
    } catch {
      console.error("Supabase gift accepted-status re-read returned an invalid response.");
    }
  }

  return sendError(response, 502, "network-error", "Unable to update the gift status.");
}
