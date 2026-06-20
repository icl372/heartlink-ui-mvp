# TODO.md｜HeartLink MVP 正式开发排期

## 全局规则

1. 每次开发前必须先读 `C:\Users\lenovo\Documents\New project1\docs\PRD.md`、`C:\Users\lenovo\Documents\New project1\docs\DESIGN.md`、`C:\Users\lenovo\Documents\New project1\docs\ARCHITECTURE.md`。
2. 每次只执行一个 TODO 任务。
3. 不允许并行处理多个任务。
4. 不允许重写 UI。
5. 不允许改变现有视觉风格。
6. 不允许新增 PRD 黑名单功能。
7. 不允许前端直接调用 AI API。
8. 不允许把 API Key 放进前端。
9. 每个任务完成后必须运行测试。
10. 每个任务完成后必须 git commit。
11. 如果修改破坏 UI 且无法快速修复，应停止并报告，不要继续扩大修改。
12. 任何大需求必须先更新 `PRD.md` 和 `ARCHITECTURE.md`，再进入 `TODO.md`。

每个任务完成后必须执行：

1. 运行项目。
2. 测试创建端主流程。
3. 测试接收端三状态。
4. 测试 loading / empty / error 状态。
5. 确认 UI 没有变形。
6. 确认没有违反 `PRD.md` / `DESIGN.md` / `ARCHITECTURE.md`。
7. `git add`。
8. `git commit -m "明确的提交信息"`。

## Phase 1：项目基线确认

### TODO-001：检查项目启动与构建

任务编号：TODO-001

任务名称：检查项目启动与构建。

修改目标：确认 `heartlink-ui-mvp` 可以通过 `npm run dev` 启动，并可以通过 `npm run build` 构建。

允许修改范围：仅允许修改运行环境说明或记录启动结果；如发现构建错误，先报告原因，不直接修 UI。

禁止修改范围：禁止修改 UI 代码、组件结构、技术栈、Vite 架构、业务逻辑。

验收标准：开发服务可访问；构建命令结果明确；无新增产品功能；无 UI 变化。

测试要求：运行 `npm run dev`；运行 `npm run build`；手动打开首页、创建流程、接收端三状态。

完成后是否需要 git commit：需要。如果没有代码变化但有文档记录变化，提交该文档；如果完全无文件变化，记录检查结果即可。

### TODO-002：建立开发基线说明

任务编号：TODO-002

任务名称：建立开发基线说明。

修改目标：在不改 UI 的前提下，记录当前项目启动方式、技术栈、核心源码入口和 UI Lock 边界。

允许修改范围：`README.md` 或独立基线说明文档。

禁止修改范围：禁止修改 `src/`、`vite.config.ts`、`package.json`、`docs/PRD.md`、`docs/DESIGN.md`、`docs/ARCHITECTURE.md`。

验收标准：说明当前 Vite + React + TypeScript + Tailwind 基线；说明 UI 已验收且不得重写；说明后续每次只做一个任务。

测试要求：运行 `npm run dev`；确认文档变更不会影响页面。

完成后是否需要 git commit：需要。

### TODO-003：确认当前 UI 页面清单和状态清单

任务编号：TODO-003

任务名称：确认当前 UI 页面清单和状态清单。

修改目标：对照源码记录当前创建端页面、接收端三状态、loading / empty / error 状态清单。

允许修改范围：仅允许新增或更新项目内开发记录文档。

禁止修改范围：禁止修改 `CreatorFlow.tsx`、`ReceiverFlow.tsx`、样式文件和 UI 组件。

验收标准：页面清单覆盖首页、场景选择、信息填写、AI 生成、文案结果、风格选择、预览、生成成功；状态清单覆盖 AI 生成中、AI 失败、网络错误、输入为空、复制成功/失败、接收端加载中、链接不存在、链接过期、接收完成。

测试要求：运行 `npm run dev`；逐页确认清单与真实 UI 一致。

完成后是否需要 git commit：需要。

## Phase 2：类型与 mock 数据整理

### TODO-004：创建 gift 相关类型定义

任务编号：TODO-004

任务名称：创建 gift 相关类型定义。

修改目标：新增 `src/app/types/`，集中定义 `Gift`、`Occasion`、`Tone`、`Theme`、AI 文案字段、接收端状态等类型。

