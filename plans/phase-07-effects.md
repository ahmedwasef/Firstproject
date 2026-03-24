# Phase 7 — Explosion & Particle Effects

**Goal:** Satisfying visual feedback when an asteroid is destroyed.

## Tasks

- [ ] 7.1 Define `class Particle`:
  ```js
  constructor(x, y, color)
    this.x      = x
    this.y      = y
    this.vx     = (Math.random() - 0.5) * 6   // random horizontal velocity
    this.vy     = (Math.random() - 0.5) * 6   // random vertical velocity
    this.alpha  = 1.0
    this.radius = Math.random() * 4 + 3        // 3–7px
    this.color  = color
  ```
  - `update()` — `x += vx`, `y += vy`, `alpha -= 0.03`
  - `draw(ctx)` — filled circle, set `ctx.globalAlpha = this.alpha` before drawing
  - `isDead()` — returns `true` when `alpha <= 0`

- [ ] 7.2 `triggerExplosion(x, y)`:
  - Push 12 new `Particle` instances to `state.particles`
  - Use asteroid color palette for particle colors

- [ ] 7.3 Define `class FloatingText`:
  ```js
  constructor(text, x, y)
    this.text   = text
    this.x      = x
    this.y      = y
    this.alpha  = 1.0
    this.frame  = 0
  ```
  - `update()` — `y -= 1.5`, `frame++`, `alpha = 1 - frame / 60`
  - `draw(ctx)` — white bold text, `ctx.globalAlpha = this.alpha`
  - `isDead()` — returns `true` when `frame >= 60`

- [ ] 7.4 In `gameLoop()`: update + draw all particles and floating texts, then filter:
  ```js
  state.particles     = state.particles.filter(p => !p.isDead())
  state.floatingTexts = state.floatingTexts.filter(t => !t.isDead())
  ```
