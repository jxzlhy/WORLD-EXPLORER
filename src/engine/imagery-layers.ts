import * as Cesium from 'cesium'
import type { DayNightMode } from './types'
import { DayNightCompositor } from './day-night-composite'
import { CloudLayer } from './cloud-layer'

/**
 * 地球影像层控制器(V0.2 重构)
 *
 * 三种昼夜模式:
 * - realtime:DayNightCompositor 逐像素合成(真实晨昏线 + 夜侧城市灯光),每 5 分钟重合成;
 * - always-day:NASA 日间贴图 + NASA GIBS 瓦片(中低空清晰度);
 * - always-night:NASA Black Marble 夜间灯光。
 *
 * 着色策略:明暗已烘焙进底图(enableLighting=false),避免与逐像素结果二次叠加。
 * GIBS 静态层(永昼 BlueMarble ShadedRelief / 永夜 VIIRS Black Marble)为拉近后的清晰度增强,
 * 与 realtime 互斥——其不透明瓦片会盖住逐像素合成的晨昏线(设计权衡,见 TECH-RESEARCH)。
 */
export class ImageryLayersController {
  private compositor = new DayNightCompositor()
  private baseLayer: Cesium.ImageryLayer | null = null
  private gibsLayer: Cesium.ImageryLayer | null = null
  private clouds = new CloudLayer()
  private cloudsLoaded = false
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

  /** 云层开关(懒加载:首次开启才创建 Primitive) */
  async setCloudsVisible(visible: boolean, viewer: Cesium.Viewer): Promise<void> {
    if (visible && !this.cloudsLoaded) {
      await this.clouds.load(viewer)
      this.cloudsLoaded = true
    }
    this.clouds.setVisible(visible)
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
        this.gibsLayer = await this.addGibsNight(viewer)
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

  /** GIBS 日间瓦片(L8):拉近后补充本地 4K 底图的清晰度。URL 无时间槽(静态层),
   *  2026-11-07 修正:此前 "500m" 占据了 TileMatrixSet 槽位,所有瓦片 400,该层从未真正渲染。 */
  private async addGibs(viewer: Cesium.Viewer): Promise<Cesium.ImageryLayer | null> {
    try {
      const gibsProvider = new Cesium.WebMapTileServiceImageryProvider({
        url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{TileMatrix}/{TileRow}/{TileCol}.jpeg',
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

  /** GIBS 夜灯瓦片(VIIRS Black Marble 2016 合成,L8,带时间维度 2016-01-01) */
  private async addGibsNight(viewer: Cesium.Viewer): Promise<Cesium.ImageryLayer | null> {
    try {
      const gibsProvider = new Cesium.WebMapTileServiceImageryProvider({
        url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{TileMatrix}/{TileRow}/{TileCol}.png',
        layer: 'VIIRS_Black_Marble',
        style: 'default',
        format: 'image/png',
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
    // 太阳位置每 5 分钟重合成一次(视觉上连续);按当前模式重应用,避免硬编码漂移
    this.refreshTimer = window.setInterval(() => {
      void this.applyMode(this.mode, viewer)
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
    this.clouds.destroy()
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