允许修改范围：`src/app/types/`；必要时只做最小 import 调整。

禁止修改范围：禁止改变 UI 文案、布局、颜色、动效、组件视觉结构；禁止接入真实 API。

验收标准：类型能覆盖当前组件中已有的场景、语气、风格、文案、状态；现有 UI 行为不变。

测试要求：运行 `npm run dev`；运行 `npm run build`；测试创建端主流程、接收端三状态和异常状态。

完成后是否需要 git commit：需要。

### TODO-005：集中管理选项和 mock gift 数据

任务编号：TODO-005

任务名称：集中管理选项和 mock gift 数据。

修改目标：新增 `src/app/data/`，集中管理场景、语气、主题、默认 AI 文案、mock gift、完成态文案。

允许修改范围：`src/app/data/`；`CreatorFlow.tsx` 和 `ReceiverFlow.tsx` 中与常量引用相关的最小改动。

禁止修改范围：禁止调整 UI 视觉；禁止新增模板；禁止新增黑名单功能；禁止删除异常状态。

验收标准：页面显示内容与整理前一致；场景仍为感谢、祝福、道歉、鼓励、小心意；风格仍为温柔信纸、复古收据、诗意卡片、简约便签。

测试要求：运行 `npm run dev`；运行 `npm run build`；检查创建端和接收端所有可见文案与视觉未变形。

完成后是否需要 git commit：需要。

### TODO-006：逐步替换组件内散落 mock 数据

任务编号：TODO-006

任务名称：逐步替换组件内散落 mock 数据。

修改目标：让 `CreatorFlow.tsx` 和 `ReceiverFlow.tsx` 使用集中数据源，减少组件内硬编码 mock 数据。

允许修改范围：`src/app/components/CreatorFlow.tsx`、`src/app/components/ReceiverFlow.tsx`、`src/app/data/`、`src/app/types/`。

禁止修改范围：禁止重构整套组件；禁止改变当前页面结构；禁止改变成功页范围；禁止新增真实存储。

验收标准：UI 视觉与交互结果保持一致；mock 数据来源清晰；异常状态仍保留。

测试要求：运行 `npm run dev`；运行 `npm run build`；测试主流程、AI 失败/网络错误、复制成功/失败、链接不存在/过期。

完成后是否需要 git commit：需要。

## Phase 3：mock service 抽离

### TODO-007：创建 giftService mock 边界

任务编号：TODO-007

任务名称：创建 `giftService.ts` mock 边界。

修改目标：新增 `src/app/services/giftService.ts`，定义 `generateCopy`、`createGift`、`getGiftByToken`、`acceptGift` 的 mock 函数签名。

允许修改范围：`src/app/services/`、`src/app/types/`。

禁止修改范围：禁止让 UI 调用真实 AI、Supabase 或外部网络；禁止改变当前组件视觉。

验收标准：service 文件只提供 mock 实现；接口命名与 `ARCHITECTURE.md` 一致；不影响当前页面。

测试要求：运行 `npm run build`；确认没有前端 API Key 或真实请求。

完成后是否需要 git commit：需要。

### TODO-008：接入 mock generateCopy

任务编号：TODO-008

任务名称：接入 mock `generateCopy`。

修改目标：将 AI 文案生成逻辑从组件内定时器逐步改为调用 mock `generateCopy`，保留当前 loading、成功、失败、网络错误状态 UI。

允许修改范围：`CreatorFlow.tsx`、`src/app/services/giftService.ts`、相关类型文件。

禁止修改范围：禁止接真实 AI；禁止改变 AI 结果页视觉；禁止删除失败状态或手动编辑能力。

验收标准：点击生成后仍进入 loading；成功后展示可编辑文案；mock 可触发 AI 失败和网络错误；输入为空仍不能生成。

测试要求：运行 `npm run dev`；运行 `npm run build`；测试成功、AI 失败、网络错误、输入为空。

完成后是否需要 git commit：需要。

### TODO-009：接入 mock createGift

任务编号：TODO-009

任务名称：接入 mock `createGift`。

修改目标：生成链接时调用 mock `createGift`，统一返回 token、giftUrl 和展示所需数据。

