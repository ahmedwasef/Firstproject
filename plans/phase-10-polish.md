# Phase 10 — Polish & Responsiveness

**Goal:** Game feels great and works on all screen sizes including tablets.

## Tasks

- [ ] 10.1 **Resize handler** — canvas stays full viewport on window resize:
  ```js
  window.addEventListener('resize', () => {
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
  })
  ```

- [ ] 10.2 **Prevent scroll during play** — block default on spacebar and arrow keys:
  ```js
  window.addEventListener('keydown', e => {
    if (['Space','ArrowUp','ArrowDown'].includes(e.code) && state.running)
      e.preventDefault()
  })
  ```

- [ ] 10.3 **Animated menu title** — CSS keyframe animation:
  ```css
  @keyframes pulse-glow {
    0%, 100% { text-shadow: 0 0 10px #0ff, 0 0 20px #0ff; }
    50%       { text-shadow: 0 0 20px #ff0, 0 0 40px #ff0; }
  }
  h1 { animation: pulse-glow 2s ease-in-out infinite; }
  ```

- [ ] 10.4 **Asteroid color tinting by question type:**
  - Addition → brownish (default palette)
  - Subtraction → blue-grey tint
  - Multiplication → orange tint
  - Division → red tint

- [ ] 10.5 **Dynamic background color shift** — as speed increases, lerp canvas background:
  - Start: dark blue `#050520`
  - Max speed: dark red `#200505`
  - Update on each `increaseSpeed()` call

- [ ] 10.6 **Mobile / tablet test** at 768px wide:
  - Input field large enough to tap (min 48px height)
  - Answer input uses `type="number"` to trigger numeric keyboard on mobile
  - HUD text readable (min 16px)
  - Asteroid text scales with asteroid size

## Input Shake Animation
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25%       { transform: translateX(-8px); }
  75%       { transform: translateX(8px); }
}
.shake { animation: shake 0.3s ease; }
```
