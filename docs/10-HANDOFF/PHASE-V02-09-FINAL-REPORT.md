# V0.2 阶段最终报告(QUALITY · IMMERSION · EXPERIENCE)

> 执行时间:2026-11-05 02:35 – 05:00+(CST)· 执行者:ZCode
> 任务书:docs/00-OVERVIEW/V0.2-QUALITY-IMMERSION-EXPERIENCE-DIRECTIVE.md(已归档)
> 对照基线:docs/10-HANDOFF/PHASE-V02-00-BASELINE.md(问题清单 I-01~I-16)

## 1. 问题清单闭环

| # | 问题 | 状态 |
| --- | --- | --- |
| I-01 引擎生命周期竞态 | ✅ 状态机 + initSeq 令牌(99ca569) |
| I-02 ExploreView 异步续体竞态 | ✅ disposed 防护 + watch 统一退订(99ca569) |
| I-03 Cesium credit 被全局隐藏 | ✅ 恢复展示并视觉统一(99ca569) |
| I-04 初始化失败无重试 | ✅ 错误遮罩 + 重新初始化按钮(99ca569) |
| I-05 昼夜整层近似 | ✅ 逐像素合成器(09074f2,截图验证) |
| I-06 标签无防碰撞 | ✅ 屏幕空间网格分桶(988e2fb) |
| I-07 国家中心跨日变线 | ✅ 环绕校正(988e2fb) |
| I-08 单击即停自动旋转 | ✅ 拖动阈值 6px 判定(99ca569) |
| I-09 数据无运行时校验 | ✅ 零依赖校验器(3a295dd) |
| I-10 导入无校验可破坏数据 | ✅ 校验→预览→确认(E2E 证实拦截真实坏数据) |
| I-11 Cesium 未分包 | ✅ 应用 4.48MB→143KB(a9aef94) |
| I-12 导航 disabled 语义混乱 | ✅ PLANNED 单项收纳(a9aef94) |
| I-13 搜索键盘索引越界 | ✅ 结果集变化重置(a9aef94) |
| I-14 移动端布局重叠 | ✅ 抽屉式控制 + 底部重排(5ca5e1f + 后续) |
| I-15 tokens 硬编码 | ⚠️ 部分:主体组件已收敛;残留 rgba 小项列 V0.3 |
| I-16 无自动化测试 | ✅ Playwright A–H 11 用例全绿 |

## 2. V0.2 新增能力(全部实测)

- **昼夜逐像素合成**:低精度天文算法 + smoothstep 晨昏带;夜侧城市灯光 + 环境蓝;5 分钟自动重合成;失败回退静态日图。视觉验证:夜侧/晨昏线双机位截图(headless)。
- **E2E 测试体系**(Playwright 1.64,chromium-headless-shell):A 启动/B 飞行/C 中断/D 连续目标/E 滚动隔离/F 收藏与导入/G 生命周期/H 四档响应式。独立端口 5199。
- **数据安全**:运行时结构校验(坐标范围/关联完整性/重复 ID/媒体降级);MY WORLD 导入改为「校验→预览→确认」,拒绝未知 schema 与类型错误(E2E 用真实坏数据证实拦截——修复前该数据会把收藏覆盖为字符串)。
- **交互升级**:标签防碰撞(150×30px 网格,选中>S>遗产/地标>普通)、悬停放大+pointer、选中呼吸脉冲(reduced-motion 静态回退)、单击与拖动区分。
- **性能**:Cesium/vue 独立分包;低性能模式(resolutionScale+FXAA)。
- **体验**:探索历史(最近 12)、全球视角一键返回、今日精选、MY WORLD 第四标签页、移动端抽屉控制。

## 3. 验证记录(V)

| 关卡 | 结果 |
| --- | --- |
| vue-tsc strict | 零错误 |
| ESLint | 0 error / 2 warning(fix 后) |
| vite build | ✓ 5.5s(cesium 4.25MB 独立块 + 应用 143KB) |
| Playwright E2E | **11/11 通过**(无头 WebGL,SwiftShader 下 FPS 2–7 为软件渲染基线) |
| 真机截图 | 五档视口 + 移动抽屉 + 夜侧/晨昏线(见 test-results/verify,不入库) |

## 4. 未完成 / 决策记录

| 项 | 状态 |
| --- | --- |
| 云层 | 已评估未实现:贴图 CDN 探测失败,许可链无法本会话核实;按红线不接入 |
| 星空 | 评估结论:Cesium 内置满足当前质量,不为换而换(任务书 4.3 允许) |
| Balanced 质量档 | 未单列:Low 档已覆盖低端主诉求,列 V0.3 |
| Heap 自动采集 | 未做,列 V0.3(Playwright CDP) |
| tokens 残留 rgba | 少量,列 V0.3 收敛 |
| GIBS × realtime 互斥 | 设计权衡:日间瓦片会盖住夜灯;realtime 用合成底图,always-day 保留 GIBS |

## 5. 待项目所有者处理

无(零付费、零授权)。完整安全审计(Mimosa 上限截断)仍列为待办,见 V0.1 报告 §7.6。

## 6. Git

提交序列(自 99ca569 起):99ca569 → 5ca5e1f → 09074f2 → 988e2fb → a9aef94 → 5b52af1(报告/版本)。
⚠️ 推送状态:GitHub 于本会话末尾出现代理级 SSL 中断(github.com 与 api.github.com 均 000),
**7 个提交暂存本地,待网络恢复后执行 `git push` 即可**(凭据此前已验证可用,无需 force)。
