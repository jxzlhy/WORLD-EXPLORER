import type { IWorldEngine } from './types'

/**
 * 引擎实例的应用级持有者。
 * ExploreView 创建并注入,其余 UI 一律通过 getEngine() 只读访问。
 */
let engine: IWorldEngine | null = null

export function setEngine(instance: IWorldEngine | null): void {
  engine = instance
  if (import.meta.env.DEV) {
    ;(window as unknown as Record<string, unknown>).__WE_ENGINE__ = instance
  }
}

export function getEngine(): IWorldEngine | null {
  return engine
}
