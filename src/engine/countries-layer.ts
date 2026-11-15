import * as Cesium from 'cesium'

const STROKE_BASE = Cesium.Color.fromCssColorString('#8fb8e8').withAlpha(0.32)
const FILL_BASE = Cesium.Color.fromCssColorString('#3d6ea8').withAlpha(0.05)
const FILL_HOVER = Cesium.Color.fromCssColorString('#6fc3ff').withAlpha(0.14)

/**
 * 国家边界层 — Natural Earth 110m(Public Domain),本地 GeoJSON。
 * 边界多边形同时承担「国家点选」热区职责。
 * V1.5 DATA EARTH:choropleth 填色——按国家设置探索密度填充色(与高亮共存,choropleth 优先)。
 */
export class CountriesLayer {
  private dataSource: Cesium.GeoJsonDataSource | null = null
  private highlightedIds: string[] = []
  /** iso → entity 索引(load 后构建一次;choropleth/高亮 O(1) 查找) */
  private isoIndex = new Map<string, Cesium.Entity>()
  /** choropleth 填色缓存(setChoropleth 写入;highlight 恢复时保留) */
  private choroplethColors = new Map<string, Cesium.Color>()

  async load(viewer: Cesium.Viewer, url: string): Promise<void> {
    this.dataSource = await Cesium.GeoJsonDataSource.load(url, {
      stroke: STROKE_BASE,
      fill: FILL_BASE,
      clampToGround: true,
    })
    this.dataSource.name = 'countries'
    this.isoIndex.clear()
    for (const entity of this.dataSource.entities.values) {
      const iso = this.isoOf(entity)
      if (iso) this.isoIndex.set(iso, entity)
    }
    viewer.dataSources.add(this.dataSource)
  }

  get ready(): boolean {
    return this.dataSource !== null
  }

  setVisible(visible: boolean): void {
    if (this.dataSource) this.dataSource.show = visible
  }

  /** 从 Entity 提取国家 ISO2 编码(Natural Earth ISO_A2_EH 属性) */
  private isoOf(entity: Cesium.Entity): string | undefined {
    const props = entity.properties
    if (!props) return undefined
    const v = props.getValue(Cesium.JulianDate.now()) as Record<string, unknown> | undefined
    const iso = v?.['ISO_A2_EH'] ?? v?.['iso_a2_eh']
    return typeof iso === 'string' && iso.length === 2 ? iso : undefined
  }

  /** 公开版:点选热区用 */
  countryIdOf(entity: unknown): string | undefined {
    if (!(entity instanceof Cesium.Entity)) return undefined
    return this.isoOf(entity)
  }

  /** 计算 iso 的有效填充色(choropleth > 高亮 > 基底) */
  private effectiveFill(iso: string): Cesium.Color {
    const choropleth = this.choroplethColors.get(iso)
    if (choropleth) return choropleth
    return this.highlightedIds.includes(iso) ? FILL_HOVER : FILL_BASE
  }

  private applyFill(iso: string): void {
    const entity = this.isoIndex.get(iso)
    if (!entity?.polygon) return
    entity.polygon.material = new Cesium.ColorMaterialProperty(this.effectiveFill(iso))
  }

  /** 高亮国家(可多国,如跨国比较场景);choropleth 国家保持其填色 */
  highlight(countryIds: string[] | null): void {
    if (!this.dataSource) return
    const prev = this.highlightedIds
    this.highlightedIds = countryIds ? [...countryIds] : []
    for (const iso of new Set([...prev, ...this.highlightedIds, ...this.choroplethColors.keys()])) {
      if (prev.includes(iso) !== this.highlightedIds.includes(iso)) this.applyFill(iso)
    }
    // choropleth 国家即使未变化,也要让高亮色让位(applyFill 已含 choropleth 优先级)
    for (const iso of this.choroplethColors.keys()) this.applyFill(iso)
  }

  /**
   * 探索密度 choropleth(V1.5 DATA EARTH 步骤 2):按国家设置填充色(金色调由调用方按密度给 alpha)。
   * null/空数组 → 清除,恢复基底色。与高亮共存:choropleth 优先。
   */
  setChoropleth(entries: Array<{ id: string; color: Cesium.Color }> | null): void {
    if (!this.dataSource) return
    this.choroplethColors.clear()
    if (entries) {
      for (const e of entries) {
        const entity = this.isoIndex.get(e.id)
        if (entity?.polygon) this.choroplethColors.set(e.id, e.color)
      }
    }
    for (const iso of new Set([...this.choroplethColors.keys(), ...this.highlightedIds])) {
      this.applyFill(iso)
    }
    // 未 choropleth 也未高亮的国家恢复基底
    for (const [iso] of this.isoIndex) {
      if (!this.choroplethColors.has(iso) && !this.highlightedIds.includes(iso)) {
        this.applyFill(iso)
      }
    }
  }

  destroy(viewer: Cesium.Viewer | null): void {
    if (this.dataSource && viewer && !viewer.isDestroyed()) {
      viewer.dataSources.remove(this.dataSource, true)
    }
    this.dataSource = null
    this.isoIndex.clear()
    this.choroplethColors.clear()
  }
}
