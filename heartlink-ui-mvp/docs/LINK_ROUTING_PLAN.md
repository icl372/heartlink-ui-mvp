# LINK_ROUTING_PLAN.md｜HeartLink 链接路由策略

## 1. 文档定位

本文档用于记录 TODO-017 的链接路由规划。

当前 `heartlink-ui-mvp` 仍保持 Vite + React SPA 状态流，不引入 React Router，不迁移 Next.js，不接 Supabase，不接真实后端。

本轮只规划后续真实链接策略，不修改 UI，不改变当前创建端和接收端视觉。

## 2. 当前已实现状态

当前代码已经支持以下本地 mock token 读取方式：

1. `/to/:token`
2. `?token=:token`
3. `?gift=:token`
4. `#/to/:token`
5. `#?token=:token`

当前读取入口集中在：

1. `src/app/lib/giftUrl.ts`
2. `src/app/App.tsx`
3. `src/app/components/ReceiverFlow.tsx`
4. `src/app/services/giftService.ts`

当前 `giftUrl` 使用本地 origin 生成，例如：

```text
http://localhost:5173/to/{token}
```

当前阶段不允许写死 `heartlink.app` 或任何未确认正式域名。

## 3. 当前推荐方案

短期继续使用 `/to/:token` 作为 MVP mock 链接路径。

原因：

1. 已通过人工验收。
2. 能进入接收端 `ReceiverFlow`。
3. 能驱动 loading / cover / letter / received 状态。
4. 能驱动 not-found / expired 状态。
5. 不需要引入复杂路由系统。
6. 不破坏现有 UI。

query/hash 方案只作为本地验证入口保留，不作为用户可见主链接格式。

## 4. 后续真实链接目标

后续真实生产链接建议目标为：

```text
/g/{token}
```

但当前阶段不立即切换。

原因：

1. 当前 UI 已锁定，不能为路由一次性重写 `App.tsx`。
2. 当前还没有真实 Supabase 数据源。
3. 当前 localStorage 只用于本地 mock preview，不是正式链接数据源。
4. `/to/:token` 已满足本地 MVP 验证。

## 5. 迁移步骤

建议后续按以下顺序小步迁移：

1. 保持 `src/app/lib/giftUrl.ts` 作为唯一链接策略入口。
2. 在真实数据服务准备好后，将 `GIFT_ROUTE_PREFIX` 从 `/to` 调整为 `/g`。
3. 让 `getGiftTokenFromPathname()` 同时兼容 `/to/:token` 和 `/g/:token` 一个阶段。
4. 验证 `/g/:token` 可进入 `ReceiverFlow` 并通过 service 查询 gift。
5. 确认旧 `/to/:token` 是否继续兼容或仅用于本地 mock。
6. 如需正式路由库，另起 TODO 评估 React Router，不在本任务中完成。

## 6. 回滚方式

如果 `/g/:token` 迁移出现问题，应优先回滚到当前已验收方案：

1. `GIFT_ROUTE_PREFIX` 恢复为 `/to`。
2. `createGiftUrl(token)` 继续生成 `/to/:token`。
3. `getGiftTokenFromLocation()` 继续保留 query/hash mock 读取。
4. `ReceiverFlow` 继续通过 props token 读取 gift。
5. UI 视觉和状态组件不做任何回退式改动。

## 7. UI 保护要求

任何链接策略调整都必须遵守 `docs/DESIGN.md` 的 UI Lock：

1. 不重写首页。
2. 不重写创建流程。
3. 不重写接收端。
4. 不改变成功页隐私提示。
5. 不删除 loading / error / empty 状态。
6. 不删除 not-found / expired / received 状态。
7. 不显示原型、Mock、Demo、MVP 等用户可见开发词。
8. 不新增管理页、登录、支付、社交分享系统。

## 8. LocalStorage 边界

当前 localStorage 只用于本地 mock preview：

1. 用于让本机新 tab / reload 后仍能读取刚创建的 mock gift。
2. 不作为正式生产链接数据源。
3. 不代表接收者可以跨设备读取创建者本地数据。
4. 后续真实链接必须由 Supabase 或其他服务端数据源支持。

## 9. 人工验收点

本规划任务完成后，仍应回归确认：

1. `/to/:token` 正常进入接收端。
2. `?token=:token` 正常进入接收端。
3. `?gift=:token` 正常进入接收端。
4. `#/to/:token` 正常进入接收端。
5. `#?token=:token` 正常进入接收端。
6. not-found 状态正常。
7. expired 状态正常。
8. 创建端生成链接 / 复制链接 / 打开预览效果正常。
9. UI 无明显变化。
