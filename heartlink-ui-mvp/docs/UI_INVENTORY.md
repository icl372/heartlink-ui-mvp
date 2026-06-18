# UI_INVENTORY.md｜HeartLink MVP v0.1 UI 清单

## 1. 文档目的

本文档记录当前 `heartlink-ui-mvp` 已验收 UI 基础中真实存在的页面、状态、组件、mock 数据和后续整理边界。

本清单只描述当前源码现状，不新增功能，不要求重做 UI。后续 TODO-004 及之后的类型、data、service 整理必须以本清单和 `docs/DESIGN.md` 的 UI Lock 为边界。

## 2. 扫描范围

本次基于以下源码和样式目录整理：

1. `src/app/App.tsx`
2. `src/app/components/CreatorFlow.tsx`
3. `src/app/components/ReceiverFlow.tsx`
4. `src/app/components/ui/`
5. `src/styles/`

## 3. 应用入口与模式

`src/app/App.tsx` 当前是单页状态流入口。

当前模式：

1. `creator`：默认模式，渲染 `CreatorFlow`。
2. `receiver`：接收端预览模式，渲染 `ReceiverFlow`。

当前切换方式：

1. 创建端首页的“先看看对方会收到什么”进入接收端预览。
2. 生成成功页的“打开预览效果”进入接收端预览。
3. `ReceiverFlow` 接收 `onBack` 参数，但正式接收端 UI 当前不显示原型切换导航。

## 4. 创建端页面 / 步骤清单

创建端由 `CreatorFlow.tsx` 中的 `step` 本地状态驱动。

### Step 0：首页

真实内容：

1. 品牌：心意链接 / HeartLink。
2. 核心文案：写下想说的话，让它变成一份可以被打开的小礼物。
3. 轻流程：填写 → 生成 → 分享。
4. 主按钮：开始创建心意 →。
5. 次级入口：先看看对方会收到什么。

后续保护：

1. 不重做首页。
2. 不恢复场景标签堆叠。
3. 不把首页改成 SaaS 营销页。

### Step 1：场景选择

真实内容：

1. 标题：这份心意的场景。
2. 说明：选择一个最贴近心意的场景。
3. 场景选项：感谢、祝福、道歉、鼓励、小心意。
4. 主按钮：下一步：填写信息。

当前 mock / option 来源：

1. `SCENE_OPTIONS` 写在 `CreatorFlow.tsx` 内。
2. 场景 icon 使用 `lucide-react`：Heart、Star、MessageCircle、Zap、Gift。

### Step 2：信息填写

真实字段：

1. 收信人：`recipient`，必填，默认“最亲爱的妈妈”。
2. 署名：`sender`，默认“您的专属宝贝”。
3. 想说的话：`message`，必填，默认“妈妈给我转了200元，我想感谢她对我的疼爱和支持。”。
4. 金额：`amount`，仅当场景为“小心意”时显示，默认“200”。
5. 语气风格：`tone`，选项为真诚、温柔、可爱、克制、正式、诗意。

真实状态：

1. 当 `recipient` 或 `message` 为空时，AI 生成按钮禁用。
2. 点击“AI 生成专属文案”后进入 AI 生成中状态。

当前 mock / option 来源：

1. `TONE_OPTIONS` 写在 `CreatorFlow.tsx` 内。
2. 默认表单值写在 `CreatorFlow.tsx` 的 `useState` 初始值中。

### Step 3：AI 生成中

真实内容：

1. 标题：正在生成文案。
2. 说明：AI 正在为您润色这份心意…
3. loading 动效使用 `motion/react`。

当前触发：

1. `handleGenerate` 设置 `aiStatus` 为 `generating`。
2. 本地 `setTimeout` 模拟生成完成。

后续保护：

1. 真实 AI 接入时必须复用当前 loading UI。
2. 不允许前端直接调用 AI API。

### Step 4：AI 文案结果 / 编辑

真实内容：

