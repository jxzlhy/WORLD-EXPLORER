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
}

/**
 * WorldEngine — CesiumJS 运行时的唯一编排入口。
 * 业务层通过 IWorldEngine 接口使用,永远不直接接触 Viewer。
 */
export class WorldEngine implements IWorldEngine {
  private viewer: Cesium.Viewer | null = null
  private camera!: CameraController
  private imagery!: ImageryLayersController
  private countries = new CountriesLayer()
  private markers = new MarkersLayer()
  private pickHandler: Cesium.ScreenSpaceEventHandler | null = null
  private readonly unsubs: Array<() => void> = []
  private initPromise: Promise<void> | null = null

  constructor(private readonly options: WorldEngineOptions) {}

  initialize(container: HTMLElement): Promise<void> {
    if (this.initPromise) return this.initPromise
    this.initPromise = this.doInitialize(container)
    return this.initPromise
  }

  private async doInitialize(container: HTMLElement): Promise<void> {
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

    // 开发态调试钩子(自动化测试/错误诊断用,生产构建不含)
    if (import.meta.env.DEV) {
      ;(window as unknown as Record<string, unknown>).__WE_VIEWER__ = this.viewer
    }

    this.imagery = new ImageryLayersController()
    await this.imagery.load(this.viewer)
    await this.countries.load(this.viewer, this.options.countriesUrl)
    this.markers.load(this.viewer, this.options.destinations)

    this.camera = new CameraController(this.viewer)

    // —— 点选分发 ——
    this.pickHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas)
    this.pickHandler.setInputAction(
      (movement: { position: Cesium.Cartesian2 }) => {
        this.dispatchPick(movement.position)
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK,
    )
  }

  private dispatchPick(position: Cesium.Cartesian2): void {
    if (!this.viewer) return
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
  private emitPick(payload: PickPayload): void {
    for (const cb of this.pickListeners) cb(payload)
  }

  // ---- IWorldEngine ----

  flyTo(target: FlyTarget): Promise<FlyResult> {
    return this.camera.flyTo(target)
  }

  cancelFlight(): void {
    this.camera.cancelFlight()
  }

  isFlying(): boolean {
    return this.camera.isFlying()
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
    this.camera.setAutoRotate(enabled)
  }

  setDayNightMode(mode: DayNightMode): void {
    this.imagery.setMode(mode)
  }

  onPick(listener: (payload: PickPayload) => void): () => void {
    this.pickListeners.add(listener)
    return () => this.pickListeners.delete(listener)
  }

  onUserInteract(listener: () => void): () => void {
    return this.camera.onUserInteract(listener)
  }

  onCameraChange(listener: (info: CameraInfo) => void): () => void {
    return this.camera.onCameraChange(listener)
  }

  onStats(listener: (stats: EngineStats) => void): () => void {
    return this.camera.onStats(listener)
  }

  destroy(): void {
    for (const unsub of this.unsubs) unsub()
    this.unsubs.length = 0
    this.pickListeners.clear()
    this.pickHandler?.destroy()
    this.pickHandler = null
    this.camera?.destroy()
    if (this.viewer && !this.viewer.isDestroyed()) {
      this.countries.destroy(this.viewer)
      this.markers.destroy(this.viewer)
      this.imagery.destroy()
      this.viewer.destroy()
    }
    this.viewer = null
    this.initPromise = null
  }
}
