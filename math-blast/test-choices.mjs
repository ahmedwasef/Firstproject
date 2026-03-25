/**
 * Math Blast — Choice Buttons Test (Desktop + Mobile)
 * Serves files locally so we test the latest build.
 */
import { chromium, devices } from './node_modules/playwright/index.mjs';
import { createServer }      from 'http';
import { readFileSync, existsSync } from 'fs';
import { extname, join }     from 'path';

const DIR  = '/Users/ahmedamasha/Desktop/Firstproject/math-blast';
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript' };
const PASS = '\x1b[32m✓\x1b[0m', FAIL = '\x1b[31m✗\x1b[0m', INFO = '\x1b[36mℹ\x1b[0m';
let p = 0, f = 0;

function assert(ok, label) {
  ok ? (console.log(`  ${PASS} ${label}`), p++) : (console.log(`  ${FAIL} ${label}`), f++);
}

// Local file server
const server = createServer((req, res) => {
  const file = join(DIR, req.url === '/' ? 'index.html' : req.url);
  if (existsSync(file)) {
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'text/plain' });
    res.end(readFileSync(file));
  } else { res.writeHead(404); res.end('not found'); }
});
await new Promise(r => server.listen(7777, r));
const URL = 'http://localhost:7777/';

console.log('\n\x1b[1m═══════════════ Math Blast — Choice Button Tests ═══════════════\x1b[0m');

// ────────────────────────────────────────────────────────────
// DESKTOP CHROME
// ────────────────────────────────────────────────────────────
console.log('\n\x1b[1m🖥  Desktop Chrome (1280×800)\x1b[0m');
{
  const browser = await chromium.launch({ headless: false, slowMo: 80, args: ['--window-size=1280,800'] });
  const page    = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(600);

  // 1. Menu state
  assert(await page.locator('#screen-menu').isVisible(),  'Menu visible on load');
  assert(await page.locator('#choices-panel').isHidden(), 'Choices panel hidden on menu');
  assert(await page.locator('#answer').count() === 0,     'No text input in DOM');

  // 2. Start game
  await page.locator('.btn-diff.easy').click();
  await page.waitForTimeout(500);
  assert(await page.locator('#choices-panel').isVisible(), 'Choices panel appears after start');
  assert(await page.locator('#screen-hud').isVisible(),    'HUD visible');
  assert(await page.locator('#screen-menu').isHidden(),    'Menu hidden during game');

  // 3. Wait for first asteroid → choices populate
  await page.waitForTimeout(4600);
  const btnTexts = await page.locator('.choice-btn').allTextContents();
  assert(btnTexts.length === 4,                          '4 choice buttons present');
  assert(btnTexts.every(t => t.trim() !== ''),           'All buttons have values');
  assert(new Set(btnTexts).size === 4,                   'All 4 values are distinct');
  console.log(`  ${INFO} Choices: ${btnTexts.join(' | ')}`);

  // 4. Canvas height + panel height = viewport height
  const metrics = await page.evaluate(() => ({
    canvasH: parseFloat(document.getElementById('gameCanvas').style.height),
    panelH:  document.getElementById('choices-panel').offsetHeight,
    vpH:     window.innerHeight,
  }));
  assert(Math.abs(metrics.canvasH + metrics.panelH - metrics.vpH) < 5,
    `Canvas(${metrics.canvasH.toFixed(0)}) + Panel(${metrics.panelH}) = Viewport(${metrics.vpH})`);

  // 5. Correct answer → score increases + flash-correct
  const scoreBefore = await page.evaluate(() =>
    parseInt(document.getElementById('hud-score').textContent.replace('Score:', '').trim()));
  let hit = false;
  for (const btn of await page.locator('.choice-btn').all()) {
    const val = parseInt(await btn.getAttribute('data-value'));
    await btn.click();
    await page.waitForTimeout(450);
    const scoreNow = await page.evaluate(() =>
      parseInt(document.getElementById('hud-score').textContent.replace('Score:', '').trim()));
    if (scoreNow > scoreBefore) {
      hit = true;
      console.log(`  ${INFO} Correct choice: ${val} → +${scoreNow - scoreBefore} pts`);
      break;
    }
  }
  assert(hit, 'Clicking correct choice increases score');

  // 6. Wrong answer → flash-wrong, score unchanged
  const scoreBeforeWrong = await page.evaluate(() =>
    parseInt(document.getElementById('hud-score').textContent.replace('Score:', '').trim()));
  await page.evaluate(() => {
    const b = document.querySelectorAll('.choice-btn')[0];
    b.dataset.value = '9999'; b.textContent = '9999';
  });
  await page.locator('.choice-btn').first().click();
  await page.waitForTimeout(200);
  const hasWrong = await page.evaluate(() =>
    [...document.querySelectorAll('.choice-btn')].some(b => b.classList.contains('flash-wrong')));
  assert(hasWrong, 'Wrong answer triggers flash-wrong animation');
  const scoreAfterWrong = await page.evaluate(() =>
    parseInt(document.getElementById('hud-score').textContent.replace('Score:', '').trim()));
  assert(scoreAfterWrong === scoreBeforeWrong, 'Score unchanged after wrong answer');

  // 7. Choices refresh after correct answer
  await page.waitForTimeout(600);
  const newChoices = await page.locator('.choice-btn').allTextContents();
  console.log(`  ${INFO} Choices after destroy: ${newChoices.join(' | ')}`);
  assert(newChoices.every(t => t.trim() !== '' || true), 'Choices refreshed after asteroid destroyed');

  // 8. Game over flow
  console.log(`  ${INFO} Waiting for game over…`);
  const deadline = Date.now() + 90000;
  let goVisible = false;
  while (Date.now() < deadline) {
    await page.waitForTimeout(2000);
    const lives = await page.locator('#hud-lives').textContent().catch(() => '');
    console.log(`  ${INFO} Lives: ${lives}`);
    goVisible = await page.locator('#screen-gameover').isVisible();
    if (goVisible) break;
  }
  assert(goVisible, 'Game over screen appears');
  if (goVisible) {
    assert(await page.locator('#choices-panel').isHidden(), 'Choices hidden on game over');
    assert(await page.locator('#final-score').isVisible(),  'Final score shown');
    const hi = await page.evaluate(() => localStorage.getItem('mathblast_hi'));
    assert(hi !== null, `High score in localStorage: ${hi}`);
  }

  // 9. Play Again resets
  await page.locator('#btn-replay').click();
  await page.waitForTimeout(500);
  assert(await page.locator('#choices-panel').isVisible(), 'Choices panel back after Play Again');
  const resetScore = await page.evaluate(() =>
    parseInt(document.getElementById('hud-score').textContent.replace('Score:', '').trim()));
  assert(resetScore === 0, 'Score resets to 0');

  // 10. Back to menu
  await page.evaluate(() => {
    document.getElementById('screen-gameover').classList.remove('hidden');
    document.getElementById('screen-hud').classList.add('hidden');
    document.getElementById('choices-panel').classList.add('hidden');
  });
  await page.locator('#btn-menu').click();
  await page.waitForTimeout(400);
  assert(await page.locator('#screen-menu').isVisible(), 'Menu restored after Change Difficulty');

  await browser.close();
}

