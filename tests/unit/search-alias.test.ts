/**
 * 搜索索引单元测试 — 别名匹配(V0.3 遗留项)
 * useSearchIndex 的 computed/ref 可脱离组件独立运行,node:test 直接验证。
 */
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { useSearchIndex } from '../../src/stores/explore-store.ts'
import type { Destination } from '../../src/domain/types.ts'

const DEST = (id: string, name: string, nameEn: string, aliases?: string[]): Destination => ({
  id,
  name,
  nameEn,
  type: 'heritage',
  countryId: 'FR',
  longitude: 0,
  latitude: 0,
  summary: 's',
  story: ['a', 'b'],
  tags: ['t'],
  sources: [{ name: 'n', url: 'u', license: 'l', checkedAt: '2026-11-05' }],
  quality: 'S',
  updatedAt: '2026-11-05',
  aliases,
})

function makeIndex(destinations: Destination[]) {
  return useSearchIndex(() => ({ countries: [], cities: [], destinations }))
}

describe('搜索别名匹配', () => {
  it('异译「艾菲尔」命中埃菲尔铁塔', () => {
    const idx = makeIndex([
      DEST('fr-eiffel-tower', '埃菲尔铁塔', 'Eiffel Tower', ['艾菲尔铁塔', '巴黎铁塔']),
    ])
    idx.query.value = '艾菲尔'
    const ids = idx.results.value.map((r) => r.id)
    assert.ok(ids.includes('dest:fr-eiffel-tower'), `别名「艾菲尔」未命中: ${ids}`)
  })

  it('通称「金字塔」命中吉萨金字塔群', () => {
    const idx = makeIndex([
      DEST('eg-giza-pyramids', '吉萨金字塔群', 'Pyramids of Giza', ['金字塔', '胡夫金字塔']),
    ])
    idx.query.value = '金字塔'
    assert.ok(idx.results.value.some((r) => r.id === 'dest:eg-giza-pyramids'))
  })

  it('「紫禁城」命中北京故宫', () => {
    const idx = makeIndex([
      DEST('cn-forbidden-city', '北京故宫', 'The Forbidden City', ['紫禁城', '故宫']),
    ])
    idx.query.value = '紫禁城'
    assert.ok(idx.results.value.some((r) => r.id === 'dest:cn-forbidden-city'))
  })

  it('正常名搜索不受影响(回归位)', () => {
    const idx = makeIndex([DEST('cn-great-wall', '万里长城', 'The Great Wall')])
    idx.query.value = '长城'
    assert.ok(idx.results.value.some((r) => r.id === 'dest:cn-great-wall'))
  })

  it('无结果时返回空数组(键盘越界修复的回归位)', () => {
    const idx = makeIndex([DEST('fr-eiffel-tower', '埃菲尔铁塔', 'Eiffel Tower')])
    idx.query.value = '完全不存在的地点xyz'
    assert.deepEqual(idx.results.value, [])
  })

  it('人物条目可被搜索(人物名命中)', () => {
    const idx = useSearchIndex(() => ({
      countries: [],
      cities: [],
      destinations: [],
      people: [
        {
          id: 'person-li-bing',
          name: '李冰',
          nameEn: 'Li Bing',
          roles: ['战国水利家'],
          summary: '都江堰总设计师',
          story: ['a'],
          relatedDestinationIds: ['cn-dujiangyan'],
          sources: [],
          quality: 'A',
        } as never,
      ],
    }))
    idx.query.value = '李冰'
    const ids = idx.results.value.map((r) => r.id)
    assert.ok(ids.includes('person:person-li-bing'), `人物未命中: ${ids}`)
  })
})
