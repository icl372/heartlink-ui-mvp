# ARCHITECTURE.md｜心意链接 / HeartLink MVP 技术架构

## 1. 项目定位

当前项目 `heartlink-ui-mvp` 是 HeartLink / 心意链接的 MVP 前端基础。

它来自 Figma Make 生成的高保真 UI 原型，并已经经过人工正式化小改和验收。当前阶段的目标不是重写 UI，而是在现有 UI 上逐步接入真实业务能力。

当前 UI 代码是正式 MVP UI 基础，不允许重写、不允许大幅改版、不允许为了接后端或 AI 破坏现有视觉。UI 保护边界以 `docs/DESIGN.md` 为准。

## 2. 项目根目录

正式 MVP 项目根目录：

`C:\Users\lenovo\Documents\New project1\heartlink-ui-mvp`

后续 Codex / AI 开发必须以这个目录为准。

原始 Figma Make 目录仅作为备份，不允许修改：

`C:\Users\lenovo\Documents\New project1\高保真交互原型设计`

## 3. 当前技术栈

根据 `heartlink-ui-mvp/package.json` 与当前代码，现有技术栈为：

1. Vite `6.3.5`。
2. React `18.3.1`，当前通过 peer dependency 声明。
3. TypeScript / TSX，当前源码使用 `.tsx` 组件文件；项目根目录未发现 `tsconfig.json`。
4. Tailwind CSS `4.1.12` 与 `@tailwindcss/vite` `4.1.12`。
5. `@vitejs/plugin-react` `4.7.0`。
6. shadcn / Radix 风格基础组件，包含多组 `@radix-ui/*` 依赖与 `src/app/components/ui/` 组件文件。
7. `lucide-react` `0.487.0` 图标。
8. `motion` `12.23.24` 动效。
9. Figma Make 导出的 UI 原型基础，保留 `figmaAssetResolver` 与 Make 所需 React / Tailwind 插件配置。

当前阶段保留 Vite + React + TypeScript + Tailwind 架构。第一阶段不迁移 Next.js。

## 4. 当前目录结构

当前真实目录结构与职责：

1. `package.json`
   项目脚本、依赖、开发依赖与 peer dependency 声明。当前脚本为 `dev: vite`、`build: vite build`。
2. `vite.config.ts`
   Vite 配置，包含 Figma asset resolver、React 插件、Tailwind 插件、`@` 指向 `src` 的 alias。
3. `index.html`
   Vite SPA HTML 入口。
4. `src/main.tsx`
   React 应用挂载入口，引入 `App.tsx` 与 `src/styles/index.css`。
5. `src/app/App.tsx`
   当前单页应用模式切换入口，在创建端 `CreatorFlow` 与接收端 `ReceiverFlow` 之间切换。
6. `src/app/components/CreatorFlow.tsx`
   创建端完整 UI 状态流，包括首页、场景选择、信息填写、AI 生成、文案编辑、风格选择、预览、生成成功。
7. `src/app/components/ReceiverFlow.tsx`
   接收端 UI 状态流，包括 loading、封面、正文、接收完成、链接不存在、链接过期。
8. `src/app/components/ui/`
   shadcn / Radix 风格基础组件，如 button、input、textarea、card、dialog、tooltip、select、tabs、skeleton 等。当前主流程主要以内联样式实现，但这些组件构成后续 UI 能力基础。
9. `src/app/components/figma/`
   Figma Make 附带的图像 fallback 组件。
10. `src/styles/`
   全局样式入口、字体、Tailwind 与主题 token。核心文件包括 `index.css`、`fonts.css`、`tailwind.css`、`theme.css`、`globals.css`。
11. `src/imports/`
   Figma Make 导入的静态图片资源。
12. `guidelines/`
   Figma Make 生成的 Guidelines 文件，目前主要是模板内容。
13. `docs/`
   产品、设计与架构文档目录，位于工作区根目录 `C:\Users\lenovo\Documents\New project1\docs`。

