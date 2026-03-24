// ══════════════════════════════════════════════════════
//  Math Blast — Game Engine
// ══════════════════════════════════════════════════════

const canvas  = document.getElementById('gameCanvas');
const ctx     = canvas.getContext('2d');

// ── Resize canvas to fill viewport ──────────────────
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ── Prevent page scroll during play ─────────────────
window.addEventListener('keydown', e => {
  if (['Space','ArrowUp','ArrowDown'].includes(e.code) && state.running)
    e.preventDefault();
});

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
    const ctx2 = getAudio();
    const osc  = ctx2.createOscillator();
    const gain = ctx2.createGain();
    osc.connect(gain);
    gain.connect(ctx2.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, ctx2.currentTime);
    osc.frequency.linearRampToValueAtTime(freqEnd, ctx2.currentTime + duration);
    gain.gain.setValueAtTime(volume, ctx2.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx2.currentTime + duration);
    osc.start();
    osc.stop(ctx2.currentTime + duration);
  } catch(e) { /* silently ignore audio errors */ }
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
  // hard
  const op = Math.random() < 0.5 ? '×' : '÷';
  if (op === '×') {
    const a = randomInt(2, 12), b = randomInt(2, 12);
    return { q: `${a} × ${b}`, a: a * b };
  } else {
    const result = randomInt(2, 12), b = randomInt(2, 12);
    const a = result * b;
    return { q: `${a} ÷ ${b}`, a: result };
  }
}

// ══════════════════════════════════════════════════════
//  PARTICLE
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
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  isDead() { return this.alpha <= 0; }
}

// ══════════════════════════════════════════════════════
//  FLOATING TEXT
// ══════════════════════════════════════════════════════
class FloatingText {
  constructor(text, x, y, color = '#f9ca24') {
    this.text  = text;
    this.x = x; this.y = y;
    this.alpha = 1;
    this.frame = 0;
    this.color = color;
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
  easy:   { baseSpeed: 0.7,  spawnMs: 3000, minSpawnMs: 1200, color: '#27ae60' },
  medium: { baseSpeed: 1.3,  spawnMs: 2200, minSpawnMs: 1000, color: '#e67e22' },
  hard:   { baseSpeed: 2.1,  spawnMs: 1500, minSpawnMs: 800,  color: '#e74c3c' },
};

const ROCK_COLORS  = ['#a0522d', '#8b4513', '#cd853f', '#b8860b'];
const OP_COLORS    = { '+': '#27ae6099', '-': '#2980b999', '×': '#e67e2299', '÷': '#e74c3c99' };

class Asteroid {
  constructor(difficulty) {
    const cfg   = DIFFICULTY_CONFIG[difficulty];
    const pad   = 90;
    this.x      = randomInt(pad, canvas.width - pad);
    this.y      = -80;
    this.speed  = cfg.baseSpeed + (Math.random() - 0.5) * 0.5;
    this.size   = randomInt(50, 78);
    this.color  = ROCK_COLORS[randomInt(0, ROCK_COLORS.length - 1)];
    this.question = generateQuestion(difficulty);
    // Pre-compute jitter for irregular polygon
    this.jitter = Array.from({length: 9}, () => Math.random() * 0.38 + 0.72);
    this.angle  = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.012;
  }

  update() {
    this.y += this.speed;
    this.angle += this.rotSpeed;
  }

