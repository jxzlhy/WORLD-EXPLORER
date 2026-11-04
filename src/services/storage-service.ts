/**
 * 本地存储服务 — MY WORLD 模块的持久化底座。
 * V0.1 使用 localStorage(数据量小:收藏/足迹);接口已抽象,
 * 未来扩展路线/笔记等大体量数据时切换为 IndexedDB(Dexie),调用方无感。
 */
const NAMESPACE = 'world-explorer:v1'

function fullKey(key: string): string {
  return `${NAMESPACE}:${key}`
}

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(fullKey(key))
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(fullKey(key), JSON.stringify(value))
  } catch {
    // 隐私模式/配额满时静默降级:应用仍可运行,只是不持久化
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(fullKey(key))
  } catch {
    /* ignore */
  }
}

/** 导出用户全部数据(MY WORLD · JSON 导出) */
export function exportAll(): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  try {
    const prefix = `${NAMESPACE}:`
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(prefix)) {
        out[k.slice(prefix.length)] = JSON.parse(localStorage.getItem(k) ?? 'null')
      }
    }
  } catch {
    /* ignore */
  }
  return out
}

/** 导入用户数据(MY WORLD · JSON 导入,覆盖同 key) */
export function importAll(data: Record<string, unknown>): number {
  let count = 0
  for (const [key, value] of Object.entries(data)) {
    saveJson(key, value)
    count++
  }
  return count
}
