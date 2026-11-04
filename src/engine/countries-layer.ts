import * as Cesium from 'cesium'

const STROKE_BASE = Cesium.Color.fromCssColorString('#8fb8e8').withAlpha(0.32)
const FILL_BASE = Cesium.Color.fromCssColorString('#3d6ea8').withAlpha(0.05)
const FILL_HOVER = Cesium.Color.fromCssColorString('#6fc3ff').withAlpha(0.14)

/**
 * 国家边界层 — Natural Earth 110m(Public Domain),本地 GeoJSON。
 * 边界多边形同时承担「国家点选」热区职责。
 */
export class CountriesLayer {
  private dataSource: Cesium.GeoJsonDataSource | null = null
  private highlightedIds: string[] = []

  async load(viewer: Cesium.Viewer, url: string): Promise<void> {
    this.dataSource = await Cesium.GeoJsonDataSource.load(url, {
      stroke: STROKE_BASE,
      fill: FILL_BASE,
      clampToGround: true,
    })
    this.dataSource.name = 'countries'
    viewer.dataSources.add(this.dataSource)
  }

  get ready(): boolean {
    return this.dataSource !== null
  }

  setVisible(visible: boolean): void {
    if (this.dataSource) this.dataSource.show = visible
  }

  /** 从 Entity 提取国家 ISO2 编码(Natural Earth ISO_A2_EH 属性) */
  countryIdOf(entity: unknown): string | undefined {
    if (!(entity instanceof Cesium.Entity)) return undefined
    const props = entity.properties
    if (!props) return undefined
    const v = props.getValue(Cesium.JulianDate.now()) as Record<string, unknown> | undefined
    const iso = v?.['ISO_A2_EH'] ?? v?.['iso_a2_eh']
    return typeof iso === 'string' && iso.length === 2 ? iso : undefined
  }

  /** 高亮国家(可多国,如跨国比较场景) */
  highlight(countryIds: string[] | null): void {
    if (!this.dataSource) return
    const prev = this.highlightedIds
    this.highlightedIds = []
    if (countryIds) this.highlightedIds = [...countryIds]

    const now = Cesium.JulianDate.now()
    for (const entity of this.dataSource.entities.values) {
      if (!(entity instanceof Cesium.Entity) || !entity.properties) continue
      const v = entity.properties.getValue(now) as Record<string, unknown> | undefined
      const iso = v?.['ISO_A2_EH']
      if (typeof iso !== 'string') continue
      if (prev.includes(iso) && !this.highlightedIds.includes(iso)) {
        entity.polygon!.material = new Cesium.ColorMaterialProperty(FILL_BASE)
      }
      if (!prev.includes(iso) && this.highlightedIds.includes(iso)) {
        entity.polygon!.material = new Cesium.ColorMaterialProperty(FILL_HOVER)
      }
    }
  }

  destroy(viewer: Cesium.Viewer | null): void {
    if (this.dataSource && viewer && !viewer.isDestroyed()) {
      viewer.dataSources.remove(this.dataSource, true)
    }
    this.dataSource = null
  }
}