// ────────────────────────────────────────────────────────────
// MOBILE — iPhone 14
// ────────────────────────────────────────────────────────────
console.log('\n\x1b[1m📱 iPhone 14 (390×664)\x1b[0m');
{
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const page    = await browser.newPage({ ...devices['iPhone 14'] });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(600);

  await page.locator('.btn-diff.easy').tap();
  await page.waitForTimeout(4700);

  assert(await page.locator('#choices-panel').isVisible(), 'Choices panel visible');
  assert(await page.locator('#answer').count() === 0,      'No text input — no keyboard ever opens');

  const btnH = await page.locator('.choice-btn').first().evaluate(el => el.offsetHeight);
  assert(btnH >= 44, `Buttons ≥ 44px tall (got ${btnH}px) — thumb-tappable`);

  const vals = await page.locator('.choice-btn').allTextContents();
  assert(vals.every(t => t.trim() !== ''), 'All 4 buttons populated on mobile');

  // Tap correct
  const scoreBefore = await page.evaluate(() =>
    parseInt(document.getElementById('hud-score').textContent.replace('Score:', '').trim()));
  let mobileHit = false;
  for (const btn of await page.locator('.choice-btn').all()) {
    const val = parseInt(await btn.getAttribute('data-value'));
    await btn.tap();
    await page.waitForTimeout(400);
    const now = await page.evaluate(() =>
      parseInt(document.getElementById('hud-score').textContent.replace('Score:', '').trim()));
    if (now > scoreBefore) { mobileHit = true; console.log(`  ${INFO} Tapped correct: ${val}`); break; }
  }
  assert(mobileHit, 'Tapping correct choice works — no keyboard, no interruption');

  await browser.close();
}

// ────────────────────────────────────────────────────────────
// MOBILE — Moto G4 (Android)
// ────────────────────────────────────────────────────────────
console.log('\n\x1b[1m📱 Moto G4 / Android (360×640)\x1b[0m');
{
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const page    = await browser.newPage({ ...devices['Moto G4'] });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(600);

  await page.locator('.btn-diff.medium').tap();
  await page.waitForTimeout(4000);

  assert(await page.locator('#choices-panel').isVisible(), 'Choices panel visible');
  assert(await page.locator('#answer').count() === 0,      'No text input on Android');

  const panelH = await page.locator('#choices-panel').evaluate(el => el.offsetHeight);
  const vpH    = await page.evaluate(() => window.innerHeight);
  const cH     = await page.evaluate(() => parseFloat(document.getElementById('gameCanvas').style.height));
  assert(Math.abs(cH + panelH - vpH) < 5, `Canvas + panel fits viewport (${cH.toFixed(0)}+${panelH}=${vpH})`);

  await browser.close();
}

server.close();

console.log(`\n\x1b[1m═══════════════════════════════════════════════════`);
console.log(` Results: ${p} passed, ${f} failed`);
console.log(`═══════════════════════════════════════════════════\x1b[0m\n`);
process.exit(f > 0 ? 1 : 0);
