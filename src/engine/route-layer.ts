import * as Cesium from 'cesium'

/** 航线绘制高度(米):高于云层(+12km),从巡游巡航高度(450km)下视清晰 */
const ROUTE_ALTITUDE = 80_000
const ROUTE_COLOR = '#e8c896'

/**
 * 航线层(V4.5)— 巡游时在球面绘制大圆航线:
 * - 全程:淡虚线(未飞航段);
 * - 已飞航段(0 → current):实线(足迹感);
 * - 当前航段(current → current+1):发光高亮。
 * 站点数最多十余个,进度变化时整体重建,不做增量编辑。
 */
export class RouteLayer {
  private dataSource: Cesium.CustomDataSource | null = null

  load(viewer: Cesium.Viewer): void {
    this.dataSource = new Cesium.CustomDataSource('route')
    viewer.dataSources.add(this.dataSource)
  }

  /** 设置/清除航线;少于 2 个站点视为清除 */
  setStops(
    stops: Array<{ longitude: number; latitude: number }> | null,
    options?: { current?: number },
  ): void {
    if (!this.dataSource) return
    this.dataSource.entities.removeAll()
    if (!stops || stops.length < 2) return

    const toPositions = (from: number, to: number) =>
      stops
        .slice(from, to + 1)
        .map((s) => Cesium.Cartesian3.fromDegrees(s.longitude, s.latitude, ROUTE_ALTITUDE))

    // 全程淡虚线
    this.dataSource.entities.add({
      polyline: new Cesium.PolylineGraphics({
        positions: toPositions(0, stops.length - 1),
        width: 2,
        arcType: Cesium.ArcType.GEODESIC, // 大圆插值,跨洲航段自然贴弯
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.fromCssColorString(ROUTE_COLOR).withAlpha(0.45),
          dashLength: 22,
        }),
      }),
    })

    const current = options?.current ?? -1
    // 已飞航段:实线(足迹)
    if (current > 0) {
      this.dataSource.entities.add({
        polyline: new Cesium.PolylineGraphics({
          positions: toPositions(0, current),
          width: 3,
          arcType: Cesium.ArcType.GEODESIC,
          material: new Cesium.ColorMaterialProperty(
            Cesium.Color.fromCssColorString(ROUTE_COLOR).withAlpha(0.85),
          ),
        }),
      })
    }
    // 当前航段:发光高亮(末站无下一段)
    if (current >= 0 && current < stops.length - 1) {
      this.dataSource.entities.add({
        polyline: new Cesium.PolylineGraphics({
          positions: toPositions(current, current + 1),
          width: 5,
          arcType: Cesium.ArcType.GEODESIC,
          material: new Cesium.PolylineGlowMaterialProperty({
            color: Cesium.Color.fromCssColorString(ROUTE_COLOR).withAlpha(0.95),
            glowPower: 0.22,
          }),
        }),
      })
    }
  }

  destroy(viewer: Cesium.Viewer): void {
    if (!this.dataSource) return
    viewer.dataSources.remove(this.dataSource, true)
    this.dataSource = null
  }
}
