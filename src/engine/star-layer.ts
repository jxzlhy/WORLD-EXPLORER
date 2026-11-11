import * as Cesium from 'cesium'

/**
 * 星空层(V1.0 收官)—— 程序化银河,零素材零许可。
 * 背景:均匀球面星点 ~2200 颗;银河:沿倾斜大圆的高斯分布点带 ~3000 颗,
 * 银心方向增密增亮。全部 PointPrimitive,渲染开销极小;quality=low 时整层隐藏。
 */

/** 种子随机(确定性视觉,同一构建每次相同) */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Box–Muller 高斯采样 */
function gauss(rand: () => number): number {
  const u = Math.max(rand(), 1e-9)
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export interface StarDirection {
  /** 单位方向向量(ECEF 近似,天球半径无关) */
  x: number
  y: number
  z: number
  /** 亮度 0-1 */
  brightness: number
  /** 颜色调:0 白 / 1 蓝白 / 2 暖白 */
  tone: number
}

/** 银河大圆:绕 X 轴倾斜 60° 的赤道大圆(视觉近似银道面) */
const GALACTIC_TILT = (60 * Math.PI) / 180

/**
 * 生成星空方向纯函数(可单测):背景均匀球面 + 银河高斯带。
 * 银带内点按银经高斯聚拢形成「银心增密」。
 */
export function generateStarDirections(
  backgroundCount = 2200,
  milkyWayCount = 3000,
  seed = 20261112,
): StarDirection[] {
  const rand = mulberry32(seed)
  const out: StarDirection[] = []

  const addDir = (x: number, y: number, z: number, brightBias = 0): void => {
    const len = Math.hypot(x, y, z) || 1
    out.push({
      x: x / len,
      y: y / len,
      z: z / len,
      brightness: Math.min(1, 0.35 + rand() * 0.45 + brightBias),
      tone: rand() < 0.72 ? 0 : rand() < 0.6 ? 1 : 2,
    })
  }

  // —— 背景星:均匀球面 ——
  for (let i = 0; i < backgroundCount; i++) {
    const u = rand() * 2 - 1
    const phi = rand() * 2 * Math.PI
    const r = Math.sqrt(1 - u * u)
    addDir(r * Math.cos(phi), u, r * Math.sin(phi))
  }

  // —— 银河带:赤道大圆倾斜 60°,银经高斯聚拢(银心权重) ——
  for (let i = 0; i < milkyWayCount; i++) {
    // 银经:70% 均匀 + 30% 银心高斯团(λ≈0 处 σ=40°)
    const lambda =
      rand() < 0.7 ? rand() * 2 * Math.PI : gauss(rand) * ((40 * Math.PI) / 180)
    // 银纬:高斯 σ=11°(带内聚拢)
    const beta = gauss(rand) * ((11 * Math.PI) / 180)
    // 大圆上单位向量:赤道面 (cosλ, 0, sinλ),再绕 X 轴倾斜
    const x0 = Math.cos(lambda)
    const z0 = Math.sin(lambda)
    const y = z0 * Math.sin(GALACTIC_TILT) + Math.sin(beta) * Math.cos(GALACTIC_TILT)
    const z = z0 * Math.cos(GALACTIC_TILT) - Math.sin(beta) * Math.sin(GALACTIC_TILT)
    const brightBias = Math.abs(beta) < 0.08 ? 0.2 : 0 // 银道面核心更亮
    addDir(x0, y, z, brightBias)
  }

  return out
}

/** 星点天球半径(相机最远 6e7m,点始终在外围) */
const STAR_RADIUS = 9e7

const STAR_TONES: Cesium.Color[] = [
  Cesium.Color.WHITE,
  Cesium.Color.fromCssColorString('#cfe2ff'), // 蓝白
  Cesium.Color.fromCssColorString('#ffe9c4'), // 暖白
]

export class StarLayer {
  private points: Cesium.PointPrimitiveCollection | null = null

  load(viewer: Cesium.Viewer): void {
    const dirs = generateStarDirections()
    this.points = new Cesium.PointPrimitiveCollection()
    for (const s of dirs) {
      this.points.add({
        position: new Cesium.Cartesian3(s.x * STAR_RADIUS, s.y * STAR_RADIUS, s.z * STAR_RADIUS),
        pixelSize: s.brightness > 0.75 ? 2 : 1.4,
        color: STAR_TONES[s.tone]!.withAlpha(s.brightness * 0.9),
        disableDepthTestDistance: 0, // 尊重深度:被地球遮挡的星不显示
      })
    }
    viewer.scene.primitives.add(this.points)
  }

  /** 性能联动:low 档整层隐藏 */
  setVisible(visible: boolean): void {
    if (this.points) this.points.show = visible
  }

  destroy(viewer: Cesium.Viewer): void {
    if (!this.points) return
    // remove 默认即销毁该 primitive(Cesium 类型此处仅声明单参)
    viewer.scene.primitives.remove(this.points)
    this.points = null
  }
}
