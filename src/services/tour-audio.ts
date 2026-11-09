/**
 * TourAudio — 巡游环境音(V4.5 迭代五,程序化 Web Audio,零素材)。
 *
 * 设计:
 * - 环境底噪:双正弦低频 drone(110/164.8Hz)+ 慢 LFO 滤波 + 极低增益气声(噪声带通);
 * - 到站提示:双泛音钟声(880/1320Hz,指数衰减);
 * - 全部程序合成 → 无第三方音频素材,无许可问题;
 * - 默认静音;AudioContext 仅在用户点击「开启」的手势中创建(规避自动播放限制),
 *   因此不持久化偏好——每次巡游都从静音开始;
 * - 生命周期:随 TourHud 挂载创建、卸载 dispose(见 docs/05-ENGINEERING/RESOURCE-LIFECYCLE.md)。
 */
export class TourAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private ambientNodes: AudioNode[] = []
  private ambientStarted = false
  /** 显式开关状态(gain 处于 automation ramp 中时读 .value 不可靠,不能用采样值判断) */
  private on = false

  get enabled(): boolean {
    return this.on
  }

  /** 用户手势中调用:创建/恢复上下文并开启主增益 */
  async enable(): Promise<void> {
    const master = (this.master ??= (() => {
      this.ctx = new AudioContext()
      const m = this.ctx.createGain()
      m.gain.value = 0
      m.connect(this.ctx.destination)
      return m
    })())
    if (this.ctx!.state === 'suspended') await this.ctx!.resume()
    master.gain.linearRampToValueAtTime(0.5, this.ctx!.currentTime + 0.8)
    this.on = true
  }

  /** 关闭(保留上下文,主增益淡出) */
  disable(): void {
    if (!this.ctx || !this.master) return
    this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4)
    this.on = false
  }

  /** 开始环境底噪(巡游进行中;幂等) */
  startAmbient(): void {
    if (!this.ctx || !this.master || this.ambientStarted) return
    this.ambientStarted = true
    const ctx = this.ctx

    // 低频 drone:双振荡器 + 慢 LFO 调制滤波
    const droneFilter = ctx.createBiquadFilter()
    droneFilter.type = 'lowpass'
    droneFilter.frequency.value = 380
    droneFilter.Q.value = 0.7
    const droneGain = ctx.createGain()
    droneGain.gain.value = 0.05
    droneFilter.connect(droneGain).connect(this.master)

    for (const freq of [110, 164.8]) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.detune.value = freq === 110 ? 0 : 4
      osc.connect(droneFilter)
      osc.start()
      this.ambientNodes.push(osc)
    }

    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.05
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 120
    lfo.connect(lfoGain).connect(droneFilter.frequency)
    lfo.start()
    this.ambientNodes.push(lfo)

    // 气声:循环白噪声 → 带通 → 极低增益(Math.random 在此为音频采样值生成,
    // 均匀分布即目标,非加密用途——安全扫描提示可忽略)
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = noiseBuf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = noiseBuf
    noise.loop = true
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 800
    band.Q.value = 0.5
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.012
    noise.connect(band).connect(noiseGain).connect(this.master)
    noise.start()
    this.ambientNodes.push(noise)
  }

  /** 到站钟声(双泛音,指数衰减 ~1.6s) */
  chime(): void {
    if (!this.on || !this.ctx || !this.master) return
    const ctx = this.ctx
    const now = ctx.currentTime
    for (const [freq, gain, decay] of [
      [880, 0.16, 1.6],
      [1320, 0.07, 1.1],
    ] as const) {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const g = ctx.createGain()
      g.gain.setValueAtTime(gain, now)
      g.gain.exponentialRampToValueAtTime(0.0001, now + decay)
      osc.connect(g).connect(this.master)
      osc.start(now)
      osc.stop(now + decay + 0.1)
    }
  }

  /** 释放全部资源(TourHud 卸载时调用) */
  dispose(): void {
    for (const node of this.ambientNodes) {
      try {
        (node as OscillatorNode).stop?.()
      } catch {
        /* 已停止 */
      }
      node.disconnect()
    }
    this.ambientNodes = []
    this.ambientStarted = false
    void this.ctx?.close()
    this.ctx = null
    this.master = null
  }
}
