# Phase 5 — Game Loop & State

**Goal:** Asteroids spawn, move, and disappear. Lives decrease when missed.

## Tasks

- [ ] 5.1 Define game state object:
  ```js
  const state = {
    running:       false,
    difficulty:    'easy',
    score:         0,
    lives:         3,
    correctCount:  0,       // tracks progression milestones
    asteroids:     [],
    particles:     [],
    floatingTexts: [],
    spawnInterval: null,
    animFrameId:   null,
  }
  ```

- [ ] 5.2 `startGame(difficulty)` function:
  - Reset all state fields to defaults
  - Hide `#screen-menu`, show `#screen-hud`
  - Focus the `#answer` input
  - Start spawn timer via `setInterval` (interval based on difficulty)
  - Call `gameLoop()`

- [ ] 5.3 Spawn timer — calls `spawnAsteroid()` every N ms:
  - Easy: 3000ms, Medium: 2200ms, Hard: 1500ms
  - Creates `new Asteroid(canvas, difficulty)` and pushes to `state.asteroids`
  - Cap: max 6 asteroids on screen at once (skip spawn if at cap)

- [ ] 5.4 `gameLoop()` using `requestAnimationFrame`:
  1. Clear canvas (`ctx.clearRect`)
  2. Draw starfield background
  3. For each asteroid: `update()` then `draw(ctx)`
  4. Check `isOffScreen()` → remove from array, decrement `state.lives`, call `updateHUD()`
  5. Update + draw particles; filter out dead ones
  6. Update + draw floating texts; filter out dead ones
  7. If `state.lives <= 0` → call `endGame()` and return
  8. Else → `state.animFrameId = requestAnimationFrame(gameLoop)`

## Spawn Intervals

| Difficulty | Initial Interval | Min Interval |
|------------|-----------------|--------------|
| Easy       | 3000ms          | 1200ms       |
| Medium     | 2200ms          | 1000ms       |
| Hard       | 1500ms          | 800ms        |
