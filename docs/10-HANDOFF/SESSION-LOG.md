# SESSION LOG — 通宵自主执行(首夜)

> 执行窗口:2026-11-05 01:07 → 持续中(CST)
> 执行者:ZCode(WORLD EXPLORER 自主研发团队)

## 时间线

| 时刻(约) | 事件 | 证据等级 |
| --- | --- | --- |
| 01:07 | PHASE 00 审计:空项目,工具链 Node25/pnpm10/git2.53 就绪 | V |
| 01:09 | 网络探测:npm/unpkg/github-raw/commons 全 200 | V |
| 01:10 | AUTOVERSE AGENTS.md 提取(证据分级/依赖登记/禁令) | R |
| 01:11 | 资产下载:Blue/Black Marble + Natural Earth 110m(校验 4096×2048/177 国) | V |
| 01:12–01:35 | 工程骨架 + 引擎 + 服务 + Store + 设计系统 + 组件 + 视图 全量落码 | V |
| 01:35–01:50 | 数据内容:10 国 28 城 67 目的地(中文原创) | V |
| 01:50 | vue-tsc 发现 5 组错误 → 全部修复 → **typecheck 零错误** | V |
| 01:53 | `vite build` 成功(主 chunk 4.37MB / gzip 1.18MB) | V |
| 01:57 | dev server 起动;数据/贴图/Cesium Workers 全 200 | V |
| 01:58 | **真机验收①**:地球渲染 ✓ 120FPS ✓ 67 数据 ✓ 无错误遮罩 ✓(截图) | V |
| 02:04 | **真机验收②**:随机探索 → 飞行 ALT 450km → 卡纳克神庙档案面板完整渲染(截图) | V |
| 02:06 | **真机验收③**:搜索「长城」→ 飞行 → 收藏 → localStorage 持久化 ✓ | V |
| 02:08 | **发现渲染崩溃**「RangeError: Too many properties to enumerate」→ 追踪 | V |
| 02:15–02:35 | 追踪结论:与 HMR/reload 撞车双挂载 + 宿主 RAF 暂停(窗口遮挡)两个环境因素叠加;干净重载后完整链路复现 **0 渲染错误** | V |
| 02:40 | **真机验收④**:国家搜索 → 🇨🇳面板 + 6 城市 chips + 8 目的地列表 ✓ | V |
| 02:45 | 收藏 toggle 语义复验(重复收藏=取消,行为正确) | V |
| 02:50 | 发现 UI 问题:搜索按钮竖排换行、450km 高度贴图模糊、标签重叠 → 修复前二 | V |
| 02:55 | GIBS 瓦片层接入(构建通过;瓦片渲染复验列入 V0.2 首项) | V(接入)/U(渲染) |
| 03:00 | Wikimedia Commons 媒体管线:10/10 成功,许可全核验(PD/CC0/CC BY/CC BY-SA) | V |
| 03:10 | 媒体元数据合并进目的地档案;DestinationMedia 将自动署名 | V |

## 待项目所有者处理

(无阻塞项;无付费/授权需求)

### 2026-11-07 追加:V4.5 批次推送被凭据阻塞

- 提交 `d76de59` / `31e7ccf` / `76d2e38` / `69f1182` / `338edbf` / `b6496f5` / `112b92b` / `5c98af7` / `45bddad` / `45cde59` / `ebad42a` / `5a1bccf` / `2f2d959` / `4612cd7`(共 14 个:巡游雏形、探索进度、昼夜修复、GIBS 修正、实时高清增强、照片展示面、V4.5 收官、航线进度化、沉浸阅读、沉浸巡展+笔记回显、巡游环境音、探索推荐 V5.0 雏形、DiscoverBar 推荐芯片、数据覆盖统计面板)均已完成本地提交,但推送持续失败:PAT 鉴权失效(11-08/11-09/11-11 多次复测)。**需要项目所有者更新 GitHub 凭据后执行 `git push origin main`**(14 个提交一次推完)。

## 关键教训(写给下一次会话)

1. **自动化验收必须在 IAB 面板真实可见时进行**——窗口被遮挡时 WebKit 暂停 RAF,一切动画相关测试都会假阳性失败。恢复可见后应用自动继续,无需特殊处理。
2. **HMR 更新引擎模块后,必须整页 reload 再验收**——引擎持有全局 WebGL 资源,不支持热替换。
3. 本机代理为 fake-ip DNS(198.18.0.0/15),严格的私网 IP 校验需放行该段(见 fetch-media-samples.py 注释)。

## V0.3 批次(2026-11-05 下午)

