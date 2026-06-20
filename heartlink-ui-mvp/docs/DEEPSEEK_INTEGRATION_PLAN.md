# DEEPSEEK_INTEGRATION_PLAN.md

## 1. Purpose

This document completes TODO-029: DeepSeek integration planning.

It defines the future boundary for DeepSeek integration only. It does not add a server function, make a provider request, create an environment file, add a key, or change the current mock AI flow.

## 2. Target Call Path

The future path must be:

```text
CreatorFlow
  -> giftService.generateCopy()
  -> owned server function
  -> DeepSeek API
```

Responsibilities:

1. `CreatorFlow.tsx` keeps its current UI state flow and only calls `generateCopy()`.
2. `giftService.generateCopy()` remains the frontend service boundary.
3. The owned server function validates input, calls the provider, validates output, and normalizes errors.
4. Only the owned server function can call DeepSeek.
5. The browser must never call DeepSeek directly.

## 3. Current Contract Boundary

The future server function must reuse the current AI contracts:

```text
src/app/types/ai.ts
  GenerateCopyInput
  GenerateCopyResult
  GENERATE_COPY_INPUT_FIELDS
  GENERATE_COPY_OUTPUT_FIELDS
  GENERATE_COPY_REQUIRED_TEXT_FIELDS
```

Input fields:

1. `recipientName`
2. `senderName`
3. `occasion`
4. `tone`
5. `amountText`
6. `originalMessage`

Required result fields:

1. `coverText`
2. `title`
3. `body`
4. `quote`
5. `buttonText`
6. `signoff`
7. `acceptedText`

The server function must return structured content that can be validated against this result shape before it reaches the browser. It must not return raw provider response objects to the UI.

## 4. Security Boundary

1. DeepSeek credentials may exist only in a server-side secret manager or server-side environment variable.
2. No provider credential may be placed in `src/`, the browser bundle, Git, documentation examples, screenshots, logs, or ChatGPT / Codex conversations.
3. A server secret must never use the `VITE_` prefix. Vite exposes `VITE_` variables to the browser bundle.
4. Do not commit `.env`, `.env.local`, or any file containing a real secret.
5. TODO-029 does not add `.env.example`; if one is later needed, it may contain variable names only and no real values.
6. The frontend should only know the owned server function URL or same-origin API route, never a provider secret.
7. No Supabase credential, database credential, or payment credential belongs in this AI plan.

## 5. Server Function Responsibility

The future function should:

1. Accept only the `GenerateCopyInput` contract.
2. Validate required text before calling a provider.
3. Build provider instructions on the server, not in editable browser-side code.
4. Set an explicit upstream request timeout.
5. Normalize provider output into `GenerateCopyResult`.
6. Reject missing or malformed required output as an AI content error.
7. Normalize provider failures without exposing provider internals or secrets to the browser.
8. Keep request logging free of raw secret values and unnecessary private message content.

Rate limiting, retry policy, abuse protection, provider model selection, and prompt versioning belong to the server-function implementation task, not the UI layer.

## 6. Error Mapping

The server function and frontend service must use the current error codes in `src/app/types/errors.ts`:

| Condition | Error code | Existing UI state |
| --- | --- | --- |
| Required input is missing | `validation-empty` | failed / existing input validation |
| Provider returns an unusable result | `ai-content-empty` | failed |
| Provider rejects, times out, or is unavailable | `ai-service-unavailable` | failed |
| Network path to the owned server function fails | `network-error` | network-error |
| Other normalized generation failure | `ai-generation-failed` | failed |

The UI must continue to reuse the current loading, success, failed, and network-error surfaces. Do not add a provider-specific error page or show raw provider error messages to users.

## 7. Timeout and Retry Strategy

The future implementation must define an explicit server-side timeout before calling DeepSeek.

Initial policy direction:

1. The server function should stop an upstream request after a bounded timeout.
2. Timeouts and temporary provider unavailability should map to `ai-service-unavailable` or `network-error` according to where the failure occurred.
3. Browser-side automatic retry should not be added in this planning task.
4. The existing user-controlled "retry generation" action remains the primary retry UX.
5. Any server-side retry count must be small, documented, and must not duplicate user-visible content unexpectedly.

The exact timeout, retry count, and rate-limit policy must be confirmed with the provider's latest documentation and expected operating cost before TODO-031.

## 8. Mock Fallback Strategy

The current local mock implementation in `src/app/services/giftService.ts` remains the active path until a real server function has been implemented and reviewed.

When the real path is introduced later:

1. Keep the mock implementation available behind a clear development-only switch or fallback policy.
2. Do not silently fabricate a real-provider success after a production provider failure.
3. If a fallback is used for local development or controlled QA, make the activation condition explicit in code and documentation.
4. Preserve existing mock failure triggers for regression coverage until equivalent controlled test coverage exists.
5. Preserve AI loading, success, failed, network-error, and empty-input UI states regardless of active backend mode.

## 9. Official Documentation Gate

Immediately before TODO-031 begins, re-check the latest official DeepSeek documentation for:

1. Supported API endpoint and authentication method.
2. Current model identifiers and model capability limits.
3. Request and response format.
4. Structured-output or JSON-output support, if used.
5. Pricing, quota, rate-limit, timeout, and retry guidance.
6. Current error response format and status-code behavior.
7. Data handling and any provider-side safety requirements relevant to user messages.

The implementation must follow the official documentation available at that time. This plan intentionally does not hard-code an endpoint, model name, parameter value, cost, or provider error payload.

## 10. Task Sequencing

1. TODO-029: document this plan only.
2. TODO-030: add a provider-free server-function skeleton.
3. TODO-031: add the DeepSeek call inside the server function only, after the official documentation gate.
4. TODO-032: route `giftService.generateCopy()` through the owned server function while retaining an explicit mock strategy.
5. TODO-033: run normal, failure, fallback, and UI regression tests.

This sequence must not add Supabase, payment, deployment, theme/style mapping changes, title/favicon/metadata changes, or a UI rewrite.
