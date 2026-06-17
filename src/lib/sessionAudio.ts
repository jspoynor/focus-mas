/** Soft two-tone chime when a focus session timer reaches zero. */
export function playSessionCompleteCue(): void {
  try {
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.setValueAtTime(0.0001, ctx.currentTime)
    master.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.04)
    master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1)
    master.connect(ctx.destination)

    const tones = [
      { frequency: 392, start: 0, duration: 0.45 },
      { frequency: 523.25, start: 0.18, duration: 0.7 },
    ]

    for (const tone of tones) {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.value = tone.frequency
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + tone.start)
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + tone.start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + tone.start + tone.duration)

      oscillator.connect(gain)
      gain.connect(master)
      oscillator.start(ctx.currentTime + tone.start)
      oscillator.stop(ctx.currentTime + tone.start + tone.duration)
    }

    window.setTimeout(() => void ctx.close(), 1200)
  } catch {
    // Audio may be unavailable (autoplay policy, unsupported browser).
  }
}
