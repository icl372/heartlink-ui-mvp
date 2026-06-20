# AI_SERVICE_INTEGRATION.md｜HeartLink AI 服务接入点

## 1. 文档定位

本文档记录 TODO-020 的 AI 服务端函数接入点。

TODO-032 后，`generateCopy(input)` 默认仍使用本地 mock；仅当浏览器构建时明确设置非敏感开关 `VITE_USE_REAL_AI=true`，才会调用同源 `/api/generate-copy`。浏览器不会直接请求任何 AI provider，也不读取 provider 密钥。

## 2. 当前前端入口

默认创建端链路：

```text
CreatorFlow.tsx -> generateCopy(input) -> mock copy result
```

当前 mock service 位于：

```text
src/app/services/giftService.ts
```

当前输入 / 输出类型位于：

```text
src/app/types/ai.ts
src/app/types/errors.ts
```

启用真实路径时：

```text
CreatorFlow.tsx -> generateCopy(input) -> POST /api/generate-copy -> Vercel Function -> DeepSeek
```

`VITE_USE_REAL_AI` 仅控制是否调用自有同源接口，不能保存、传递或推导任何 provider key。未启用时继续使用 mock，现有 mock 错误触发器也始终优先于真实路径，供本地回归使用。

## 3. 后续替换目标

真实 AI 的调用切换仅限 `giftService.generateCopy(input)` 内部实现。

目标链路为：

```text
CreatorFlow.tsx -> generateCopy(input) -> service function endpoint -> AI provider
```

前端仍然只调用自己的服务端函数，不直接调用任何 AI provider。

## 4. 服务端函数输入

后续服务端函数输入应复用 `GenerateCopyInput`：

1. `recipientName`
2. `senderName`
3. `occasion`
4. `tone`
5. `amountText`
6. `originalMessage`

## 5. 服务端函数输出

后续服务端函数输出应复用 `GenerateCopyResult`：

1. `coverText`
2. `title`
3. `body`
4. `quote`
5. `buttonText`
6. `acceptedText`

## 6. 错误映射

后续服务端函数错误应映射到当前已有错误边界：

1. `validation-empty`
2. `ai-generation-failed`
3. `ai-content-empty`
4. `ai-service-unavailable`
5. `network-error`

前端 UI 继续复用当前已有状态：

1. AI loading
2. AI success
3. AI failed
4. network-error

不要新增大面积错误页，不要暴露 provider 技术错误给普通用户。

## 7. 安全边界

后续接入必须遵守：

1. 前端不得直接调用 AI provider。
2. 前端不得包含 provider key。
3. 不创建 `VITE_` 前缀的 AI 密钥变量。
4. provider key 只能存在服务端环境。
5. 服务端函数应统一处理重试、限流和错误归一。
6. 当前 mock service 在真实服务可用前必须保持可运行。

## 8. 本轮不做

本轮不做以下事项：

1. 不接真实 AI。
2. 不新增真实 endpoint。
3. 不新增 `.env`。
4. 不新增 API Key。
5. 不修改创建端 UI。
6. 不修改主题 / 风格映射。
7. 不接 Supabase。