允许修改范围：`CreatorFlow.tsx`、`src/app/services/giftService.ts`、`src/app/types/`。

禁止修改范围：禁止接 Supabase；禁止新增链接管理页；禁止新增二维码、统计、社交分享系统。

验收标准：成功页仍只展示专属链接、复制链接、打开预览、再创建一份、隐私提示；用户可见文案不出现 MVP / Mock / Demo。

测试要求：运行 `npm run dev`；运行 `npm run build`；测试生成成功页和复制成功/失败。

完成后是否需要 git commit：需要。

### TODO-010：接入 mock getGiftByToken 与 acceptGift

任务编号：TODO-010

任务名称：接入 mock `getGiftByToken` 与 `acceptGift`。

修改目标：接收端读取 mock gift 数据，并在点击接收时调用 mock `acceptGift`。

允许修改范围：`ReceiverFlow.tsx`、`src/app/services/giftService.ts`、`src/app/types/`、`src/app/data/`。

禁止修改范围：禁止新增真实 token 查询；禁止新增接收状态管理页；禁止显示原型导航或开发词。

验收标准：接收端仍保持封面态、正文态、接收完成态；loading、链接不存在、链接过期状态仍可由 mock service 触发。

测试要求：运行 `npm run dev`；运行 `npm run build`；测试接收端 loading、封面、正文、完成、not-found、expired。

完成后是否需要 git commit：需要。

## Phase 4：前端状态流稳定

### TODO-011：整理 CreatorFlow 状态

任务编号：TODO-011

任务名称：整理 `CreatorFlow` 状态。

修改目标：梳理创建端 step、form、AI、copy、生成结果等状态，让状态变化更清晰。

允许修改范围：`CreatorFlow.tsx`；必要时可新增局部 helper 或类型。

禁止修改范围：禁止改变页面视觉；禁止把流程改成新路由；禁止新增复杂编辑器。

验收标准：创建流程仍为首页 → 场景选择 → 填写信息 → AI 生成文案 → 选择风格 → 预览 → 生成链接；所有按钮、字段和状态保持可用。

测试要求：运行 `npm run dev`；运行 `npm run build`；测试完整创建流程、输入为空、AI 失败、网络错误、复制失败。

完成后是否需要 git commit：需要。

### TODO-012：整理 ReceiverFlow 状态

任务编号：TODO-012

任务名称：整理 `ReceiverFlow` 状态。

修改目标：梳理接收端 loading、cover、letter、received、not-found、expired 状态，确保异常状态由数据/service 结果触发。

允许修改范围：`ReceiverFlow.tsx`；必要时可新增局部 helper 或类型。

禁止修改范围：禁止显示“创建端 / 接收端”切换；禁止显示 `[原型]`、`模拟生成失败`、`MVP`、Demo、Mock、调试等用户可见词。

验收标准：接收端三状态沉浸体验不变；异常状态组件保留；无原型演示入口。

测试要求：运行 `npm run dev`；运行 `npm run build`；测试 loading、cover、letter、received、not-found、expired。

完成后是否需要 git commit：需要。

### TODO-013：统一异常状态触发边界

任务编号：TODO-013

任务名称：统一异常状态触发边界。

修改目标：确认 AI 失败、网络错误、复制失败、链接不存在、链接过期均可由 mock service 或真实浏览器 API 失败触发。

允许修改范围：`CreatorFlow.tsx`、`ReceiverFlow.tsx`、`src/app/services/`。

禁止修改范围：禁止新增用户可见手动演示按钮；禁止删除状态 UI；禁止接真实后端。

验收标准：异常状态可测试；正式 UI 不出现开发阶段词；状态 UI 复用当前视觉。

测试要求：运行 `npm run dev`；运行 `npm run build`；逐项测试 loading / empty / error / success 状态。

完成后是否需要 git commit：需要。

## Phase 5：真实链接策略准备

### TODO-014：增加 token 工具函数

任务编号：TODO-014

任务名称：增加 token 工具函数。

修改目标：新增 `src/app/lib/`，提供随机 token 生成、token 校验、URL 安全处理等前端工具。

允许修改范围：`src/app/lib/`、相关类型文件。

禁止修改范围：禁止接数据库；禁止使用自增 ID；禁止把姓名或敏感内容放进 token。

