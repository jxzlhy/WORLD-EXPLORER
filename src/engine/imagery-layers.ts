import * as Cesium from 'cesium'
import type { DayNightMode } from './types'

/**
 * 地球贴图层:NASA Blue Marble(昼) + NASA Black Marble 城市灯光(夜)。
 * 数据来源:NASA Earth Observatory,Public Domain,本地静态化(见 LICENSE-REGISTRY.md)。
 *
 * 昼夜混合为「近似实现」:按当前视点与日下点的角距整层渐变夜间灯光 alpha,
 * 终端线附近不做逐像素混合(那需要自定义 Globe Surface Shader,列为后续优化)。
 */
export class ImageryLayersController {
  private nightLayer: Cesium.ImageryLayer | null = null
  private readonly scratchA = new Cesium.Cartesian3()
  private readonly scratchB = new Cesium.Cartesian3()
  private readonly scratchM = new Cesium.Matrix3()
  private mode: DayNightMode = 'realtime'

  async load(viewer: Cesium.Viewer): Promise<void> {
    const dayProvider = await Cesium.SingleTileImageryProvider.fromUrl(
      '/textures/earth-blue-marble.jpg',
    )
    viewer.imageryLayers.addImageryProvider(dayProvider)

    // NASA GIBS 蓝色大理石瓦片(500m/px,至 L8):修复单张贴图在中低空模糊的问题。
    // 免费公共服务,无 key;失败时下方单张贴图仍兜底。登记见 docs/07-DATA-AND-ASSETS/DATA-SOURCES.md
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
      viewer.imageryLayers.addImageryProvider(gibsProvider, 1)
    } catch {
      /* 离线环境忽略,继续使用本地贴图 */
    }

    const nightProvider = await Cesium.SingleTileImageryProvider.fromUrl(
      '/textures/earth-night.jpg',
    )
    this.nightLayer = viewer.imageryLayers.addImageryProvider(nightProvider)
    this.nightLayer.alpha = 0

    const globe = viewer.scene.globe
    globe.enableLighting = true
    globe.dynamicAtmosphereLighting = true
    globe.baseColor = Cesium.Color.fromCssColorString('#0a1220')
  }

  setMode(mode: DayNightMode): void {
    this.mode = mode
  }

  get currentMode(): DayNightMode {
    return this.mode
  }

  /** 每帧调用:更新夜间灯光层 alpha */
  update(viewer: Cesium.Viewer): void {
    if (!this.nightLayer) return
    if (this.mode === 'always-day') {
      viewer.scene.globe.enableLighting = false
      this.nightLayer.alpha = 0
      return
    }
    if (this.mode === 'always-night') {
      viewer.scene.globe.enableLighting = false
      this.nightLayer.alpha = 1
      return
    }
    viewer.scene.globe.enableLighting = true

    const now = viewer.clock.currentTime
    const sunIcrf = Cesium.Simon1994PlanetaryPositions.computeSunPositionInEarthInertialFrame(now)
    const icrfToFixed = Cesium.Transforms.computeIcrfToFixedMatrix(now, this.scratchM)
    if (!sunIcrf || !icrfToFixed) return // ICRF 数据未就绪时保持上一帧

    const sunFixed = Cesium.Matrix3.multiplyByVector(icrfToFixed, sunIcrf, this.scratchA)
    Cesium.Cartesian3.normalize(sunFixed, sunFixed)
    Cesium.Cartesian3.normalize(viewer.camera.positionWC, this.scratchB)

    const cos = Cesium.Math.clamp(Cesium.Cartesian3.dot(this.scratchB, sunFixed), -1, 1)
    const angularDist = Math.acos(cos)

    // 视点处于日下半球(<80°)时无夜灯,越过晨昏线(80°~110°)渐入
    const t = Cesium.Math.clamp(
      (angularDist - Cesium.Math.toRadians(80)) / Cesium.Math.toRadians(30),
      0,
      1,
    )
    this.nightLayer.alpha = 0.92 * t
  }

  destroy(): void {
    this.nightLayer = null
  }
}
