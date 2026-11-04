import * as Cesium from 'cesium'
import type { DayNightMode } from './types'
import { DayNightCompositor } from './day-night-composite'

/**
 * 地球影像层控制器(V0.2 重构)
 *
 * 三种昼夜模式:
 * - realtime:DayNightCompositor 逐像素合成(真实晨昏线 + 夜侧城市灯光),每 5 分钟重合成;
 * - always-day:NASA 日间贴图 + NASA GIBS 瓦片(中低空清晰度);
 * - always-night:NASA Black Marble 夜间灯光。
 *
 * 着色策略:明暗已烘焙进底图(enableLighting=false),避免与逐像素结果二次叠加。
 * GIBS 仅在 always-day 模式保留——其日间瓦片会盖住夜灯,与 realtime 模式互斥(设计权衡,见 TECH-RESEARCH)。
 */
export class ImageryLayersController {
  private compositor = new DayNightCompositor()
  private baseLayer: Cesium.ImageryLayer | null = null
  private gibsLayer: Cesium.ImageryLayer | null = null
  private mode: DayNightMode = 'realtime'
  private refreshTimer: number | null = null
  /** 模式切换令牌:丢弃迟到的异步结果 */
  private applySeq = 0

  async load(viewer: Cesium.Viewer): Promise<void> {
    await this.compositor.init()
    await this.applyMode(this.mode, viewer)

    const globe = viewer.scene.globe
    globe.enableLighting = false
    globe.dynamicAtmosphereLighting = false
    globe.baseColor = Cesium.Color.fromCssColorString('#0a1220')
  }

  setMode(mode: DayNightMode): void {
    this.mode = mode
  }

  get currentMode(): DayNightMode {
    return this.mode
  }

  /** 立即重合成(模式切换与定时刷新共用) */
  async refresh(viewer: Cesium.Viewer): Promise<void> {
    await this.applyMode(this.mode, viewer)
  }

  private async applyMode(mode: DayNightMode, viewer: Cesium.Viewer): Promise<void> {
    const seq = ++this.applySeq
    const layers = viewer.imageryLayers
    this.removeBaseLayers(viewer)
    this.stopRefreshTimer()

    const nasaCredit = new Cesium.Credit('NASA Blue Marble / Black Marble (Public Domain)')

    try {
      if (mode === 'realtime') {
        const url = await canvasToBlobUrl(this.compositor.compositeToDate(new Date()))
        const provider = await Cesium.SingleTileImageryProvider.fromUrl(url, {
          credit: nasaCredit,
        })
        URL.revokeObjectURL(url)
        if (seq !== this.applySeq) return // 期间发生了新的模式切换
        this.baseLayer = layers.addImageryProvider(provider)
        this.startRefreshTimer(viewer)
      } else if (mode === 'always-day') {
        const dayProvider = await Cesium.SingleTileImageryProvider.fromUrl(
          '/textures/earth-blue-marble.jpg',
          { credit: nasaCredit },
        )
        if (seq !== this.applySeq) return
        this.baseLayer = layers.addImageryProvider(dayProvider)
        this.gibsLayer = await this.addGibs(viewer)
      } else {
        const nightProvider = await Cesium.SingleTileImageryProvider.fromUrl(
          '/textures/earth-night.jpg',
          { credit: nasaCredit },
        )
        if (seq !== this.applySeq) return
        this.baseLayer = layers.addImageryProvider(nightProvider)
      }
    } catch (err) {
      // 合成或加载失败:回退到静态日间贴图,保证地球可用(P0 降级要求)
      console.error('[WorldExplorer] 影像层应用失败,回退日间贴图:', err)
      if (seq === this.applySeq && !this.baseLayer) {
        const fallback = await Cesium.SingleTileImageryProvider.fromUrl(
          '/textures/earth-blue-marble.jpg',
          { credit: nasaCredit },
        )
        this.baseLayer = layers.addImageryProvider(fallback)
      }
    }
  }

  private async addGibs(viewer: Cesium.Viewer): Promise<Cesium.ImageryLayer | null> {
    try {
      const gibsProvider = new Cesium.WebMapTileServiceImageryProvider({
        url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/500m/{TileMatrix}/{TileRow}/{TileCol}.jpeg',
        layer: 'BlueMarble_ShadedRelief_Bathymetry',
        style: 'default',
        format: 'image/jpeg',
        maximumLevel: 8,
        tileMatrixSetID: 'GoogleMapsCompatible_Level8',
        credit: 'NASA EOSDIS GIBS',
      })
      return viewer.imageryLayers.addImageryProvider(gibsProvider, 1)
    } catch {
      return null // 离线降级:仅本地贴图
    }
  }

  private startRefreshTimer(viewer: Cesium.Viewer): void {
    // 太阳位置每 5 分钟重合成一次(视觉上连续)
    this.refreshTimer = window.setInterval(() => {
      void this.applyMode('realtime', viewer)
    }, 5 * 60_000)
  }

  private stopRefreshTimer(): void {
    if (this.refreshTimer !== null) {
      window.clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  private removeBaseLayers(viewer: Cesium.Viewer): void {
    if (this.baseLayer && !viewer.isDestroyed()) {
      viewer.imageryLayers.remove(this.baseLayer, true)
      this.baseLayer = null
    }
    if (this.gibsLayer && !viewer.isDestroyed()) {
      viewer.imageryLayers.remove(this.gibsLayer, true)
      this.gibsLayer = null
    }
  }

  destroy(): void {
    this.stopRefreshTimer()
    this.applySeq++
    this.baseLayer = null
    this.gibsLayer = null
  }
}

function canvasToBlobUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(URL.createObjectURL(blob))
      else reject(new Error('画布导出失败'))
    }, 'image/jpeg', 0.92)
  })
}
