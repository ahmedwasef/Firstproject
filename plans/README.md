# Math Blast — Plan Index

## Context
Browser-based arcade game where math equations fall on asteroids.
Player types the correct answer to destroy them. Difficulty adapts to age (5–12).
Deployed to GitHub Pages inside the existing `Firstproject` repo.

## Difficulty Levels

| Level  | Age   | Operations        | Speed  | Max number |
|--------|-------|-------------------|--------|------------|
| Easy   | 5–7   | Addition only     | Slow   | 10         |
| Medium | 8–10  | Add + Subtract    | Normal | 20         |
| Hard   | 11–12 | Multiply + Divide | Fast   | 12×12      |

## File Structure

```
math-blast/
├── index.html   — game shell, UI overlays (menu, HUD, game over)
├── style.css    — dark space theme, responsive layout, animations
└── game.js      — all game logic (canvas, asteroids, input, scoring)
```

## Phases

| File | Phase | Goal |
|------|-------|------|
| [phase-01-scaffold.md](phase-01-scaffold.md) | 1 — Project Scaffold | Empty shell that opens in the browser |
| [phase-02-menu.md](phase-02-menu.md) | 2 — Menu Screen | Styled menu with difficulty selector |
| [phase-03-math-engine.md](phase-03-math-engine.md) | 3 — Math Engine | Question generator per difficulty level |
| [phase-04-asteroid.md](phase-04-asteroid.md) | 4 — Asteroid Class | Render + movement for each asteroid |
| [phase-05-game-loop.md](phase-05-game-loop.md) | 5 — Game Loop & State | Spawning, movement, missed hits |
| [phase-06-input.md](phase-06-input.md) | 6 — Input & Answer Checking | Destroy asteroids on correct answer |
| [phase-07-effects.md](phase-07-effects.md) | 7 — Explosion & Particles | Visual feedback on destroy |
| [phase-08-sound.md](phase-08-sound.md) | 8 — Sound Effects | Web Audio API, no external files |
| [phase-09-hud.md](phase-09-hud.md) | 9 — HUD & Game Over | Score, lives, end state screen |
| [phase-10-polish.md](phase-10-polish.md) | 10 — Polish & Responsiveness | Mobile support, animations |
| [phase-11-deploy.md](phase-11-deploy.md) | 11 — Deployment | Push to GitHub Pages |
