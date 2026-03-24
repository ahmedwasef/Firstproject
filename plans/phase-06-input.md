# Phase 6 — Input & Answer Checking

**Goal:** Player types an answer, correct ones destroy asteroids.

## Tasks

- [ ] 6.1 Add `keydown` listener on `#answer` input for the `Enter` key

- [ ] 6.2 On Enter — answer checking logic:
  ```
  typed = parseInt(input.value.trim())

  find first asteroid where asteroid.question.a === typed

  IF match found:
    - Remove asteroid from state.asteroids
    - pts = asteroid.y < canvas.height / 2 ? 15 : 10   (early bonus)
    - state.score += pts
    - state.correctCount++
    - triggerExplosion(asteroid.x, asteroid.y)
    - addFloatingText('+' + pts, asteroid.x, asteroid.y)
    - playSuccess()
    - updateHUD()
    - if state.correctCount % 5 === 0 → increaseSpeed()

  IF no match:
    - add class 'shake' to input element
    - setTimeout to remove class after 300ms
    - playMiss()

  Always: input.value = ''
  ```

- [ ] 6.3 `increaseSpeed()`:
  - Multiply `speed` of every active asteroid by 1.1
  - Reduce spawn interval by 100ms (respect minimum per difficulty)
  - Restart `setInterval` with new interval

## Scoring

| Condition | Points |
|-----------|--------|
| Correct answer (bottom half) | +10 |
| Correct answer (top half — early) | +15 |
