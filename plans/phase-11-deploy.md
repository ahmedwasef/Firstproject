# Phase 11 — Deployment

**Goal:** Math Blast live on GitHub Pages, linked from the portfolio homepage.

## Tasks

- [ ] 11.1 Stage and commit all game files:
  ```bash
  git add math-blast/
  git commit -m "Add Math Blast kids math game"
  ```

- [ ] 11.2 Push to `origin main`:
  ```bash
  git push origin main
  ```

- [ ] 11.3 Wait ~1–2 minutes for GitHub Pages to rebuild, then verify at:
  ```
  https://ahmedwasef.github.io/Firstproject/math-blast/
  ```

- [ ] 11.4 Smoke-test all 3 difficulty levels on the live URL:
  - Easy: addition equations, slow asteroids
  - Medium: add/subtract, normal speed
  - Hard: multiply/divide, fast asteroids

- [ ] 11.5 Add "Play Math Blast" card to the portfolio homepage (`index.html`):
  - Add a 4th card in the `#projects` section
  - Card links to `./math-blast/`
  - Commit and push

## Verification Checklist

| Test | Expected Result |
|------|----------------|
| Open menu | Stars visible, high score shows 0, 3 difficulty buttons |
| Click Easy | Asteroids spawn slowly with addition equations |
| Type correct answer + Enter | Explosion animation, score increases, input clears |
| Type wrong answer + Enter | Input shakes, score unchanged |
| Let asteroid reach bottom | One heart disappears from HUD |
| Lose all 3 lives | Game over screen with final score |
| Beat previous high score | "New High Score!" badge appears |
| Refresh page | High score still shows in menu |
| Click Hard | Multiplication/division equations, faster asteroids |
| Mobile viewport (768px) | Input accessible, text readable |
| GitHub Pages live URL | Game loads and plays correctly |
