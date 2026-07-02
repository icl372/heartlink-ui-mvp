# xygift / 心意链接

心意链接的新定位是：**帮用户把已有的心意包装好，做成一个能送出去的东西。**

当前项目来自 Figma Make 导出的高保真 UI，并已完成正式化小改与多轮 MVP 能力接入。它是当前产品的已验收 UI 基础，不是待重做的原型。后续开发必须在现有 UI 上小步接入能力，不能重写视觉或流程。

## 项目状态

- 技术栈：Vite、React、TypeScript、Tailwind CSS、Radix/shadcn 风格基础组件。
- 当前主链路：用户交出心意 -> 系统理解心意 -> 模型加工心意 -> 包装成可发送成品 -> 生成链接发送。
- 当前创建端：围绕“准备这份心意”收集收信人、关系、送出原因、具体小事、表达重点、补充话和想要的感觉。
- 当前结果页：不再强调“AI 文案”，而是呈现“心意已包装好”的成品状态，支持预览、复制心意链接和重新包装。
- 当前接收端：保留信封 / 信纸式体验，包含封面、正文、已接收、not-found、expired 等状态。
- 当前数据：已具备 Supabase create/read/status 写回链路，同时保留 mock / localStorage 作为本地开发和同浏览器预览兜底。

当前仍是 MVP：不包含登录、支付、模板市场、社交广场、复杂编辑器、多种包装样式或用户上传素材。

## 本地运行

在项目根目录执行：

```bash
npm install
npm run dev
```

Vite 会输出本地访问地址，通常为 `http://localhost:5173/`。如果端口被占用，请使用终端实际输出的地址。

## 生产构建

```bash
npm run build
```

构建产物输出到 `dist/`。该目录为本地构建产物，不应提交到 Git。

## 当前流程

创建端：

```text
首页 -> 场景选择 -> 准备这份心意 -> 包装心意 -> 选择风格 -> 预览这份心意 -> 生成心意链接
```

接收端：

```text
打开链接 -> 封面态 -> 正文态 -> 接收完成态
```

异常状态：

```text
生成失败 / 网络错误 / 限流 / 链接不存在 / 链接过期 / 复制失败
```

## 心意理解数据

创建端会先整理出结构化的 `HeartIntent`，作为模型理解心意的输入：

- `recipientName`：这份心意送给谁。
- `recipientRole`：TA 是用户的谁。
- `occasion`：为什么想送。
- `story`：有什么事，想放进这份心意里。
- `intentTag`：最想表达的重点。
- `coreMessage`：最想让对方知道的一句话。
- `tone`：想要的感觉。
- `senderName`：署名。
- `originalInput`：用户原始输入。
- `noInventFacts`：不能被模型乱编的事实边界。

核心原则：用户已经有心意，系统只负责理解、整理和包装，不负责凭空创造事实。

## Mock 与验收

用于验收的 mock 触发值：

- `__mock_ai_error__`：生成失败。
- `__mock_network_error__`：网络错误。
- `__mock_empty_content__`：返回空内容。
- `__mock_ai_unavailable__`：服务不可用。

接收端验收示例：

```text
/to/mock-heartlink-a9f2
/to/mock-heartlink-expired
/to/any-unknown-token
```

其中不存在的 token 显示 not-found 状态；`mock-heartlink-expired` 显示 expired 状态。

## UI Lock

当前 UI 是视觉基准。开发前请先阅读：

- [PRD.md](docs/PRD.md)
- [DESIGN.md](docs/DESIGN.md)
- [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [DEVELOPMENT_BASELINE.md](docs/DEVELOPMENT_BASELINE.md)
- [UI_INVENTORY.md](docs/UI_INVENTORY.md)

必须保持：

- 奶油背景、白色圆角卡片、香槟金细节、深咖色主按钮和信纸感排版。
- 创建端清晰的步骤流，但表达应像“准备心意”，不是普通填表工具。
- 接收端沉浸式封面、正文、完成三状态。
- 成功页的心意链接、复制链接、预览这份心意、再做一份及隐私提示。
- 既有 loading、error、empty 与接收端异常状态组件。

不得重做首页、创建流程或接收端，不得改成 SaaS 风格、普通表单工具或复杂 H5 编辑器。

## 当前禁止项

当前阶段不做：

- 前端直连 AI provider 或在前端放置 API Key。
- 登录、支付、小程序、App、模板市场、多人协作或社交广场。
- 图片、视频、音乐上传，接收者回复留言，接收状态管理页，生成图片或保存截图作为核心能力。
- Next.js 迁移、复杂路由重构或技术栈更换。

后续真实 AI、Supabase、服务端函数或正式链接能力必须替换 `src/app/services/` 或 `api/` 内部实现，并继续复用现有 UI 和状态组件。

## 相关文档

- [QA_HEARTLINK_NEW_FLOW.md](docs/QA_HEARTLINK_NEW_FLOW.md)
- [AI_SERVICE_INTEGRATION.md](docs/AI_SERVICE_INTEGRATION.md)
- [SUPABASE_FIELD_MAPPING.md](docs/SUPABASE_FIELD_MAPPING.md)
- [LOCAL_STORAGE_BOUNDARY.md](docs/LOCAL_STORAGE_BOUNDARY.md)
- [LINK_ROUTING_PLAN.md](docs/LINK_ROUTING_PLAN.md)
