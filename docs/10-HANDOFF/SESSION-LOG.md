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

- 提交 `d76de59` / `31e7ccf` / `76d2e38` / `debccdc`(巡游雏形、探索进度、昼夜修复、GIBS 修正)均已完成本地提交,但 `git push` 鉴权失败:osxkeychain 中 GitHub 令牌失效("Invalid username or token"),非交互环境无法重新输入;`gh` CLI 未安装。**需要项目所有者更新 GitHub 凭据(PAT)后执行 `git push origin main`**(4 个提交一次推完),或将有效 PAT 提供给代理环境。

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
