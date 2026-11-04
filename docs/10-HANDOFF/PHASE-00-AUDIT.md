# PHASE 00 — 项目审计报告

> 执行时间:2026-11-05 01:07–01:12(CST)
> 执行者:ZCode(WORLD EXPLORER 自主研发团队)
> 证据等级:**V**(全部条目为实际执行结果)

## 1. 工作区现状

| 检查项 | 结果 |
| --- | --- |
| 工作目录 | `/Users/admin/Desktop/jxz/AI项目/3D交互式全球旅行地图` |
| 初始内容 | **空项目**(仅 `.mimosa`/`.v2c` 插件缓存目录) |
| Git 仓库 | 不存在(本次执行中初始化) |
| 已有代码/页面/3D 引擎 | 无 |
| 已有设计规范/数据 | 无 |

结论:按指令 PART 13「空项目」分支处理——建立完整项目骨架、基础配置与文档结构,保留成果原则不适用。

## 2. 工具链检查(V,实测)

| 工具 | 版本 | 备注 |
| --- | --- | --- |
| Node.js | v25.9.0 | 满足 Vite 7 要求(≥20) |
| pnpm | v10.33.0 | 主包管理器 |
| TypeScript | 5.9.3(vue-tsc 5.9.3) | strict 模式 |
| Git | 2.53.0 | 本地提交正常 |
| macOS | darwin 24.6.0 arm64 | Apple Silicon,120Hz 显示屏(FPS 实测 107–120) |

## 3. 网络可达性(V,实测 200)

- registry.npmjs.org ✓
- unpkg.com ✓
- raw.githubusercontent.com ✓
- commons.wikimedia.org / upload.wikimedia.org / thumb.wikimedia.org ✓
- gibs.earthdata.nasa.gov(后续瓦片服务,已接入)

注意:本机经代理上网,DNS 呈 fake-ip(198.18.0.0/15);资源抓取脚本已做相应处理(见 `experiments/fetch-media-samples.py`)。

## 4. 风险与决策预登记

1. **Cesium ion 云服务不使用**(指令 PART 09 红线):所有影像/地形本地化或使用免 key 公共服务。
2. **ZCode 浏览器宿主在窗口被遮挡时会暂停 requestAnimationFrame**:自动化验收需在面板可见时进行(已在 QA 记录)。
3. pnpm 默认拦截依赖构建脚本(esbuild postinstall),实测不影响 vite 运行(二进制来自平台可选依赖)。

## 5. 产出

- 本报告。
- 项目骨架(见 PHASE 02 报告与 SYSTEM-ARCHITECTURE.md)。
