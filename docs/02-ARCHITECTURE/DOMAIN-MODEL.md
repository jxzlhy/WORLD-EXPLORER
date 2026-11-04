# 领域模型

> 代码即权威:`src/domain/types.ts`。本文描述关系与约束。

## 实体关系

```
Country (ISO2 主键)
 ├── 1:N → City(含 isCapital)
 └── 1:N → Destination
Destination N:1 → Country · 0:1 → City
Destination.media → MediaRef(verified | placeholder)
Destination.sources[] → SourceRef(许可逐条)
MY WORLD:favorites / visited / wantToGo → Destination.id 集合
```

## 关键约束

1. **稳定 ID**:目的地 id 形如 `cn-great-wall`(ISO2 前缀 + slug),与媒体文件名、收藏列表、URL 未来路由共享。
2. **地理坐标**:WGS84 十进制度;longitude ∈ [-180,180],latitude ∈ [-90,90]。
3. **质量分级 S/A/B** 决定:标签显示距离(S 更远)、未来排序权重、扩容优先级。
4. **媒体诚实原则**:`media.status='placeholder'` 渲染程序星图卡并标注 ILLUSTRATIVE;绝不使用无许可图片冒充。
5. **证据分级**在数据侧对应 `sources[].checkedAt`(逐条核验日期)。

## 数据文件结构

```
public/data/
├── manifest.json          清单(data-service 据此加载)
├── countries.json         10 国
├── cities.json            28 城
├── destinations/*.json    每国一文件(10 文件,67 条)
└── media-samples.json     媒体许可台账
```
