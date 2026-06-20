# AI_SERVER_FUNCTION_SKELETON.md

## 1. Purpose

This document completes TODO-030: add an AI server-function skeleton.

The repository is currently a Vite static frontend and does not yet select a server-function host. This task therefore records a provider-free, platform-neutral skeleton instead of adding a Vercel, Netlify, Cloudflare, or Node runtime implementation prematurely.

No provider request, provider SDK, API key, `.env`, `.env.local`, frontend endpoint call, or frontend flow change is added by this document.

## 2. Ownership Boundary

The future call path remains:

```text
CreatorFlow
  -> giftService.generateCopy()
  -> owned server function
  -> AI provider
```

Current state:

- `CreatorFlow.tsx` calls the existing frontend service.
- `src/app/services/giftService.ts` still returns local mock copy.
- No server function exists in the current Vite application.

Future state:

- The browser calls an owned same-origin API route or owned server function.
- The server function validates, invokes a provider, validates output, and returns normalized data.
- Only the server function may access a server-side provider secret.

## 3. Platform Selection Deferred

The function host must be selected before implementation. Candidate locations depend on the selected host:

| Host option | Future function location | Status in this repository |
| --- | --- | --- |
| Vercel Functions | a future `api/` function entry | not created |
| Netlify Functions | a future `netlify/functions/` entry | not created |
| Cloudflare Pages Functions | a future `functions/` entry | not created |
| Separate Node service | a separate service repository or approved server directory | not created |

No option is selected in TODO-030. Adding one of these directories, provider dependencies, or deployment configuration belongs to a later approved implementation task.

## 4. Function Contract Skeleton

Future owned endpoint intent:

```text
POST <owned generate-copy route>
Content-Type: application/json
```

Request body contract:

```text
GenerateCopyInput
```

Response contracts:

```text
Success: GenerateCopyResult
Failure: { error: { code: AiGenerationErrorCode, message: string } }
```

The source of truth for these contracts remains:

```text
src/app/types/ai.ts
src/app/types/errors.ts
```

The server function must not invent a second browser-facing copy contract.

## 5. Provider-Free Handler Skeleton

The future handler should follow this order:

```text
1. Accept a JSON request.
2. Parse it as GenerateCopyInput.
3. Validate required input fields.
4. If validation fails, return validation-empty.
5. Resolve an internal generation adapter.
6. TODO-030 adapter behavior: return not-implemented / unavailable only.
7. TODO-031 adapter behavior: invoke the provider from the server only.
8. Validate normalized output as GenerateCopyResult.
9. Return normalized result or one of the existing AI error codes.
```

This task intentionally does not add executable provider adapter code. It must not contain a provider URL, authentication header, model name, request body, SDK import, or provider credential lookup.

## 6. Error Boundary

The function skeleton must preserve the existing error codes:

| Function condition | Error code | Existing creator UI |
| --- | --- | --- |
| Missing required fields | `validation-empty` | existing validation / failed state |
| Placeholder adapter not implemented | `ai-service-unavailable` | failed state |
| Normalized upstream transport failure | `network-error` | network-error state |
| Normalized provider failure | `ai-generation-failed` | failed state |
| Missing or invalid generated content | `ai-content-empty` | failed state |

The frontend must continue to use `getAiErrorUiStatus()` and its existing loading, success, failed, and network-error UI. No provider-specific error page is needed.

## 7. Security Requirements

1. The browser must never request an AI provider directly.
2. No API key belongs in `src/`, documentation, comments, tests, logs, Git, or ChatGPT / Codex conversations.
3. No key, `.env`, `.env.local`, or `.env.example` is created in TODO-030.
4. A future server secret must not use a `VITE_` prefix.
5. The future function may read a server-only secret only after TODO-031 begins and official provider documentation has been rechecked.
6. The current frontend mock behavior remains active until TODO-032 explicitly changes the service call path.

## 8. Manual Verification for TODO-030

After this documentation-only skeleton task:

1. `npm run build` still succeeds.
2. The creator flow still uses mock `generateCopy()`.
3. `__mock_ai_error__` still reaches the existing failure UI.
4. `__mock_network_error__` still reaches the existing network-error UI.
5. No server function directory, provider request, key, or environment file has been added.
6. No creator or receiver UI has changed.

## 9. Next Task Boundary

TODO-031 may implement a provider call only after all of the following are true:

1. A server-function host has been explicitly selected.
2. The latest official provider documentation has been reviewed.
3. The server-only secret path is configured outside Git.
4. The implementation can keep the browser free of provider keys and provider requests.
5. The existing mock flow remains available until TODO-032 performs the frontend service-path switch.
