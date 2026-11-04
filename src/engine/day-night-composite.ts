/**
 * 昼夜逐像素合成器(V0.2 Phase 03,I-05)
 *
 * 思路:把「日间贴图 + 夜间灯光」按真实太阳位置做 per-pixel 合成,输出单张画布,
 * 作为唯一底图上传 —— 晨昏线为真实逐像素过渡,城市灯光只出现在夜侧。
 *
 * 为什么不用自定义 Globe Surface Shader:Cesium 的 GlobeSurfaceShader 属内部 API,
 * 跨版本不稳定(任务书 PART 4.1 明确要求验证稳定性);本方案只用公开 API + 标准低精度天文算法。
 *
 * 数据:NASA Blue/Black Marble(Public Domain),与 V0.1 相同的本地贴图。
 */

const DAY_URL = '/textures/earth-blue-marble.jpg'
const NIGHT_URL = '/textures/earth-night.jpg'

/** 晨昏带:太阳仰角从 -12°(民用晨昏)到 +3° 平滑过渡到日侧 */
const TWILIGHT_START_DEG = -12
const TWILIGHT_END_DEG = 3

interface LoadedImage {
  image: HTMLImageElement
  width: number
  height: number
}

export class DayNightCompositor {
  private day: LoadedImage | null = null
  private night: LoadedImage | null = null
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null

  async init(): Promise<void> {
    const [day, night] = await Promise.all([loadImage(DAY_URL), loadImage(NIGHT_URL)])
    this.day = day
    this.night = night
    this.canvas = document.createElement('canvas')
    this.canvas.width = day.width
    this.canvas.height = day.height
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })
    if (!this.ctx) throw new Error('Canvas 2D 上下文不可用')
  }

  get ready(): boolean {
    return this.ctx !== null && this.day !== null
  }

  /** 合成指定时刻的地球昼夜画布(返回复用的内部画布) */
  compositeToDate(date: Date): HTMLCanvasElement {
    if (!this.ctx || !this.day || !this.night || !this.canvas) {
      throw new Error('合成器未初始化')
    }
    const w = this.canvas.width
    const h = this.canvas.height
    const ctx = this.ctx

    ctx.drawImage(this.day.image, 0, 0, w, h)
    const dayData = ctx.getImageData(0, 0, w, h)
    const nightCtx = document.createElement('canvas').getContext('2d')
    if (!nightCtx) throw new Error('Canvas 2D 上下文不可用')
    nightCtx.canvas.width = w
    nightCtx.canvas.height = h
    nightCtx.drawImage(this.night.image, 0, 0, w, h)
    const nightData = nightCtx.getImageData(0, 0, w, h)

    const dpx = dayData.data
    const npx = nightData.data

    // —— 太阳位置(低精度天文算法,视误差 <0.01°) ——
    const jd = date.getTime() / 86_400_000 + 2440587.5
    const n = jd - 2451545.0 // J2000 起的天数
    const L = (280.46 + 0.9856474 * n) % 360
    const g = ((357.528 + 0.9856003 * n) % 360) * (Math.PI / 180)
    const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * (Math.PI / 180)
    const eps = (23.439 - 0.0000004 * n) * (Math.PI / 180)
    const dec = Math.asin(Math.sin(eps) * Math.sin(lambda)) // 太阳赤纬 δ
    const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) // 赤经 α
    const gmst = (280.46061837 + 360.98564736629 * n) % 360
    let subLon = ((ra * 180) / Math.PI - gmst) % 360 // 日下点经度
    if (subLon > 180) subLon -= 360
    if (subLon < -180) subLon += 360

    const sinDec = Math.sin(dec)
    const cosDec = Math.cos(dec)

    // 预计算:每列时角余弦、每行纬度正余弦
    const cosH = new Float64Array(w)
    for (let x = 0; x < w; x++) {
      const lon = (x / (w - 1)) * 360 - 180
      cosH[x] = Math.cos(((lon - subLon) * Math.PI) / 180)
    }
    const sinLat = new Float64Array(h)
    const cosLat = new Float64Array(h)
    for (let y = 0; y < h; y++) {
      const lat = 90 - (y / (h - 1)) * 180
      sinLat[y] = Math.sin((lat * Math.PI) / 180)
      cosLat[y] = Math.cos((lat * Math.PI) / 180)
    }

    // 晨昏带(cosZ 从 cos(102°) 到 cos(87°) 平滑过渡)
    const cosStart = Math.cos(((90 - TWILIGHT_START_DEG) * Math.PI) / 180)
    const cosEnd = Math.cos(((90 - TWILIGHT_END_DEG) * Math.PI) / 180)
    const span = cosEnd - cosStart

    for (let y = 0; y < h; y++) {
      const rowDay = sinLat[y]! * sinDec
      const rowNight = cosLat[y]! * cosDec
      for (let x = 0; x < w; x++) {
        const cosZ = rowDay + rowNight * cosH[x]!
        let t: number
        if (cosZ >= cosEnd) {
          t = 1 // 纯日侧
        } else if (cosZ <= cosStart) {
          t = 0 // 纯夜侧
        } else {
          const u = (cosZ - cosStart) / span
          t = u * u * (3 - 2 * u) // smoothstep
        }
        if (t === 1) continue // 保留 day 像素,零写入
        const idx = (y * w + x) * 4
        if (t === 0) {
          // 纯夜侧:夜灯(轻提亮)+ 少量环境蓝,避免死黑
          dpx[idx] = Math.min(255, npx[idx]! * 1.08 + 5)
          dpx[idx + 1] = Math.min(255, npx[idx + 1]! * 1.08 + 9)
          dpx[idx + 2] = Math.min(255, npx[idx + 2]! * 1.1 + 14)
          dpx[idx + 3] = 255
        } else {
          dpx[idx] = dpx[idx]! * t + npx[idx]! * (1 - t)
          dpx[idx + 1] = dpx[idx + 1]! * t + npx[idx + 1]! * (1 - t)
          dpx[idx + 2] = dpx[idx + 2]! * t + npx[idx + 2]! * (1 - t)
          dpx[idx + 3] = 255
        }
      }
    }
    ctx.putImageData(dayData, 0, 0)
    return this.canvas
  }
}

function loadImage(url: string): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () =>
      resolve({ image, width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error(`贴图加载失败:${url}`))
    image.src = url
  })
}
