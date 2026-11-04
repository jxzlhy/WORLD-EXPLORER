# 测试标准

> 三层防线,逐层补齐(V0.1 已有前两层)。

## 1. 类型层(已就位,V)

`pnpm typecheck`(vue-tsc strict,零 any):每次提交前必须通过。

## 2. 构建层(已就位,V)

`pnpm build`:类型检查 + 生产构建;产物含 Cesium 静态资源复制(vite-plugin-static-copy)。

## 3. 交互层(V0.2 落地,Playwright)

关键用例(优先级序):

1. **飞行中断**:flyTo 期间向 canvas 派发 wheel → promise 必须 `interrupted`。
2. **连续目标**:200ms 内连续两次 selectDestination → 镜头最终停在第 2 目标,无残留动画。
3. **面板滚动隔离**:在 DetailPanel 内 wheel → 相机高度不变。
4. **收藏持久化**:toggle → reload → 状态保持。
5. **内存**:进出场景 ×5 → heap 无阶梯增长。

## 4. 真机走查(已执行,V,记录于 SESSION-LOG)

- 视觉:地球/面板/标记/玻璃质感截图。
- 链路:搜索→飞行→档案→收藏;国家→城市 chip→目的地。
- 环境注意:IAB 面板遮挡 → RAF 暂停 → 动画测试假失败;验收前确认面板可见。
