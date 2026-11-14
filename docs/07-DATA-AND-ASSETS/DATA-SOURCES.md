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
- 数据(2026-11-07 核验并修正 URL,依据 WMTS Capabilities 的 ResourceURL 模板):
  - `BlueMarble_ShadedRelief_Bathymetry`(静态层,**URL 无时间槽**):`.../BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{TileMatrix}/{TileRow}/{TileCol}.jpeg`
  - `VIIRS_Black_Marble`(2016 合成,时间值 `2016-01-01`,PNG):`.../VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{TileMatrix}/{TileRow}/{TileCol}.png`
  - 两者均为 GoogleMapsCompatible_Level8(最大 z8)
- 许可:NASA 开放数据(免费公共服务,建议署名 "NASA EOSDIS GIBS")
- 用途:拉近后的影像细节增强——永昼/永夜为静态增强层;实时模式为日光感知双瓦片层(昼侧淡入 BlueMarble、夜侧淡入 Black Marble,α 随相机指向与高度变化,全球视角隐藏)
- 服务限制:GIBS 使用政策要求合理用量、不得转售、要求缓存——本项目按浏览器默认缓存使用;**离线/失败自动降级本地贴图**
- 核验:2026-11-07(瓦片端点 L0/L6/L7 实测 200;**此前 always-day 的 URL 含错误时间槽 "500m",所有瓦片 400,该层从未真正渲染,已修正**)
- 运行时可达性:本机代理环境实测可达(shell curl 200);NASA eoimages / Wikimedia Commons 当前被拦,本地 4K 贴图升级暂缓——升级管线已就绪(`experiments/fetch-hd-textures.py`),源站可达时运行即可

### 4. Wikimedia Commons(150/150 全覆盖,2026-11-15)
- 官方:https://commons.wikimedia.org/
- 许可:**逐张核验**,仅接受 CC0 / Public Domain / CC BY / CC BY-SA(允许商用,需署名);当前分布:CC BY-SA 4.0×61、CC BY-SA 3.0×29+2(igo)、CC BY 3.0×11、PD×11、CC BY 2.0×10、CC0×8、CC BY 4.0×8、CC BY-SA 2.0×6、CC BY 2.5×4
- 明细:`public/data/media-samples.json`(150 条,含作者、许可、原始页面链接、字节数)
- 展示署名:DestinationMedia 组件在图片上叠加 "© 作者 · 许可" 行;沉浸巡展逐张署名;条带逐张署名
- 用途:全部 150 个目的地档案头图 + 国家/城市/合集影像条带 + 沉浸背景
- 服务限制:API 礼貌用量;构建期抓取,运行时零请求;本地 `public/media/destinations/`(约 96MB,1920px 宽缩放版)
- 抓取脚本:`experiments/fetch-media-samples.py`(首批 10 张)+ `experiments/expand-media-coverage.py`(覆盖扩容,断点续跑)
- 里程碑:2026-11-05 首批 10 张 → 11-06 扩至 29 → **11-15 全覆盖 150**(11-08/11-09 Commons 被代理拦截期间管线挂起,11-14 深夜解禁后分 7 轮完成)

### 5. 云层贴图(V1.0,2026-11-06 接入)
- 来源:Wikimedia Commons「Transparent Fair Weather Clouds Map」,作者 GabrielGGD
- 许可:**CC0**(无需署名;文档仍保留作者记录)
- 链路说明:NASA eoimages 直连不可达,turban/webgl-earth 中转链无 LICENSE 文件 → 按红线弃用,改用 Commons CC0 归档版本
- 本地化:`public/textures/earth-clouds.png`(2048×1024,1.7MB,gray+alpha)
- 运行时:独立球壳 Primitive(+12km),缓慢西移,默认关闭

### 6. 内容参考(Wikipedia / UNESCO)
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
