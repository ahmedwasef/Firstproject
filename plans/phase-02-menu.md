# Phase 2 — Menu Screen

**Goal:** Fully styled menu that lets the player pick difficulty and start the game.

## Tasks

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

## Details

| Button  | Color  | Calls                    |
|---------|--------|--------------------------|
| Easy    | Green  | `startGame('easy')`      |
| Medium  | Orange | `startGame('medium')`    |
| Hard    | Red    | `startGame('hard')`      |
