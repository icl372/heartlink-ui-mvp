# SUPABASE_FIELD_MAPPING.md｜HeartLink Gifts 字段映射说明

## 1. 文档定位

本文档记录 TODO-022 的 Supabase 字段映射准备。

当前阶段只做文档准备，不创建 Supabase 项目，不新增 Supabase key，不新增 `.env`，不接真实数据库，不改变当前 mock / localStorage 运行方式。

## 2. 当前数据来源

当前创建端数据来源：

1. `CreatorFlow.tsx` 中的表单状态。
2. `CreateGiftInput`。
3. `GiftCopy`。
4. `giftService.createGift(input)`。
5. 本地 mock gift store 和 localStorage mock preview。

当前接收端数据来源：

1. `giftService.getGiftByToken(token)`。
2. `Gift`。
3. `giftService.acceptGift(token)`。

未来 Supabase 记录类型：

```text
src/app/types/gift.ts -> GiftRecord
```

## 3. 字段映射表

| UI / service 字段 | 当前类型 | 未来 Supabase 字段 | 未来记录类型 | 说明 |
| --- | --- | --- | --- | --- |
| `gift.id` | `Gift.id` | `id` | `GiftRecord.id` | 数据库主键，当前 mock 可为空。 |
| `token` | `CreateGiftResult.token` / `Gift.token` | `token` | `GiftRecord.token` | 公开链接 token，不使用自增 ID，不包含姓名或敏感内容。 |
| `recipient` | `CreatorFlow` state | `recipient_name` | `GiftRecord.recipient_name` | 创建端“收礼人”。 |
| `recipientName` | `CreateGiftInput.recipientName` / `Gift.recipientName` | `recipient_name` | `GiftRecord.recipient_name` | service 层字段。 |
| `sender` | `CreatorFlow` state | `sender_name` | `GiftRecord.sender_name` | 创建端署名。 |
| `senderName` | `CreateGiftInput.senderName` / `Gift.senderName` | `sender_name` | `GiftRecord.sender_name` | service 层字段。 |
| `scene` | `CreatorFlow` state | `occasion` | `GiftRecord.occasion` | UI 内部场景选择，对应 `GiftOccasion`。 |
| `occasion` | `CreateGiftInput.occasion` / `Gift.occasion` | `occasion` | `GiftRecord.occasion` | service 层场景字段。 |
| `tone` | `CreatorFlow` state / `CreateGiftInput.tone` | `tone` | `GiftRecord.tone` | 语气字段。 |
| `amount` | `CreatorFlow` state | `amount_text` | `GiftRecord.amount_text` | 金额展示文本，可为空。 |
| `amountText` | `CreateGiftInput.amountText` / `Gift.amountText` | `amount_text` | `GiftRecord.amount_text` | service 层金额展示文本。 |
| `message` | `CreatorFlow` state | `original_message` | `GiftRecord.original_message` | 用户原始输入。 |
| `originalMessage` | `CreateGiftInput.originalMessage` / `Gift.originalMessage` | `original_message` | `GiftRecord.original_message` | service 层原始输入字段。 |
| `copy.coverText` | `GiftCopy.coverText` | `cover_text` | `GiftRecord.cover_text` | 接收端封面文案，可为空。 |
| `editTitle` | `CreatorFlow` state | `title` | `GiftRecord.title` | AI 生成后可编辑标题。 |
| `copy.title` | `GiftCopy.title` | `title` | `GiftRecord.title` | service 层标题。 |
| `editBody` | `CreatorFlow` state | `body` | `GiftRecord.body` | AI 生成后可编辑正文。 |
| `copy.body` | `GiftCopy.body` | `body` | `GiftRecord.body` | service 层正文。 |
| `editQuote` | `CreatorFlow` state | `quote` | `GiftRecord.quote` | AI 生成后可编辑引用句。 |
| `copy.quote` | `GiftCopy.quote` | `quote` | `GiftRecord.quote` | service 层引用句。 |
| `editButtonText` | `CreatorFlow` state | `button_text` | `GiftRecord.button_text` | AI 生成后可编辑按钮文案。 |
| `copy.buttonText` | `GiftCopy.buttonText` | `button_text` | `GiftRecord.button_text` | service 层按钮文案。 |
| `copy.acceptedText` | `GiftCopy.acceptedText` | `accepted_text` | `GiftRecord.accepted_text` | 接收完成态文案，可为空。 |
| `selectedStyle` | `CreatorFlow` state | `theme` | `GiftRecord.theme` | 当前选中风格。本文档不处理主题视觉映射问题。 |
| `theme` | `CreateGiftInput.theme` / `Gift.theme` | `theme` | `GiftRecord.theme` | service 层风格字段。 |
| `openedAt` | `Gift.openedAt` | 暂无独立字段 | 暂无独立字段 | `ARCHITECTURE.md` 初稿记录的是 `opened_count`，暂不记录打开时间。 |
| `acceptedAt` | `Gift.acceptedAt` / `AcceptGiftResult.acceptedAt` | `accepted_at` | `GiftRecord.accepted_at` | 接收时间，可为空。 |
| `expiresAt` | `Gift.expiresAt` | `expires_at` | `GiftRecord.expires_at` | 过期时间，可为空。 |
| `status` | `Gift.status` | 暂不直接保存 | 暂不直接保存 | 当前 DB 初稿用 `accepted_at`、`expires_at`、`is_deleted` 和计数字段推导状态。 |
| 暂无 | 当前 mock 未记录 | `opened_count` | `GiftRecord.opened_count` | 未来服务端记录打开次数，默认 `0`。 |
| 暂无 | 当前 mock 未记录 | `accepted_count` | `GiftRecord.accepted_count` | 未来服务端记录接收次数，默认 `0`。 |
| 暂无 | 当前 mock 未记录 | `created_at` | `GiftRecord.created_at` | 数据库创建时间。 |
| 暂无 | 当前 mock 未记录 | `updated_at` | `GiftRecord.updated_at` | 数据库更新时间。 |
| 暂无 | 当前 mock 未记录 | `is_deleted` | `GiftRecord.is_deleted` | 软删除标记，当前 MVP 不提供删除入口。 |

## 4. Service 替换点

后续接入 Supabase 时，应优先替换 service 内部实现，而不是改 UI：

1. `createGift(input)`：将 `CreateGiftInput` 转换为 `GiftRecord` 并保存，返回 `token` 和 `giftUrl`。
2. `getGiftByToken(token)`：根据 `token` 查询 `GiftRecord`，再转换为前端 `Gift`。
3. `acceptGift(token)`：更新 `accepted_at` / `accepted_count`，返回 `AcceptGiftResult`。

当前 UI 仍只依赖现有 service 签名，不应直接依赖 Supabase client。

## 5. 边界说明

1. 本文档不创建数据库表。
2. 本文档不新增 Supabase client。
3. 本文档不新增 `.env` 或任何 key。
4. 本文档不改变当前 localStorage mock preview。
5. 本文档不修改创建端或接收端 UI。
6. 本文档不处理主题 / 风格视觉映射问题。

## 6. 后续建议

TODO-023 应继续确认 localStorage 边界，明确它只用于 mock 或临时草稿，不作为正式生产链接数据源。
