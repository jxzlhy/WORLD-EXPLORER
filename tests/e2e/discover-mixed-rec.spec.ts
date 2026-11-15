import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 — DiscoverBar 三合一混合轮换(迭代二十四):
 * 播种日本足迹 → 芯片轮换覆盖 目的地×3 / 国度×1 / 城市×1 五种推荐
 * → 城市 entry 点击 → flyToCity 打开城市面板。
 */
test('DiscoverBar 混合推荐:五档轮换覆盖三种粒度 + 城市直达', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'world-explorer:v1:explored',
      JSON.stringify(['jp-kinkaku-ji', 'jp-fushimi-inari']),
    )
  })
  await waitForAppReady(page)

  const chip = page.locator('.discover-bar .rec-chip')
  await expect(chip).toBeVisible()

  // ↻ 轮换一周,收集 kind 与 name
  const kinds: string[] = []
  const names: string[] = []
  for (let i = 0; i < 5; i++) {
    kinds.push(await chip.locator('.kind').textContent().then((t) => t?.trim() ?? ''))
    names.push(await chip.locator('.name').textContent().then((t) => t?.trim() ?? ''))
    await chip.locator('.swap').click()
  }
  // 三种粒度全部出现
  expect(new Set(kinds)).toEqual(new Set(['目的地', '国度', '城市']))
  // 城市 entry 是京都(足迹动量)
  expect(names).toContain('京都')
  // 目的地 entries 是日本未探索地点(3 个)
  const destCount = kinds.filter((k) => k === '目的地').length
  expect(destCount).toBe(3)

  // 轮换到「城市」entry 再点击 → 城市面板打开
  let guard = 0
  while (guard++ < 6) {
    const kind = (await chip.locator('.kind').textContent())?.trim()
    if (kind === '城市') break
    await chip.locator('.swap').click()
  }
  await expect(chip.locator('.kind')).toHaveText('城市')
  await chip.locator('.name').click()
  await expect(page.locator('.detail-panel .name')).toHaveText('京都')
})
