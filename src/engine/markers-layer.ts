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

/** 共享 show 属性对象(避免高频分配) */
const SHOW_TRUE = new Cesium.ConstantProperty(true)
const SHOW_FALSE = new Cesium.ConstantProperty(false)

/** 标签优先级:选中 > S 级档案 > 遗产/地标 > 普通 */
export function labelPriority(d: Destination): number {
  if (d.quality === 'S') return 2
  if (d.type === 'heritage' || d.type === 'landmark') return 1
  return 0
}

/**
 * 目的地标记层 — 点 + 标签双级显示:
 * 点始终可见(按距离缩放),标签仅当相机低于 ~2200km 时显示,避免远视距标签堆叠。
 * V0.2:屏幕空间网格分桶防碰撞、悬停放大、选中呼吸脉冲(尊重 reduced-motion)。
 */
export class MarkersLayer {
  private dataSource: Cesium.CustomDataSource | null = null
  private meta = new Map<string, { priority: number; type: string }>()
  private selectedId: string | null = null
  private hoveredId: string | null = null
  private pulseEnabled = true
  private labelsVisible = true
  private activeTypes: Set<string> | null = null
  private lastCollisionUpdate = 0
  private removePreRender: (() => void) | null = null

  load(
    viewer: Cesium.Viewer,
    destinations: Destination[],
    options: { pulse: boolean },
  ): void {
    this.pulseEnabled = options.pulse
    this.dataSource = new Cesium.CustomDataSource('destinations')
    viewer.dataSources.add(this.dataSource)

    for (const d of destinations) {
      const color = destinationColor(d.type)
      this.meta.set(d.id, { priority: labelPriority(d), type: d.type })
      const id = d.id
      // 选中呼吸脉冲 / 悬停放大 / 常态,由单一 CallbackProperty 统一驱动
      const pixelSize = new Cesium.CallbackProperty(() => {
        if (this.selectedId === id) {
          return this.pulseEnabled ? 13 + Math.sin(Date.now() / 280) * 2.2 : 13
        }
        if (this.hoveredId === id) return 11
        return 8
      }, false)

      this.dataSource.entities.add({
        id: `dest:${id}`,
        name: d.name,
        position: Cesium.Cartesian3.fromDegrees(d.longitude, d.latitude),
        point: new Cesium.PointGraphics({
          pixelSize,
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
          // S 级档案标签显示更远,普通地点更近,减少密集区标签堆叠
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            d.quality === 'S' ? 900_000 : 450_000,
          ),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          style: Cesium.LabelStyle.FILL,
        }),
        properties: { destinationId: id },
      })
    }

    // 标签防碰撞:preRender 节流执行(250ms)
    this.removePreRender = viewer.scene.preRender.addEventListener(() =>
      this.updateLabelCollision(viewer),
    )
  }

  /** 屏幕空间网格分桶:高优先级先占格,重叠的低优先级标签隐藏 */
  private updateLabelCollision(viewer: Cesium.Viewer): void {
    const now = performance.now()
    if (now - this.lastCollisionUpdate < 250 || !this.dataSource) return
    this.lastCollisionUpdate = now

    type TransformsLike = {
      worldToWindowCoordinates?: (
        s: Cesium.Scene,
        p: Cesium.Cartesian3,
      ) => Cesium.Cartesian2 | undefined
      wgs84ToWindowCoordinates?: (
        s: Cesium.Scene,
        p: Cesium.Cartesian3,
      ) => Cesium.Cartesian2 | undefined
    }
    const t = Cesium.SceneTransforms as unknown as TransformsLike
    const toWindow = t.worldToWindowCoordinates ?? t.wgs84ToWindowCoordinates
    if (!toWindow) return

    const CELL_W = 150
    const CELL_H = 30
    const grid = new Map<string, number>()
    const tryClaim = (x: number, y: number, priority: number): boolean => {
      const cx0 = Math.floor((x - CELL_W / 2) / CELL_W)
      const cx1 = Math.floor((x + CELL_W / 2) / CELL_W)
      const cy0 = Math.floor((y - CELL_H / 2) / CELL_H)
      const cy1 = Math.floor((y + CELL_H / 2) / CELL_H)
      for (let cy = cy0; cy <= cy1; cy++) {
        for (let cx = cx0; cx <= cx1; cx++) {
          const cur = grid.get(`${cx},${cy}`)
          if (cur !== undefined && cur >= priority) return false
        }
      }
      for (let cy = cy0; cy <= cy1; cy++) {
        for (let cx = cx0; cx <= cx1; cx++) grid.set(`${cx},${cy}`, priority)
      }
      return true
    }

    // 先全部恢复,再按优先级隐藏;远距隐藏交给 DistanceDisplayCondition,互不冲突
    const time = viewer.clock.currentTime
    for (const e of this.dataSource.entities.values) {
      if (e.label) e.label.show = SHOW_TRUE
    }
    for (const e of this.dataSource.entities.values) {
      if (!e.label || !e.position) continue
      if (e.show === false) continue // 被类型过滤隐藏的实体不参与标签碰撞
      const raw = e.id as string
      const id = raw.startsWith('dest:') ? raw.slice(5) : null
      if (!id || this.selectedId === id) continue // 选中标签始终显示
      if (!this.labelsVisible) {
        e.label.show = SHOW_FALSE
        continue
      }
      const pos = e.position.getValue(time)
      if (!pos) continue
      const dist = Cesium.Cartesian3.distance(viewer.camera.positionWC, pos)
      if (dist > 900_000) continue
      const win = toWindow(viewer.scene, pos)
      if (!win) continue
      const priority = this.meta.get(id)?.priority ?? 0
      if (!tryClaim(win.x, win.y, priority)) {
        e.label.show = SHOW_FALSE
      }
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
    this.labelsVisible = visible
    if (!this.dataSource) return
    for (const e of this.dataSource.entities.values) {
      if (e.label) e.label.show = visible ? SHOW_TRUE : SHOW_FALSE
    }
  }

  /** 悬停高亮(由引擎 MOUSE_MOVE 驱动) */
  setHover(destinationId: string | null): void {
    this.hoveredId = destinationId
  }

  /** 类型过滤:仅显示启用类型;选中项始终显示。null 表示不过滤 */
  setTypesFilter(activeTypes: string[] | null): void {
    this.activeTypes = activeTypes ? new Set(activeTypes) : null
    if (!this.dataSource) return
    for (const e of this.dataSource.entities.values) {
      const raw = e.id as string
      const id = raw.startsWith('dest:') ? raw.slice(5) : null
      if (!id) continue
      if (this.selectedId === id || !this.activeTypes) {
        e.show = true
        continue
      }
      const type = this.meta.get(id)?.type
      e.show = type !== undefined && this.activeTypes.has(type)
    }
  }

  highlight(destinationId: string | null): void {
    const prev = this.selectedId
    this.selectedId = destinationId
    if (!this.dataSource) return

    const setOutline = (id: string | null, selected: boolean) => {
      if (!id) return
      const e = this.dataSource!.entities.getById(`dest:${id}`)
      if (!e || !e.point) return
      e.point.outlineWidth = new Cesium.ConstantProperty(selected ? 3 : 2)
    }
    setOutline(prev, false)
    setOutline(destinationId, true)
  }

  destroy(viewer: Cesium.Viewer | null): void {
    this.removePreRender?.()
    this.removePreRender = null
    if (this.dataSource && viewer && !viewer.isDestroyed()) {
      viewer.dataSources.remove(this.dataSource, true)
    }
    this.dataSource = null
  }
}
