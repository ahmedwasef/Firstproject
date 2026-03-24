# Math Blast — Kids Math Game (Ages 5–12)

## Context
Browser-based arcade game where math equations fall from the sky on asteroids.
The player types the correct answer to destroy them before they reach the ground.
Difficulty adapts to age group. Deployed to GitHub Pages alongside the existing portfolio.

**Core loop:** Asteroids spawn at the top, drift downward. Each carries a math equation.
Player types the answer and hits Enter. Correct = explosion + score. Miss = lose a life.

---

## Difficulty Levels

| Level  | Age   | Operations        | Speed  | Max number |
|--------|-------|-------------------|--------|------------|
| Easy   | 5–7   | Addition only     | Slow   | 10         |
| Medium | 8–10  | Add + Subtract    | Normal | 20         |
| Hard   | 11–12 | Multiply + Divide | Fast   | 12×12      |

---

## File Structure

```
math-blast/
├── index.html   — game shell, UI overlays (menu, HUD, game over)
├── style.css    — dark space theme, responsive layout, animations
└── game.js      — all game logic (canvas, asteroids, input, scoring)
```

---

## Phase 1 — Project Scaffold

**Goal:** Get a working empty shell that opens in the browser.

### Tasks
- [ ] 1.1 Create `math-blast/` folder inside `Firstproject/`
- [ ] 1.2 Create `index.html` with:
  - `<canvas id="gameCanvas">` filling the viewport
  - Three overlay `<div>` containers: `#screen-menu`, `#screen-hud`, `#screen-gameover`
  - Single `<input id="answer">` field at the bottom (hidden until game starts)
  - Link `style.css` and `game.js`
- [ ] 1.3 Create empty `style.css` with CSS reset and `body { margin:0; overflow:hidden; }`
- [ ] 1.4 Create empty `game.js` with a `DOMContentLoaded` listener and `console.log('Math Blast loaded')`
- [ ] 1.5 Open in browser and confirm canvas fills screen with no errors

---

## Phase 2 — Menu Screen

**Goal:** Fully styled menu that lets the player pick difficulty and start the game.

### Tasks
- [ ] 2.1 **HTML** — Inside `#screen-menu` add:
  - `<h1>` title "Math Blast 🚀"
  - Subtitle "Type the answer. Destroy the asteroids."
  - Three `<button>` elements: Easy / Medium / Hard
  - `<p id="high-score">` — reads from `localStorage` on load
- [ ] 2.2 **CSS** — Style the menu:
  - Deep space background: `radial-gradient(ellipse, #0d0d2b, #000)`
  - Starfield layer: 200 pseudo-random `box-shadow` dots on `::before`
  - Title: large font, `text-shadow` glow in cyan/yellow
  - Difficulty buttons: pill shape, color-coded (green / orange / red), hover scale effect
- [ ] 2.3 **JS** — `initMenu()` function:
  - Show `#screen-menu`, hide others
  - Read and display high score from `localStorage`
  - Attach click handlers to difficulty buttons → call `startGame(difficulty)`

---

## Phase 3 — Math Engine

**Goal:** Pure function that generates correct, age-appropriate questions.

### Tasks
- [ ] 3.1 Create `generateQuestion(difficulty)` that returns `{ q: "3 + 4", a: 7 }`
  - **Easy:** `a + b`, a and b in [1, 10]
  - **Medium:** `a + b` or `a - b` (result ≥ 0), numbers in [1, 20]
  - **Hard:** `a × b` or `a ÷ b` (only clean integer division), numbers in [1, 12]
- [ ] 3.2 Add `randomInt(min, max)` helper
- [ ] 3.3 For Hard division: generate `b` and `result` first, derive `a = b × result` to guarantee no remainders
- [ ] 3.4 Unit-test in browser console: call `generateQuestion('easy')` 10x and verify all answers are correct

---

## Phase 4 — Asteroid Class

**Goal:** A single asteroid object that can render itself and move.