  draw(c) {
    const pts = 9;
    c.save();
    c.translate(this.x, this.y);
    c.rotate(this.angle);

    // Rock shape
    c.beginPath();
    for (let i = 0; i < pts; i++) {
      const theta = (i / pts) * Math.PI * 2;
      const r = this.size * this.jitter[i];
      const px = Math.cos(theta) * r;
      const py = Math.sin(theta) * r;
      i === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
    }
    c.closePath();

    // Fill with gradient
    const grad = c.createRadialGradient(0, -this.size * 0.3, 0, 0, 0, this.size);
    grad.addColorStop(0, lighten(this.color, 40));
    grad.addColorStop(1, darken(this.color, 30));
    c.fillStyle = grad;
    c.fill();
    c.strokeStyle = '#222';
    c.lineWidth = 2;
    c.stroke();

    // Question text
    const fontSize = Math.max(14, Math.min(22, this.size * 0.38));
    c.font = `bold ${fontSize}px Segoe UI, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#fff';
    c.shadowColor = '#000';
    c.shadowBlur = 6;
    c.fillText(this.question.q, 0, 0);
    c.shadowBlur = 0;

    c.restore();
  }

  isOffScreen() { return this.y - this.size > canvas.height; }
}

function lighten(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (n >> 16) + pct);
  const g = Math.min(255, ((n >> 8) & 0xff) + pct);
  const b = Math.min(255, (n & 0xff) + pct);
  return `rgb(${r},${g},${b})`;
}
function darken(hex, pct) { return lighten(hex, -pct); }

// ══════════════════════════════════════════════════════
//  GAME STATE
// ══════════════════════════════════════════════════════
const state = {
  running:       false,
  difficulty:    'easy',
  score:         0,
  lives:         3,
  correctCount:  0,
  asteroids:     [],
  particles:     [],
  floatingTexts: [],
  spawnInterval: null,
  animFrameId:   null,
  currentSpawnMs: 3000,
  bgHue:         230,
};

// ── DOM refs ─────────────────────────────────────────
const elMenu      = document.getElementById('screen-menu');
const elHud       = document.getElementById('screen-hud');
const elGameOver  = document.getElementById('screen-gameover');
const elInputWrap = document.getElementById('input-wrap');
const elAnswer    = document.getElementById('answer');
const elScore     = document.getElementById('hud-score');
const elLevel     = document.getElementById('hud-level');
const elLives     = document.getElementById('hud-lives');
const elFinalScore= document.getElementById('final-score');
const elNewRecord = document.getElementById('new-record');
const elHighScore = document.getElementById('menu-highscore');

// ══════════════════════════════════════════════════════
//  MENU
// ══════════════════════════════════════════════════════
function initMenu() {
  elMenu.classList.remove('hidden');
  elHud.classList.add('hidden');
  elInputWrap.classList.add('hidden');
  elGameOver.classList.add('hidden');
  const best = localStorage.getItem('mathblast_hi') || 0;
  elHighScore.textContent = `Best Score: ${best}`;
}

document.querySelectorAll('.btn-diff').forEach(btn => {
  btn.addEventListener('click', () => startGame(btn.dataset.diff));
});
document.getElementById('btn-replay').addEventListener('click', () => startGame(state.difficulty));
document.getElementById('btn-menu').addEventListener('click', initMenu);

// ══════════════════════════════════════════════════════
//  START GAME
// ══════════════════════════════════════════════════════
function startGame(difficulty) {
  state.difficulty    = difficulty;
  state.score         = 0;
  state.lives         = 3;
  state.correctCount  = 0;
  state.asteroids     = [];
  state.particles     = [];
  state.floatingTexts = [];
  state.running       = true;
  state.bgHue         = 230;
  const cfg = DIFFICULTY_CONFIG[difficulty];
  state.currentSpawnMs = cfg.spawnMs;

  elMenu.classList.add('hidden');
  elGameOver.classList.add('hidden');
  elHud.classList.remove('hidden');
  elInputWrap.classList.remove('hidden');
  updateHUD();

  clearInterval(state.spawnInterval);
  startSpawnTimer();

  if (state.animFrameId) cancelAnimationFrame(state.animFrameId);
  gameLoop();

  setTimeout(() => elAnswer.focus(), 50);
}

function startSpawnTimer() {
  clearInterval(state.spawnInterval);
  state.spawnInterval = setInterval(spawnAsteroid, state.currentSpawnMs);
}

function spawnAsteroid() {
  if (!state.running) return;
  if (state.asteroids.length >= 6) return;
  state.asteroids.push(new Asteroid(state.difficulty));
}

// ══════════════════════════════════════════════════════
//  INPUT
// ══════════════════════════════════════════════════════
elAnswer.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const typed = parseInt(elAnswer.value.trim(), 10);
  elAnswer.value = '';

  if (isNaN(typed)) return;

  const idx = state.asteroids.findIndex(a => a.question.a === typed);
  if (idx !== -1) {
    const ast = state.asteroids[idx];
    const pts = ast.y < canvas.height / 2 ? 15 : 10;
    state.score += pts;
    state.correctCount++;
    triggerExplosion(ast.x, ast.y, ast.color);
    state.floatingTexts.push(new FloatingText(`+${pts}`, ast.x, ast.y - ast.size - 10));
    state.asteroids.splice(idx, 1);
    playSuccess();
    updateHUD();
    if (state.correctCount % 5 === 0) increaseSpeed();
  } else {
    playMiss();
    elAnswer.classList.remove('shake');
    void elAnswer.offsetWidth; // reflow to restart animation
    elAnswer.classList.add('shake');
    setTimeout(() => elAnswer.classList.remove('shake'), 400);
  }
});

function increaseSpeed() {
  state.asteroids.forEach(a => { a.speed *= 1.12; });
  const cfg = DIFFICULTY_CONFIG[state.difficulty];
  state.currentSpawnMs = Math.max(cfg.minSpawnMs, state.currentSpawnMs - 120);
  startSpawnTimer();
  // Shift bg hue toward red
  state.bgHue = Math.max(0, state.bgHue - 15);
}

// ══════════════════════════════════════════════════════
//  EXPLOSION
// ══════════════════════════════════════════════════════
function triggerExplosion(x, y, color) {
  const colors = [color, '#f9ca24', '#e74c3c', '#fff', '#0ff'];
  for (let i = 0; i < 14; i++) {
    state.particles.push(new Particle(x, y, colors[i % colors.length]));
  }
}

// ══════════════════════════════════════════════════════
//  HUD
// ══════════════════════════════════════════════════════
function updateHUD() {
  elScore.textContent = `Score: ${state.score}`;
  const level = Math.floor(state.correctCount / 5) + 1;
  elLevel.textContent = `Level ${level}`;
  elLives.textContent = '♥'.repeat(state.lives) + '♡'.repeat(Math.max(0, 3 - state.lives));
}

// ══════════════════════════════════════════════════════
//  GAME LOOP
// ══════════════════════════════════════════════════════
function drawBackground() {
  const bg = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
  );
  bg.addColorStop(0, `hsl(${state.bgHue}, 60%, 8%)`);
  bg.addColorStop(1, `hsl(${state.bgHue}, 80%, 2%)`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
  if (!state.running) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  // Asteroids
  const missed = [];
  for (let i = state.asteroids.length - 1; i >= 0; i--) {
    const a = state.asteroids[i];
    a.update();
    a.draw(ctx);
    if (a.isOffScreen()) {
      missed.push(a);
      state.asteroids.splice(i, 1);
    }
  }
  missed.forEach(a => {
    state.lives--;
    playMissLife();
    updateHUD();
    state.floatingTexts.push(new FloatingText('-1 ♥', a.x, canvas.height - 60, '#e74c3c'));
  });

  // Particles
  state.particles.forEach(p => { p.update(); p.draw(ctx); });
  state.particles = state.particles.filter(p => !p.isDead());

  // Floating texts
  state.floatingTexts.forEach(t => { t.update(); t.draw(ctx); });
  state.floatingTexts = state.floatingTexts.filter(t => !t.isDead());

  if (state.lives <= 0) {
    endGame();
    return;
  }

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
  elInputWrap.classList.add('hidden');
  elGameOver.classList.remove('hidden');
}

// ── Boot ─────────────────────────────────────────────
initMenu();
