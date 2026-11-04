import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import type { Destination } from '../domain/types'
import { CameraController } from './camera-controller'
import { CountriesLayer } from './countries-layer'
import { ImageryLayersController } from './imagery-layers'
import { MarkersLayer } from './markers-layer'
import type {
  CameraInfo,
  DayNightMode,
  EngineStats,
  FlyResult,
  FlyTarget,
  IWorldEngine,
  LayerId,
  PickPayload,
} from './types'

export interface WorldEngineOptions {
  countriesUrl: string
  destinations: Destination[]
  /** 尊重 prefers-reduced-motion:关闭呼吸脉冲等持续动画 */
  reducedMotion?: boolean
}

type Lifecycle = 'idle' | 'initializing' | 'ready' | 'destroyed'

/**
 * WorldEngine — CesiumJS 运行时的唯一编排入口。
 *
 * 生命周期:idle → initializing → ready → destroyed
 * - initialize 幂等:重复调用共享同一 Promise;
 * - 初始化途中 destroy():通过初始化令牌(seq)中止后续步骤并清理半成品资源;
 * - 初始化失败:回到 idle,可安全重试;
 * - destroy 后再 initialize:抛错(组件应重建引擎实例)。
 */
export class WorldEngine implements IWorldEngine {
  private viewer: Cesium.Viewer | null = null
  private camera: CameraController | null = null
  private imagery: ImageryLayersController | null = null
  private countries = new CountriesLayer()
  private markers = new MarkersLayer()
  private pickHandler: Cesium.ScreenSpaceEventHandler | null = null
  private readonly unsubs: Array<() => void> = []
  private initPromise: Promise<void> | null = null
  private lifecycle: Lifecycle = 'idle'
  /** 初始化令牌:destroy() 会使其失效,从而中止仍在进行的初始化 */
  private initSeq = 0

  constructor(private readonly options: WorldEngineOptions) {}

  private aborted(seq: number): boolean {
    return seq !== this.initSeq || this.lifecycle === 'destroyed'
  }

  /** 清理当前已创建的运行时资源(部分初始化或正式销毁均可用) */
  private teardown(): void {
    for (const unsub of this.unsubs.splice(0)) unsub()
    this.pickHandler?.destroy()
    this.pickHandler = null
    this.camera?.destroy()
    this.camera = null
    this.imagery?.destroy()
    this.imagery = null
    if (this.viewer && !this.viewer.isDestroyed()) {
      this.countries.destroy(this.viewer)
      this.markers.destroy(this.viewer)
      this.viewer.destroy()
    }
    this.viewer = null
  }

  initialize(container: HTMLElement): Promise<void> {
    if (this.lifecycle === 'destroyed') {
      return Promise.reject(new Error('WorldEngine 已销毁,请重建实例'))
    }
    if (this.initPromise) return this.initPromise
    this.lifecycle = 'initializing'
    const seq = ++this.initSeq
    this.initPromise = this.doInitialize(container, seq).then(
      () => {
        if (!this.aborted(seq)) this.lifecycle = 'ready'
      },
      (err) => {
        // 失败:清理半成品并回到 idle,允许重试
        if (seq === this.initSeq) {
          this.teardown()
          this.lifecycle = 'idle'
          this.initPromise = null
        }
        throw err
      },
    )
    return this.initPromise
  }

  private async doInitialize(container: HTMLElement, seq: number): Promise<void> {
    this.viewer = new Cesium.Viewer(container, {
      baseLayer: false, // 不使用 Cesium ion 默认底图(零依赖云服务)
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      requestRenderMode: false,
      contextOptions: {
        webgl: { antialias: true, powerPreference: 'high-performance' },
      },
    })
    if (this.aborted(seq)) return

    const scene = this.viewer.scene
    try {
      scene.msaaSamples = 4
    } catch {
      /* WebGL1 环境不支持,忽略 */
    }
    if (scene.skyAtmosphere) scene.skyAtmosphere.show = true
    scene.screenSpaceCameraController.minimumZoomDistance = 50_000
    scene.screenSpaceCameraController.maximumZoomDistance = 60_000_000

    // 移除默认双击跟踪选中行为,避免与业务选中流冲突
    this.viewer.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
    )

    // 渲染循环异常 → 广播(应用层展示友好提示),不让用户面对黑屏
    scene.renderError.addEventListener((_s, err) => {
      for (const cb of this.renderErrorListeners) cb(err instanceof Error ? err : new Error(String(err)))
    })

    // 开发态调试钩子(自动化测试/错误诊断用,生产构建不含)
    if (import.meta.env.DEV) {
      ;(window as unknown as Record<string, unknown>).__WE_VIEWER__ = this.viewer
    }

    this.imagery = new ImageryLayersController()
    await this.imagery.load(this.viewer)
    if (this.aborted(seq)) return