- 内存回归用例 I:CDP 双 GC + 5 轮引擎生命周期,增长 <1.8x 通过 [V]
- tokens 收敛 14 处;画质三档;档案交错入场 [V]
- 目的地 67→100:4 个批次文件 + 19 城,python 全量校验 0 问题 [V]
- 套件 12/12 + 单测 15/15;超时预算按 SwiftShader 实测调整 [V]
- 推送:守望曾在恢复窗口推送至 9799c5c;6 提交待推,守望 v2 继续盯守 [V]
- 混排乱码自检流程固化:python 脚本写入后立即校验,已捕获 7 处 [V]

## 数据覆盖统计批(2026-11-11 迭代八)

- `/stats` 独立路由(懒加载)+ DataCoverageView:`buildCoverageStats` 纯函数——分级/照片/时间轴/人物关联四口径 + 按国矩阵(降序)+ 合集成员实时统计(失效引用剔除,p2-missing-id 用例覆盖);空输入防 NaN [V]
- UI:摘要卡 5 张 + 按国矩阵(照片覆盖进度条)+ 合集表;返回探索链接;单测 coverage.test.ts 5 断言 + E2E 用例 R(150/29/10 国/4 合集断言)一次通过 [V]
- 推送:PAT 仍失效(11-11 复测),13 个提交本地待推 [V]

## DiscoverBar 推荐批(2026-11-11 迭代七)

- DiscoverBar「为你推荐」芯片:复用 buildRecommendations Top5,首条 + reason 展示,↻ 轮换(offset 环),点击直达;足迹空自动隐藏(v-if);E2E 用例 Q [V]
- 测试断言修正:EG/CN 并列时 tie-break 取决于数据序,reason 断言从具体国名放宽为「同在」信号存在 [O]
- 推送:PAT 仍失效(继续复测),12 个提交本地待推 [V]

## 探索推荐批(2026-11-11 迭代六)—— V5.0 雏形

- `buildRecommendations` 纯函数(node 可测):质量基分 + 同国 ×1.5/同类型 ×0.8/同合集 ×1.2;排除已探索/收藏/想去/去过;reason 三级信号(同国带国名 > 同合集 > 同类型);DESTINATION_TYPE_LABELS 值导入须带 `.ts` 扩展(类型导入被擦除,node ESM 值导入需显式扩展——坑已记) [V]
- MyWorld「你可能想去」Top3(进度块上方,金框卡片),点击直达并关面板 [V]
- 单测 recommend.test.ts 6 断言(首版测试自身播种了不存在的 id,eg-x——修正为真实成员 eg-abu);E2E 用例 P(addInitScript 播种 → 渲染 → 点击直达)一次通过 [V]
- 推送:PAT 仍失效(11-11 复测),11 个提交继续本地待推 [V]

## 巡游音频批(2026-11-09 迭代五)

- TourAudio(程序化 Web Audio,零素材):drone 双振荡器 + LFO 滤波 + 白噪声气声;到站双泛音钟声;默认静音,AudioContext 在点击手势中创建(规避自动播放限制,不持久化偏好);dispose 停振荡/断节点/close 上下文,挂载于 TourHud 生命周期(RESOURCE-LIFECYCLE.md 已补行) [V]
- 排障①:Mimosa 提示 Math.random 弱随机——实为音频采样值生成,均匀分布即目标,非加密用途,注释说明保留 [O]
- 排障②:开关断言首测失败——`linearRampToValueAtTime` 调度后读 `gain.value` 仍为 0,`enabled` 改显式标志;顺带 chime 门控用标志 [V]
- 排障③:J 首试 flaky——cancelFlight 注入落在航段已落地后成空操作,改「确认在飞才注入」轮询重试(≤3 轮),3/3 稳定 [V]
- J 用例加音频开关断言(🔇→🔊 aria-label 切换) [V]

## 沉浸体系增强批(2026-11-09 迭代四)

- CollectionShowcase:合集面板「⛶ 沉浸巡展」(verified ≥2 才启用)→ 全屏照片轮播(自动 8s/暂停/←→/进度点/逐张署名);组件自持键盘监听(挂载期 add/remove,卸载清理);ui-store.showcaseOpen;Esc 键位插在 search 之后 immersive 之前 [V]
- ImmersiveReader 内「✎ 我的笔记」只读回显(myWorld.notes;编辑仍归档案面板) [V]
- E2E 用例 O1(轮播:首张=吉萨、→ 翻页、‹ 返回、进度点直达、Esc 退出面板保持)/O2(沉浸内笔记回显)一次通过 [V]
- 推送:PAT 仍失效(11-09 复测),9 个提交继续本地待推 [V]

