export class AudioManager {
  constructor() {
    this.context = null
    this.master = null
    this.muted = false
    this.volume = 0.28
    this.musicTimer = null
    this.musicStep = 0
  }

  unlock() {
    if (!this.context) {
      const Context = window.AudioContext || window.webkitAudioContext
      if (!Context) return
      this.context = new Context()
      this.master = this.context.createGain()
      this.master.gain.value = this.muted ? 0 : this.volume
      this.master.connect(this.context.destination)
    }
    if (this.context.state === 'suspended') this.context.resume()
  }

  setMuted(muted) {
    this.muted = muted
    if (this.master) this.master.gain.setTargetAtTime(muted ? 0 : this.volume, this.context.currentTime, 0.05)
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.master && !this.muted) this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.05)
  }

  tone(frequency, duration = 0.12, type = 'triangle', gain = 0.18, slide = 0) {
    this.unlock()
    if (!this.context || this.muted) return
    const now = this.context.currentTime
    const oscillator = this.context.createOscillator()
    const envelope = this.context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, now)
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(25, frequency + slide), now + duration)
    envelope.gain.setValueAtTime(gain, now)
    envelope.gain.exponentialRampToValueAtTime(0.001, now + duration)
    oscillator.connect(envelope)
    envelope.connect(this.master)
    oscillator.start(now)
    oscillator.stop(now + duration + 0.02)
  }

  cue(name) {
    const patterns = {
      jump: [[330, 0.1, 'triangle', 0.13, 230]],
      punch: [[115, 0.08, 'sawtooth', 0.14, -60]],
      blast: [[220, 0.24, 'sawtooth', 0.2, 680], [440, 0.18, 'sine', 0.08, -180]],
      hit: [[92, 0.16, 'square', 0.13, -40]],
      pickup: [[660, 0.09, 'sine', 0.1, 200], [880, 0.12, 'sine', 0.08, 180]],
      boss: [[82, 0.42, 'sawtooth', 0.22, -35], [55, 0.55, 'triangle', 0.16, -18]],
      victory: [[523, 0.24, 'triangle', 0.15, 130], [659, 0.28, 'triangle', 0.15, 170], [784, 0.42, 'triangle', 0.15, 210]],
      ultimate: [[64, 0.5, 'sawtooth', 0.22, 920], [130, 0.4, 'sine', 0.12, -60]],
    }
    for (const [frequency, duration, type, gain, slide] of patterns[name] || []) this.tone(frequency, duration, type, gain, slide)
  }

  startMusic(mode = 'menu') {
    this.unlock()
    if (!this.context || this.musicMode === mode && this.musicTimer) return
    window.clearInterval(this.musicTimer)
    this.musicMode = mode
    const notes = mode === 'boss'
      ? [73.42, 0, 73.42, 110, 0, 82.41, 0, 123.47, 0, 92.5, 0, 73.42]
      : mode === 'combat'
        ? [82.41, 0, 123.47, 0, 110, 0, 164.81, 0, 92.5, 0, 138.59, 0, 110, 0, 185, 0]
        : [110, 0, 164.81, 0, 146.83, 0, 196, 0, 123.47, 0, 185, 0, 164.81, 0, 220, 0]
    this.musicTimer = window.setInterval(() => {
      const note = notes[this.musicStep++ % notes.length]
      if (note) this.tone(note, mode === 'boss' ? 0.26 : 0.42, mode === 'boss' ? 'triangle' : 'sine', mode === 'boss' ? 0.055 : 0.035)
    }, mode === 'boss' ? 190 : 260)
  }

  dispose() {
    window.clearInterval(this.musicTimer)
    this.musicTimer = null
    this.musicMode = null
    if (this.context && this.context.state !== 'closed') this.context.close()
  }
}