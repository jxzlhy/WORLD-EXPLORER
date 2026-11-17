/**
 * 纪年解析单元测试 — parseEraYear 纯函数(V3.0 时间机器底座)
 * 覆盖:数字年/约前/公元N世纪/N世纪/BC/不可解析。
 */
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { parseEraYear } from '../../src/domain/types.ts'

describe('parseEraYear — 纪年解析', () => {
  it('普通数字年', () => {
    assert.equal(parseEraYear('1000年'), 1000)
    assert.equal(parseEraYear('1950年'), 1950)
    assert.equal(parseEraYear('930年前后'), 930)
    assert.equal(parseEraYear('1944年'), 1944)
  })

  it('公元前(负数)', () => {
    assert.equal(parseEraYear('约前447年'), -447)
    assert.equal(parseEraYear('前2567年'), -2567)
    assert.equal(parseEraYear('2567 BC'), -2567)
  })

  it('世纪取起始年', () => {
    assert.equal(parseEraYear('公元1世纪'), 1)
    assert.equal(parseEraYear('18世纪'), 1701)
    assert.equal(parseEraYear('公元前4世纪'), -400)
  })

  it('不可解析(史前/无数字)→ null', () => {
    assert.equal(parseEraYear('旧石器时代'), null)
    assert.equal(parseEraYear('中世纪'), null)
    assert.equal(parseEraYear(''), null)
  })
})