1. 状态标签：AI 已生成。
2. 标题：文案已就绪。
3. 编辑提示：点击可修改。
4. 可编辑字段：标题、正文、quote / 引用句、署名、按钮文案。
5. 操作：重新生成、使用这份文案。

当前编辑实现：

1. `editTitle`
2. `editBody`
3. `editQuote`
4. `editSignoff`
5. `editButtonText`
6. `editingField`
7. 局部组件 `EditableField`

当前 mock 来源：

1. `AI_TITLE_DEFAULT`
2. `AI_BODY_DEFAULT`
3. `AI_QUOTE_DEFAULT`
4. `AI_SIGNOFF_DEFAULT`
5. `AI_BUTTON_DEFAULT`

### Step 4：AI 失败 / 网络错误

真实状态：

1. `aiStatus === "failed"`：文案生成失败。
2. `aiStatus === "network-error"`：网络连接失败。

真实操作：

1. 重新生成。
2. 手动填写文案继续。

当前说明：

1. 当前 UI 保留失败状态组件。
2. 当前正式界面不显示手动演示失败入口。
3. 后续真实 AI / 网络失败必须映射到这些已有状态。

### Step 5：风格选择

真实内容：

1. 标题：选择风格。
2. 说明：为这份心意选一个适合的外衣。
3. 风格选项：温柔信纸、复古收据、诗意卡片、简约便签。
4. 每个风格包含小型预览缩略图。
5. 主按钮：预览效果 →。

当前 mock / option 来源：

1. `STYLE_OPTIONS` 写在 `CreatorFlow.tsx` 内。
2. 预览缩略图由局部组件 `StyleThumbnail` 实现。

### Step 6：预览

真实内容：

1. 标题：预览效果。
2. 说明：对方打开链接时看到的样子。
3. 展示接收端封面和正文效果的组合预览。
4. 显示当前风格和场景。
5. 操作：调整风格、生成链接。

当前说明：

1. 预览使用当前编辑后的文案字段。
2. 不是真实 token 链接预览。

### Step 7：生成成功

真实内容：

1. 标题：心意已封存。
2. 说明：专属链接已生成，分享给收信人，静待亲启。
3. 专属链接。
4. 按钮：复制。
5. 按钮：打开预览效果。
6. 按钮：再创建一份。
7. 隐私提示：拥有链接的人都可以查看，请只分享给你想分享的人。

当前链接来源：

1. `LINK` 在 `CreatorFlow.tsx` 中根据 `recipient` 拼出 `heartlink.app/to/{recipient}-a9f2`。
2. 当前不是可被接收端真实查询的 token 链接。

后续保护：

1. 成功页不加入生成图片、查看接收状态、管理页、登录提示、支付入口或社交分享系统。

## 5. 接收端状态清单

接收端由 `ReceiverFlow.tsx` 中的 `state` 本地状态驱动。

当前 `ReceiverState`：

1. `loading`
2. `cover`
3. `letter`
4. `received`
5. `not-found`
6. `expired`

### loading：接收端加载中

真实内容：

1. 白色圆角卡片骨架屏。
2. 文案：正在加载心意…
3. 局部组件：`SkeletonBlock`。

当前触发：

1. 当 `state === "loading"` 时通过 `useEffect` 在 2200ms 后进入 `cover`。

### cover：封面态

真实内容：

1. 英文标签：A message for you。
2. 收信人：致：最亲爱的妈妈。
3. 引导文案：在这琐碎而温热的日常里 / 有一份心意请您亲启。
4. 主按钮：点击开启信笺。
5. 开启中按钮文案：正在开启…
6. 底部品牌：心意链接 · HeartLink。

当前触发：

1. 默认初始状态为 `cover`。
2. 点击开启后进入 `letter`。

### letter：正文态

真实内容：

1. 英文标签：Acknowledgment Receipt。
2. 标题：妈妈，谢谢您。
3. 正文段落。
4. quote / 引用句。
5. 署名：您的专属宝贝 敬呈。
6. 主按钮：点击接收我的爱心电波。
7. 轻提示：这份心意只为你准备。

