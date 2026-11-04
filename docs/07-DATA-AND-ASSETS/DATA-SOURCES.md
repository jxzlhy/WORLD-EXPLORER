# 数据来源登记

> 指令 PART 8.1 要求:每个来源记录官方网址、许可、商用/修改/再分发、署名、服务限制、核验时间。
> 核验日期:2026-11-05

## 已接入来源

### 1. Natural Earth(nvkelso/natural-earth-vector)
- 官方:https://www.naturalearthdata.com/ · GitHub: https://github.com/nvkelso/natural-earth-vector
- 数据:`geojson/ne_110m_admin_0_countries.geojson`(177 国,含 ISO_A2_EH)
- 许可:**Public Domain**(全额商用/修改/再分发,无需署名)
- 用途:国家边界多边形 + 国家点选热区
- 本地化:`public/data/ne_110m_countries.geojson`(838KB)
- 服务限制:静态文件,无

### 2. NASA Earth Observatory 贴图(经 three-globe 0.44 示例资产分发)
- 官方:https://earthobservatory.nasa.gov/features/BlueMarble · https://earthobservatory.nasa.gov/features/NightsAtNight
- 数据:`earth-blue-marble.jpg`(4096×2048)、`earth-night.jpg`(4096×2048)、`earth-topology.png`
- 许可:**Public Domain**(NASA 影像)
- 用途:昼/夜全球贴图
- 本地化:`public/textures/`
- 服务限制:无(已本地)

### 3. NASA EOSDIS GIBS(WMTS)
- 官方:https://worldview.earthdata.nasa.gov/ · 文档:https://nasa-gibs.github.io/gibs-api-docs/
- 数据:`BlueMarble_ShadedRelief_Bathymetry` 500m,GoogleMapsCompatible_Level8(最大 z8)
- 许可:NASA 开放数据(免费公共服务,建议署名 "NASA EOSDIS GIBS")
- 用途:中低空影像细节(修复单张贴图模糊)
- 服务限制:GIBS 使用政策要求合理用量、不得转售、要求缓存——本项目按浏览器默认缓存使用;**离线/失败自动降级本地贴图**
- 核验:2026-11-05(接入并构建通过;瓦片渲染复验见 SESSION-LOG)

### 4. Wikimedia Commons(首批 10 张真实照片)
- 官方:https://commons.wikimedia.org/
- 许可:**逐张核验**,仅接受 CC0 / Public Domain / CC BY / CC BY-SA(允许商用,需署名)
- 明细:`public/data/media-samples.json`(含作者、许可、原始页面链接、字节数)
- 展示署名:DestinationMedia 组件在图片上叠加 "© 作者 · 许可" 行
- 用途:目的地档案头图
- 服务限制:API 礼貌用量;本项目仅构建期抓取一次,运行时零请求
- 抓取脚本:`experiments/fetch-media-samples.py`(HTTPS+域名白名单+私网阻断)

### 5. 内容参考(Wikipedia / UNESCO)
- 用途:目的地摘要与故事的事实参考;**所有文本为原创改写**,不逐字复制
- 许可:CC BY-SA 4.0(参考)· UNESCO 官网(事实参考)
- 记录:每条目的 `sources[]` 字段

## 待评估来源(未接入)

| 来源 | 用途 | 注意 |
| --- | --- | --- |
| AWS Terrain Tiles(terrarium) | 免费 3D 地形 | 许可核对后接入,替换椭球 |
| GeoNames | 城市扩充 | CC BY 4.0,需署名 |
| Overture Maps | 建筑/POI | CDLA Permissive 2.0,核对 |
| Poly Haven / ambientCG | HDRI/PBR | 逐资产核验 |
