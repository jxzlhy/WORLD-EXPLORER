import * as Cesium from 'cesium'
import type { CameraInfo, FlyResult, FlyTarget } from './types'

/**
 * 相机控制器 — 引擎内唯一的相机动画入口。
 *
 * 控制权规则(见 docs/04-INTERACTION/CAMERA-CONTROL.md):
 * - 飞行使用 Cesium 原生 camera.flyTo(带 complete/cancel 回调);
 * - 用户任何拖动/滚轮/捏合立即中断飞行并广播 onUserInteract;
 * - 自动旋转仅在「用户从未交互 + 未在飞行 + 相机高于 12,000km」时生效;
 * - UI/GSAP 不直接驱动相机,所有地理镜头运动都经由本控制器。
 */
export class CameraController {
  private readonly camera: Cesium.Camera
  private readonly canvas: HTMLCanvasElement
  private readonly handler: Cesium.ScreenSpaceEventHandler

  private flightSeq = 0
  private _flying = false
  private userInteracted = false
  private _autoRotate = true

  private readonly preRenderCb: Cesium.Event.RemoveCallback
  private lastFrameTime = performance.now()
  private lastEmitTime = 0
  private lastFpsEmitTime = 0
  private frameCount = 0

  private readonly userInteractListeners = new Set<() => void>()
  private readonly cameraChangeListeners = new Set<(info: CameraInfo) => void>()
  private readonly statsListeners = new Set<(stats: { fps: number }) => void>()

  constructor(viewer: Cesium.Viewer) {
    this.camera = viewer.camera
    this.canvas = viewer.canvas
    this.handler = new Cesium.ScreenSpaceEventHandler(this.canvas)

    const interruptEvents = [
      Cesium.ScreenSpaceEventType.LEFT_DOWN,
      Cesium.ScreenSpaceEventType.MIDDLE_DOWN,
      Cesium.ScreenSpaceEventType.RIGHT_DOWN,
      Cesium.ScreenSpaceEventType.WHEEL,
      Cesium.ScreenSpaceEventType.PINCH_START,
    ]
    for (const type of interruptEvents) {
      this.handler.setInputAction(() => this.handleUserInput(), type)
    }

    this.preRenderCb = viewer.scene.preRender.addEventListener(() => this.tick())
  }

  /** 用户主动输入:中断飞行 + 永久关闭自动旋转 */
  private handleUserInput(): void {
    this.userInteracted = true
    if (this._flying) {
      this.camera.cancelFlight()
    }
    for (const cb of this.userInteractListeners) cb()
  }

  private tick(): void {
    const now = performance.now()
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1)
    this.lastFrameTime = now

    // —— 自动旋转(缓慢环绕,接近地表时自动停止) ——
    if (this._autoRotate && !this.userInteracted && !this._flying) {
      const height = this.camera.positionCartographic.height
      if (height > 12_000_000) {
        this.camera.rotate(Cesium.Cartesian3.UNIT_Z, -0.008 * dt)
      }
    }

    // —— 相机位置广播(4Hz 节流) ——
    if (now - this.lastEmitTime > 250) {
      this.lastEmitTime = now
      const carto = this.camera.positionCartographic
      const info: CameraInfo = {
        longitude: Cesium.Math.toDegrees(carto.longitude),
        latitude: Cesium.Math.toDegrees(carto.latitude),
        height: carto.height,
      }
      for (const cb of this.cameraChangeListeners) cb(info)
    }

    // —— FPS 统计(1s 窗口) ——
    this.frameCount++
    if (now - this.lastFpsEmitTime > 1000) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsEmitTime))
      this.frameCount = 0
      this.lastFpsEmitTime = now
      for (const cb of this.statsListeners) cb({ fps })
    }
  }

  flyTo(target: FlyTarget): Promise<FlyResult> {
    const seq = ++this.flightSeq
    this._flying = true
    return new Promise<FlyResult>((resolve) => {
      const finish = (result: FlyResult) => {
        // 只有最新一次飞行才有权结束状态(旧飞行已被取代)
        if (seq === this.flightSeq) {
          this._flying = false
        }
        resolve(result)
      }
      this.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude, target.height),
        duration: target.duration,
        easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
        complete: () => finish('arrived'),
        cancel: () => finish('interrupted'),
      })
    })
  }

  cancelFlight(): void {
    this.camera.cancelFlight()
  }

  isFlying(): boolean {
    return this._flying
  }

  setAutoRotate(enabled: boolean): void {
    this._autoRotate = enabled
    if (enabled) {
      // 重新开启时,允许恢复自动旋转(例如通过 UI 开关)
      this.userInteracted = false
    }
  }

  get autoRotateEnabled(): boolean {
    return this._autoRotate
  }

  onUserInteract(cb: () => void): () => void {
    this.userInteractListeners.add(cb)
    return () => this.userInteractListeners.delete(cb)
  }

  onCameraChange(cb: (info: CameraInfo) => void): () => void {
    this.cameraChangeListeners.add(cb)
    return () => this.cameraChangeListeners.delete(cb)
  }

  onStats(cb: (stats: { fps: number }) => void): () => void {
    this.statsListeners.add(cb)
    return () => this.statsListeners.delete(cb)
  }

  destroy(): void {
    this.preRenderCb()
    for (const type of [
      Cesium.ScreenSpaceEventType.LEFT_DOWN,
      Cesium.ScreenSpaceEventType.MIDDLE_DOWN,
      Cesium.ScreenSpaceEventType.RIGHT_DOWN,
      Cesium.ScreenSpaceEventType.WHEEL,
      Cesium.ScreenSpaceEventType.PINCH_START,
    ]) {
      this.handler.removeInputAction(type)
    }
    this.handler.destroy()
    this.userInteractListeners.clear()
    this.cameraChangeListeners.clear()
    this.statsListeners.clear()
  }
}
