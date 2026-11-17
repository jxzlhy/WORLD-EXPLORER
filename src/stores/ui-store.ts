import { defineStore } from 'pinia'
import type { CameraInfo, DayNightMode, LayerId, QualityMode } from '../engine/types'

/** 全局 UI 状态:图层开关、昼夜模式、自动旋转、引擎状态、性能面板 */
export const useUiStore = defineStore('ui', {
  state: () => ({
    engineReady: false,
    engineError: '' as string,
    layers: {
      countries: true,
      markers: true,
      labels: true,
    } as Record<LayerId, boolean>,
    dayNightMode: 'realtime' as DayNightMode,
    autoRotate: true,
    quality: 'high' as QualityMode,
    /** 启用的目的地类型(分类筛选;V1.5) */
    activeTypes: [
      'heritage',
      'natural',
      'landmark',
      'museum',
      'city',
      'island',
      'geology',
      'observatory',
    ] as string[],
    /** 云层(懒加载,默认关闭——性能优先) */
    cloudsOn: false,
    /** FPS 自动降档守门(默认关:自动改画质需用户显式开启) */
    autoDegrade: false,
    /** 探索密度 choropleth(默认关:数据可视化属于可选叠加) */
    choroplethOn: false,
    /** 时间机器(V3.0 雏形):null=关闭;数值=只显示该年份已建成的目的地 */
    timeMachineYear: null as number | null,
    /** 自动降档提示(触发后短暂展示,由 ExploreView 清除) */
    autoDegradeNote: '',
    showStats: false,
    fps: 0,
    cameraInfo: null as CameraInfo | null,
    searchOpen: false,
    myWorldOpen: false,
    /** 全屏沉浸阅读(V2.5):目的地档案全屏呈现 */
    immersiveOpen: false,
    /** 合集沉浸巡展(V2.5):已核验照片全屏轮播 */
    showcaseOpen: false,
    /** 移动端控制抽屉(≤768px 时 LeftRail 收纳于此) */
    mobileControlsOpen: false,
  }),
  actions: {
    setLayerVisible(layer: LayerId, visible: boolean) {
      this.layers[layer] = visible
    },
    setDayNightMode(mode: DayNightMode) {
      this.dayNightMode = mode
    },
    setAutoRotate(enabled: boolean) {
      this.autoRotate = enabled
    },
    setQuality(mode: QualityMode) {
      this.quality = mode
    },
    setClouds(on: boolean) {
      this.cloudsOn = on
    },
    setAutoDegrade(on: boolean) {
      this.autoDegrade = on
      if (!on) this.autoDegradeNote = ''
    },
    setChoropleth(on: boolean) {
      this.choroplethOn = on
    },
    setTimeMachineYear(year: number | null) {
      this.timeMachineYear = year
    },
    setAutoDegradeNote(note: string) {
      this.autoDegradeNote = note
    },
    toggleType(type: string) {
      this.activeTypes = this.activeTypes.includes(type)
        ? this.activeTypes.filter((t) => t !== type)
        : [...this.activeTypes, type]
    },
    setAllTypes(active: boolean) {
      const all = [
        'heritage',
        'natural',
        'landmark',
        'museum',
        'city',
        'island',
        'geology',
        'observatory',
      ]
      this.activeTypes = active ? all : []
    },
    setEngineReady() {
      this.engineReady = true
    },
    setEngineError(message: string) {
      this.engineError = message
    },
    setFps(fps: number) {
      this.fps = fps
    },
    setCameraInfo(info: CameraInfo) {
      this.cameraInfo = info
    },
    toggleSearch(open?: boolean) {
      this.searchOpen = open ?? !this.searchOpen
    },
    toggleMyWorld(open?: boolean) {
      this.myWorldOpen = open ?? !this.myWorldOpen
    },
    toggleImmersive(open?: boolean) {
      this.immersiveOpen = open ?? !this.immersiveOpen
    },
    toggleShowcase(open?: boolean) {
      this.showcaseOpen = open ?? !this.showcaseOpen
    },
    toggleMobileControls(open?: boolean) {
      this.mobileControlsOpen = open ?? !this.mobileControlsOpen
    },
  },
})