验收标准：token 长度和格式符合 `ARCHITECTURE.md`；不影响当前 UI。

测试要求：运行 `npm run build`；如有测试工具则补充单元测试，否则通过临时开发验证后移除临时代码。

完成后是否需要 git commit：需要。

### TODO-015：统一 giftUrl 生成逻辑

任务编号：TODO-015

任务名称：统一 `giftUrl` 生成逻辑。

修改目标：将成功页链接生成逻辑集中到工具函数或 service 中，为后续 `/g/{token}` 做准备。

允许修改范围：`CreatorFlow.tsx`、`src/app/lib/`、`src/app/services/`。

禁止修改范围：禁止重写 `App.tsx`；禁止立即迁移 React Router 或 Next.js；禁止新增管理页。

验收标准：成功页链接展示一致；隐私提示保持 `拥有链接的人都可以查看，请只分享给你想分享的人。`。

测试要求：运行 `npm run dev`；运行 `npm run build`；测试生成成功页、复制链接、打开预览。

完成后是否需要 git commit：需要。

### TODO-016：初步支持 mock token 读取

任务编号：TODO-016

任务名称：初步支持 mock token 读取。

修改目标：在保持 SPA 状态流前提下，让接收端可以根据 mock token 或 query/hash 读取 mock gift。

允许修改范围：`App.tsx`、`ReceiverFlow.tsx`、`src/app/services/`、`src/app/lib/`。

禁止修改范围：禁止一次性重写路由；禁止迁移 Next.js；禁止接 Supabase。

验收标准：当前创建端与接收端仍可运行；mock token 可驱动 loading / success / not-found / expired 状态。

测试要求：运行 `npm run dev`；运行 `npm run build`；测试正常 token、不存在 token、过期 token。

完成后是否需要 git commit：需要。

### TODO-017：规划 `/g/{token}` 或 hash/query 方案

任务编号：TODO-017

任务名称：规划 `/g/{token}` 或 hash/query 方案。

修改目标：基于现有 SPA 结构记录下一步真实链接路由方案，不立即大改。

允许修改范围：开发说明文档或架构补充记录。

禁止修改范围：禁止在本任务中重写 `App.tsx`；禁止迁移 Next.js；禁止改 UI。

验收标准：说明选择方案、迁移步骤、回滚方式和对 UI 的保护要求。

测试要求：文档任务不要求运行新功能；仍需运行 `npm run dev` 确认当前 UI 不受影响。

完成后是否需要 git commit：需要。

## Phase 6：AI 接入准备

### TODO-018：定义 generateCopy 输入输出类型

任务编号：TODO-018

任务名称：定义 `generateCopy` 输入输出类型。

修改目标：明确 AI 文案生成输入和输出字段，为后续服务端函数替换 mock service 做准备。

允许修改范围：`src/app/types/`、`src/app/services/giftService.ts`。

禁止修改范围：禁止接真实 DeepSeek / OpenAI / Gemini；禁止新增 API Key；禁止改变 AI 结果页 UI。

验收标准：输入包含 recipientName、senderName、occasion、tone、amountText、originalMessage；输出包含 coverText、title、body、quote、buttonText、acceptedText。

测试要求：运行 `npm run build`；测试 AI mock 成功和失败状态。

完成后是否需要 git commit：需要。

### TODO-019：统一 AI 错误类型

任务编号：TODO-019

任务名称：统一 AI 错误类型。

修改目标：定义 AI 失败、网络错误、内容为空或服务不可用等错误类型，并映射到当前已有状态 UI。

允许修改范围：`src/app/types/`、`src/app/services/`、`CreatorFlow.tsx`。

禁止修改范围：禁止新增新的大面积错误页；禁止删除现有失败 UI；禁止暴露技术错误给普通用户。

验收标准：不同 mock 错误可以映射到 AI 失败或网络错误；用户仍可重新生成或手动编辑继续。

测试要求：运行 `npm run dev`；运行 `npm run build`；测试 AI 失败、网络错误、输入为空。

完成后是否需要 git commit：需要。

### TODO-020：标明后续服务端函数接入点

任务编号：TODO-020

任务名称：标明后续服务端函数接入点。

