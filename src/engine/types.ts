/**
 * WorldEngine 接口契约
 * 业务层(Pinia/组件)只允许调用该接口,禁止直接操作 Cesium Viewer。
 * 详见 docs/02-ARCHITECTURE/WORLD-ENGINE.md
 */

export interface FlyTarget {
  longitude: number
  latitude: number
  /** 相机高度(米) */
  height: number
  /** 飞行时长(秒),缺省由距离自动决定 */
  duration?: number
}

export type FlyResult = 'arrived' | 'interrupted'

export type LayerId = 'countries' | 'markers' | 'labels'

export type DayNightMode = 'realtime' | 'always-day' | 'always-night'

/** 目的地类型(与领域模型一致;引擎侧仅作字符串透传) */
export type TypeFilter = string

/** 渲染质量档位(见 docs/05-ENGINEERING/PERFORMANCE-RULES.md) */
export type QualityMode = 'high' | 'balanced' | 'low'

export type PickPayload =
  | { kind: 'destination'; destinationId: string }
  | { kind: 'country'; countryId: string }
  | { kind: 'globe' }

export interface CameraInfo {
  longitude: number
  latitude: number
  height: number
}

export interface EngineStats {
  fps: number
}

export interface IWorldEngine {
  /** 初始化 Viewer 与所有图层。重复调用无效。 */
  initialize(container: HTMLElement): Promise<void>

  /**
   * 飞往目标。用户拖动/滚轮会中断飞行,Promise 以 'interrupted' 结束。
   * 连续调用时旧的飞行自动被新目标取代(旧 Promise 以 'interrupted' 结束)。
   */
  flyTo(target: FlyTarget): Promise<FlyResult>

  cancelFlight(): void
  isFlying(): boolean

  /** 高亮指定目的地标记(取消此前高亮) */
  highlightMarker(destinationId: string | null): void
  /** 高亮指定国家边界 */
  highlightCountry(countryId: string | null): void
  /** 按目的地类型过滤标记(传入全部启用类型;选中项不受过滤影响) */
  setTypesFilter(activeTypes: string[]): void

  setLayerVisible(layer: LayerId, visible: boolean): void
  /** 云层开关(懒加载,默认关闭) */
  setCloudsVisible(visible: boolean): Promise<void>
  setAutoRotate(enabled: boolean): void
  setDayNightMode(mode: DayNightMode): void
  /** 渲染质量档位:high=原生+FXAA / balanced=0.85x+FXAA / low=0.7x 无 FXAA */
  setQuality(mode: QualityMode): void

  onPick(listener: (payload: PickPayload) => void): () => void
  /** 渲染循环异常(用于友好降级提示) */
  onRenderError(listener: (e: Error) => void): () => void
  onUserInteract(listener: () => void): () => void
  onCameraChange(listener: (info: CameraInfo) => void): () => void
  onStats(listener: (stats: EngineStats) => void): () => void

  destroy(): void
}
