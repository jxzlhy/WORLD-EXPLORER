import * as Cesium from 'cesium'
import type { Destination, DestinationType } from '../domain/types'

const TYPE_COLORS: Record<DestinationType, string> = {
  heritage: '#e8c896',
  natural: '#7fd8b0',
  landmark: '#6fc3ff',
  museum: '#b9a8e8',
  city: '#d5def0',
  island: '#8fd6e8',
  geology: '#d8a87f',
  observatory: '#e8b45a',
}

export function destinationColor(type: DestinationType): Cesium.Color {
  return Cesium.Color.fromCssColorString(TYPE_COLORS[type] ?? '#6fc3ff')
}

/**
 * 目的地标记层 — 点 + 标签双级显示:
 * 点始终可见(按距离缩放),标签仅当相机低于 ~2200km 时显示,避免远视距标签堆叠。
 */
export class MarkersLayer {
  private dataSource: Cesium.CustomDataSource | null = null
  private selectedId: string | null = null

  load(viewer: Cesium.Viewer, destinations: Destination[]): void {
    this.dataSource = new Cesium.CustomDataSource('destinations')
    viewer.dataSources.add(this.dataSource)

    for (const d of destinations) {
      const color = destinationColor(d.type)
      this.dataSource.entities.add({
        id: `dest:${d.id}`,
        name: d.name,
        position: Cesium.Cartesian3.fromDegrees(d.longitude, d.latitude),
        point: new Cesium.PointGraphics({
          pixelSize: 8,
          color: color.withAlpha(0.95),
          outlineColor: Cesium.Color.fromCssColorString('#030609').withAlpha(0.9),
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(5e5, 1.15, 2.8e7, 0.55),
          translucencyByDistance: new Cesium.NearFarScalar(2e5, 1.0, 3.5e7, 0.85),
        }),
        label: new Cesium.LabelGraphics({
          text: d.name,
          font: '12px "PingFang SC", "Helvetica Neue", sans-serif',
          fillColor: Cesium.Color.fromCssColorString('#eff4fc').withAlpha(0.92),
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('#060b14').withAlpha(0.72),
          backgroundPadding: new Cesium.Cartesian2(7, 4),
          pixelOffset: new Cesium.Cartesian2(0, -17),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 900_000),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          style: Cesium.LabelStyle.FILL,
        }),
        properties: { destinationId: d.id },
      })
    }
  }

  destinationIdOf(entity: unknown): string | undefined {
    if (!(entity instanceof Cesium.Entity)) return undefined
    const raw = entity.id
    if (typeof raw !== 'string' || !raw.startsWith('dest:')) return undefined
    return raw.slice(5)
  }

  setVisible(visible: boolean): void {
    if (this.dataSource) this.dataSource.show = visible
  }

  setLabelsVisible(visible: boolean): void {
    if (!this.dataSource) return
    for (const e of this.dataSource.entities.values) {
      if (e.label) e.label.show = new Cesium.ConstantProperty(visible)
    }
  }

  highlight(destinationId: string | null): void {
    const prev = this.selectedId
    this.selectedId = destinationId
    if (!this.dataSource) return

    const setStyle = (id: string | null, selected: boolean) => {
      if (!id) return
      const e = this.dataSource!.entities.getById(`dest:${id}`)
      if (!e || !e.point) return
      e.point.pixelSize = new Cesium.ConstantProperty(selected ? 13 : 8)
      e.point.outlineWidth = new Cesium.ConstantProperty(selected ? 3 : 2)
    }
    setStyle(prev, false)
    setStyle(destinationId, true)
  }

  destroy(viewer: Cesium.Viewer | null): void {
    if (this.dataSource && viewer && !viewer.isDestroyed()) {
      viewer.dataSources.remove(this.dataSource, true)
    }
    this.dataSource = null
  }
}