修改目标：在 mock service 或开发文档中标明后续 `前端 → 服务端函数 → AI API` 的替换位置。

允许修改范围：`src/app/services/giftService.ts` 的简短注释；必要的开发说明文档。

禁止修改范围：禁止真实发起外部请求；禁止创建真实环境变量；禁止把 API Key 放入前端。

验收标准：代码中没有真实 AI provider Key；接入点说明清楚且不影响 UI。

测试要求：运行 `npm run build`；检查前端包配置无密钥。

完成后是否需要 git commit：需要。

## Phase 7：Supabase 接入准备

### TODO-021：定义 GiftRecord 类型

任务编号：TODO-021

任务名称：定义 `GiftRecord` 类型。

修改目标：为后续 Supabase `gifts` 表准备前端数据记录类型。

允许修改范围：`src/app/types/`。

禁止修改范围：禁止创建数据库；禁止安装 Supabase；禁止真实保存数据。

验收标准：字段与 `ARCHITECTURE.md` 的 gifts 表初稿保持一致；不影响现有 mock 流程。

测试要求：运行 `npm run build`。

完成后是否需要 git commit：需要。

### TODO-022：准备 Supabase 字段映射说明

任务编号：TODO-022

任务名称：准备 Supabase 字段映射说明。

修改目标：记录 UI / service 数据字段与未来 Supabase 字段的映射关系。

允许修改范围：开发说明文档或架构补充记录。

禁止修改范围：禁止修改 `docs/ARCHITECTURE.md`，除非任务开始前明确批准；禁止接 Supabase。

验收标准：说明 token、recipient、sender、occasion、tone、title、body、quote、buttonText、acceptedText、theme、created_at、accepted_at 等字段映射。

测试要求：文档任务不要求功能测试；仍需运行 `npm run build` 确认项目无意外变化。

完成后是否需要 git commit：需要。

### TODO-023：确认 LocalStorage 边界

任务编号：TODO-023

任务名称：确认 LocalStorage 边界。

修改目标：如果需要临时草稿或 mock token，可明确 LocalStorage 仅用于 mock 或临时草稿，不作为正式链接数据源。

允许修改范围：`src/app/services/`、`src/app/lib/`、开发说明文档。

禁止修改范围：禁止让接收端正式依赖创建者本地 LocalStorage；禁止把 LocalStorage 当作生产数据库。

验收标准：mock service 仍可运行；正式数据源边界清楚；不影响分享链接策略。

测试要求：运行 `npm run dev`；运行 `npm run build`；测试刷新页面后主流程可接受。

完成后是否需要 git commit：需要。

## Phase 8：测试与发布准备

### TODO-024：运行生产构建并修复构建错误

任务编号：TODO-024

任务名称：运行生产构建并修复构建错误。

修改目标：确保 `npm run build` 通过。

允许修改范围：仅限修复构建错误所需的最小代码或配置改动。

禁止修改范围：禁止借构建修复重构 UI；禁止迁移技术栈；禁止新增功能。

验收标准：`npm run build` 成功；开发服务器仍可运行；UI 无变形。

测试要求：运行 `npm run build`；运行 `npm run dev`；测试主流程和异常状态。

完成后是否需要 git commit：需要。

### TODO-025：测试移动端主要页面

任务编号：TODO-025

任务名称：测试移动端主要页面。

修改目标：检查 390px 左右移动端视口下创建端和接收端页面是否溢出、遮挡或变形。

允许修改范围：仅允许修复明显移动端溢出和文字遮挡问题。

禁止修改范围：禁止重做视觉；禁止改变主色、按钮、卡片、页面结构。

验收标准：首页、场景选择、信息填写、AI 结果、风格选择、预览、成功页、接收端三状态均无明显溢出。

测试要求：运行 `npm run dev`；用浏览器移动端视口检查；必要时截图记录。

完成后是否需要 git commit：需要。

### TODO-026：生成 README 使用说明

任务编号：TODO-026

任务名称：生成 README 使用说明。

修改目标：更新 `README.md`，说明项目定位、启动命令、构建命令、UI Lock、当前 mock 范围和禁止事项。

允许修改范围：`README.md`。

禁止修改范围：禁止修改 UI 代码；禁止承诺未实现能力；禁止写成已接 AI / Supabase。