## 5. 当前 UI 状态

当前 UI 已经实现的是前端原型状态流，不是真实业务系统。

当前已具备：

1. 创建端流程 UI。
2. 接收端三状态 UI：封面、正文、接收完成。
3. AI 生成 loading / failed / network-error 等状态 UI。
4. 输入为空时按钮禁用状态。
5. 复制成功 / 失败提示 UI。
6. 接收端加载中 skeleton UI。
7. 链接不存在 / 链接过期 UI。
8. mock 文案、mock 接收日期、mock 场景、mock 风格、mock 链接。

当前未具备：

1. 真实 AI 文案生成。
2. 真实数据库保存。
3. 真实 token 链接。
4. 真实 `/g/{token}` 路由。
5. 真实打开次数记录。
6. 真实接收状态记录。
7. 真实部署配置。
8. 后端安全层。
9. 服务端函数。
10. 真实环境变量配置。

## 6. 架构原则

后续开发必须遵守：

1. 保留现有 UI，不允许重写。
2. 先文档，后 TODO，再开发。
3. 每次只做一个小任务。
4. 新功能必须先写入 `PRD.md` / `ARCHITECTURE.md`，再进入 `TODO.md`。
5. 不允许一次性大改架构。
6. 不允许为了接后端而破坏现有 UI。
7. 不允许前端直接调用 DeepSeek / OpenAI / Gemini 等 AI API 并暴露 API Key。
8. 不允许新增登录、支付、模板市场、多人协作、社交广场。
9. 不允许修改原始 Figma Make 目录。
10. 不允许删除 mock 数据、loading / error / empty 状态组件，除非已有真实实现替代且文档已更新。

## 7. 推荐演进路线

以下是后续开发阶段规划，本轮不执行。

### Phase 0：当前状态

1. Vite + React UI 原型。
2. mock 数据。
3. 本地状态流。
4. 无真实后端。
5. 无真实 AI。
6. UI 已人工验收，并由 `docs/DESIGN.md` 锁定。

### Phase 1：UI 代码整理与状态稳定

目标：

1. 保留现有视觉。
2. 整理必要的组件边界。
3. 保留 mock 流程。
4. 确保创建端和接收端主流程稳定。
5. 补齐真实状态入口，但不接后端。

限制：

1. 不重写 UI。
2. 不迁移路由。
3. 不接真实 AI / Supabase。

### Phase 2：前端数据结构与 mock service

目标：

1. 抽离 gift 数据类型。
2. 抽离 mock gift service。
3. 将 UI 中散落的 mock 数据集中管理。
4. 为后续 Supabase / AI 接入做准备。

### Phase 3：AI 文案生成服务接入

目标：

1. 接入服务端函数调用 AI。
2. 前端只调用自家 API / Function。
3. 不暴露 AI API Key。
4. 保留 AI 失败兜底 UI。

可选服务端方案：

1. Supabase Edge Function。
2. Vercel Serverless Function。
3. 独立轻量 Node 服务。

### Phase 4：Supabase 数据库接入

目标：

1. 保存 gift 数据。
2. 生成 token。
3. 根据 token 查询 gift。
4. 记录打开 / 接收状态。

### Phase 5：部署与 README

目标：

1. 部署 Vite 前端。
2. 部署服务端函数。
3. 配置环境变量。
4. 更新 README。
5. 更新 `ARCHITECTURE.md` 中的最终目录结构。

## 8. AI 调用机制

前端禁止直接调用 DeepSeek / OpenAI / Gemini 等模型 API。

原因：

1. API Key 会暴露在浏览器包中。
2. 无法做频率限制。
3. 无法做滥用控制。
4. 无法统一错误处理。

推荐调用链路：

前端 → 服务端函数 → AI API

服务端函数可选：

1. Supabase Edge Function。
2. Vercel Serverless Function。
3. 独立 Node API。

