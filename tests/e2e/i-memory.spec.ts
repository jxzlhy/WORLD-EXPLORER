import { expect, test, type CDPSession } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 I(V0.3)— 内存回归:反复加载页面(每次完整走 引擎创建→销毁),
 * 强制 GC 后采集 JSHeapUsedSize,断言不出现线性增长(资源泄漏)。
 *
 * 方法:CDP HeapProfiler.collectGarbage + Performance.getMetrics。
 * 容差:允许 JIT/贴图缓存合理波动,但末轮中位均值不得超过首轮的 1.8 倍。
 */
async function measureHeap(client: CDPSession): Promise<number> {
  await client.send('HeapProfiler.collectGarbage')
  await client.send('HeapProfiler.collectGarbage') // 双次 GC 回收孤立对象
  await pageSleep(300)
  const { metrics } = (await client.send('Performance.getMetrics')) as {
    metrics: Array<{ name: string; value: number }>
  }
  const heap = metrics.find((m) => m.name === 'JSHeapUsedSize')
  if (!heap) throw new Error('JSHeapUsedSize 不可用')
  return heap.value / 1024 / 1024 // MB
}

function pageSleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

test('I. 反复初始化引擎,堆内存无线性增长', async ({ page }) => {
  // 5 轮完整 app 周期(SwiftShader + 套件负载下单轮可达 60s+)
  test.setTimeout(400_000)
  const samples: number[] = []
  const ROUNDS = 5

  for (let round = 0; round < ROUNDS; round++) {
    if (round > 0) await page.reload()
    await waitForAppReady(page)

    const client = await page.context().newCDPSession(page)
    await client.send('Performance.enable')

    // 等待渲染稳定(贴图/编译缓存收敛)后采样
    await pageSleep(1_500)
    const heapMb = await measureHeap(client)
    samples.push(heapMb)
    await client.detach()
  }

  const first = samples[0]!
  const last = samples[ROUNDS - 1]!
  const growth = last / first

  // 失败时输出完整采样序列便于定位泄漏源
  expect(growth, `堆增长 ${growth.toFixed(2)}x(采样:${samples.map((s) => s.toFixed(1)).join(' → ')}MB)`, ).toBeLessThan(1.8)
})
