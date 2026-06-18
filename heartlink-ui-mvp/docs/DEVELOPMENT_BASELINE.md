# DEVELOPMENT_BASELINE.md｜HeartLink MVP 开发基线

## 1. 基线状态

当前 `heartlink-ui-mvp` 是 HeartLink / 心意链接的 MVP v0.1 已验收 UI 基础。

项目已完成：

1. UI 基线提交：`fd34149c chore: establish MVP UI baseline`。
2. docs 基线提交：`4091bf0e docs: add MVP development boundary documents`。
3. `TODO-001：检查项目启动与构建` 已通过。

当前项目已确认可以：

1. 安装依赖：`npm install`。
2. 启动开发服务器：`npm run dev`。
3. 执行生产构建：`npm run build`。

## 2. 正式项目目录

后续开发只在以下目录内进行：

`C:\Users\lenovo\Documents\New project1\heartlink-ui-mvp`

原始 Figma Make 目录只作为备份，不允许修改：

`C:\Users\lenovo\Documents\New project1\高保真交互原型设计`

## 3. 文档基线

后续开发必须先读取项目内文档：

1. `docs/PRD.md`
2. `docs/DESIGN.md`
3. `docs/ARCHITECTURE.md`
4. `TODO.md`

当前项目内 docs 已进入 Git 基线。父目录 `C:\Users\lenovo\Documents\New project1\docs` 可作为历史来源参考，但后续开发应以 `heartlink-ui-mvp/docs/` 中的文档为准。

## 4. 技术栈基线

当前阶段保留现有技术栈：

1. Vite `6.3.5`
2. React `18.3.1`
3. TypeScript / TSX
4. Tailwind CSS `4.1.12`
5. shadcn / Radix 风格基础组件
6. `lucide-react`
7. `motion`

第一阶段不迁移 Next.js，不重构技术栈，不为了后续后端或 AI 接入提前大改架构。

## 5. 核心源码入口

当前核心源码入口：

1. `src/main.tsx`：React 应用挂载入口。
2. `src/app/App.tsx`：创建端与接收端模式切换入口。
3. `src/app/components/CreatorFlow.tsx`：创建端完整 UI 状态流。
4. `src/app/components/ReceiverFlow.tsx`：接收端完整 UI 状态流。
5. `src/app/components/ui/`：shadcn / Radix 风格基础组件。
6. `src/styles/`：全局样式、字体、Tailwind 入口和主题 token。

## 6. UI Lock 边界

当前 UI 是 MVP v0.1 已验收视觉基准，不是待重做原型。

后续开发必须遵守：

1. 不允许重写 UI。
2. 不允许更换视觉风格。
3. 不允许重做首页、创建流程或接收端。
4. 不允许把页面改成 SaaS 风或普通表单工具。
5. 不允许为了接入功能破坏当前排版、配色、按钮、卡片、字体和动效节奏。
6. 必须保留接收端三状态：封面态、正文态、接收完成态。
7. 必须保留当前 loading / empty / error 状态组件，后续真实业务接入时复用。

UI 保护边界以 `docs/DESIGN.md` 为准。

## 7. 开发节奏

后续开发必须按 `TODO.md` 顺序小步执行：

1. 每次只执行一个 TODO 任务。
2. 不允许并行处理多个任务。
3. 不允许跳过当前任务执行后续任务。
4. 每个任务开始前必须读取 `PRD.md`、`DESIGN.md`、`ARCHITECTURE.md` 和 `TODO.md`。
5. 每个任务完成后必须运行测试并提交 Git commit。

当前只完成到 `TODO-002`，不得在本任务中执行 `TODO-003` 或后续任务。

## 8. 禁止事项

当前 MVP 阶段禁止：

1. 新增登录。
2. 新增支付。
3. 新增小程序或 App。
4. 新增模板市场。
5. 新增多人协作。
6. 新增社交广场。
7. 新增复杂 H5 编辑器。
8. 图片 / 视频 / 音乐上传。
9. 接收者回复留言。
10. 查看接收状态管理页。
11. 生成图片 / 保存截图作为核心功能。
12. 前端直接调用 AI API。
13. 把 API Key 放进前端。
14. 立即接入 Supabase。
15. 迁移 Next.js。

## 9. 后续接入原则

后续真实 AI、Supabase、token 链接、保存与查询能力都必须小步接入。

任何会明显改变 UI、路由、数据模型或服务端边界的需求，必须先更新 `PRD.md` 和 `ARCHITECTURE.md`，再进入 `TODO.md`，不能直接开发。
