// ══════════════════════════════════════════════════════
//  Math Blast — Game Engine
// ══════════════════════════════════════════════════════

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const IS_MOBILE = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// ── Keypad panel height (reserved at bottom) ─────────
const PANEL_H = () => document.getElementById('keypad-panel').offsetHeight || 250;

// ── Resize canvas to fill area ABOVE the choices panel ──
function resizeCanvas() {
  const vw  = window.innerWidth;
  const vh  = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  const ph  = PANEL_H();

  canvas.style.left   = '0px';
  canvas.style.top    = '0px';
  canvas.style.width  = vw + 'px';
  canvas.style.height = (vh - ph) + 'px';

  canvas.width  = Math.round(vw       * dpr);
  canvas.height = Math.round((vh - ph) * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 300));

// CSS-pixel game dimensions
function cw() { return parseFloat(canvas.style.width)  || canvas.width; }
function ch() { return parseFloat(canvas.style.height) || canvas.height; }

// ── Keyboard input (desktop) ─────────────────────────
window.addEventListener('keydown', e => {
  if (['Space','ArrowUp','ArrowDown'].includes(e.code) && state.running)
    e.preventDefault();
  if (!state.running) return;
  if (e.key >= '0' && e.key <= '9') appendKey(e.key);
  else if (e.key === 'Backspace') { e.preventDefault(); deleteKey(); }
  else if (e.key === 'Enter')     { e.preventDefault(); submitKeypad(); }
});

// ── iOS AudioContext resume ──────────────────────────
document.addEventListener('touchstart', () => {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}, { passive: true });

// ══════════════════════════════════════════════════════
//  AUDIO
// ══════════════════════════════════════════════════════
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTone(type, freqStart, freqEnd, duration, volume = 0.3) {
  try {
    const ac   = getAudio();
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, ac.currentTime);
    osc.frequency.linearRampToValueAtTime(freqEnd, ac.currentTime + duration);
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0, ac.currentTime + duration);
    osc.start(); osc.stop(ac.currentTime + duration);
  } catch(e) {}
}
const playSuccess  = () => playTone('sine',     300, 700, 0.18, 0.25);
const playMiss     = () => playTone('triangle', 200, 100, 0.22, 0.2);
const playGameOver = () => playTone('sawtooth', 500, 80,  0.9,  0.3);
const playMissLife = () => playTone('triangle', 350, 150, 0.35, 0.25);

// ══════════════════════════════════════════════════════
//  MATH ENGINE
// ══════════════════════════════════════════════════════
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(difficulty) {
  if (difficulty === 'easy') {
    const a = randomInt(1, 10), b = randomInt(1, 10);
    return { q: `${a} + ${b}`, a: a + b };
  }
  if (difficulty === 'medium') {
    const op = Math.random() < 0.5 ? '+' : '-';
    let a = randomInt(1, 20), b = randomInt(1, 20);
    if (op === '-' && b > a) [a, b] = [b, a];
    return { q: `${a} ${op} ${b}`, a: op === '+' ? a + b : a - b };
  }
  const op = Math.random() < 0.5 ? '×' : '÷';
  if (op === '×') {
    const a = randomInt(2, 12), b = randomInt(2, 12);
    return { q: `${a} × ${b}`, a: a * b };
  } else {
    const result = randomInt(2, 12), b = randomInt(2, 12);
    return { q: `${result * b} ÷ ${b}`, a: result };
  }
}

// ══════════════════════════════════════════════════════
//  KEYPAD
// ══════════════════════════════════════════════════════
function updateKeypadDisplay() {
  elKeypadInput.textContent = state.keypadInput || '–';
}

function appendKey(digit) {
  if (state.keypadInput.length >= 4) return;
  state.keypadInput += digit;
  updateKeypadDisplay();
}

function deleteKey() {
  state.keypadInput = state.keypadInput.slice(0, -1);
  updateKeypadDisplay();
}

