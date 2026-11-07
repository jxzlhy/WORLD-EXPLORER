/**
 * 探索足迹单元测试 — addExplored 纯函数(V4.5 探索进度底座)
 * 语义:去重、单调不减、原数组不被修改。
 */
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { addExplored } from '../../src/stores/explore-store.ts'

describe('addExplored — 已探索足迹追加', () => {
  it('新 id 追加到尾部', () => {
    assert.deepEqual(addExplored(['a', 'b'], 'c'), ['a', 'b', 'c'])
  })

  it('已有 id 去重(返回等价列表,不重复)', () => {
    assert.deepEqual(addExplored(['a', 'b', 'c'], 'b'), ['a', 'b', 'c'])
  })

  it('重复追加不改变长度(单调不减)', () => {
    let list = addExplored([], 'x')
    list = addExplored(list, 'x')
    list = addExplored(list, 'x')
    assert.equal(list.length, 1)
    assert.deepEqual(list, ['x'])
  })

  it('不修改原数组(不可变更新)', () => {
    const original = ['a']
    addExplored(original, 'b')
    assert.deepEqual(original, ['a'])
  })
})
