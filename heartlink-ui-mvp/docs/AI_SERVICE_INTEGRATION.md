# AI_SERVICE_INTEGRATION.md｜心意包装服务接入点

## 1. 文档定位

本文档记录心意链接当前 AI / mock 生成边界。当前任务不新增真实 AI 接入，不新增环境变量，也不改 Supabase。

心意链接的新定位是：**帮用户把已有的心意包装好，做成一个能送出去的东西。**

AI 的任务不再是“凭空生成祝福文案”，而是：

```text
根据用户提供的真实心意材料，把这份心意整理、润色、包装成一份可以直接送出去的心意成品。
```

## 2. 当前调用路径

默认 mock 路径：

```text
CreatorFlow.tsx -> giftService.generateCopy(input) -> mock packaged result
```

真实 AI 开关路径：

```text
CreatorFlow.tsx -> giftService.generateCopy(input) -> POST /api/generate-copy -> Vercel Function -> AI provider
```

前端不得直接请求 DeepSeek、OpenAI、Gemini 或任何 provider；provider key 不得进入前端 bundle。

## 3. HeartIntent 输入

`generateCopy(input)` 应优先使用 `HeartIntent` / `GiftIntent` 风格的结构化输入：

1. `recipientName`：这份心意送给谁。
2. `recipientRole`：TA 是用户的谁。
3. `occasion`：为什么想送。
4. `story`：有什么事，想放进这份心意里。
5. `intentTag`：最想表达的重点。
6. `coreMessage`：最想让对方知道的一句话。
7. `tone`：想要的感觉。
8. `senderName`：署名。
9. `originalInput`：用户原始输入。
10. `noInventFacts`：不能乱编的事实边界。

旧字段仍保留兼容映射，不能因为新字段接入导致 mock、历史 gift 或异常输入崩溃。

## 4. 提示词核心规则

服务端真实路径和 mock 生成都应遵守同一产品规则：

1. 只加工用户提供的内容，不编造用户没有说过的事实。
2. 保留用户提供的具体事情，不把细节稀释成空泛套话。
3. 表达要自然，像可以发给真实的人，不像作文或明显 AI 生成文本。
4. 不过度文艺，不堆砌形容词，不使用与用户输入无关的宏大意象。
5. 如果信息不足，就围绕已有内容写得真诚一点，不强行扩写。
6. 根据 `tone` 调整表达：真诚、温柔、日常聊天、克制肉麻或有仪式感。
7. 不输出写作过程，只输出现有 `GenerateCopyResult` 兼容结构。

特别禁止：

```text
把用户没写的经历、长期状态、关系认知、地点、承诺、考试/工作准备、私人背景写成事实。
```

## 5. 输出结构

继续复用 `GenerateCopyResult`：

1. `coverText`
2. `title`
3. `body`
4. `quote`
5. `buttonText`
6. `acceptedText`

短 UI 字段仍由服务端兜底：

1. `buttonText` 固定为“收下心意”。
2. `coverText` 保持短提示，不暗示红包、支付或奖励。
3. `acceptedText` 保持短完成态提示。

## 6. 错误映射

服务端函数错误应映射到当前已有错误边界：

1. `validation-empty`
2. `ai-generation-failed`
3. `ai-content-empty`
4. `ai-service-unavailable`
5. `network-error`
6. `rate-limited`

前端 UI 继续复用当前已有状态，不新增大面积错误页，不暴露 provider 技术错误给普通用户。

## 7. 安全边界

1. 前端不得直接调用 AI provider。
2. 前端不得包含 provider key。
3. 不创建 `VITE_` 前缀的 AI 密钥变量。
4. provider key 只能存在服务端环境。
5. 服务端函数统一处理重试、限流、错误归一和内容安全兜底。
6. mock service 必须继续可运行，便于本地和异常状态回归。

## 8. 当前不做

1. 不新增真实 AI provider。
2. 不新增环境变量。
3. 不新增 `.env` 或 `.env.local`。
4. 不改 Supabase。
5. 不改接收端信封结构。
6. 不新增登录、支付、模板市场或多种包装形式。
