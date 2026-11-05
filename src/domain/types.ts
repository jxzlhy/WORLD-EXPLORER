/**
 * WORLD EXPLORER 领域模型
 * 对应 docs/02-ARCHITECTURE/DOMAIN-MODEL.md
 * 数据规范详见 docs/07-DATA-AND-ASSETS/
 */

/** 目的地类型(与 markers 层配色一一对应) */
export type DestinationType =
  | 'heritage' // 世界遗产 / 历史遗迹
  | 'natural' // 自然景观
  | 'landmark' // 著名建筑 / 城市地标
  | 'museum' // 博物馆
  | 'city' // 城市整体
  | 'island' // 海岛
  | 'geology' // 地质奇观
  | 'observatory' // 天文观测地点

export const DESTINATION_TYPE_LABELS: Record<DestinationType, string> = {
  heritage: '世界遗产',
  natural: '自然景观',
  landmark: '著名地标',
  museum: '博物馆',
  city: '城市',
  island: '海岛',
  geology: '地质奇观',
  observatory: '天文观测',
}

/** 资料来源引用(许可必须逐条登记) */
export interface SourceRef {
  name: string
  url: string
  license: string
  /** 许可核验日期 ISO 8601 */
  checkedAt: string
}

/** 媒体资源(图片)引用 */
export interface MediaRef {
  /** 应用内相对路径;status=placeholder 时为空 */
  file?: string
  /** verified: 已核验许可的真实照片;placeholder: 程序生成的示意图 */
  status: 'verified' | 'placeholder'
  author?: string
  license?: string
  sourceUrl?: string
}

/** 内容质量分级:S 完整档案 / A 较完整 / B 基础信息 */
export type QualityLevel = 'S' | 'A' | 'B'

/** 证据等级:V 实测验证 / R 研究核实 / O 经验判断 / U 未核实 */
export type EvidenceLevel = 'V' | 'R' | 'O' | 'U'

export interface Destination {
  id: string
  name: string
  nameEn: string
  type: DestinationType
  /** ISO 3166-1 alpha-2 */
  countryId: string
  cityId?: string
  longitude: number
  latitude: number
  /** 2-3 句导语(Editorial 面板首屏) */
  summary: string
  /** 叙事段落(故事/历史/文化) */
  story: string[]
  bestSeason?: string
  tags: string[]
  /** 搜索别名:常见通称/异译(如 艾菲尔铁塔/金字塔/紫禁城) */
  aliases?: string[]
  sources: SourceRef[]
  wikidataId?: string
  quality: QualityLevel
  media?: MediaRef
  /** 内容更新时间 ISO 8601 */
  updatedAt: string
}

export interface City {
  id: string
  name: string
  nameEn: string
  countryId: string
  longitude: number
  latitude: number
  summary: string
  isCapital?: boolean
}

export interface Country {
  /** ISO 3166-1 alpha-2(与 Natural Earth ISO_A2_EH 对齐) */
  id: string
  name: string
  nameEn: string
  continent: string
  capital: string
  summary: string
  /** 面积(平方公里,约值) */
  areaKm2?: number
  /** 人口(约值) */
  population?: number
  /** 官方/主要语言 */
  languages?: string[]
  /** 货币(中文名 + ISO 代码) */
  currency?: string
  wikidataId?: string
  updatedAt: string
}

export interface DataManifest {
  version: string
  generatedAt: string
  countriesFile: string
  citiesFiles: string[]
  destinationFiles: string[]
}
