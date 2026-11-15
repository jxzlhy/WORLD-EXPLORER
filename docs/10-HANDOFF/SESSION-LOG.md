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

- 提交 `d76de59` / `31e7ccf` / `76d2e38` / `69f1182` / `338edbf` / `b6496f5` / `112b92b` / `5c98af7` / `45bddad` / `45cde59` / `ebad42a` / `5a1bccf` / `2f2d959` / `4612cd7` / `279520d` / `813c7d4` / `8e43ffe` / `7f3f975` / `5925ba4` / `4508ee2` / `ff141a3` / `f0a0aeb` / `a5e8a4c` / `5bfa5ab`(共 38 个:巡游雏形…混合轮换、目的地 180 扩容、生成我的巡游)均已完成本地提交,但推送持续失败:PAT 鉴权失效 + github 网络间歇不稳(连接超时/SSL/鉴权错误交替,11-08 至 11-15 多次复测)。**需要项目所有者更新 GitHub 凭据并确认网络后执行 `git push origin main`**(34 个提交一次推完)。

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

## 数据地球步骤 1 批(2026-11-15 迭代二十五)—— 下一阶段启动

- **下一阶段规划**:ROADMAP 新增「V1.5 DATA EARTH」三步走(生成我的巡游 ✓ / 探索 choropleth / 内容新鲜度) [V]
- 生成我的巡游:TourState.stops/title 可选字段 + tourCollection 合成合集 getter + startCustomTour action;巡游全套管线(TourHud/航线/音频/停留可调)零改动复用 [V]
- MyWorld 推荐区「✈ 生成我的巡游」按钮(≥2 条推荐显示);E2E my-tour.spec(生成 → 合成巡游运行/结束)一次通过 [V]
- 推送:PAT 仍失效(网络错误交替),37 个提交本地待推 [V]

## 混合轮换批(2026-11-15 迭代二十四)

- DiscoverBar 芯片升级:目的地 Top3 + 国度 Top1 + 城市 Top1 合并轮换(kind 徽标),点击按粒度分发;MyWorld 三个推荐区块与首页芯片共用同一评分核 [V]
- E2E 用例 discover-mixed-rec(轮换一周收集 kind/name → 三粒度齐全 → 轮换到城市 entry 点击直达京都);首版在 entry 0 点击却期望城市面板——断言顺序错误,修为轮换到目标 kind 再点击 [V]

## 城市推荐批(2026-11-15 迭代二十三)

- `buildCityRecommendations` 纯函数:同城动量 ×2 + 同城剩余 ×1.2 + 同国动量 ×0.6;全逛完/无信号城市不计分过滤;reason 同城计数 > 同国延伸 [V]
- MyWorld「延伸的城」区块(点击 flyToCity);单测 city-rec.test.ts 5 断言(首版测试误期望巴黎入榜——无信号城市本就被设计过滤,修测试期望)+ E2E 用例(播种京都 2/4 → 京都居首「还有 2 处」→ 点击进城市面板)一次通过 [V]
- 照片:170/170 全覆盖确认(新批 20 张已在上轮扩量中覆盖,待办清零) [V]

## 国家推荐批(2026-11-15 迭代二十二)

- `buildCountryRecommendations` 纯函数:动量评分(同国已探索 ×1.2 × 剩余可探索 ×0.5),探索完/显式排除剔除,无足迹返回空 [V]
- MyWorld「下一站国度」区块(点击进国家面板);单测 country-rec.test.ts 5 断言 + E2E 用例一次通过 [V]

## 数据重置批(2026-11-15 迭代二十一)

- MyWorld「重置数据」两步确认按钮(⚠ armed 态红边):my-world.resetAll + explore.resetExploration(localStorage 同步);取消路径不破坏 [V]
- 第二夜报告:`OVERNIGHT-REPORT-20261114.md`(保留首夜原文,新建续篇;首夜 67 目的地/10 照片 → 今夜 170/170 照片、v0.4.0、单测 65 + E2E 32) [V]
- E2E 用例(两步确认/取消/全清)一次通过 [V]

## 巡展音频批(2026-11-15 迭代二十)

- CollectionShowcase 接入 TourAudio(复用巡游音频服务):🔇/🔊 开关(默认静音、手势解锁),翻页时到站钟声;播放/暂停按钮左移避让;dispose 随卸载 [V]
- O 系用例回归通过;全量结果见 CHANGELOG 当次记录 [V]

## 沉浸连续浏览批(2026-11-15 迭代十九)

- 相似 chips 进沉浸阅读底部(复用 buildSimilarDestinations,不读用户状态);点击保持沉浸切换目的地——wiki 式无尽浏览闭环 [V]
- **顺带修真 bug**:沉浸内切换目的地时 scrollTop 残留(新档案从旧位置显示)——watch 中归零(用户侧 flaky 暴露,产品侧修复) [V]
- E2E 用例(沉浸保持/内容切换/进度归零/Esc 退出即该目的地)修复后一次通过 [V]