## 沉浸阅读批(2026-11-08 迭代三)—— V2.5 雏形

- ImmersiveReader 组件(Teleport + z-modal):照片暗化背景(placeholder 渐变诚实降级)+ fs-display 标题 + 62ch 阅读宽逐段故事 + 时间轴 + 来源;GSAP 逐段浮现,reduced-motion 直通;ui-store.immersiveOpen;Esc 键位插在 search 之后 myWorld 之前 [V]
- 入口:目的地面板 actions 行「⛶ 沉浸阅读」;E2E 用例 N(Esc 与按钮双退出、面板保持) [V]
- 余项(正式版):沉浸内翻页式滚动、合集整体沉浸巡展、行内笔记只读展示 [O]

## 航线进度批(2026-11-08 迭代二)

- Commons 复测仍被拦(照片扩量继续等);改做巡游航线增强 [V]
- setRouteLine 增 RouteLineOptions.current:全程淡虚线 + 已飞实线(足迹感)+ 当前段 PolylineGlow 发光;route-layer 三实体重建式更新(站点 ≤14,成本可忽略) [V]
- 顺带修复:ExploreView 航线 watch 原依赖 tour 对象引用(index 变化不触发),改为派生 {id,index,n} 快照 [V]
- J 用例加航线实体数断言(启动 2 → 推进 3 → 结束 0) [V]

## V4.5 收官批(2026-11-08)—— 自主迭代(/goal 自行迭代)

- 完成审计:旅行笔记 UI 实际 V0.3 已存在(DetailPanel「我的笔记」+ blur 落盘 + setNote 后端),但 **E2E 零覆盖**——补用例 M(自动保存 → localStorage → 刷新回显 → 导出含 notes)而非重复造轮子 [V]
- 巡游停留可调:`TourState.dwellMs`(默认 8s 不变,J 用例兼容)+ TourHud 三档 chips(5s/8s/15s,localStorage 'tour-dwell' 持久化);dwell 变化会重启停留计时(watch 依赖含 dwellMs) [V]
- MyWorld 列表行「✎ 有笔记」标记(读 myWorld.notes) [V]
- 文档:CHANGELOG/ROADMAP(V4.5 清单全项 ✓)/SESSION-LOG [V]

## 实时模式高清增强(2026-11-08)—— 用户二次反馈「地球分辨率有点低」

- 判定:默认「实时」模式仍是 4K 单图(450km 高度 ~11km/px)——昨日修复只覆盖了永昼/永夜;Commons 今日仍被拦(numpy/Pillow 均无),本地 8K 贴图路径维持暂缓 [V]
- 方案取舍:单图最高 8K 在近距也只有 ~4.9km/px(需 ~0.3km/px),治标不治本 → **日光感知双瓦片增强**:合成打底,GIBS 昼/夜层 α 由「屏幕中心拾取地表点的太阳照射角 cosZ + 相机高度」驱动(250ms 节流,smoothstep 昼侧 -0.05→0.25 / 夜侧对称;高度因子 6,000km 全量→14,000km 归零,保留全球视角合成晨昏线);α 缓动 0.18/tick,近零 `show=false` 零瓦片请求 [O→V]
- 清理:removeBaseLayers 改为全量移除(while 循环),gibsLayer 字段删除;K 用例 realtime 断言 1→3 层 [V]
- 验证:typecheck ✓ lint ✓ K/L ✓;全量结果见 CHANGELOG 当次记录 [V]

## 照片展示面批次(2026-11-08)—— 用户反馈「信息不够丰富,可以加入景点图片吗」

- 现状:29/150 目的地有已核验照片(10 国全覆盖,pe 仅 1);Commons 今日仍被代理拦截(TLS 握手超时),扩量不可行 [V]
- 展示面扩容:国家/城市面板照片头图(heroMediaOf:优先 verified,兜底首成员示意图)+ 合集「收录影像」MediaStrip(仅 verified,点击直达)+ 目的地列表/MyWorld 行缩略图(verified 显照片,否则类型色点) [V]
- 扩量管线就绪:`experiments/expand-media-coverage.py`(目的地驱动、--limit 断点续跑、许可白名单、JSON 按既有格式写回);网络恢复后分批跑即可 29→150 [V]
- E2E 用例 L:埃及国家 hero(真照片 + © 署名)、列表 thumb、「古文明的回声」条带 ≥5 张、条带点击直达(修正:国家 id 为大写 ISO2 'EG') [V]

