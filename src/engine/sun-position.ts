/**
 * 太阳位置计算(纯函数,可单元测试)
 *
 * 低精度天文算法(《Astronomical Almanac》低精度公式),视误差 <0.01°,远超视觉需求。
 * 供昼夜合成器与验证脚本共用;公式说明见 docs/08-RESEARCH/TECH-RESEARCH-REPORT.md §4。
 */

export interface SunSubPoint {
  /** 日下点经度(度,[-180,180]) */
  subLon: number
  /** 日下点纬度 = 太阳赤纬(度) */
  subLat: number
}

const DEG = Math.PI / 180

/** 计算指定时刻的太阳日下点(WGS84 经纬度) */
export function sunSubPoint(date: Date): SunSubPoint {
  const jd = date.getTime() / 86_400_000 + 2440587.5 // 儒略日
  const n = jd - 2451545.0 // 自 J2000.0 起的天数

  // 平黄经与平近点角
  const L = (280.46 + 0.9856474 * n) % 360
  const g = ((357.528 + 0.9856003 * n) % 360) * DEG

  // 真黄经(含中心差修正)
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG

  // 黄赤交角(缓慢长期变化)
  const eps = (23.439 - 0.0000004 * n) * DEG

  // 赤纬与赤经
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda))
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda))

  // 格林尼治平恒星时(度)→ 日下点经度
  const gmst = (280.46061837 + 360.98564736629 * n) % 360
  let subLon = ((ra * 180) / Math.PI - gmst) % 360
  if (subLon > 180) subLon -= 360
  if (subLon < -180) subLon += 360

  return { subLon, subLat: (dec * 180) / Math.PI }
}
