# TODO-033 AI Regression Results

## Test Date

2026-06-20

## Test Environment

- Local repository: `heartlink-ui-mvp`
- Runtime verification: local Node-based service stubs and Vite production build
- Production context: Vercel Function route `/api/generate-copy` and SPA rewrite are present in the repository. No production URL or secret was used by this regression task.

## Build Result

- `npm run build`: passed.

## Mock Mode Result

With `VITE_USE_REAL_AI` absent, `giftService.generateCopy()` remains on the mock path.

- Normal mock generation: passed.
- Generated copy can create a token-specific local mock gift: passed.
- Token-specific gift read and accept persistence: passed.
- Existing loading timing remains in the mock service implementation; visual timing remains a manual UI check.

## Mock Error Trigger Result

The service returned the expected normalized error codes for all existing QA triggers:

| Trigger | Result |
| --- | --- |
| `__mock_ai_error__` | `ai-generation-failed` |
| `__mock_network_error__` | `network-error` |
| `__mock_empty_content__` | `ai-content-empty` |
| `__mock_ai_unavailable__` | `ai-service-unavailable` |

`CreatorFlow` continues to map `network-error` to the existing network-error UI and the other AI errors to the existing failed UI. No UI code was changed in this task.

## Real AI Path Check

- Browser service target: same-origin `POST /api/generate-copy` only.
- DeepSeek URL and `DEEPSEEK_API_KEY` access exist only in `api/generate-copy.ts`.
- Missing server key returns normalized `ai-service-unavailable` without an upstream call: passed with a local function stub.
- No real key, `.env`, or `.env.local` was created or used.
- Production DeepSeek availability was reported as working before this task. This task did not issue a production request because no production URL or secret is part of the repository test environment.

## AI Short UI Copy Constraints

The Vercel Function response normalization was tested with a local provider stub.

- Unsafe button input is normalized to `收下心意`.
- Unsafe cover input, including `一封家书`, is normalized to `有一份心意送给你`.
- Empty, non-allowlisted, unsafe, or longer-than-12-character completion copy is normalized to `这份心意已被珍藏`.
- Provider text cannot introduce red-packet, cash, payment, transfer, collection, withdrawal, reward, or similar short UI copy through the normalized response.

## Link And Token Result

- Created gifts persist by token in the current same-browser local mock store: passed.
- A created token reads back the same title and button text: passed.
- `acceptGift()` persists `acceptedAt`, `acceptedCount`, and accepted status for that token: passed.
- Unknown token returns `gift-not-found`: passed.
- Expired mock token returns `gift-expired`: passed.
- `vercel.json` excludes `/api/*` from the SPA rewrite and sends other paths, including `/to/:token`, to `index.html`: code/configuration verified.

## Data Consistency Result

The current creation path persists the current generated cover text, title, body, quote, signoff, button text, and accepted text in the token-specific gift. The receiver reads its displayed content from that gift.

- `title`, `body`, `quote`, `senderName`, `recipientName`, `buttonText`, `acceptedText`, and `theme` remain part of the persisted gift contract.
- `createdAt` is set at creation; `acceptedAt` is set at receive time.
- Receiver date labels no longer use the old fixed 2025 mock date.

## Received State Result

- Primary completion CTA: `已收下这份心意`.
- Completion detail: `gift.acceptedText`, with `这份心意已被珍藏` fallback.
- The two completion copy surfaces no longer intentionally reuse the same value.

## Security Check

- No `.env` or `.env.local` exists in the project.
- No `VITE_DEEPSEEK_API_KEY` reference exists.
- No tracked `node_modules/`, `dist/`, or `vite-dev.out.log` file was found.
- No API key is present in the repository changes for this task.

## Remaining Manual Production Checks

After pushing and Vercel auto-deployment, manually verify:

1. Real AI generation in the production browser.
2. A newly created `/to/:token` link in a new tab does not show a Vercel 404.
3. The production receiver shows the same token-specific copy as the creator flow.
4. The received state displays a current acceptance date and non-duplicated completion copy.

## Known Follow-up Items

- Default form content cleanup: TODO-034.
- Theme/style mapping repair: TODO-035.
- Supabase cross-device sharing: TODO-036 and later.
- AI cost protection: TODO-040.