## 章节跳转批(2026-11-14 迭代十七;11-15 深夜重设计)

- **设计假设被证伪**:900px 视口 + 内容 ~1.3 屏 → denom ~300,全部锚点聚在行程末端,章节跳转对现有 150 档案几乎总是退化(伦敦塔 denom 亦仅 299)——初版 PgUp/PgDn「无移动」不是 bug 而是几何必然 [V]
- 重设计:①阈值改为 `denom < 视口×0.6` 隐藏 markers(短内容不显示退化的锚点);②`updateProgress` 滚动时节流(150ms)重测锚点——支持动态内容与未来深度档案;③Y 用例双分支:真实短内容 → 隐藏;注入 5000px spacer → markers 出现 + 「跳转到导语」回顶 + 当前章高亮 [V]
- 教训:交互功能设计前先验证「内容几何」假设(视口 × 内容高度决定交互是否有意义) [O]
- 推送:PAT 仍失效,25 个提交本地待推 [V]

## 章节跳转批(2026-11-14 迭代十七)

- 进度条章节锚点:data-section 块(lead/story/timeline/note/sources)自动测量 pct,点击平滑滚动直达(reduced-motion 瞬时);滚动时当前章节高亮(最后 pct ≤ 进度+2) [V]
- 排障:点击定位 30s 失败——markers 原在 aria-hidden 容器内,getByRole 跳过隐藏子树;移除 aria-hidden(含交互按钮的容器不应隐藏,a11y 反模式一并修正) [V]
- E2E 用例 Y(4 markers/title 断言/跳来源 ≥85%/高亮)通过 [V]

## 巡展叙事批(2026-11-14 迭代十八)

- 巡展叙事升级:①**策展语片头**(打开时居中 3.5s 淡出,curatorNote 大字);②caption 新增**当前站故事摘要**(首段截 110 字 + 两行 line-clamp);③「查看完整档案 →」按钮——退出巡展直达目的地面板 [V]
- E2E 用例 Z(片头出现/淡出/摘要长度 ≤111/直达)一次通过 [V]

## 阅读进度批(2026-11-14 迭代十六)

- ImmersiveReader 顶部细线进度条 + 左上百分比:容器 @scroll.passive 监听(除零防护),打开/切换目的地归零重算;progress-rail 金色 3px [V]
- E2E 用例 X:scrollTop 编程滚动 → 0%/100%/0% 三态 + Esc 退出,一次通过(首版漏 import ref,typecheck 拦截) [V]

## 照片全覆盖批(2026-11-14/15 通宵批次)—— 里程碑

- **150/150 全覆盖**:Commons 解禁后 expand-media-coverage.py 分 7 轮(3+24+30+16+30+12+6)跑完剩余 121 张;网络断续 4 次自动保全续跑(断点续跑设计首次实战验证) [V]
- 许可全白名单(CC BY-SA 4.0×61/3.0×29+2igo/CC BY 3.0×11/PD×11/CC BY 2.0×10/CC0×8/CC BY 4.0×8/CC BY-SA 2.0×6/2.5×4),自动署名;本地 96MB(1920px 缩放版) [V]
- 用例适配:R(29→150 张/100% 覆盖)、T(埃及条带 2→14、巴黎改 ≥2 稳健断言) [V]
- 按国分布 12-19 张:CN 18/JP 19/FR 15/EG 15/GB 15/IT 13/PE 13/US 18/AU 12/IS 12 [V]
- 推送:PAT 仍失效,24 个提交本地待推(照片数据批即将成为第 25 个) [V]

## Ken Burns 批(2026-11-14 迭代十五)

- 巡展照片 Ken Burns:奇偶交替 kb-in/kb-out(推近/拉远,时长 = 停留 8s + 1.2s 全周期);暂停联动 play-state;reduced-motion 纯 CSS 禁用 [V]
- 排障:换图后旧图滞留致断言读到旧动画——Vue Transition 端点嗅探把照片自带 9.2s 动画当离开时长;显式 `:duration="300"` 修复(教训:Transition 包含长动画元素必须显式时长) [V]
- E2E 用例 W(暂停后导航消竞态:kb-in→kb-out→kb-in→running 四步)+ W2(reduced-motion)通过;expect.poll 需函数而非 Promise(首版笔误) [V]
- 推送:PAT 仍失效(11-14 复测),20 个提交本地待推 [V]

## 性能守门批(2026-11-14 迭代十四)

