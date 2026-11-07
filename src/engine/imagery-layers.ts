import * as Cesium from 'cesium'
import type { DayNightMode } from './types'
import { DayNightCompositor } from './day-night-composite'
import { CloudLayer } from './cloud-layer'
import { sunSubPoint } from './sun-position'

/**
 * 地球影像层控制器(V0.2 重构;2026-11-08 实时模式增强)
 *
 * 三种昼夜模式:
 * - realtime:DayNightCompositor 逐像素合成(真实晨昏线 + 夜侧城市灯光)打底,
 *   其上叠 GIBS 日间/夜灯双瓦片层,α 由「相机所指地表的太阳照射角 + 相机高度」驱动:
 *   全球视角 α≈0(保留合成晨昏线);拉近后昼侧淡入日间瓦片、夜侧淡入夜灯瓦片——
 *   近距清晰度由 GIBS L8(≈611m/px)承担,远超单张贴图的极限;
 * - always-day:NASA 日间贴图 + NASA GIBS 瓦片(中低空清晰度);
 * - always-night:NASA Black Marble 夜间灯光 + GIBS 夜灯瓦片。
 *
 * 着色策略:明暗已烘焙进底图(enableLighting=false),避免与逐像素结果二次叠加。
 */
export class ImageryLayersController {
  private compositor = new DayNightCompositor()
  private baseLayer: Cesium.ImageryLayer | null = null
  /** realtime 模式的日光感知增强层(昼/夜),α 由 updateSharpAlphas 驱动 */
  private sharpDay: Cesium.ImageryLayer | null = null
  private sharpNight: Cesium.ImageryLayer | null = null
  private sharpPreRender: (() => void) | null = null
  private lastAlphaTick = 0
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
        // 日光感知高清增强层(GIBS 昼/夜):α 由 preRender 驱动,全球视角隐藏
        this.sharpDay = await this.addGibs(viewer, 1)
        this.sharpNight = await this.addGibsNight(viewer, 2)
        for (const l of [this.sharpDay, this.sharpNight]) {
          if (l) {
            l.alpha = 0
            l.show = false
          }
        }
        this.startSharpDriver(viewer)
        this.startRefreshTimer(viewer)
      } else if (mode === 'always-day') {
        const dayProvider = await Cesium.SingleTileImageryProvider.fromUrl(
          '/textures/earth-blue-marble.jpg',
          { credit: nasaCredit },
        )
        if (seq !== this.applySeq) return
        this.baseLayer = layers.addImageryProvider(dayProvider)
        await this.addGibs(viewer)
      } else {
        const nightProvider = await Cesium.SingleTileImageryProvider.fromUrl(
          '/textures/earth-night.jpg',
          { credit: nasaCredit },
        )
        if (seq !== this.applySeq) return
        this.baseLayer = layers.addImageryProvider(nightProvider)
        await this.addGibsNight(viewer)
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
  /** GIBS 日间瓦片(L8):拉近后补充本地 4K 底图的清晰度。URL 无时间槽(静态层),
   *  2026-11-07 修正:此前 "500m" 占据了 TileMatrixSet 槽位,所有瓦片 400,该层从未真正渲染。 */
  private async addGibs(viewer: Cesium.Viewer, index = 1): Promise<Cesium.ImageryLayer | null> {
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
      return viewer.imageryLayers.addImageryProvider(gibsProvider, index)
    } catch {
      return null // 离线降级:仅本地贴图
    }
  }

  /** GIBS 夜灯瓦片(VIIRS Black Marble 2016 合成,L8,带时间维度 2016-01-01) */
  private async addGibsNight(viewer: Cesium.Viewer, index = 1): Promise<Cesium.ImageryLayer | null> {
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
      return viewer.imageryLayers.addImageryProvider(gibsProvider, index)
    } catch {
      return null // 离线降级:仅本地贴图
    }
  }

  // ---- 实时模式日光感知增强(2026-11-08) ----

  private startSharpDriver(viewer: Cesium.Viewer): void {
    this.stopSharpDriver()
    this.sharpPreRender = viewer.scene.preRender.addEventListener(() =>
      this.tickSharpAlphas(viewer),
    )
  }

  private stopSharpDriver(): void {
    if (this.sharpPreRender) {
      this.sharpPreRender()
      this.sharpPreRender = null
    }
  }

  /** 每 250ms 依据「目标点太阳照射角 + 相机高度」更新昼/夜增强层 α(带缓动) */
  private tickSharpAlphas(viewer: Cesium.Viewer): void {
    const now = performance.now()
    if (now - this.lastAlphaTick < 250) return
    this.lastAlphaTick = now
    if (!this.sharpDay && !this.sharpNight) return
    if (viewer.isDestroyed()) return

    // 相机所指地表点(屏幕中心拾取,失败退回相机星下点)
    let lat: number
    let lon: number
    const canvas = viewer.canvas
    const center = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2)
    const picked = viewer.camera.pickEllipsoid(center, Cesium.Ellipsoid.WGS84)
    if (picked) {
      const carto = Cesium.Cartographic.fromCartesian(picked)
      lat = Cesium.Math.toDegrees(carto.latitude)
      lon = Cesium.Math.toDegrees(carto.longitude)
    } else {
      const carto = viewer.camera.positionCartographic
      lat = Cesium.Math.toDegrees(carto.latitude)
      lon = Cesium.Math.toDegrees(carto.longitude)
    }
    const heightKm = viewer.camera.positionCartographic.height / 1000

    // 高度因子:6,000km 以下全量,14,000km 以上归零(全球视角保留合成晨昏线)
    const heightFactor = Cesium.Math.clamp((14_000 - heightKm) / 8_000, 0, 1)

    // 目标点天顶角余弦(-1 夜侧 → +1 昼侧)
    const { subLon, subLat } = sunSubPoint(new Date())
    const phi = (lat * Math.PI) / 180
    const dec = (subLat * Math.PI) / 180
    const cosZ =
      Math.sin(phi) * Math.sin(dec) +
      Math.cos(phi) * Math.cos(dec) * Math.cos(((lon - subLon) * Math.PI) / 180)

    // smoothstep:昼侧 cosZ -0.05→0.25 淡入;夜侧对称
    const smooth = (t: number) => t * t * (3 - 2 * t)
    const dayTarget = smooth(Cesium.Math.clamp((cosZ + 0.05) / 0.3, 0, 1)) * heightFactor
    const nightTarget = smooth(Cesium.Math.clamp((-cosZ + 0.05) / 0.3, 0, 1)) * heightFactor

    this.easeAlpha(this.sharpDay, dayTarget)
    this.easeAlpha(this.sharpNight, nightTarget)
  }

  /** α 向目标缓动;近零时隐藏图层(跳过瓦片请求) */
  private easeAlpha(layer: Cesium.ImageryLayer | null, target: number): void {
    if (!layer) return
    const cur = layer.alpha
    const next = Math.abs(target - cur) < 0.02 ? target : cur + (target - cur) * 0.18
    layer.alpha = next
    layer.show = next > 0.02
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
    this.stopSharpDriver()
    this.sharpDay = null
    this.sharpNight = null
    if (viewer.isDestroyed()) return
    // baseLayer 之外的全部影像层(含 GIBS 增强/实时双瓦片)一并移除
    while (viewer.imageryLayers.length > 0) {
      viewer.imageryLayers.remove(viewer.imageryLayers.get(0), true)
    }
  }

  destroy(): void {
    this.stopRefreshTimer()
    this.stopSharpDriver()
    this.applySeq++
    this.clouds.destroy()
    this.baseLayer = null
    this.sharpDay = null
    this.sharpNight = null
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