MVP 推荐优先考虑 Supabase Edge Function，因为后续数据库也推荐 Supabase。

AI 生成接口规划：

`POST /generate-copy`

输入：

1. `recipientName`
2. `senderName`
3. `occasion`
4. `tone`
5. `amountText`
6. `originalMessage`

输出：

1. `coverText`
2. `title`
3. `body`
4. `quote`
5. `buttonText`
6. `acceptedText`

失败时：

1. 返回标准错误。
2. 前端复用现有 AI 失败 / 网络错误 UI。
3. 用户仍可手动编辑文案并继续生成链接。

## 9. 数据库方案

推荐数据库：Supabase Postgres。

原因：

1. 适合保存结构化 gift 数据。
2. 后续可扩展 token 查询、删除、过期、统计。
3. 可配合 Supabase Edge Function。

不要在 MVP 中使用 LocalStorage 作为正式存储，因为接收者无法通过分享链接读取创建者本地数据。

LocalStorage 只可用于临时草稿或 mock，不可作为正式链接数据源。

## 10. 数据模型初稿

后续规划 `gifts` 表字段：

1. `id`
2. `token`
3. `recipient_name`
4. `sender_name`
5. `occasion`
6. `tone`
7. `amount_text`
8. `original_message`
9. `cover_text`
10. `title`
11. `body`
12. `quote`
13. `button_text`
14. `accepted_text`
15. `theme`
16. `opened_count`
17. `accepted_count`
18. `created_at`
19. `updated_at`
20. `accepted_at`
21. `expires_at`
22. `is_deleted`

这些字段是后续实现规划，本轮不创建数据库表。

## 11. Token 规则

公开链接 token 规则：

1. 不使用自增 ID 作为公开链接。
2. 使用随机 token。
3. token 长度建议至少 10-16 位。
4. token 不包含收信人姓名、发送人姓名或敏感内容。
5. 拥有链接的人都可以查看。
6. 正式 UI 使用隐私提示：`拥有链接的人都可以查看，请只分享给你想分享的人。`

## 12. 未来 API / Service 边界

以下为后续规划，本轮不实现。

### `generateCopy(input)`

用途：调用服务端 AI 生成心意文案。

### `createGift(payload)`

用途：保存礼物数据，返回 token 和 giftUrl。

### `getGiftByToken(token)`

用途：接收端通过 token 读取礼物内容。

### `acceptGift(token)`

用途：记录接收者点击接收。

当前阶段可以先用 mock service 实现相同函数签名，后续再替换为真实 Supabase / Function。

## 13. 前端代码组织建议

以下是最小整理方向，本轮不执行、不改目录。

后续可以逐步形成：

1. `src/app/components/`
2. `src/app/components/ui/`
3. `src/app/data/`
4. `src/app/types/`
5. `src/app/services/`
6. `src/app/lib/`
7. `src/styles/`

职责建议：

1. `types/` 放 Gift、Theme、Occasion 等类型。
2. `data/` 放 mock 数据和选项。
3. `services/` 放 mock service / API service。
4. `lib/` 放工具函数，如 token、formatDate、copyToClipboard。

整理必须小步进行，不能为了拆目录重写 `CreatorFlow.tsx` / `ReceiverFlow.tsx` 的视觉。

## 14. 路由策略

当前 UI 是单页状态流，`App.tsx` 通过本地 state 在创建端和接收端之间切换。

MVP 后续需要支持真实链接：

`/g/{token}`

由于当前项目是 Vite SPA，可以选择：

### 方案 A：使用 React Router

前端支持 `/create`、`/preview`、`/success`、`/g/:token` 等路由。

### 方案 B：保持当前状态流，先用 query/hash 模拟

例如 `/#/g/{token}` 或 `?gift=token`，用于早期验证。

架构建议：

1. 第一阶段不急于改路由。
2. 等数据 service 抽离后，再小步接入路由。
3. 不允许为了路由一次性重写 `App.tsx`。