当前触发：

1. 点击封面按钮后进入正文态。
2. 点击接收按钮后进入完成态。

### received：接收完成态

真实内容：

1. 保留正文内容。
2. 主按钮变为完成态。
3. 完成文案根据场景来自 `COMPLETION_TEXTS`。
4. 接收时间：已于 2025 年 6 月 17 日 接收。
5. 完成提示：这份心意已被珍藏。
6. 局部动效组件：`FloatingHearts`。

当前 mock 来源：

1. `COMPLETION_TEXTS`
2. `RECEIVED_DATE`
3. `scene` 当前固定为“感谢”。

### not-found：链接不存在

真实内容：

1. 英文标签：404 · Not Found。
2. 标题：这份心意不存在。
3. 说明：链接可能不存在 / 请向发件人重新索取。
4. 操作：查看示例效果。
5. 底部品牌：心意链接 · HeartLink。

当前触发：

1. 状态组件存在。
2. 当前尚未由真实 token 查询触发。

### expired：链接过期

真实内容：

1. 英文标签：Link Expired。
2. 标题：这份心意已过期。
3. 说明：链接有效期已过 / 请联系发件人重新生成一份。
4. 操作：查看示例效果。
5. 底部品牌：心意链接 · HeartLink。

当前触发：

1. 状态组件存在。
2. 当前尚未由真实 token 查询触发。

## 6. Toast / 轻提示状态

当前 toast 由 `CreatorFlow.tsx` 中局部组件 `Toast` 实现。

真实状态：

1. `copyStatus === "success"`：链接已复制到剪贴板。
2. `copyStatus === "fail"`：复制失败，请手动复制。

当前触发：

1. `handleCopy` 调用 `navigator.clipboard.writeText(LINK)`。
2. Promise 成功时显示复制成功。
3. Promise 失败时显示复制失败。
4. toast 约 2500ms 后恢复 `idle`。

当前没有发现其他 toast 类型。

## 7. 当前核心组件清单

### 创建端相关组件

位于 `CreatorFlow.tsx`：

1. `CreatorFlow`
2. `StyleThumbnail`
3. `Toast`
4. `FormField`
5. `EditableField`

### 接收端相关组件

位于 `ReceiverFlow.tsx`：

1. `ReceiverFlow`
2. `SceneIcon`
3. `FloatingHearts`
4. `SkeletonBlock`

### App 入口组件

位于 `App.tsx`：

1. `App`

### 通用 UI 组件

`src/app/components/ui/` 当前包含 shadcn / Radix 风格基础组件：

1. accordion
2. alert-dialog
3. alert
4. aspect-ratio
5. avatar
6. badge
7. breadcrumb
8. button
9. calendar
10. card
11. carousel
12. chart
13. checkbox
14. collapsible
15. command
16. context-menu
17. dialog
18. drawer
19. dropdown-menu
20. form
21. hover-card
22. input-otp
23. input
24. label
25. menubar
26. navigation-menu
27. pagination
28. popover
29. progress
30. radio-group
31. resizable
32. scroll-area
33. select
34. separator
35. sheet
36. sidebar
37. skeleton
38. slider
39. sonner
40. switch
41. table
42. tabs
43. textarea
44. toggle-group
45. toggle
46. tooltip
47. use-mobile
48. utils

当前主流程主要以内联样式实现，以上通用组件暂不应被删除。

## 8. 图标 / 动效 / 样式依赖

### 图标

当前主流程使用 `lucide-react`：

1. Heart
2. Star
3. MessageCircle
4. Zap
5. Gift
6. ArrowLeft
7. Copy
8. Check
9. RefreshCw
10. Edit3
11. X
12. AlertCircle
13. WifiOff
14. ChevronRight
15. Mail

### 动效

当前主流程使用 `motion/react`：

1. `motion`
2. `AnimatePresence`
3. loading 动效
4. toast 动效
5. 页面切换动效
6. 接收完成 floating hearts 动效