### Tasks
- [ ] 4.1 Define `class Asteroid`:
  ```
  constructor(canvas, difficulty)
    x       = random position across canvas width (with padding)
    y       = -80 (off-screen top)
    speed   = base speed for difficulty + small random variance
    size    = random between 50–80px radius
    color   = random from palette [#a0522d, #8b4513, #cd853f]
    question = generateQuestion(difficulty)  →  { q, a }
  ```
- [ ] 4.2 `update()` method — increment `y` by `speed` each frame
- [ ] 4.3 `draw(ctx)` method:
  - Draw irregular polygon (8 points with slight random jitter) as rock shape
  - Fill with asteroid color, dark stroke
  - Center the question text `q` in white bold font over the rock
- [ ] 4.4 `isOffScreen(canvasHeight)` — returns `true` when `y - size > canvasHeight`

---

## Phase 5 — Game Loop & State

**Goal:** Asteroids spawn, move, and disappear. Lives decrease when missed.

### Tasks
- [ ] 5.1 Define game state object:
  ```js
  const state = {
    running: false,
    difficulty: 'easy',
    score: 0,
    lives: 3,
    correctCount: 0,   // tracks progression
    asteroids: [],
    particles: [],
    floatingTexts: [],
    spawnInterval: null,
    animFrameId: null,
  }
  ```
- [ ] 5.2 `startGame(difficulty)` function:
  - Reset all state fields
  - Hide menu, show HUD
  - Focus the answer input
  - Start spawn timer via `setInterval` (interval based on difficulty)
  - Call `gameLoop()`
- [ ] 5.3 Spawn timer — calls `spawnAsteroid()` every N ms:
  - Easy: 3000ms, Medium: 2200ms, Hard: 1500ms
  - Creates new `Asteroid` and pushes to `state.asteroids`
  - Max 6 asteroids on screen at once
- [ ] 5.4 `gameLoop()` using `requestAnimationFrame`:
  - Clear canvas
  - Draw starfield background
  - `asteroid.update()` + `asteroid.draw(ctx)` for each asteroid
  - Check `isOffScreen()` → remove asteroid, decrement life, call `updateHUD()`
  - Update and draw particles and floating texts
  - If `state.lives <= 0` → call `endGame()`
  - Else → `requestAnimationFrame(gameLoop)`

---

## Phase 6 — Input & Answer Checking

**Goal:** Player types an answer, correct ones destroy asteroids.

### Tasks
- [ ] 6.1 Add `keydown` listener on `#answer` input for `Enter` key
- [ ] 6.2 On Enter:
  - Read and trim `input.value`
  - Find first asteroid where `asteroid.question.a === parseInt(typed)`
  - If match found:
    - Remove asteroid from `state.asteroids`
    - Bonus check: if `asteroid.y < canvas.height / 2` → +15 pts, else +10 pts
    - Increment `state.correctCount`
    - Call `triggerExplosion(asteroid.x, asteroid.y)`
    - Call `addFloatingText('+10', asteroid.x, asteroid.y)`
    - Play success sound
    - Update HUD score
    - Check progression (every 5 correct → `increaseSpeed()`)
  - If no match:
    - Add CSS class `shake` to input for 300ms
    - Play error sound
  - Always clear input value
- [ ] 6.3 `increaseSpeed()` — multiply all asteroid speeds by 1.1, reduce spawn interval by 100ms (min 800ms)

---

## Phase 7 — Explosion & Particle Effects

**Goal:** Satisfying visual feedback when an asteroid is destroyed.

### Tasks
- [ ] 7.1 Define `class Particle`:
  ```
  constructor(x, y, color)
    vx, vy = random direction + speed
    alpha  = 1.0
    radius = random 3–7px
  ```
  - `update()` — move by velocity, decrease alpha by 0.03
  - `draw(ctx)` — filled circle with globalAlpha
  - `isDead()` — returns true when alpha ≤ 0
- [ ] 7.2 `triggerExplosion(x, y)` — push 12 new Particles to `state.particles`
- [ ] 7.3 Define `class FloatingText`:
  ```
  constructor(text, x, y)
    y drifts upward by 1.5px/frame
    alpha fades from 1 → 0 over 60 frames
  ```
  - `update()` / `draw(ctx)` / `isDead()`
