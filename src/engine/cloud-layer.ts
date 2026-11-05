import * as Cesium from 'cesium'

/**
 * 云层(V0.3-E / V1.0)—— 独立球壳 Primitive:
 * 贴图 CC0(GabrielGGD,Commons「Transparent Fair Weather Clouds Map」,2048 下采样);
 * 海拔 +12km,缓慢西移(约 17 分钟一圈);默认关闭,开关在左轨。
 * 生命周期:由 ImageryLayersController 持有并在 destroy 时移除。
 */
const EARTH_RADIUS = 6378137
const CLOUD_ALTITUDE = 12_000
/** 每秒旋转弧度(西向;three-globe 示例同量级 -0.36°/s) */
const ROTATION_SPEED = -0.0063

export class CloudLayer {
  private primitive: Cesium.Primitive | null = null
  private removePreRender: (() => void) | null = null
  private viewer: Cesium.Viewer | null = null

  async load(viewer: Cesium.Viewer): Promise<void> {
    this.viewer = viewer
    const radii = Cesium.Cartesian3.fromArray([
      EARTH_RADIUS + CLOUD_ALTITUDE,
      EARTH_RADIUS + CLOUD_ALTITUDE,
      EARTH_RADIUS + CLOUD_ALTITUDE,
    ])
    this.primitive = viewer.scene.primitives.add(
      new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.EllipsoidGeometry({
            radii,
            stackPartitions: 48,
            slicePartitions: 96,
          }),
        }),
        appearance: new Cesium.EllipsoidSurfaceAppearance({
          material: Cesium.Material.fromType('Image', {
            image: '/textures/earth-clouds.png',
          }),
          flat: true,
          translucent: true,
          aboveGround: true,
        }),
        asynchronous: true,
        show: false, // 默认关闭(性能优先,见 PERFORMANCE-RULES)
      }),
    )

    // 每帧缓慢西移
    const rotation = new Cesium.Matrix3()
    const model = new Cesium.Matrix4()
    this.removePreRender = viewer.scene.preRender.addEventListener(() => {
      if (!this.primitive || !this.primitive.show) return
      const angle = (Date.now() / 1000) * ROTATION_SPEED
      Cesium.Matrix4.fromRotationTranslation(
        Cesium.Matrix3.fromRotationZ(angle, rotation),
        Cesium.Cartesian3.ZERO,
        model,
      )
      this.primitive.modelMatrix = model
    })
  }

  setVisible(visible: boolean): void {
    if (this.primitive) this.primitive.show = visible
  }

  destroy(): void {
    this.removePreRender?.()
    this.removePreRender = null
    if (this.primitive && this.viewer && !this.viewer.isDestroyed()) {
      this.viewer.scene.primitives.remove(this.primitive)
    }
    this.primitive = null
    this.viewer = null
  }
}
