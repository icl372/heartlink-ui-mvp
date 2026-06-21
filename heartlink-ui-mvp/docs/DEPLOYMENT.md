# DEPLOYMENT.md

## 1. Purpose

This document records deployment preparation for HeartLink's current Vite frontend.

It does not deploy the project, create a hosting account, create a production domain, add environment variables, or change production configuration.

## 2. Current Deployment Boundary

The current project is a frontend MVP with mock services.

- `npm run build` produces static assets in `dist/`.
- Gift data currently uses in-memory and LocalStorage mock preview storage.
- Generated share links use `VITE_APP_BASE_URL`, `VITE_SITE_URL`, or `VITE_PUBLIC_SITE_URL` when configured, then use `https://www.xygift.cn` outside local development. Local development falls back to `window.location.origin`.
- A deployed static site cannot turn LocalStorage mock data into a cross-device production gift link.

Do not describe the current static deployment as a production data service. Real cross-device gift links require a later server-side data source and service implementation.

## 3. Pre-Deployment Checks

Before any real hosting action, verify:

```bash
npm install
npm run build
```

Expected output directory:

```text
dist/
```

Also confirm:

- `dist/` is ignored by Git.
- The current UI passes creator, receiver, error-state, and mobile QA checks.
- No development-only UI text is visible to users.
- No secret, API key, `.env`, `node_modules/`, or build artifact is included in a commit.
- The known theme / style mapping issue has been explicitly accepted or resolved in a separate task.

## 4. Static Hosting Settings

The following are deployment settings to enter in a hosting provider dashboard or approved provider configuration later. They are not applied by this document.

| Provider | Build command | Publish directory | Required SPA behavior |
| --- | --- | --- | --- |
| Vercel | `npm run build` | `dist` | Direct `/to/:token` requests must serve `index.html` so the SPA can render `ReceiverFlow`. |
| Netlify | `npm run build` | `dist` | Add an SPA fallback to `index.html` before relying on direct `/to/:token` links. |
| Cloudflare Pages | `npm run build` | `dist` | Configure an SPA fallback to `index.html` before relying on direct `/to/:token` links. |

Current route behavior to preserve:

```text
/to/:token
?token=:token
?gift=:token
#/to/:token
#?token=:token
```

`/to/:token` is the current user-facing mock route. The future production target `/g/:token` remains a planned migration, not part of this deployment preparation task.

## 5. SPA Fallback Requirement

Vite produces a single-page application. A static host must return `index.html` for a direct request to a valid client-side receiver route such as:

```text
/to/mock-heartlink-a9f2
```

Without an SPA fallback, opening a shared receiver URL directly can return the hosting provider's 404 page before React loads.

Provider-specific rewrites or redirect files must be added only in a separate approved task, because they are production configuration changes. When added, they must not change the existing UI, route parsing, or mock service behavior.

## 6. Environment Variable and Secret Boundary

`VITE_APP_BASE_URL` is the preferred public browser-visible configuration value for the canonical share-link origin. Set it to `https://www.xygift.cn`, without a trailing slash, so links created from Preview or Vercel deployment URLs still point to the public site. `VITE_SITE_URL` and the legacy `VITE_PUBLIC_SITE_URL` are supported as lower-priority aliases. `PUBLIC_SITE_URL` and `NEXT_PUBLIC_SITE_URL` are not exposed by Vite and must not be relied on by browser code.

When real services are added later:

- Never put AI provider keys, Supabase service-role keys, database passwords, or other server secrets in the frontend.
- Never prefix a secret with `VITE_`. Vite exposes `VITE_` variables in the browser bundle.
- Store provider secrets only in a server-side function or host secret manager.
- A future public configuration value must be reviewed before adding it. Do not hard-code an unconfirmed production domain.
- An absent or stale `.vercel.app` public URL falls back to `https://www.xygift.cn` outside local development. Local preview continues to use `window.location.origin`.
- Production AI generation requires server-only `AI_RATE_LIMIT_ENABLED=true` and a non-empty `RATE_LIMIT_SALT`, plus the optional numeric limit overrides documented in `.env.example`. Run `docs/AI_RATE_LIMIT_SQL.md` in Supabase before enabling this path. These values must never use a `VITE_` prefix.

## 7. Future Deployment Smoke Test

After a future real deployment, run these checks in a clean browser session:

1. Open the root page and complete the creator flow.
2. Confirm AI loading, mock/error UI, and success page remain visually unchanged.
3. Copy the generated link and open it in a new tab.
4. Open `/to/:token` directly, including after refresh, and confirm the host serves the SPA.
5. Confirm not-found and expired states still render.
6. Check the 390px mobile viewport for horizontal scrolling or visual clipping.
7. Confirm no API key, secret, mock/debug control, or deployment-stage wording is visible in the UI.

For the current mock stage, cross-device reading of a newly created gift is not expected and is not a deployment failure.

## 8. Out of Scope

This task does not:

- Deploy to Vercel, Netlify, Cloudflare Pages, or any other provider.
- Configure a domain, DNS, redirect, rewrite, or provider account.
- Modify `vite.config.ts`, `index.html`, title, favicon, or metadata.
- Add Supabase, AI APIs, server functions, API keys, `.env`, payment, or authentication.
- Change UI visuals, theme mapping, creator flow, receiver flow, success-page privacy copy, or LocalStorage mock behavior.