- [ ] 7.4 In game loop: update + draw all particles and floating texts, filter out dead ones

---

## Phase 8 — Sound Effects

**Goal:** Audio feedback using Web Audio API (no external files).

### Tasks
- [ ] 8.1 Create `AudioContext` lazily on first user interaction (browser policy)
- [ ] 8.2 `playSuccess()` — short ascending tone:
  - Oscillator type: `sine`, frequency sweep 400Hz → 600Hz over 0.15s
  - Gain envelope: attack 0.01s, release 0.1s
- [ ] 8.3 `playMiss()` — low thud:
  - Oscillator type: `triangle`, frequency 150Hz, duration 0.2s
  - Gain envelope: fast decay
- [ ] 8.4 `playGameOver()` — descending wail:
  - Frequency sweep 500Hz → 100Hz over 0.8s

---

## Phase 9 — HUD & Game Over Screen

**Goal:** Player always knows their score, lives, and level.

### Tasks
- [ ] 9.1 **HUD HTML** inside `#screen-hud`:
  - `<span id="score">Score: 0</span>` — top left
  - `<span id="level">Level 1</span>` — top center
  - `<div id="lives">♥ ♥ ♥</div>` — top right
- [ ] 9.2 `updateHUD()` — syncs DOM elements with `state.score` and `state.lives`
  - Hearts: re-render as filled `♥` (alive) vs hollow `♡` (lost)
  - Level: increments every 5 correct answers
- [ ] 9.3 **Game Over HTML** inside `#screen-gameover`:
  - `<h2>Game Over</h2>`
  - `<p id="final-score">`
  - `<p id="new-record">` — conditionally shown
  - Two buttons: "Play Again" (same difficulty) and "Change Difficulty" (back to menu)
- [ ] 9.4 `endGame()`:
  - Cancel animation frame and spawn interval
  - Compare score to `localStorage` high score → update if beaten
  - Show `#screen-gameover` with final score
  - Play game over sound

---

## Phase 10 — Polish & Responsiveness

**Goal:** Game feels great and works on all screen sizes.

### Tasks
- [ ] 10.1 Resize handler — on `window.resize`, update `canvas.width/height` to match viewport
- [ ] 10.2 Prevent spacebar/Enter from scrolling the page during play
- [ ] 10.3 Animate title on menu with a slow pulse/glow CSS animation
- [ ] 10.4 Color-code asteroids by difficulty (green tint = easy, red tint = hard equations)
- [ ] 10.5 Add subtle background color shift as speed increases (dark blue → dark red)
- [ ] 10.6 Test on mobile viewport (768px wide) — ensure input is accessible and text is readable

---

## Phase 11 — Deployment

**Goal:** Live on GitHub Pages.

### Tasks
- [ ] 11.1 Add and commit all `math-blast/` files:
  ```
  git add math-blast/
  git commit -m "Add Math Blast game"
  ```
- [ ] 11.2 Push to `origin main`
- [ ] 11.3 Verify GitHub Pages rebuilds (usually 1–2 min)
- [ ] 11.4 Open `https://ahmedwasef.github.io/Firstproject/math-blast/` and smoke-test all 3 difficulty levels
- [ ] 11.5 Add a "Play Math Blast" link/card to the main `index.html` portfolio page

---

## Verification Checklist

| Test | Expected Result |
|------|----------------|
| Open menu | Stars visible, high score shows 0, 3 difficulty buttons |
| Click Easy | Asteroids spawn slowly with addition equations |
| Type correct answer + Enter | Explosion, score +10, input clears |
| Type wrong answer + Enter | Input shakes, no score change |
| Let asteroid reach bottom | Life heart disappears |
| Lose 3 lives | Game over screen with final score |
| Beat high score | "New Record!" message appears |
| Refresh page | High score persists |
| Click Hard | Multiplication/division equations, faster asteroids |
| Mobile viewport | Layout adapts, input reachable |
| GitHub Pages URL | Game loads and plays correctly |
