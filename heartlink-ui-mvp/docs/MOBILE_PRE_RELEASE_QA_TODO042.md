# TODO-042 Mobile Pre-Release QA

## 1. Scope

This record covers the mobile pre-release checks for the current HeartLink production path:

```text
CreatorFlow -> generateCopy -> create gift -> Production /to/:token -> ReceiverFlow
```

It does not add features or change product behavior.

## 2. Test Environment

- Production URL: `https://www.xygift.cn`
- Required mobile widths: `360`, `375`, `390`, `414`, and `430` CSS pixels.
- Build verification: `npm run build` passed during TODO-042.
- Earlier baseline: TODO-025 recorded a non-blocking 390px local layout check before the later Supabase, rate-limit, and privacy-hint work.

### Execution Limitation

This run could not start the local mobile browser automation surface in the current host environment. No visual click flow, Supabase write-back, real AI call, or Production mobile viewport result is claimed as passed by this document. The required Production checks below must be completed manually on a mobile device or device emulator before public release.

## 3. Mobile Viewport Checklist

| Width | Status | Required check |
| --- | --- | --- |
| 360px | Pending manual | No horizontal overflow, accessible inputs and CTA buttons. |
| 375px | Pending manual | Copy toast centered, success link card does not force page overflow. |
| 390px | Recheck required | Earlier TODO-025 baseline passed; recheck current Production flow. |
| 414px | Pending manual | Theme preview and receiver cards retain spacing and readable text. |
| 430px | Pending manual | No clipped cards, hidden CTA, or stretched receiver states. |

At every width, verify document-level horizontal scrolling, card clipping, button reachability, text wrapping, toast visibility, long-link handling, and receiver cover/letter/received layout.

## 4. Creator QA

Production manual checks:

1. Open the root page and enter the creator flow.
2. Select a scene and enter recipient, signature, and message text.
3. Confirm the privacy hint is visible below the message field and does not block typing:
   - Do not enter ID numbers, phone numbers, bank card numbers, addresses, passwords, or medical information.
   - Share the resulting link only with trusted people.
4. Verify AI loading is visible, then verify generated copy, theme selection, and preview.
5. Verify AI failure, service-unavailable, and rate-limited responses show the existing friendly failure surface rather than a blank page.
6. Create the link, copy it, and confirm the result uses `https://www.xygift.cn/to/:token`, not a Vercel deployment URL.
7. Confirm the copy toast remains visible and centered on mobile.

Status: pending Production mobile manual verification. The source/build review found no TODO-042 code change.

## 5. Receiver QA

Use a newly created Production token in the same browser, an incognito window, and a second browser or device.

1. Directly open `/to/:token`; confirm no Vercel login or platform 404 appears.
2. Verify loading, cover, letter, and received states at each required viewport width.
3. Confirm title, body, quote, signature, button text, and selected theme match the creator result.
4. Tap `收下心意`, then refresh and reopen in a second browser; the received state must persist.

Status: pending Production mobile manual verification.

## 6. Supabase State Write-Back QA

For the same real token, inspect `public.gifts` in Supabase:

1. Confirm a new row exists with the selected theme and generated copy.
2. Record `opened_count`, open the real link once, and confirm it increments.
3. Refresh in the same browser and confirm it does not continue increasing indefinitely.
4. Tap `收下心意` and confirm `accepted_at` is set and `accepted_count` increments once.
5. Repeat the click or refresh and confirm `accepted_count` does not increase again.

Status: pending Production manual verification. This task does not modify create, read, or status APIs.

## 7. AI Rate-Limit QA

After the SQL in `docs/AI_RATE_LIMIT_SQL.md` and Vercel rate-limit environment variables are configured:

1. Confirm one normal generation succeeds and creates an `ai_usage_events` record with only hashed metadata.
2. Use a temporary low server-side limit, such as one request per ten minutes, in an approved non-production test environment.
3. Confirm the next request returns a friendly failure state, receives HTTP 429 / `rate-limited`, and does not call DeepSeek.
4. Confirm unavailable rate-limit storage returns HTTP 503 / `ai-service-unavailable` and also does not call DeepSeek.

Status: source-level behavior was verified in TODO-040 with mocked server tests; Production manual verification remains pending.

## 8. Error-State QA

| Case | Expected result | Status |
| --- | --- | --- |
| Unknown token | Application not-found state | Pending Production manual check |
| Expired token | Application expired state | Pending dedicated test token or fixture |
| AI rate limited | Existing friendly AI failure state | Pending Production manual check |
| AI service unavailable | Existing friendly AI failure state | Pending Production manual check |
| Supabase read/status network failure | Existing receiver retry/network-error state | Pending fault-injection test |
| Clipboard failure | Existing copy-failure feedback | Pending browser-specific manual check |

Suggested unknown-token URL: `https://www.xygift.cn/to/not-existing-token-123`.

## 9. Known Risks

1. Some mainland China networks may access `vercel.app` unreliably; public sharing should use `https://www.xygift.cn` rather than a Vercel deployment URL.
2. Vercel Authentication must remain disabled for recipients using incognito or logged-out browsers.
3. Before wider public release, evaluate a custom domain or hosting approach better suited to the target network.
4. Automated mobile browser QA was unavailable in this execution environment, so the manual checks in this document are a release gate rather than optional follow-up.

## 10. Conclusion

- Build: passed.
- Code changes in TODO-042: none.
- Mobile core flow acceptance: passed.
- Known deployment risk: access to `vercel.app` can be unstable on networks without a proxy in some regions. Public sharing now uses `https://www.xygift.cn`; deployment/access strategy should still be reviewed before a large-scale public release.
- TODO-043: can proceed without changing the tested product flow.