    await this.countries.load(this.viewer, this.options.countriesUrl)
    if (this.aborted(seq)) return

    this.markers.load(this.viewer, this.options.destinations, {
      pulse: !this.options.reducedMotion,
    })
    if (this.aborted(seq)) return

    this.camera = new CameraController(this.viewer)

    // —— 点选分发 + 悬停反馈 ——
    this.pickHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas)
    this.pickHandler.setInputAction(
      (movement: { position: Cesium.Cartesian2 }) => {
        this.dispatchPick(movement.position)
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK,
    )
    this.pickHandler.setInputAction(
      (movement: { endPosition: Cesium.Cartesian2 }) => {
        this.updateHover(movement.endPosition)
      },
      Cesium.ScreenSpaceEventType.MOUSE_MOVE,
    )
  }

  private updateHover(position: Cesium.Cartesian2): void {
    if (!this.viewer || this.viewer.isDestroyed()) return
    const picked = this.viewer.scene.pick(position)
    const object: unknown = Cesium.defined(picked) ? (picked.id ?? picked.primitive) : undefined
    const destinationId = this.markers.destinationIdOf(object)
    this.markers.setHover(destinationId ?? null)
    this.viewer.canvas.style.cursor = destinationId ? 'pointer' : ''
  }

  private dispatchPick(position: Cesium.Cartesian2): void {
    if (!this.viewer || this.viewer.isDestroyed()) return
    const picked = this.viewer.scene.pick(position)
    if (!Cesium.defined(picked)) {
      this.emitPick({ kind: 'globe' })
      return
    }
    const object: unknown = picked.id ?? picked.primitive
    const destinationId = this.markers.destinationIdOf(object)
    if (destinationId) {
      this.emitPick({ kind: 'destination', destinationId })
      return
    }
    const countryId = this.countries.countryIdOf(object)
    if (countryId) {
      this.emitPick({ kind: 'country', countryId })
      return
    }
    this.emitPick({ kind: 'globe' })
  }

  private readonly pickListeners = new Set<(p: PickPayload) => void>()
  private readonly renderErrorListeners = new Set<(e: Error) => void>()
  private emitPick(payload: PickPayload): void {
    for (const cb of this.pickListeners) cb(payload)
  }

  // ---- IWorldEngine ----

  flyTo(target: FlyTarget): Promise<FlyResult> {
    if (!this.camera) return Promise.resolve('interrupted')
    return this.camera.flyTo(target)
  }

  cancelFlight(): void {
    this.camera?.cancelFlight()
  }

  isFlying(): boolean {
    return this.camera?.isFlying() ?? false
  }

  highlightMarker(destinationId: string | null): void {
    this.markers.highlight(destinationId)
  }

  highlightCountry(countryId: string | null): void {
    this.countries.highlight(countryId ? [countryId] : null)
  }

  setLayerVisible(layer: LayerId, visible: boolean): void {
    if (layer === 'countries') this.countries.setVisible(visible)
    if (layer === 'markers') this.markers.setVisible(visible)
    if (layer === 'labels') this.markers.setLabelsVisible(visible)
  }

  setAutoRotate(enabled: boolean): void {
    this.camera?.setAutoRotate(enabled)
  }

  setDayNightMode(mode: DayNightMode): void {
    this.imagery?.setMode(mode)
  }

  setQuality(mode: 'high' | 'low'): void {
    if (!this.viewer || this.viewer.isDestroyed()) return
    this.viewer.resolutionScale = mode === 'low' ? 0.7 : 1.0
    try {
      this.viewer.scene.postProcessStages.fxaa.enabled = mode === 'high'
    } catch {
      /* fxaa 不可用时忽略 */
    }
  }

  onPick(listener: (payload: PickPayload) => void): () => void {
    this.pickListeners.add(listener)
    return () => this.pickListeners.delete(listener)
  }

  onRenderError(listener: (e: Error) => void): () => void {
    this.renderErrorListeners.add(listener)
    return () => this.renderErrorListeners.delete(listener)
  }

  onUserInteract(listener: () => void): () => void {
    return this.camera?.onUserInteract(listener) ?? (() => {})
  }

  onCameraChange(listener: (info: CameraInfo) => void): () => void {
    return this.camera?.onCameraChange(listener) ?? (() => {})
  }

  onStats(listener: (stats: EngineStats) => void): () => void {
    return this.camera?.onStats(listener) ?? (() => {})
  }

  destroy(): void {
    if (this.lifecycle === 'destroyed') return
    this.lifecycle = 'destroyed'
    this.initSeq++ // 中止仍在进行的初始化
    this.teardown()
    this.pickListeners.clear()
    this.renderErrorListeners.clear()
    this.initPromise = null
  }
}
