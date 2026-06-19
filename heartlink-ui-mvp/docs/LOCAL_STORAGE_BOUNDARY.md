# LOCAL_STORAGE_BOUNDARY.md

## 1. 文档目的

本文档用于完成 `TODO-023：确认 LocalStorage 边界`。

当前 `heartlink-ui-mvp` 仍处于 MVP 开发准备阶段。LocalStorage 只用于本地 mock preview 和开发验收，不是正式生产链接的数据源。

## 2. 当前 LocalStorage 使用位置

当前 LocalStorage 使用集中在：

- `src/app/services/giftService.ts`

当前 mock 存储 key：

- `heartlink_mock_gifts`

当前用途：

- `createGift(input)` 创建 mock gift 后，将 gift 写入内存 mock store。
- 同时将 gift 写入 LocalStorage，支持本地浏览器刷新、新标签打开 `/to/:token` 后继续预览本次创建内容。
- `getGiftByToken(token)` 读取顺序为：
  1. 内存 mock store
  2. LocalStorage mock preview store
  3. 默认示例 token / mock gift
  4. not-found / expired 分支

## 3. 明确边界

LocalStorage 在当前阶段只允许作为：

- 本地 mock preview 存储
- 本地开发验收辅助
- 后续如需要，可作为临时草稿存储

LocalStorage 不允许作为：

- 正式生产链接数据源
- 跨设备或跨浏览器共享数据源
- 礼物内容的正式持久化数据库
- token 查询的正式后端
- 接收状态记录的正式来源
- 权限、隐私或安全能力的实现方式
- 删除、过期、管理页等能力的数据基础

## 4. 当前 mock 行为说明

当前本地 mock 链接策略支持：

- `/to/:token`
- `?token=...`
- `?gift=...`
- `#/to/...`
- `#?token=...`

这些入口只用于本地 MVP 验收和路由策略准备。

在同一浏览器中，创建端生成的 gift 可以通过 LocalStorage 在刷新或新标签中被接收端读取。换浏览器、换设备、清理浏览器数据后，不保证仍能读取该 mock gift。

这是预期行为，不代表正式产品链接能力。

## 5. 后续 Supabase 替换边界

后续接入真实 Supabase 或服务端数据源时，应替换以下 service 内部实现，而不是改 UI：

- `createGift(input)`
  - 从写入 LocalStorage mock store，替换为写入 Supabase `gifts` 表或等价服务端数据源。
- `getGiftByToken(token)`
  - 从读取内存 / LocalStorage mock store，替换为按 token 查询服务端数据源。
- `acceptGift(token)`
  - 从 mock 更新接收状态，替换为服务端记录 `accepted_at`、`accepted_count` 或等价字段。

当前 `GiftRecord` 与 Supabase 字段映射参考：

- `docs/SUPABASE_FIELD_MAPPING.md`

链接策略参考：

- `docs/LINK_ROUTING_PLAN.md`

## 6. 后续开发约束

后续开发不得因为 LocalStorage 当前可用而默认它是生产方案。

接入真实链接能力前必须满足：

- 前端不直接持有数据库密钥。
- 不新增 Supabase key 到前端包。
- 不新增 `.env` 到仓库。
- 不让正式接收端依赖创建者浏览器 LocalStorage。
- 不改变当前已验收 UI 视觉和流程。

如果要把 mock store 替换为真实服务端数据源，应在 `giftService` 边界内完成，并继续复用现有 loading / error / empty 状态。

## 7. 人工验收建议

当前阶段人工验收可检查：

- 创建一份心意后生成链接。
- 复制链接并在同一浏览器新标签打开，能进入接收端。
- 刷新 `/to/:token`，仍能读取本地 mock gift。
- 使用不存在的 token，仍进入 not-found 状态。
- 使用 expired token，仍进入 expired 状态。
- 当前 UI 视觉、成功页隐私提示、接收端三状态不发生变化。

不需要也不应该期待：

- 换设备后仍能读取刚才创建的 mock gift。
- 清理 LocalStorage 后仍能读取刚才创建的 mock gift。
- 当前阶段具备正式生产级分享链接能力。
