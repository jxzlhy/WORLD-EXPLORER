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
    showStats: false,
    fps: 0,
    cameraInfo: null as CameraInfo | null,
    searchOpen: false,
    myWorldOpen: false,
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
    toggleMobileControls(open?: boolean) {
      this.mobileControlsOpen = open ?? !this.mobileControlsOpen
    },
  },
})