function submitKeypad() {
  if (!state.keypadInput) return;
  const value = parseInt(state.keypadInput, 10);
  state.keypadInput = '';
  updateKeypadDisplay();

  const idx = state.asteroids.findIndex(a => a.question.a === value);
  if (idx !== -1) {
    const ast = state.asteroids[idx];
    const pts = ast.y < ch() / 2 ? 15 : 10;
    state.score += pts;
    state.correctCount++;
    triggerExplosion(ast.x, ast.y, ast.color);
    state.floatingTexts.push(new FloatingText(`+${pts}`, ast.x, ast.y - ast.size - 10));
    state.asteroids.splice(idx, 1);
    playSuccess();
    updateHUD();
    if (state.correctCount % 5 === 0) increaseSpeed();
    elKeypadDisp.classList.add('flash-correct');
    setTimeout(() => elKeypadDisp.classList.remove('flash-correct'), 320);
  } else {
    playMiss();
    elKeypadDisp.classList.add('flash-wrong');
    setTimeout(() => elKeypadDisp.classList.remove('flash-wrong'), 380);
  }
}

// ══════════════════════════════════════════════════════
//  PARTICLES & FLOATING TEXT
// ══════════════════════════════════════════════════════
class Particle {
  constructor(x, y, color) {
    this.x = x; this.y = y;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = (Math.random() - 0.5) * 8;
    this.alpha  = 1;
    this.radius = Math.random() * 4 + 2;
    this.color  = color;
  }
  update() { this.x += this.vx; this.y += this.vy; this.alpha -= 0.035; }
  draw(c) {
    c.save();
    c.globalAlpha = Math.max(0, this.alpha);
    c.fillStyle = this.color;
    c.beginPath(); c.arc(this.x, this.y, this.radius, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  isDead() { return this.alpha <= 0; }
}

class FloatingText {
  constructor(text, x, y, color = '#f9ca24') {
    this.text = text; this.x = x; this.y = y;
    this.alpha = 1; this.frame = 0; this.color = color;
  }
  update() { this.y -= 1.8; this.frame++; this.alpha = 1 - this.frame / 55; }
  draw(c) {
    c.save();
    c.globalAlpha = Math.max(0, this.alpha);
    c.fillStyle = this.color;
    c.font = 'bold 22px Segoe UI, sans-serif';
    c.textAlign = 'center';
    c.fillText(this.text, this.x, this.y);
    c.restore();
  }
  isDead() { return this.frame >= 55; }
}

// ══════════════════════════════════════════════════════
//  ASTEROID
// ══════════════════════════════════════════════════════
const DIFFICULTY_CONFIG = {
  easy:   { baseSpeed: IS_MOBILE ? 0.45 : 0.7,  spawnMs: IS_MOBILE ? 4500 : 3000, minSpawnMs: IS_MOBILE ? 2000 : 1200, maxAsteroids: IS_MOBILE ? 2 : 5 },
  medium: { baseSpeed: IS_MOBILE ? 0.85 : 1.3,  spawnMs: IS_MOBILE ? 3500 : 2200, minSpawnMs: IS_MOBILE ? 1500 : 1000, maxAsteroids: IS_MOBILE ? 3 : 5 },
  hard:   { baseSpeed: IS_MOBILE ? 1.4  : 2.1,  spawnMs: IS_MOBILE ? 2500 : 1500, minSpawnMs: IS_MOBILE ? 1200 : 800,  maxAsteroids: IS_MOBILE ? 3 : 5 },
};

const ROCK_COLORS = ['#a0522d', '#8b4513', '#cd853f', '#b8860b'];

class Asteroid {
  constructor(difficulty) {
    const minSize = IS_MOBILE ? 68 : 50;
    const maxSize = IS_MOBILE ? 90 : 76;
    const pad     = IS_MOBILE ? 70 : 90;
    this.x        = randomInt(pad, cw() - pad);
    this.y        = -80;
    this.speed    = DIFFICULTY_CONFIG[difficulty].baseSpeed + (Math.random() - 0.5) * 0.3;
    this.size     = randomInt(minSize, maxSize);
    this.color    = ROCK_COLORS[randomInt(0, ROCK_COLORS.length - 1)];
    this.question = generateQuestion(difficulty);
    this.jitter   = Array.from({length: 9}, () => Math.random() * 0.38 + 0.72);
    this.angle    = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.012;
  }
  update() { this.y += this.speed; this.angle += this.rotSpeed; }
  draw(c) {
    const pts = 9;
    c.save();
    c.translate(this.x, this.y);
    c.rotate(this.angle);

    c.beginPath();
    for (let i = 0; i < pts; i++) {
      const theta = (i / pts) * Math.PI * 2;
      const r = this.size * this.jitter[i];
      i === 0 ? c.moveTo(Math.cos(theta)*r, Math.sin(theta)*r)
              : c.lineTo(Math.cos(theta)*r, Math.sin(theta)*r);
    }
    c.closePath();

    const grad = c.createRadialGradient(0, -this.size*0.3, 0, 0, 0, this.size);
    grad.addColorStop(0, lighten(this.color, 40));
    grad.addColorStop(1, darken(this.color, 30));
    c.fillStyle = grad; c.fill();
    c.strokeStyle = '#222'; c.lineWidth = 2; c.stroke();

    const fontMax  = IS_MOBILE ? 30 : 22;
    const fontMin  = IS_MOBILE ? 18 : 14;
    const fontSize = Math.max(fontMin, Math.min(fontMax, this.size * (IS_MOBILE ? 0.46 : 0.38)));
    c.font = `bold ${fontSize}px Segoe UI, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#fff'; c.shadowColor = '#000'; c.shadowBlur = 6;
    c.fillText(this.question.q, 0, 0);
    c.shadowBlur = 0;
    c.restore();
  }
  isOffScreen() { return this.y - this.size > ch(); }
}

function lighten(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${Math.min(255,(n>>16)+pct)},${Math.min(255,((n>>8)&0xff)+pct)},${Math.min(255,(n&0xff)+pct)})`;
}
function darken(hex, pct) { return lighten(hex, -pct); }

// ══════════════════════════════════════════════════════
//  GAME STATE
// ══════════════════════════════════════════════════════
const state = {
  running: false, difficulty: 'easy',
  score: 0, lives: 3, correctCount: 0,
  asteroids: [], particles: [], floatingTexts: [],
  spawnInterval: null, animFrameId: null,
  currentSpawnMs: 3000, bgHue: 230,
  keypadInput: '',
};

// ── DOM refs ─────────────────────────────────────────
const elMenu       = document.getElementById('screen-menu');
const elHud        = document.getElementById('screen-hud');
const elGameOver   = document.getElementById('screen-gameover');
const elKeypad     = document.getElementById('keypad-panel');
const elKeypadDisp = document.getElementById('keypad-display');
const elKeypadInput= document.getElementById('keypad-input');
const elScore      = document.getElementById('hud-score');
const elLevel      = document.getElementById('hud-level');
const elLives      = document.getElementById('hud-lives');
const elFinalScore = document.getElementById('final-score');
const elNewRecord  = document.getElementById('new-record');
const elHighScore  = document.getElementById('menu-highscore');

// ══════════════════════════════════════════════════════
//  MENU
// ══════════════════════════════════════════════════════
function initMenu() {
  elMenu.classList.remove('hidden');
  elHud.classList.add('hidden');
  elKeypad.classList.add('hidden');
  elGameOver.classList.add('hidden');
  elHighScore.textContent = `Best Score: ${localStorage.getItem('mathblast_hi') || 0}`;
}

document.querySelectorAll('.btn-diff').forEach(btn =>
  btn.addEventListener('click', () => startGame(btn.dataset.diff))
);
document.getElementById('btn-replay').addEventListener('click', () => startGame(state.difficulty));
document.getElementById('btn-menu').addEventListener('click', initMenu);

// ══════════════════════════════════════════════════════
//  START GAME
// ══════════════════════════════════════════════════════
function startGame(difficulty) {
  Object.assign(state, {
    difficulty, score: 0, lives: 3, correctCount: 0,
    asteroids: [], particles: [], floatingTexts: [],
    running: true, bgHue: 230,
    currentSpawnMs: DIFFICULTY_CONFIG[difficulty].spawnMs,
    keypadInput: '',
  });

  elMenu.classList.add('hidden');
  elGameOver.classList.add('hidden');
  elHud.classList.remove('hidden');
  elKeypad.classList.remove('hidden');
  updateKeypadDisplay();
  updateHUD();
  resizeCanvas();

  clearInterval(state.spawnInterval);
  startSpawnTimer();
  if (state.animFrameId) cancelAnimationFrame(state.animFrameId);
  gameLoop();
}

function startSpawnTimer() {
  clearInterval(state.spawnInterval);
  state.spawnInterval = setInterval(spawnAsteroid, state.currentSpawnMs);
}

function spawnAsteroid() {
  if (!state.running) return;
  if (state.asteroids.length >= DIFFICULTY_CONFIG[state.difficulty].maxAsteroids) return;
  state.asteroids.push(new Asteroid(state.difficulty));
}

// ══════════════════════════════════════════════════════
//  KEYPAD BUTTON HANDLERS
// ══════════════════════════════════════════════════════
document.querySelectorAll('.key-btn').forEach(btn => {
  function handleTap(e) {
    e.preventDefault();
    if (!state.running) return;
    const key = btn.dataset.key;
    if (key === '⌫')      deleteKey();
    else if (key === '✓') submitKeypad();
    else                  appendKey(key);
  }
  btn.addEventListener('click',    handleTap);
  btn.addEventListener('touchend', handleTap, { passive: false });
});

function increaseSpeed() {
  state.asteroids.forEach(a => { a.speed *= 1.12; });
  const cfg = DIFFICULTY_CONFIG[state.difficulty];
  state.currentSpawnMs = Math.max(cfg.minSpawnMs, state.currentSpawnMs - 120);
  startSpawnTimer();
  state.bgHue = Math.max(0, state.bgHue - 15);
}

// ══════════════════════════════════════════════════════
//  EXPLOSION
// ══════════════════════════════════════════════════════
function triggerExplosion(x, y, color) {
  const colors = [color, '#f9ca24', '#e74c3c', '#fff', '#0ff'];
  for (let i = 0; i < 14; i++)
    state.particles.push(new Particle(x, y, colors[i % colors.length]));
}

// ══════════════════════════════════════════════════════
//  HUD
// ══════════════════════════════════════════════════════
function updateHUD() {
  elScore.textContent = `Score: ${state.score}`;
  elLevel.textContent = `Level ${Math.floor(state.correctCount / 5) + 1}`;
  elLives.textContent = '♥'.repeat(state.lives) + '♡'.repeat(Math.max(0, 3 - state.lives));
}

// ══════════════════════════════════════════════════════
//  GAME LOOP
// ══════════════════════════════════════════════════════
function drawBackground() {
  const w = cw(), h = ch();
  const bg = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h));
  bg.addColorStop(0, `hsl(${state.bgHue}, 60%, 8%)`);
  bg.addColorStop(1, `hsl(${state.bgHue}, 80%, 2%)`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
}

function gameLoop() {
  if (!state.running) return;
  ctx.clearRect(0, 0, cw(), ch());
  drawBackground();

  const missed = [];
  for (let i = state.asteroids.length - 1; i >= 0; i--) {
    const a = state.asteroids[i];
    a.update(); a.draw(ctx);
    if (a.isOffScreen()) { missed.push(a); state.asteroids.splice(i, 1); }
  }

  if (missed.length) {
    missed.forEach(a => {
      state.lives--;
      playMissLife();
      state.floatingTexts.push(new FloatingText('-1 ♥', a.x, ch() - 40, '#e74c3c'));
    });
    updateHUD();
  }

  state.particles.forEach(p => { p.update(); p.draw(ctx); });
  state.particles = state.particles.filter(p => !p.isDead());

  state.floatingTexts.forEach(t => { t.update(); t.draw(ctx); });
  state.floatingTexts = state.floatingTexts.filter(t => !t.isDead());

  if (state.lives <= 0) { endGame(); return; }
  state.animFrameId = requestAnimationFrame(gameLoop);
}

// ══════════════════════════════════════════════════════
//  END GAME
// ══════════════════════════════════════════════════════
function endGame() {
  state.running = false;
  clearInterval(state.spawnInterval);
  cancelAnimationFrame(state.animFrameId);
  playGameOver();

  const best = parseInt(localStorage.getItem('mathblast_hi') || '0', 10);
  if (state.score > best) {
    localStorage.setItem('mathblast_hi', state.score);
    elNewRecord.classList.remove('hidden');
  } else {
    elNewRecord.classList.add('hidden');
  }

  elFinalScore.textContent = `Final Score: ${state.score}`;
  elHud.classList.add('hidden');
  elKeypad.classList.add('hidden');
  elGameOver.classList.remove('hidden');
}

// ── Boot ─────────────────────────────────────────────
initMenu();
