import { defineStore } from 'pinia'
import type { CameraInfo, DayNightMode, LayerId } from '../engine/types'

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
    lowPerf: false,
    showStats: false,
    fps: 0,
    cameraInfo: null as CameraInfo | null,
    searchOpen: false,
    myWorldOpen: false,
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
    setLowPerf(on: boolean) {
      this.lowPerf = on
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
  },
})