## 15. 部署策略

当前 Vite 前端可部署到：

1. Vercel。
2. Netlify。
3. Cloudflare Pages。

如果后续使用 Supabase Edge Function：

1. 前端部署可继续使用 Vercel / Netlify。
2. 后端函数部署在 Supabase。
3. 环境变量配置在对应平台。
4. AI API Key 只存在服务端环境变量中。

如果后续使用 Vercel Function：

1. 前端和 serverless function 可在 Vercel 统一部署。
2. 仍然不允许将 AI Key 暴露到前端。

## 16. 环境变量规划

后续可规划以下环境变量，本轮不创建真实 key：

1. `VITE_SUPABASE_URL`
2. `VITE_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`，仅服务端。
4. `DEEPSEEK_API_KEY`，仅服务端。
5. `AI_PROVIDER`
6. `APP_BASE_URL`

所有 `VITE_` 前缀变量会暴露给前端。任何密钥都不能使用 `VITE_` 前缀。

## 17. 安全与隐私

安全与隐私边界：

1. 不保存支付信息。
2. 不处理真实转账。
3. 金额字段仅用于文案展示。
4. 不做登录。
5. 不做公开广场。
6. token 链接默认知道链接即可访问。
7. 页面不应被搜索引擎索引，后续可加入 `noindex`。
8. 后续可支持过期 / 删除，但不进入当前 MVP。
9. 不在前端暴露 AI API Key、Supabase service role key 或其他服务端密钥。

## 18. 明确禁止事项

架构层面明确禁止：

1. 不允许重写 UI。
2. 不允许迁移 Next.js。
3. 不允许直接在前端调用 AI API。
4. 不允许新增登录。
5. 不允许新增支付。
6. 不允许接微信支付 / 支付宝 / Stripe。
7. 不允许做 App / 小程序。
8. 不允许做模板市场。
9. 不允许做多人协作。
10. 不允许做社交广场。
11. 不允许做复杂 H5 编辑器。
12. 不允许图片 / 视频 / 音乐上传。
13. 不允许引入向量数据库、PDF 解析、Web Crawler。
14. 不允许为了架构文档而改项目结构。

## 19. 开发验收标准

后续每个开发任务必须测试：

1. 创建端主流程。
2. 接收端三状态。
3. AI loading。
4. AI failure。
5. 网络错误。
6. 输入为空。
7. 复制成功 / 失败。
8. 链接不存在。
9. 链接过期。
10. 移动端展示。
11. 现有 UI 是否被破坏。
12. 是否仍遵守 `docs/DESIGN.md` 的 UI Lock。

任一任务如果会改变 UI、路由、数据模型或服务端边界，必须先更新对应文档，再进入 TODO 与实现。

## 20. TODO-028 Final Actual Structure Record

This section is the final actual structure record for the current repository state. It supersedes older directory descriptions in this document when they conflict with the files below.

Project root:

```text
heartlink-ui-mvp/
  README.md
  TODO.md
  api/                              # Vercel Functions
  package.json
  package-lock.json
  vite.config.ts
  index.html
  postcss.config.mjs
  default_shadcn_theme.css
  pnpm-workspace.yaml
  docs/
  guidelines/
  src/
```

Current documentation files:

```text
docs/
  PRD.md
  DESIGN.md
  ARCHITECTURE.md
  DEVELOPMENT_BASELINE.md
  UI_INVENTORY.md
  MOBILE_QA_TODO025.md
  LINK_ROUTING_PLAN.md
  AI_SERVICE_INTEGRATION.md
  SUPABASE_FIELD_MAPPING.md
  LOCAL_STORAGE_BOUNDARY.md
  DEPLOYMENT.md
```

Current frontend structure:

```text
src/
  main.tsx                         # React mount entry
  app/
    App.tsx                        # creator/receiver entry and token-aware mode selection
    components/
      CreatorFlow.tsx              # creator flow UI and local flow state
      ReceiverFlow.tsx             # receiver UI and receiver state flow
      figma/ImageWithFallback.tsx  # Figma Make image fallback helper
      ui/                          # generated Radix/shadcn-style reusable primitives
    data/
      occasions.ts
      tones.ts
      themes.ts
      mockCopy.ts
      mockGifts.ts
      index.ts
    lib/
      token.ts                     # token generation, validation, sanitization and encoding
      giftUrl.ts                   # local gift URL creation and path/query/hash token parsing
      index.ts
    services/
      giftService.ts               # mock generate/create/read/accept service boundary
      index.ts
    types/
      gift.ts                      # Gift, GiftRecord and create/accept contracts
      ai.ts                        # generateCopy input/output contract
      errors.ts                    # UI-facing AI/app/copy error contracts
      ui.ts                        # creator and receiver UI state unions
      index.ts
  imports/                         # Figma Make static image assets
  styles/
    index.css
    fonts.css
    globals.css
    tailwind.css
    theme.css
```

## 21. Current Runtime Boundaries

Current implemented boundaries:

1. `CreatorFlow.tsx` calls `generateCopy()` and `createGift()` through `src/app/services/`.
2. `ReceiverFlow.tsx` calls `getGiftByToken()` and `acceptGift()` through `src/app/services/`.
3. `App.tsx` renders the receiver flow when `getGiftTokenFromLocation()` finds a supported token route or query/hash token.
4. `src/app/lib/giftUrl.ts` owns the current `/to/:token` route prefix and shared-link origin selection: `VITE_PUBLIC_SITE_URL` first, then the current browser origin.
5. `src/app/lib/token.ts` owns the current 10-16 character mock token rules.
6. `src/app/data/` owns static option lists and mock content; UI components should not introduce a second source of mock data.
7. `api/create-gift.ts` is an owned Vercel Function that can write a created gift to Supabase when the non-secret `VITE_USE_SUPABASE` selector is enabled in the frontend build. It reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only on the server.
8. `api/get-gift.ts` is an owned Vercel Function that reads one gift by token from Supabase. It uses the same server-only variables and performs no receiver state write-back.

Current mock-only implementation:

1. `giftService.generateCopy()` returns local mock copy and exposes controlled mock error triggers for QA.
2. `giftService.createGift()` creates a local mock gift and a local-origin URL.
3. `giftService.getGiftByToken()` and `acceptGift()` read from the in-memory mock store, then LocalStorage mock preview storage.
4. LocalStorage key `heartlink_mock_gifts` is only for same-browser mock preview, refresh, and new-tab QA. It is not a production link database.
5. not-found and expired are retained mock branches for UI and QA coverage.
6. Explicit mock tokens and accept writes remain local-only. TODO-038 adds real-token Supabase reads; TODO-039 remains responsible for all receiver state write-back.

Future replacement points, not implemented now:

1. Replace `giftService.generateCopy()` internals with a call to an owned server function; the browser must not call AI providers directly.
2. Replace `giftService.createGift()`, `getGiftByToken()`, and `acceptGift()` internals with a server-side data source such as Supabase.
3. Keep the existing service signatures so `CreatorFlow.tsx` and `ReceiverFlow.tsx` do not require a UI rewrite.
4. A future production `/g/:token` route is planned in `LINK_ROUTING_PLAN.md`; do not migrate from `/to/:token` in this task.
5. A future static deployment must configure SPA fallback for direct receiver URLs; see `DEPLOYMENT.md`.

## 22. Repository Hygiene

1. `node_modules/`, `dist/`, `.env`, `.env.local`, `.DS_Store`, and development Vite logs are ignored and must not be committed.
2. The authoritative project documentation lives in this repository's `docs/` directory, not in the parent workspace `docs/` directory.
3. The original Figma Make directory remains outside the project and is read-only reference material.
4. The known theme/style visual mapping issue remains a separate future task and does not change this structure record.
