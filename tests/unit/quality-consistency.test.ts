/**
 * 数据分级一致性测试 — 真实数据 × destinationCompleteness 口径(2026-11-11 一致性回填后加入)
 * 防回归:以后新增目的地批次,quality 字段必须与 validator 口径一致(S:summary+story≥2+sources+tags)。
 * 曾因批次回填欠账,82 篇内容达标却标注 A——本测试防止再次脱节。
 */
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { destinationCompleteness } from '../../src/services/data-validator.ts'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const destDir = join(here, '..', '..', 'public', 'data', 'destinations')

describe('真实数据 × 分级口径一致性', () => {
  const files = readdirSync(destDir).filter((f) => f.endsWith('.json'))

  it(`全部目的地 quality 与 destinationCompleteness 一致(${files.length} 个批次文件)`, () => {
    assert.ok(files.length >= 10, '批次文件应存在')
    let count = 0
    for (const f of files) {
      const arr = JSON.parse(readFileSync(join(destDir, f), 'utf-8')) as Array<Record<string, unknown>>
      for (const d of arr) {
        count++
        const expected = destinationCompleteness({
          summary: d.summary,
          story: d.story,
          tags: d.tags,
          sources: d.sources,
        })
        assert.equal(
          d.quality,
          expected,
          `${d.id} 的 quality=${d.quality} 与口径 ${expected} 不一致`,
        )
      }
    }
    assert.equal(count, 150, '目的地总数应为 150')
  })
})
