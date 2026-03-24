# Phase 8 — Sound Effects

**Goal:** Audio feedback using Web Audio API — no external sound files needed.

## Tasks

- [ ] 8.1 Create `AudioContext` lazily on first user interaction:
  ```js
  let audioCtx = null
  function getAudioCtx() {
    if (!audioCtx) audioCtx = new AudioContext()
    return audioCtx
  }
  ```
  *(Browsers block AudioContext until a user gesture — lazy init solves this)*

- [ ] 8.2 `playSuccess()` — short ascending tone:
  - Oscillator type: `sine`
  - Frequency sweep: 400Hz → 600Hz over 0.15s (`linearRampToValueAtTime`)
  - Gain envelope: attack 0.01s → peak → release 0.1s

- [ ] 8.3 `playMiss()` — low thud:
  - Oscillator type: `triangle`
  - Frequency: 150Hz, fixed
  - Duration: 0.2s
  - Gain envelope: fast decay from 0.4 → 0

- [ ] 8.4 `playGameOver()` — descending wail:
  - Oscillator type: `sawtooth`
  - Frequency sweep: 500Hz → 100Hz over 0.8s
  - Gain envelope: steady then fade out

## Pattern for All Sounds
```js
function playSound(type, freqStart, freqEnd, duration) {
  const ctx  = getAudioCtx()
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freqStart, ctx.currentTime)
  osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + duration)
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
  osc.start()
  osc.stop(ctx.currentTime + duration)
}
```
