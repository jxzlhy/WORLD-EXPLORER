import type { QualityMode } from '../engine/types'

/**
 * FPS 自动降档守门(V5.0 迭代十四)— 性能红线自动化。
 *
 * 设计:
 * - 仅降不升:自动降档只向下走(high→balanced→low),恢复画质永远是用户的显式选择;
 * - opt-in:默认关闭——自动改变用户画质会造成意外,LeftRail 有显式开关;
 * - 持续判定:低于阈值连续 N 次(每秒采样)才降档,瞬时掉帧不触发;
 * - 决策为纯函数(可单测),服务类只做采样与接线。
 */

/** 各档位的降档阈值(平均 FPS 低于该值视为过载) */
export const FPS_DEGRADE_THRESHOLDS: Record<Exclude<QualityMode, 'low'>, number> = {
  high: 24,
  balanced: 18,
}

/** 连续低帧采样次数(秒)达标才降档 */
export const LOW_FPS_STREAK = 6

/** 纯决策:当前档位下,该帧率是否应降档;返回下一档或 null */
export function nextQualityOnFps(current: QualityMode, avgFps: number): QualityMode | null {
  if (current === 'high' && avgFps < FPS_DEGRADE_THRESHOLDS.high) return 'balanced'
  if (current === 'balanced' && avgFps < FPS_DEGRADE_THRESHOLDS.balanced) return 'low'
  return null
}

/** 降档提示文案( StatusBar 展示) */
export function degradeNote(to: QualityMode): string {
  return `帧率偏低,画质已自动调至「${to === 'balanced' ? '均衡' : '低'}」`
}

/**
 * 守门服务:每秒采样 ui.fps,持续低于阈值则调用 onDegrade。
 * start/stop 由 ExploreView 生命周期接线(RESOURCE-LIFECYCLE 约定)。
 */
export class PerformanceGuard {
  private timer: ReturnType<typeof setInterval> | null = null
  private lowStreak = 0

  start(
    getFps: () => number,
    getQuality: () => QualityMode,
    onDegrade: (from: QualityMode, to: QualityMode) => void,
  ): void {
    this.stop()
    this.lowStreak = 0
    this.timer = setInterval(() => {
      const current = getQuality()
      const next = nextQualityOnFps(current, getFps())
      if (next) {
        this.lowStreak++
        if (this.lowStreak >= LOW_FPS_STREAK) {
          this.lowStreak = 0
          onDegrade(current, next)
        }
      } else {
        this.lowStreak = 0
      }
    }, 1000)
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}
