# QA_HEARTLINK_NEW_FLOW.md

## 1. QA 目标

本次 QA 用于确认前 4 步新链路调整是否稳定完成，并同步产品、设计、架构和 AI 文档。

当前产品定位：

```text
帮用户把已有的心意包装好，做成一个能送出去的东西。
```

当前主链路：

```text
用户交出心意 -> 系统理解心意 -> 模型加工心意 -> 包装成可发送成品 -> 生成链接发送
```

## 2. 测试范围

本次只做整体 QA 和文档同步，不新增功能，不改 Supabase，不改真实 AI 接入，不新增登录、支付、模板市场或多种包装形式。

检查范围：

1. 创建端输入问题与选项。
2. `HeartIntent` / `buildHeartIntent` 数据整理。
3. AI / mock 心意包装规则。
4. 结果页“心意成品”表达。
5. 接收端信封形式与基础状态。
6. 移动端布局静态风险。
7. `npm run build`。

## 3. 创建端检查结果

代码检查位置：

```text
src/app/components/CreatorFlow.tsx
```

检查结果：通过。

当前创建端已围绕以下问题展开：

1. 这份心意送给谁？
2. TA 是你的谁？
3. 为什么想送这份心意？
4. 有什么事，想放进这份心意里？
5. 你最想表达的重点是什么？
6. 也可以补一句你最想让对方知道的话。
7. 想要什么感觉？

当前主按钮为“帮我包装这份心意”，生成中状态为“正在包装这份心意”。

选项检查：

1. TA 是你的谁：父母 / 伴侣 / 朋友 / 老师 / 同学 / 同事 / 其他。
2. 为什么想送这份心意：生日 / 感谢 / 道歉 / 鼓励 / 想念 / 表白 / 和好 / 其他。
3. 最想表达的重点：感谢 / 道歉 / 鼓励 / 想念 / 祝福 / 表白 / 其他。
4. 想要什么感觉：真诚一点 / 温柔一点 / 像日常聊天一样 / 不要太肉麻 / 有仪式感一点。

“最想表达的重点”标签只记录心意方向，不会把标签句子填充进输入框。

## 4. 数据结构检查结果

代码检查位置：

```text
src/app/types/gift.ts
src/app/types/ai.ts
src/app/lib/heartIntent.ts
src/app/services/giftService.ts
```

检查结果：通过。

当前已存在结构化心意对象和整理函数：

1. `HeartIntent`
2. `buildHeartIntent(input)`
3. `noInventFacts`

可整理字段：

1. `recipientName`
2. `recipientRole`
3. `occasion`
4. `story`
5. `intentTag`
6. `coreMessage`
7. `tone`
8. `senderName`
9. `originalInput`
10. `noInventFacts`

旧字段兼容仍保留：`recipientName`、`senderName`、`originalMessage`、`tone`、`occasion` 等仍可映射给现有 service 和 mock 逻辑。

## 5. AI / Mock 生成检查结果

代码检查位置：

```text
api/generate-copy.ts
src/app/services/giftService.ts
src/app/data/mockCopy.ts
```

检查结果：通过。

当前 AI / mock 任务已从“生成祝福文案”调整为“包装用户已有心意”。规则包含：

1. 只加工用户提供的信息。
2. 不乱编用户没说过的事实。
3. 保留用户输入的具体事情。
4. 不过度文艺，不写成作文。
5. 避免明显 AI 味。
6. 根据 `tone` 调整表达。

重点边界：如果用户只写“妈妈给我买了一台电脑，我很喜欢”，生成内容不应扩写成“每天早起做饭”“这些年操碎了心”等未提供事实。

## 6. 结果页检查结果

代码检查位置：

```text
src/app/components/CreatorFlow.tsx
```

检查结果：通过。

结果页已从“AI 文案结果”调整为“心意成品结果”：

1. 生成中：正在包装这份心意。
2. 生成成功：心意已包装好。
3. 主要操作：预览这份心意、复制心意链接、重新包装。
4. 创建完成：这份心意可以送出去了。

## 7. 接收端检查结果

代码检查位置：

```text
src/app/components/ReceiverFlow.tsx
src/app/services/giftService.ts
```

检查结果：通过。

接收端信封形式继续保留：

1. `/to/:token` 路由仍由 ReceiverFlow 读取 token。
2. 封面标题使用“给 {{recipientName}} 的一份小心意”。
3. 打开按钮使用“打开这份心意”。
4. 正文、引用、署名和收下心意按钮保持原结构。
5. 已接收状态保持可用。
6. not-found / expired 状态仍保留。

需要人工或线上环境补测：

1. `/to/not-exist-token`
2. `/to/mock-heartlink-expired`
3. 真实 Supabase token 的跨设备读取。

## 8. 移动端检查结果

静态检查结果：通过。

本次未大改 UI 结构，移动端风险主要来自现有长文案和接收端分步阅读。建议继续用 390px 宽度做人工回归：

1. 创建端表单不横向溢出。
2. 生成结果区域不遮挡按钮。
3. 复制心意链接 toast 可见。
4. 接收端封面、正文、已接收态不遮挡主 CTA。

## 9. 构建结果

命令：

```bash
npm run build
```

结果：通过。`vite build` 成功完成，未发现构建错误。

## 10. 已知问题和后续 TODO

已知边界：

1. 当前不新增更多包装形式，信封 / 信纸仍是第一种包装形式。
2. 当前不新增登录、支付、模板市场或社交广场。
3. 当前不改 Supabase 表结构；`HeartIntent` 完整持久化可作为后续任务评估。
4. 当前不做真实 AI provider 新接入，只同步任务定义和文档。
5. 线上真实链路仍建议在部署后人工回归：创建、包装、复制链接、打开 `/to/:token`、收下心意。

结论：

```text
新链路已在代码和文档中形成闭环；如 npm run build 通过，可认为当前 MVP 的“准备心意 -> 包装心意 -> 生成链接”主链路已完成本轮 QA。
```
