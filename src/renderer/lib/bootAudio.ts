let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

export function playCRTPowerOn() {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(40, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.9)
  gain.gain.setValueAtTime(0.07, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.9)
}

export function playKeystroke() {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.value = 900 + Math.random() * 500
  gain.gain.setValueAtTime(0.05, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.035)
}

export function playOkBeep() {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(660, ctx.currentTime)
  osc.frequency.setValueAtTime(980, ctx.currentTime + 0.08)
  gain.gain.setValueAtTime(0.08, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.15)
}

export function playWarnTone() {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(440, ctx.currentTime)
  osc.frequency.setValueAtTime(220, ctx.currentTime + 0.15)
  gain.gain.setValueAtTime(0.1, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.3)
}

export function playSolarFlare() {
  const ctx = getCtx()
  // Whoosh
  const noise = ctx.createOscillator()
  const noiseGain = ctx.createGain()
  noise.type = 'sawtooth'
  noise.frequency.setValueAtTime(200, ctx.currentTime)
  noise.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.3)
  noise.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.8)
  noiseGain.gain.setValueAtTime(0, ctx.currentTime)
  noiseGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
  noise.connect(noiseGain).connect(ctx.destination)
  noise.start()
  noise.stop(ctx.currentTime + 0.8)

  // High shimmer
  const shimmer = ctx.createOscillator()
  const shimmerGain = ctx.createGain()
  shimmer.type = 'sine'
  shimmer.frequency.setValueAtTime(2400, ctx.currentTime)
  shimmer.frequency.exponentialRampToValueAtTime(6000, ctx.currentTime + 0.2)
  shimmer.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.6)
  shimmerGain.gain.setValueAtTime(0, ctx.currentTime)
  shimmerGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.15)
  shimmerGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
  shimmer.connect(shimmerGain).connect(ctx.destination)
  shimmer.start()
  shimmer.stop(ctx.currentTime + 0.6)
}

export function playXPGain() {
  const ctx = getCtx()
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const t = ctx.currentTime + i * 0.08
    gain.gain.setValueAtTime(0.08, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.15)
  })
}

export function playOnlineChime() {
  const ctx = getCtx()
  const notes = [880, 1108, 1320]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08)
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08)
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + i * 0.08 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25)
    osc.connect(gain).connect(ctx.destination)
    osc.start(ctx.currentTime + i * 0.08)
    osc.stop(ctx.currentTime + i * 0.08 + 0.25)
  })
}

export function playErrorBuzz() {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(150, ctx.currentTime)
  gain.gain.setValueAtTime(0.06, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.2)
}

export function playCorrectChime() {
  const ctx = getCtx()
  const notes = [523, 659, 784, 1046]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1)
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1)
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + i * 0.1 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3)
    osc.connect(gain).connect(ctx.destination)
    osc.start(ctx.currentTime + i * 0.1)
    osc.stop(ctx.currentTime + i * 0.1 + 0.3)
  })
}
