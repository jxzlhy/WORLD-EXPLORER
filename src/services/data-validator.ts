import type { QualityLevel } from '../domain/types'

/**
 * 轻量运行时校验器(零依赖决策,见 DEPENDENCY-REGISTRY)。
 * 数据规模(10² 记录级)下,自写校验比引入 zod/valibot 更符合「不为单一功能引入重依赖」红线。
 */

export function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string')
}

export function isNotes(v: unknown): v is Record<string, string> {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    Object.values(v).every((x) => typeof x === 'string')
  )
}

export interface MyWorldData {
  favorites: string[]
  visited: string[]
  wantToGo: string[]
  notes: Record<string, string>
}

export type ImportResult =
  | {
      ok: true
      data: MyWorldData
      stats: { favorites: number; visited: number; wantToGo: number; notes: number; droppedIds: number }
      warnings: string[]
    }
  | { ok: false; error: string }

const LIST_LIMIT = 999

/** 解析并校验 MY WORLD 导入文件;仅接受已知结构,未知字段拒绝 */
export function parseMyWorldImport(raw: string, knownIds: Set<string>): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: '不是有效的 JSON 文件' }
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: '文件结构不正确' }
  }
  const obj = parsed as Record<string, unknown>

  // 兼容两种形态:导出包裹 {app,schema,data} 或裸数据
  const schema = typeof obj['schema'] === 'string' ? obj['schema'] : undefined
  if (schema !== undefined && schema !== 'my-world/v1') {
    return { ok: false, error: `不支持的导出版本:${schema}` }
  }
  const src = (schema !== undefined ? obj['data'] : obj) as Record<string, unknown> | undefined
  if (typeof src !== 'object' || src === null) {
    return { ok: false, error: '缺少数据区(data)' }
  }

  const warnings: string[] = []
  const readList = (key: string): string[] => {
    const v = src[key]
    if (v === undefined) return []
    if (!isStringArray(v)) {
      throw new TypeError(`字段 ${key} 应为字符串数组`)
    }
    const known = v.filter((id) => knownIds.has(id))
    const dropped = v.length - known.length
    if (dropped > 0) warnings.push(`${key}:忽略 ${dropped} 个未知地点 ID`)
    return [...new Set(known)].slice(0, LIST_LIMIT)
  }

  let favorites: string[]
  let visited: string[]
  let wantToGo: string[]
  try {
    favorites = readList('favorites')
    visited = readList('visited')
    wantToGo = readList('want-to-go')
  } catch (e) {
    return { ok: false, error: e instanceof TypeError ? e.message : '数据字段类型不正确' }
  }

  const rawNotes = src['notes']
  const notes: Record<string, string> = {}
  if (rawNotes !== undefined) {
    if (!isNotes(rawNotes)) return { ok: false, error: '字段 notes 应为字符串键值表' }
    for (const [k, val] of Object.entries(rawNotes)) {
      if (knownIds.has(k)) notes[k] = val
    }
  }

  const recognized =
    src['favorites'] !== undefined ||
    src['visited'] !== undefined ||
    src['want-to-go'] !== undefined ||
    src['notes'] !== undefined
  if (!recognized) return { ok: false, error: '文件中不包含 MY WORLD 数据' }

  return {
    ok: true,
    data: { favorites, visited, wantToGo, notes },
    stats: {
      favorites: favorites.length,
      visited: visited.length,
      wantToGo: wantToGo.length,
      notes: Object.keys(notes).length,
      droppedIds: warnings.length,
    },
    warnings,
  }
}

/** 从本地存储读取时的消毒:任何脏数据都退回空列表,不让坏形态进入 store */
export function sanitizeStringList(v: unknown): string[] {
  if (!isStringArray(v)) return []
  return [...new Set(v)].slice(0, LIST_LIMIT)
}

export function sanitizeNotes(v: unknown): Record<string, string> {
  return isNotes(v) ? v : {}
}

/** 数据质量分级辅助:目的地记录的完整性评分 */
export function destinationCompleteness(d: {
  summary?: unknown
  story?: unknown
  tags?: unknown
  sources?: unknown
  media?: unknown
}): QualityLevel {
  const hasStory = Array.isArray(d.story) && d.story.length >= 2
  const hasSources = Array.isArray(d.sources) && d.sources.length > 0
  const hasTags = Array.isArray(d.tags) && d.tags.length > 0
  if (d.summary && hasStory && hasSources && hasTags) return 'S'
  if (d.summary && Array.isArray(d.story) && hasSources) return 'A'
  return 'B'
}