- `performance-guard.ts`:`nextQualityOnFps` 纯决策(high<24→balanced,balanced<18→low,low 终点)+ 持续低帧 6s 才降(瞬时掉帧豁免);**opt-in 默认关**——自动改画质需用户显式授权(LeftRail「自动降档」开关),避免意外改变画质 [V]
- 触发:StatusBar 提示(8s 自清);ExploreView watch 开关启停守门,卸载 stop(RESOURCE-LIFECYCLE 约定);degradeNote 签名简化(未用 from 参数,TS6133) [V]
- E2E 用例 V:stub `ui.setFps` 恒 5(确定性,不受软渲染实际帧率影响)→ 两级降档 + 提示出现/更新 + 关闭清理,一次通过 [V]
- 推送:PAT 仍失效(11-14 复测),19 个提交本地待推 [V]

## 晨昏暖色批(2026-11-14 迭代十三)—— V1.0 视觉打磨

- `twilightWarmth` 纯函数(正弦钟形)接入合成循环:晨昏带像素向暖橙靠拢(峰值带中心,强度 0.38);首版放错作用域(idx 未定义)——移到 else 分支 idx 声明后 [V]
- 星空三档:拆双 collection(背景/银河),setQualityMode(high 全显/balanced 银河减负/low 全隐);U 用例重写为四步三档断言(顶部残留占位函数已清) [V]
- 测试教训×3:sin(π)≈1.2e-16 浮点残差需容差;钟形 0.4/0.6 对称相等而非单调;`./sun-position` 值导入缺 `.ts`(合成器首次被单测运行才暴露) [V]
- 推送:PAT 仍失效(11-14 复测),18 个提交本地待推 [V]

## 银河星空批(2026-11-12 迭代十二)—— V1.0 收官

- 勘察确认项目从未有过星空实现(ROADMAP 项是设想)→ 从零做:纯数据点云方案(零素材零许可,对比 SkyBox 六面图更轻) [O]
- `star-layer.ts`:`generateStarDirections` 纯函数(背景均匀球面 2200 + 银河大圆 3000,倾斜 60°,银纬 σ=11°,银心 30% 高斯团)+ mulberry32 种子 PRNG(确定性视觉);StarLayer PointPrimitiveCollection 半径 9e7m,深度测试尊重地球遮挡;Mimosa 弱随机提示 = 确定性视觉 PRNG,非加密用途 [V]
- world-engine 接入 load/teardown;setQuality low → 整层隐藏(性能红线);Cesium PrimitiveCollection.remove 类型仅单参(数据源 remove 才有双参) [V]
- 单测 star.test.ts 6 断言 + E2E 用例 U(点云 5200 + low 联动);U 排障:画质按钮 accessible name 是「低」(hint 在 title),用 radiogroup 定位 [V]
- 推送:PAT 仍失效(11-12 复测),17 个提交本地待推 [V]

## 国家/城市影像条带批(2026-11-11 迭代十一)

- 数据勘察:国家维度 10 国全部 ≥2 张(PE 仅 1),城市仅巴黎 3/京都 2/北京 2 够格 → 条带阈值定为 verified ≥3(数据驱动,避免单张条带) [V]
- MediaStrip 加 `excludeId`(hero 排除防首图重复);国家/城市面板 hero 之下渲染其余照片 [V]
- E2E 用例 T(埃及条带 hero 排除断言——hero 名取自 caption 正则;巴黎城市条带)一次通过;仅 1 张照片的国家不出条带由阈值天然覆盖 [V]
- 回归修复:L 用例 `.panel-hero img` 因条带新增 img 触发 strict-mode violation(3 元素)——locator 限定 `.dest-media img` 指向 hero 本体;教训:给已有 DOM 区域加子结构时,旧用例的宽泛 locator 要同步收窄 [V]

## 分级一致性批(2026-11-11 迭代十)

- 量化发现:82 篇 A 级与 S 级故事字数中位 276 vs 271——内容量无差异,quality 标注是历史批次欠账(口径达标未回填) [V]
- 回填:S 68→150 · A 82→0;全库 150 条与 destinationCompleteness 口径 0 不一致(python 重实现口径复核) [V]
- 防回归:quality-consistency.test.ts——真实 150 条 × validator 口径逐条断言(批次文件遍历 + 总数 150 锁定) [V]
- 影响:标签优先级同质化(仅排序无碍)、「S 级档案」徽标 = 完整档案;E2E 断言不受影响(R 无分级数字、N 的吉萨本就是 S) [O]
- 推送:github SSL_ERROR_SYSCALL(11-11 复测),15 个提交本地待推 [V]

## 相似目的地批(2026-11-11 迭代九)

- `buildSimilarDestinations` 纯函数(以当前目的地为锚,内容关联不读用户状态):质量基分 + 同合集 ×2 > 同国 ×1.5 > 同类型 ×0.8;reason 三级(同合集 > 同国 > 同类型) [V]
- 目的面板「看过这处的人也看」Top3(相关人物之后),复用 dest-list 样式与缩略图 [V]
- 单测 similar.test.ts 5 断言(首版把锚点设成 natural 而候选全 heritage——测试数据错误,修正锚点类型);E2E 用例 S(渲染 Top3 → 点击切换)一次通过 [V]

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
