/**
 * 数据校验器单元测试(node:test,零依赖;Node 25 原生类型剥离直接运行 .ts)
 * 运行:pnpm test:unit
 */
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import {
  parseMyWorldImport,
  sanitizeStringList,
  sanitizeNotes,
  destinationCompleteness,
  isStringArray,
} from '../../src/services/data-validator.ts'

const KNOWN = new Set(['cn-great-wall', 'jp-mount-fuji', 'eg-giza-pyramids'])

describe('parseMyWorldImport — P0 数据安全回归', () => {
  it('合法导出文件(包裹形态)通过并统计', () => {
    const raw = JSON.stringify({
      app: 'WORLD EXPLORER',
      schema: 'my-world/v1',
      data: { favorites: ['cn-great-wall'], notes: {} },
    })
    const r = parseMyWorldImport(raw, KNOWN)
    assert.equal(r.ok, true)
    if (r.ok) {
      assert.deepEqual(r.data.favorites, ['cn-great-wall'])
      assert.equal(r.stats.favorites, 1)
    }
  })

  it('裸数据形态(无 schema 包裹)兼容', () => {
    const r = parseMyWorldImport(JSON.stringify({ favorites: ['jp-mount-fuji'] }), KNOWN)
    assert.equal(r.ok, true)
  })

  it('拒绝:非法 JSON', () => {
    const r = parseMyWorldImport('{not json', KNOWN)
    assert.equal(r.ok, false)
    if (!r.ok) assert.match(r.error, /JSON/)
  })

  it('拒绝:非对象顶层', () => {
    const r = parseMyWorldImport(JSON.stringify([1, 2, 3]), KNOWN)
    assert.equal(r.ok, false)
  })

  it('拒绝:未知 schema 版本(修复前的 P0 缺陷回归位)', () => {
    const r = parseMyWorldImport(
      JSON.stringify({ schema: 'unknown/v9', data: { favorites: 'not-an-array' } }),
      KNOWN,
    )
    assert.equal(r.ok, false)
    if (!r.ok) assert.match(r.error, /版本/)
  })

  it('拒绝:favorites 非字符串数组(类型攻击面)', () => {
    const r = parseMyWorldImport(JSON.stringify({ favorites: 'not-an-array' }), KNOWN)
    assert.equal(r.ok, false)
    if (!r.ok) assert.match(r.error, /字符串数组/)
  })

  it('拒绝:无任何已识别字段', () => {
    const r = parseMyWorldImport(JSON.stringify({ hello: 'world' }), KNOWN)
    assert.equal(r.ok, false)
  })

  it('剔除未知目的地 ID 并生成警告', () => {
    const r = parseMyWorldImport(
      JSON.stringify({ favorites: ['cn-great-wall', 'xx-unknown', 42] }),
      KNOWN,
    )
    assert.equal(r.ok, true)
    if (r.ok) {
      assert.deepEqual(r.data.favorites, ['cn-great-wall'])
      assert.ok(r.warnings.length >= 1)
    }
  })

  it('notes 非字符串表被拒绝', () => {
    const r = parseMyWorldImport(JSON.stringify({ notes: { a: 1 } }), KNOWN)
    assert.equal(r.ok, false)
  })

  it('合法 notes 通过且未知键被剔除', () => {
    const r = parseMyWorldImport(
      JSON.stringify({ notes: { 'cn-great-wall': '好', 'zz': 'drop' } }),
      KNOWN,
    )
    assert.equal(r.ok, true)
    if (r.ok) assert.deepEqual(r.data.notes, { 'cn-great-wall': '好' })
  })
})

describe('消毒函数', () => {
  it('sanitizeStringList 去重(混合类型数组整体拒绝是契约)', () => {
    assert.deepEqual(sanitizeStringList(['a', 'a', 'b']), ['a', 'b'])
    assert.deepEqual(sanitizeStringList(['a', 1, 'b']), []) // 含非字符串→整体拒绝
    assert.deepEqual(sanitizeStringList('garbage'), [])
  })

  it('sanitizeNotes 非法形态退回空表', () => {
    assert.deepEqual(sanitizeNotes([['x']]), {})
    assert.deepEqual(sanitizeNotes({ a: 'ok' }), { a: 'ok' })
  })
})

describe('destinationCompleteness — S/A/B 分级', () => {
  it('完整记录为 S', () => {
    assert.equal(
      destinationCompleteness({
        summary: 'x',
        story: ['a', 'b'],
        tags: ['t'],
        sources: [{ name: 's' }],
      }),
      'S',
    )
  })
  it('缺故事标签降为 A/B', () => {
    assert.equal(
      destinationCompleteness({ summary: 'x', story: ['a'], sources: [{}] }),
      'A',
    )
    assert.equal(destinationCompleteness({ summary: 'x' }), 'B')
  })
})

describe('isStringArray', () => {
  it('空数组合法', () => {
    assert.equal(isStringArray([]), true)
  })
})