## 地球清晰度批次(2026-11-07)—— 用户报告「分辨率有点低」

- 排查:本地贴图均为 4096×2048(450km 高度 ~11km/px);GIBS WMTS 实测可达,且**发现 always-day 的 URL 含错误段 "500m" 占据 TileMatrixSet 槽位——瓦片全 400,该层从未渲染**(依 Capabilities ResourceURL 模板确认静态层无时间槽) [V]
- 修复:addGibs URL 修正;always-night 新增 VIIRS_Black_Marble(2016,L8,PNG)瓦片层(时间值 2016-01-01);K 用例增图层计数断言(昼/夜 2 层,实时 1 层) [V]
- 网络实况:shell 下 NASA eoimages 与 Wikimedia Commons TLS 握手被拦(11/5-11/6 曾可用,代理规则已变),github/npm registry/GIBS 可达;npm/github 无可验证的 ≥5400 有源贴图 [V]
- 决策:本地贴图升级**暂缓**(管线 `experiments/fetch-hd-textures.py` 就绪,许可链 NASA PD → Commons,源站可达时一键执行);默认「实时」模式拉近仍受 4K 源限制,已记入 CHANGELOG 已知限制 [O]
- 文档:DATA-SOURCES.md(#3 重写)、LICENSE-REGISTRY.md(C 节两行) [V]

## 昼夜模式修复(2026-11-07)—— 用户报告「切换没有变化」

- 根因:`ImageryLayersController.setMode()` 仅存字段不重应用,`refresh()` 无任何调用点;贴图与 UI 接线均正常,断点在引擎最后一步 [V]
- 修复:引擎 `setDayNightMode` → `setMode` + `refresh(viewer)`(applySeq 令牌防快速切换竞态);5 分钟定时器从硬编码 'realtime' 改为按当前模式(消除模式漂移隐患) [V]
- 回归测试:用例 K(三档 provider 断言);暂存修复复跑 K 复现失败、恢复后通过——确认是真回归测试 [V]

## V4.5 批次二(2026-11-07)—— 探索进度 + 合集搜索直达

- 探索进度:被动足迹 `exploredIds`(访问即单调累计,与手标「去过」区分)+ MyWorld 头部进度块(X/150 + Y% + 进度条);导入链路补 `reloadLocal`(顺带修复 recent 导入后内存不刷新的存量缺口) [V]
- 合集搜索直达:SearchHit 增 `collection` kind,SearchOverlay 金徽标 + 直达合集面板;修掉批次一记录的「合集未入搜索索引」已知边界 [V]
- 单测 34/34(新增 6:合集命中×2 + addExplored×4) [V]

## V4.5 雏形批次(2026-11-07)—— 合集镜头巡游

- 设计定型:巡游 = 逐站复用目的地 450km flyTo 管线,航段固定 6s 电影感匀速(`pendingFlight.duration` 透传),不新增相机原语;站点推进定时器归 TourHud(组件生命周期)而非 store [O]
- Store:`tour { collectionId, index, paused }` + start/goTo/next/prev/pause/resume/stop;巡游逐站走 `selectDestination(id, { duration })`(面板/飞行/探索历史全部复用) [V]
- 引擎:新接口 `setRouteLine(stops | null)` + `route-layer.ts`(CustomDataSource 'route',大圆虚线 80km 金色);IWorldEngine 文档清单同步补齐(setTypesFilter/setQuality/onRenderError 等此前缺失项) [V]
- UI:TourHud(底部居中,窄屏上移避让)+ 合集面板「✈ 镜头巡游」按钮 + ExploreView 接线(航段被打断→自动暂停;tour→航线挂/摘;Esc 先退巡游) [V]
- 已知边界:巡游中点击球面其他目的地只切面板不并轨,停留后回到巡游序列(雏形行为,记录不修);~~合集未入搜索索引~~(批次二已修) [O]
- 排障记录:巡游 E2E「拖拽打断→暂停」三态复现,五轮插桩定位——非应用 bug,而是 SwiftShader 软渲染下飞行期主线程饱和、Playwright 输入事件延迟数秒,拖拽落地时航段已正常结束;改用 `eng.cancelFlight()` 注入(与用户打断同走 flyTo→'interrupted'→pauseTour 路径)后 3/3 稳定,物理中断保留给用例 C(滚轮) [V]
- 验证:typecheck ✓ · lint 0 错误 ✓ · build ✓ · 单测 28/28 ✓ · E2E 结果见 CHANGELOG 当次记录(Node v25 下 `node --test tests/unit/` 需去尾斜杠,环境差异非代码问题) [V]
