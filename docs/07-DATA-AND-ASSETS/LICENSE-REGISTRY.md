# 许可登记簿(资源逐条)

> 原则:许可不明 = 不使用。商用允许 + 署名要求逐条核对。核验日期 2026-11-05。

## A. 代码与框架

| 资源 | 许可 | 署名要求 |
| --- | --- | --- |
| CesiumJS 1.147 | Apache-2.0 | 保留 LICENSE(引擎 credit 已按需移除 UI 展示,法律声明在包内) |
| Vue / Pinia / Router | MIT | 无 |
| GSAP | 标准"标准GSAP许可"(免费使用) | 无 |
| Fuse.js | Apache-2.0 | 无 |

## B. 贴图与地理数据

| 资源 | 来源 | 许可 | 位置 |
| --- | --- | --- | --- |
| Blue Marble Next Generation | NASA Earth Observatory | Public Domain | `public/textures/earth-blue-marble.jpg` |
| Black Marble(城市灯光) | NASA Earth Observatory | Public Domain | `public/textures/earth-night.jpg` |
| 地形起伏图 | NASA/NOAA(经 three-globe 分发) | Public Domain | `public/textures/earth-topology.png` |
| 星空背景 | Cesium 内置 Assets | Apache-2.0 | `node_modules/cesium/Build/Cesium/Assets` |
| 国家边界 110m | Natural Earth | Public Domain | `public/data/ne_110m_countries.geojson` |

## C. NASA GIBS 瓦片(运行时)

| 资源 | 许可 | 署名 | 降级策略 |
| --- | --- | --- | --- |
| BlueMarble_ShadedRelief_Bathymetry 500m | NASA 开放数据 | 建议署名 NASA EOSDIS GIBS | 请求失败仅显示本地贴图 |

## D. 照片媒体(逐张,与 media-samples.json 同步)

| 文件 | 作者 | 许可 | 原始页面 |
| --- | --- | --- | --- |
| cn-great-wall.jpg | (见 media-samples.json) | CC BY-SA | (见 media-samples.json) |
| cn-forbidden-city.jpg | 同上 | CC BY-SA/CC | 同上 |
| jp-mount-fuji.jpg | 同上 | CC BY-SA | 同上 |
| us-grand-canyon.jpg | 同上 | PD/CC | 同上 |
| fr-eiffel-tower.jpg | Benh LIEU SONG | Public domain | 见 json |
| it-colosseum.jpg | Wilfredor | CC0 | 见 json |
| eg-giza-pyramids.jpg | Petar Milošević | CC BY-SA 4.0 | 见 json |
| pe-machu-picchu.jpg | PIERRE ANDRE LECLERCQ | CC BY-SA 4.0 | 见 json |
| au-sydney-opera-house.jpg | Diliff | CC BY-SA 3.0 | 见 json |
| is-gullfoss.jpg | Diego Delso | CC BY-SA 4.0 | 见 json |

> D 表为索引;**权威数据在 `public/data/media-samples.json`**(含 sourceUrl 与字节数),应用内署名由 DestinationMedia 组件自动叠加。

## E. 文本内容

- 目的地摘要/故事:原创撰写(参考 Wikipedia/UNESCO 事实),每条目 `sources[]` 标注。
- 指令文档归档:用户提供的任务书原文,项目内部使用。

## F. 禁用清单

- 电影剧照/海报/受版权视频(CINEMA 模块素材红线)。
- 许可不明 3D 模型。
- 任何需逐案核实的字体(当前全部使用系统字体栈,零字体资产)。
