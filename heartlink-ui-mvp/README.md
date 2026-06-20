# HeartLink / 心意链接

HeartLink 是一个将一句心意变成可被打开的小礼物链接的 MVP 前端项目。

当前项目来自 Figma Make 导出的高保真 UI，并已完成正式化小改与人工验收。它是 MVP v0.1 的已验收 UI 基础，不是待重做的原型。后续开发必须在现有 UI 上小步接入能力，不能重写视觉或流程。

## 项目状态

- 技术栈：Vite、React、TypeScript、Tailwind CSS、Radix/shadcn 风格基础组件。
- 当前能力：创建端流程、AI 文案 mock 生成与编辑、风格选择、预览、mock 链接创建，以及接收端封面、正文、接收完成三状态。
- 当前链接：本地 mock 使用 `/to/:token`；也保留 query/hash token 读取用于开发验收。
- 当前数据：创建内容只使用内存和 LocalStorage mock preview 存储，支持同一浏览器的刷新或新标签预览。

当前不是正式生产链接服务：LocalStorage 不支持跨设备共享，也不是正式的数据持久化方案。

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
首页 -> 场景选择 -> 填写信息 -> AI 生成文案 -> 选择风格 -> 预览 -> 生成链接
```

接收端：

```text
打开链接 -> 封面态 -> 正文态 -> 接收完成态
```

接收端还保留 loading、链接不存在、链接过期状态。创建端保留输入为空、AI 生成中、AI 失败、网络错误、复制成功和复制失败状态。

## Mock 与本地验收

当前 AI 文案由本地 mock service 提供，不会请求 DeepSeek、OpenAI、Gemini 或其他真实 AI 服务。

用于验收的 mock 触发值：

- `__mock_ai_error__`：AI 生成失败。
- `__mock_network_error__`：网络错误。
- `__mock_empty_content__`：AI 返回空内容。
- `__mock_ai_unavailable__`：AI 服务不可用。

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
- 创建端清晰的步骤流。
- 接收端沉浸式封面、正文、完成三状态。
- 成功页的专属链接、复制链接、打开预览、再创建一份及隐私提示。
- 既有 loading、error、empty 与接收端异常状态组件。

不得重做首页、创建流程或接收端，不得改成 SaaS 风格、普通表单工具或复杂 H5 编辑器。

## 当前禁止项

当前阶段不做：

- 真实 AI API 调用或在前端放置 API Key。
- Supabase 项目、数据库、真实 token 查询或真实后端。
- 登录、支付、小程序、App、模板市场、多人协作或社交广场。
- 图片、视频、音乐上传，接收者回复留言，接收状态管理页，生成图片或保存截图作为核心能力。
- Next.js 迁移、复杂路由重构或正式部署配置。

后续真实 AI、Supabase、服务端函数或正式链接能力必须替换 `src/app/services/` 内部实现，并继续复用现有 UI 和状态组件。

## 已知待处理项

- 主题 / 风格选择后，预览页和接收端视觉尚未明显映射到所选主题。该问题需作为单独任务处理。
- 浏览器 title / favicon / metadata 的品牌清理不在当前任务范围内。

## 相关准备文档

- [AI_SERVICE_INTEGRATION.md](docs/AI_SERVICE_INTEGRATION.md)
- [SUPABASE_FIELD_MAPPING.md](docs/SUPABASE_FIELD_MAPPING.md)
- [LOCAL_STORAGE_BOUNDARY.md](docs/LOCAL_STORAGE_BOUNDARY.md)
- [LINK_ROUTING_PLAN.md](docs/LINK_ROUTING_PLAN.md)
- [MOBILE_QA_TODO025.md](docs/MOBILE_QA_TODO025.md)

