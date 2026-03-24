# Phase 4 — Asteroid Class

**Goal:** A single asteroid object that can render itself and move down the canvas.

## Tasks

- [ ] 4.1 Define `class Asteroid` with constructor:
  ```
  constructor(canvas, difficulty)
    x        = random position across canvas width (with 80px padding each side)
    y        = -80 (spawns off-screen top)
    speed    = base speed for difficulty + small random variance (±0.3)
    size     = random between 50–80px radius
    color    = random from palette [#a0522d, #8b4513, #cd853f]
    question = generateQuestion(difficulty)  →  { q, a }
    points   = jitter array of 8 angles for irregular polygon shape (set once in constructor)
  ```

- [ ] 4.2 `update()` method — increment `y` by `speed` each frame

- [ ] 4.3 `draw(ctx)` method:
  - Draw irregular polygon using 8 pre-computed jitter points around center
  - Fill with `this.color`, stroke with `#333` (2px)
  - Center the question text `q` in white bold font (size based on asteroid size)
  - Add subtle inner shadow for depth

- [ ] 4.4 `isOffScreen(canvasHeight)` — returns `true` when `y - size > canvasHeight`

## Speed by Difficulty

| Difficulty | Base Speed (px/frame) |
|------------|-----------------------|
| Easy       | 0.8                   |
| Medium     | 1.4                   |
| Hard       | 2.2                   |
