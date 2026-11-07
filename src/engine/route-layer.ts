import * as Cesium from 'cesium'

/** 航线绘制高度(米):高于云层(+12km),从巡游巡航高度(450km)下视清晰 */
const ROUTE_ALTITUDE = 80_000
const ROUTE_COLOR = '#e8c896'

/**
 * 航线层(V4.5 雏形)— 巡游时在球面绘制大圆航线(虚线金色)。
 * 站点数最多十余个,变更时整体重建,不做增量编辑。
 */
export class RouteLayer {
  private dataSource: Cesium.CustomDataSource | null = null

  load(viewer: Cesium.Viewer): void {
    this.dataSource = new Cesium.CustomDataSource('route')
    viewer.dataSources.add(this.dataSource)
  }

  /** 设置/清除航线;少于 2 个站点视为清除 */
  setStops(stops: Array<{ longitude: number; latitude: number }> | null): void {
    if (!this.dataSource) return
    this.dataSource.entities.removeAll()
    if (!stops || stops.length < 2) return
    const positions = stops.map((s) =>
      Cesium.Cartesian3.fromDegrees(s.longitude, s.latitude, ROUTE_ALTITUDE),
    )
    this.dataSource.entities.add({
      polyline: new Cesium.PolylineGraphics({
        positions,
        width: 2.5,
        arcType: Cesium.ArcType.GEODESIC, // 大圆插值,跨洲航段自然贴弯
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.fromCssColorString(ROUTE_COLOR).withAlpha(0.85),
          dashLength: 22,
        }),
      }),
    })
  }

  destroy(viewer: Cesium.Viewer): void {
    if (!this.dataSource) return
    viewer.dataSources.remove(this.dataSource, true)
    this.dataSource = null
  }
}