验收标准：README 清楚说明当前为 MVP 前端 UI 基础；说明 `npm install`、`npm run dev`、`npm run build`。

测试要求：运行 `npm run build`；确认 README 不影响项目。

完成后是否需要 git commit：需要。

### TODO-027：记录部署步骤

任务编号：TODO-027

任务名称：记录部署步骤。

修改目标：记录 Vite 前端部署到 Vercel / Netlify / Cloudflare Pages 的基本步骤和环境变量边界。

允许修改范围：部署说明文档或 README。

禁止修改范围：禁止接真实服务端；禁止创建真实密钥；禁止修改生产配置造成不可运行。

验收标准：部署说明包含构建命令、输出目录、前端可见环境变量风险、服务端密钥不得使用 `VITE_` 前缀。

测试要求：运行 `npm run build`；确认本地构建产物生成。

完成后是否需要 git commit：需要。

### TODO-028：更新最终实际结构记录

任务编号：TODO-028

任务名称：更新最终实际结构记录。

修改目标：在所有准备任务完成后，更新架构记录中的最终实际目录结构。

允许修改范围：`docs/ARCHITECTURE.md` 或经批准的架构补充文档。

禁止修改范围：禁止为了文档改项目结构；禁止与真实代码不一致。

验收标准：文档结构与实际文件一致；说明哪些是 mock、哪些是后续真实接入点。

测试要求：运行 `npm run build`；抽查核心文件路径。

完成后是否需要 git commit：需要。

## Phase 9：真实 AI 接入准备与 DeepSeek 接入

本阶段只处理 AI 服务接入边界。任何任务开始前必须先阅读 `docs/PRD.md`、`docs/DESIGN.md`、`docs/ARCHITECTURE.md`、`docs/AI_SERVICE_INTEGRATION.md`、`docs/LOCAL_STORAGE_BOUNDARY.md` 和本文件。

全局安全规则：

1. 浏览器前端不得直接请求 DeepSeek 或任何 AI provider。
2. 不得在前端包、Git、`.env.example`、文档截图或 ChatGPT / Codex 对话中粘贴真实 API Key。
3. 服务端密钥不得使用 `VITE_` 前缀；`VITE_` 变量会暴露在浏览器包中。
4. DeepSeek API 文档、模型名、请求参数和限额规则必须在真实接入前以 DeepSeek 官方最新文档为准。
5. 本阶段不接 Supabase、不接支付、不改 UI、不处理主题 / 风格映射问题、不真实部署。
6. 既有 AI loading、success、failed、network-error、空输入状态必须保留并继续复用。
7. 每次只执行一个 TODO；完成后运行构建、相关回归测试并提交明确的 Git commit。

### TODO-029：补充 DeepSeek 接入方案

任务编号：TODO-029

任务名称：补充 DeepSeek 接入方案。

修改目标：记录 `前端 -> 自有服务端函数 -> DeepSeek` 的调用路径、服务端函数职责、环境变量安全边界、错误映射、超时与 mock fallback 策略。

允许修改范围：`docs/AI_SERVICE_INTEGRATION.md`，或新增一份 DeepSeek 接入方案文档。

禁止修改范围：禁止修改 UI；禁止新增 API Key、`.env`、真实网络请求、Supabase、支付、部署配置；禁止直接接入 DeepSeek。

验收标准：文档明确前端只调用自有服务端函数；明确真实密钥只存在于服务端 secret manager；明确 DeepSeek 官方文档需在 TODO-031 前再次核对；明确错误映射到现有 AI failed / network-error UI；明确 mock fallback 策略。

测试要求：运行 `npm run build`；确认只修改 AI 接入方案文档。

完成后是否需要 git commit：需要。

### TODO-030：新增 AI 服务端函数骨架

任务编号：TODO-030

任务名称：新增 AI 服务端函数骨架。

修改目标：准备一个不含真实 provider 调用的服务端函数骨架，定义前端请求、自有函数响应、输入校验和错误归一化边界。

允许修改范围：经确认的服务端函数目录、共享 AI 类型、服务端函数说明文档，以及实现骨架所需的最小配置文件。

