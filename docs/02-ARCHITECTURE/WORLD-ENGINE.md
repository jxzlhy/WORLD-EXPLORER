# WorldEngine 接口规范

> 位置:`src/engine/types.ts`。业务层唯一允许的引擎入口。

## 接口(实际实现)

```ts
interface IWorldEngine {
  initialize(container: HTMLElement): Promise<void>
  flyTo(target: FlyTarget): Promise<'arrived' | 'interrupted'>
  cancelFlight(): void
  isFlying(): boolean
  highlightMarker(destinationId: string | null): void
  highlightCountry(countryId: string | null): void
  setTypesFilter(activeTypes: string[]): void
  setLayerVisible(layer: 'countries' | 'markers' | 'labels', visible: boolean): void
  setCloudsVisible(visible: boolean): Promise<void>
  setRouteLine(stops: RouteStopPoint[] | null): void      // V4.5 巡游航线(大圆虚线,null 清除)
  setAutoRotate(enabled: boolean): void
  setDayNightMode(mode: 'realtime' | 'always-day' | 'always-night'): void
  setQuality(mode: 'high' | 'balanced' | 'low'): void
  onPick(cb: (p: PickPayload) => void): () => void        // 返回退订函数
  onRenderError(cb: (e: Error) => void): () => void
  onUserInteract(cb: () => void): () => void
  onCameraChange(cb: (info: CameraInfo) => void): () => void
  onStats(cb: (s: { fps: number }) => void): () => void
  destroy(): void
}
```

## 设计要点

1. **flyTo 的 Promise 语义**:用户中断时以 `'interrupted'` 结束(不 reject)——调用方无需 try/catch 区分中断与异常。连续调用以最新飞行为准(内部 flightSeq 序号防旧动画回写状态)。
2. **控制权**:任何用户拖动/滚轮/捏合 → `camera.cancelFlight()` + 广播 onUserInteract(UI 侧关闭自动旋转)。用户操作优先级最高(指令 7.3)。
3. **自动旋转**:仅当「未交互 + 未飞行 + 相机高于 12,000km」;通过 UI 开关重开时重置交互标记。
4. **昼夜模式**:`realtime` 为逐像素合成(晨昏线 + 夜灯)打底,其上叠 GIBS 昼/夜双瓦片层,α 由「相机所指地表的太阳照射角 + 相机高度」驱动(preRender 250ms 节流 + 缓动):全球视角 α≈0 保留合成,拉近后昼/夜侧分别淡入对应高清瓦片(≈611m/px);`always-day/night` 为静态贴图 + GIBS 增强模式。
5. **拾取**:LEFT_CLICK → scene.pick → 标记(自定义 id 前缀 `dest:`)/ 国家(ISO_A2_EH)/ 空地 三类分发。
6. **性能面板数据**:preRender 统计 FPS(1s 窗口)+ 相机位置 4Hz 节流广播。

## 测试要点(未来自动化)

- 连续快速点击两个目的地:旧 Promise 必须以 interrupted 结束,镜头最终到达第二目标。
- 飞行中拖动地球:flyTo 返回 interrupted,相机停在手松位置,面板不回弹。
- 面板滚动不缩放地球(面板 DOM 在 canvas 之上,pointer-events 隔离)。