### 样式

`src/styles/` 当前包含：

1. `index.css`
2. `fonts.css`
3. `tailwind.css`
4. `theme.css`
5. `globals.css`

关键视觉 token 位于 `theme.css`：

1. 奶油色背景：`#FAF7F0`
2. 深咖主色：`#473B35`
3. 正文深咖：`#3F342F`
4. 香槟金：`#C9A66B`
5. 浅边框：`#EAE2D8`
6. 次级文字：`#9B8E86`
7. 白色卡片：`#FFFFFF`

## 9. 当前 mock 数据来源

### 写死在 `CreatorFlow.tsx` 的数据

1. `SCENE_OPTIONS`
2. `TONE_OPTIONS`
3. `STYLE_OPTIONS`
4. `AI_TITLE_DEFAULT`
5. `AI_BODY_DEFAULT`
6. `AI_QUOTE_DEFAULT`
7. `AI_SIGNOFF_DEFAULT`
8. `AI_BUTTON_DEFAULT`
9. 表单默认值：`recipient`、`sender`、`message`、`amount`、`tone`、`selectedStyle`
10. `LINK` 生成逻辑
11. `PROGRESS_MAP`

### 写死在 `ReceiverFlow.tsx` 的数据

1. `LETTER_TITLE`
2. `LETTER_BODY_P1`
3. `LETTER_BODY_P2`
4. `LETTER_QUOTE`
5. `LETTER_SIGNOFF`
6. `COMPLETION_TEXTS`
7. `RECEIVED_DATE`
8. `scene` 默认值

## 10. 后续整理建议边界

以下为后续 TODO 的输入，不在 TODO-003 中执行。

### 后续应进入 `types/` 的内容

1. `Scene`
2. `Style` / `Theme`
3. `Tone`
4. `AiStatus`
5. `CopyStatus`
6. `ReceiverState`
7. AI 文案字段：title、body、quote、signoff、buttonText
8. Gift / GiftDraft / GiftPreview 等后续数据结构

### 后续应进入 `data/` 的内容

1. 场景选项：感谢、祝福、道歉、鼓励、小心意。
2. 语气选项：真诚、温柔、可爱、克制、正式、诗意。
3. 风格选项：温柔信纸、复古收据、诗意卡片、简约便签。
4. 默认 AI 文案。
5. mock gift 数据。
6. 接收完成文案。
7. 默认接收日期。

### 后续应进入 `services/` 的动作

1. `generateCopy`：替代当前 `handleGenerate` / `handleRetry` 中的本地 setTimeout mock。
2. `createGift`：替代当前成功页链接拼接逻辑。
3. `getGiftByToken`：替代接收端固定 mock 文案与状态。
4. `acceptGift`：替代当前点击接收后的本地状态切换。
5. copy 相关能力可后续整理为工具函数或保留在 UI 中，需保持复制成功/失败状态。

## 11. 当前不能删除的状态组件

后续整理时必须保留：

1. AI 生成中。
2. AI 失败。
3. 网络错误。
4. 输入为空按钮禁用。
5. 复制成功。
6. 复制失败。
7. 接收端加载中。
8. 封面态。
9. 正文态。
10. 接收完成态。
11. 链接不存在。
12. 链接过期。

可以删除原型演示入口，但不能删除这些状态 UI 本身。后续真实业务状态必须复用当前 UI 状态，而不是另起一套视觉。

## 12. TODO-003 验收结论

当前 UI 页面和状态清单已覆盖：

1. 首页。
2. 场景选择。
3. 信息填写。
4. AI 生成中。
5. AI 文案结果 / 编辑。
6. AI 失败 / 网络错误。
7. 风格选择。
8. 预览。
9. 生成成功。
10. 接收端加载中。
11. 接收端封面态。
12. 接收端正文态。
13. 接收完成态。
14. 链接不存在。
15. 链接过期。
16. 复制成功 / 复制失败 toast。

本轮未修改 UI 代码，未执行 TODO-004。