禁止修改范围：禁止真实调用 DeepSeek；禁止新增真实 API Key 或 `.env`；禁止在浏览器端新增 provider 请求；禁止修改 `CreatorFlow.tsx` UI 结构、`ReceiverFlow.tsx`、Supabase、支付、主题 / 风格映射或部署配置。

验收标准：服务端函数骨架可接收与 `GenerateCopyInput` 对应的请求；返回结构可映射到 `GenerateCopyResult` 或统一错误；源码中没有真实 DeepSeek URL、真实 key 或 provider 调用；现有 mock 流程仍可运行。

测试要求：运行 `npm run build`；检查服务端函数骨架不影响前端构建；回归 AI mock 生成、AI 失败和网络错误状态。

完成后是否需要 git commit：需要。

### TODO-031：接入 DeepSeek API

任务编号：TODO-031

任务名称：接入 DeepSeek API。

修改目标：仅在自有服务端函数内部调用 DeepSeek，并将 provider 响应归一化为既有 AI 合同。

允许修改范围：服务端函数实现、服务端依赖、服务端环境变量示例文件（仅变量名，不含真实值）、AI 接入文档和必要的共享类型。

禁止修改范围：禁止在前端、`src/app/`、浏览器 bundle、Git 历史、`.env.local`、文档或对话中写入真实 API Key；禁止前端直连 DeepSeek；禁止接入 Supabase、支付、UI 改版、主题 / 风格映射或真实部署。

验收标准：真实 provider 请求只存在于服务端函数；密钥只从服务端环境变量读取；可新增 `.env.example` 但不得含真实值；DeepSeek 官方最新文档、模型参数和错误格式已在实现前核对；provider 错误可映射到现有统一 AI 错误类型。

测试要求：运行 `npm run build`；在不提供真实密钥时确认前端 mock 路径仍可运行；仅在用户自行配置服务端 secret 后进行受控服务端联调，不在此仓库提交真实密钥。

完成后是否需要 git commit：需要。

### TODO-032：替换 generateCopy 的真实调用路径

任务编号：TODO-032

任务名称：替换 `generateCopy` 的真实调用路径。

修改目标：让 `giftService.generateCopy()` 通过自有服务端函数请求真实 AI，同时保留明确的 mock fallback 或开发开关。

允许修改范围：`src/app/services/giftService.ts`、服务调用 helper、共享类型、AI 接入文档，以及保持现有状态映射所需的最小调整。

禁止修改范围：禁止让 `CreatorFlow.tsx` 直接调用 DeepSeek；禁止删除 AI loading、success、failed、network-error、空输入状态；禁止改 UI 视觉、成功页隐私提示、ReceiverFlow、Supabase、支付、主题 / 风格映射或部署配置。

验收标准：前端只调用自有服务端函数；mock fallback 的启用条件清晰且不依赖真实密钥；正常结果映射到现有可编辑文案字段；失败、网络错误和空内容继续映射到现有 UI 状态；UI 流程与视觉不变。

测试要求：运行 `npm run build`；测试 mock 正常生成、空输入、AI 失败、网络错误、空内容；在已安全配置的服务端环境中再单独测试真实 AI 路径。

完成后是否需要 git commit：需要。

### TODO-033：AI 接入回归测试

任务编号：TODO-033

任务名称：AI 接入回归测试。

修改目标：验证真实 AI 路径和 mock fallback 不破坏创建端、链接生成和接收端既有流程。

允许修改范围：测试清单、AI 接入文档、必要的测试辅助文件；仅允许修复已确认的最小构建或状态映射 bug。

禁止修改范围：禁止 UI 重写；禁止删除现有异常状态；禁止新增或提交真实 key、`.env.local`、Supabase、支付、部署配置；禁止处理主题 / 风格映射问题。

验收标准：覆盖正常生成、DeepSeek 服务失败、网络错误、内容为空、输入为空、mock fallback、`npm run build`；确认生成链接、复制链接、接收端 loading / cover / letter / received、not-found 和 expired 回归正常；确认 UI 无明显变化。

测试要求：运行 `npm run build`；运行开发服务；执行创建端与接收端主流程和异常状态人工验收；确认任何真实服务端密钥均未出现在 Git 状态、构建产物或前端请求中。

完成后是否需要 git commit：需要。
