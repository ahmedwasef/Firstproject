# Phase 9 — HUD & Game Over Screen

**Goal:** Player always knows their score, lives, and level. Clear end state screen.

## Tasks

- [ ] 9.1 **HUD HTML** inside `#screen-hud`:
  ```html
  <div id="screen-hud">
    <span id="hud-score">Score: 0</span>
    <span id="hud-level">Level 1</span>
    <div id="hud-lives">♥ ♥ ♥</div>
    <input id="answer" type="number" placeholder="?" autocomplete="off" />
  </div>
  ```
  - Score: top-left
  - Level: top-center
  - Lives: top-right
  - Input: fixed bottom-center, large font, focused during play

- [ ] 9.2 `updateHUD()` — syncs DOM with current state:
  ```js
  document.getElementById('hud-score').textContent = 'Score: ' + state.score
  document.getElementById('hud-level').textContent = 'Level ' + Math.floor(state.correctCount / 5) + 1
  // Hearts: filled ♥ for remaining lives, hollow ♡ for lost
  document.getElementById('hud-lives').textContent =
    '♥'.repeat(state.lives) + '♡'.repeat(3 - state.lives)
  ```

- [ ] 9.3 **Game Over HTML** inside `#screen-gameover`:
  ```html
  <div id="screen-gameover">
    <h2>Game Over</h2>
    <p id="final-score"></p>
    <p id="new-record" hidden>New High Score!</p>
    <button id="btn-replay">Play Again</button>
    <button id="btn-menu">Change Difficulty</button>
  </div>
  ```

- [ ] 9.4 `endGame()`:
  - `cancelAnimationFrame(state.animFrameId)`
  - `clearInterval(state.spawnInterval)`
  - Read current high score from `localStorage`
  - If `state.score > highScore` → update `localStorage`, show `#new-record`
  - Populate `#final-score` with score
  - Show `#screen-gameover`, hide `#screen-hud`
  - Play `playGameOver()` sound
  - Attach `#btn-replay` → `startGame(state.difficulty)`
  - Attach `#btn-menu` → `initMenu()`
