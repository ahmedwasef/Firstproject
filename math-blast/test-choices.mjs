/**
 * Math Blast — Keypad Tests (Desktop + Mobile)
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

console.log('\n\x1b[1m═══════════════ Math Blast — Keypad Tests ═══════════════\x1b[0m');

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
  assert(await page.locator('#keypad-panel').isHidden(),  'Keypad panel hidden on menu');
  assert(await page.locator('#answer').count() === 0,     'No text input in DOM');

  // 2. Start game
  await page.locator('.btn-diff.easy').click();
  await page.waitForTimeout(500);
  assert(await page.locator('#keypad-panel').isVisible(), 'Keypad panel appears after start');
  assert(await page.locator('#screen-hud').isVisible(),   'HUD visible');
  assert(await page.locator('#screen-menu').isHidden(),   'Menu hidden during game');

  // 3. Keypad structure: 12 buttons
  const keyBtns = await page.locator('.key-btn').count();
  assert(keyBtns === 12, `12 key buttons present (got ${keyBtns})`);

  // 4. Display shows placeholder dash
  const dispText = await page.locator('#keypad-input').textContent();
  assert(dispText === '–', `Display shows '–' initially (got '${dispText}')`);

  // 5. Canvas height + panel height = viewport height
  const metrics = await page.evaluate(() => ({
    canvasH: parseFloat(document.getElementById('gameCanvas').style.height),
    panelH:  document.getElementById('keypad-panel').offsetHeight,
    vpH:     window.innerHeight,
  }));
  assert(Math.abs(metrics.canvasH + metrics.panelH - metrics.vpH) < 5,
    `Canvas(${metrics.canvasH.toFixed(0)}) + Panel(${metrics.panelH}) = Viewport(${metrics.vpH})`);

  // 6. Typing digits updates display
  await page.keyboard.press('4');
  await page.keyboard.press('2');
  await page.waitForTimeout(80);
  const afterType = await page.locator('#keypad-input').textContent();
  assert(afterType === '42', `Typing 4,2 shows '42' (got '${afterType}')`);

  // 7. Backspace deletes last digit
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(80);
  const afterBackspace = await page.locator('#keypad-input').textContent();
  assert(afterBackspace === '4', `Backspace removes last digit (got '${afterBackspace}')`);

  // 8. Click '5' button → display appends
  await page.locator('.key-btn[data-key="5"]').click();
  await page.waitForTimeout(80);
  const after5 = await page.locator('#keypad-input').textContent();
  assert(after5 === '45', `Clicking '5' button appends (got '${after5}')`);

  // 9. ⌫ button removes last digit
  await page.locator('.key-btn[data-key="⌫"]').click();
  await page.waitForTimeout(80);
  const afterDel = await page.locator('#keypad-input').textContent();
  assert(afterDel === '4', `⌫ button removes digit ('45' → '${afterDel}')`);

  // 10. Clear display back to placeholder
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(80);
  const cleared = await page.locator('#keypad-input').textContent();
  assert(cleared === '–', `Cleared display shows '–' (got '${cleared}')`);

  // 11. Wait for first asteroid then test wrong answer
  await page.waitForTimeout(4600);
  const scoreBeforeWrong = await page.evaluate(() =>
    parseInt(document.getElementById('hud-score').textContent.replace('Score:', '').trim()));
  await page.keyboard.type('9999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  const scoreAfterWrong = await page.evaluate(() =>
    parseInt(document.getElementById('hud-score').textContent.replace('Score:', '').trim()));
  assert(scoreAfterWrong === scoreBeforeWrong, 'Score unchanged after wrong answer');

  // 12. Correct answer → score increases
  let hit = false;
  for (let attempt = 0; attempt < 20 && !hit; attempt++) {
    await page.waitForTimeout(300);
    if (await page.locator('#screen-gameover').isVisible()) break;
    const correctAnswer = await page.evaluate(() => {
      if (typeof state === 'undefined' || !state.asteroids.length) return null;
      return state.asteroids[0].question.a;
    });
    if (correctAnswer !== null && correctAnswer !== undefined) {
      const scoreBefore2 = await page.evaluate(() =>
        parseInt(document.getElementById('hud-score').textContent.replace('Score:', '').trim()));
      await page.keyboard.type(String(correctAnswer));
      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);
      const scoreNow = await page.evaluate(() =>
        parseInt(document.getElementById('hud-score').textContent.replace('Score:', '').trim()));
      if (scoreNow > scoreBefore2) {
        hit = true;
        console.log(`  ${INFO} Correct answer ${correctAnswer} → score +${scoreNow - scoreBefore2}`);
      }
    }
  }
  assert(hit, 'Typing correct answer increases score');

  // 13. Game over flow
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
    assert(await page.locator('#keypad-panel').isHidden(), 'Keypad hidden on game over');
    assert(await page.locator('#final-score').isVisible(), 'Final score shown');
    const hi = await page.evaluate(() => localStorage.getItem('mathblast_hi'));
    assert(hi !== null, `High score in localStorage: ${hi}`);
  }

  // 14. Play Again resets
  await page.locator('#btn-replay').click();
  await page.waitForTimeout(500);
  assert(await page.locator('#keypad-panel').isVisible(), 'Keypad panel back after Play Again');
  const resetScore = await page.evaluate(() =>
    parseInt(document.getElementById('hud-score').textContent.replace('Score:', '').trim()));
  assert(resetScore === 0, 'Score resets to 0');
  const resetDisp = await page.locator('#keypad-input').textContent();
  assert(resetDisp === '–', `Display resets to '–' (got '${resetDisp}')`);

  // 15. Back to menu
  await page.evaluate(() => {
    document.getElementById('screen-gameover').classList.remove('hidden');
    document.getElementById('screen-hud').classList.add('hidden');
    document.getElementById('keypad-panel').classList.add('hidden');
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
  await page.waitForTimeout(500);

  assert(await page.locator('#keypad-panel').isVisible(), 'Keypad panel visible');
  assert(await page.locator('#answer').count() === 0,     'No text input — no keyboard ever opens');

  const keyBtnH = await page.locator('.key-btn').first().evaluate(el => el.offsetHeight);
  assert(keyBtnH >= 44, `Key buttons ≥ 44px tall (got ${keyBtnH}px) — thumb-tappable`);

  // Tap digit buttons
  await page.locator('.key-btn[data-key="7"]').tap();
  await page.locator('.key-btn[data-key="3"]').tap();
  await page.waitForTimeout(100);
  const mobileDisp = await page.locator('#keypad-input').textContent();
  assert(mobileDisp === '73', `Mobile tap updates display (got '${mobileDisp}')`);

  // Tap backspace
  await page.locator('.key-btn[data-key="⌫"]').tap();
  await page.waitForTimeout(100);
  const afterDelMobile = await page.locator('#keypad-input').textContent();
  assert(afterDelMobile === '7', `Mobile ⌫ removes digit (got '${afterDelMobile}')`);

  // Clear and wait for asteroid then test wrong answer score unchanged
  await page.locator('.key-btn[data-key="⌫"]').tap();
  await page.waitForTimeout(4200);
  const scoreBeforeMob = await page.evaluate(() =>
    parseInt(document.getElementById('hud-score').textContent.replace('Score:', '').trim()));
  await page.locator('.key-btn[data-key="9"]').tap();
  await page.locator('.key-btn[data-key="9"]').tap();
  await page.locator('.key-btn[data-key="9"]').tap();
  await page.locator('.key-btn.key-enter').tap();
  await page.waitForTimeout(300);
  const scoreAfterMob = await page.evaluate(() =>
    parseInt(document.getElementById('hud-score').textContent.replace('Score:', '').trim()));
  assert(scoreAfterMob === scoreBeforeMob, 'Wrong answer does not change score on mobile');

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
  await page.waitForTimeout(500);

  assert(await page.locator('#keypad-panel').isVisible(), 'Keypad panel visible on Android');
  assert(await page.locator('#answer').count() === 0,     'No text input on Android');

  const panelH = await page.locator('#keypad-panel').evaluate(el => el.offsetHeight);
  const vpH    = await page.evaluate(() => window.innerHeight);
  const cH     = await page.evaluate(() => parseFloat(document.getElementById('gameCanvas').style.height));
  assert(Math.abs(cH + panelH - vpH) < 5, `Canvas + panel fits viewport (${cH.toFixed(0)}+${panelH}=${vpH})`);

  // Tap a few keys
  await page.locator('.key-btn[data-key="1"]').tap();
  await page.locator('.key-btn[data-key="2"]').tap();
  await page.waitForTimeout(100);
  const droidDisp = await page.locator('#keypad-input').textContent();
  assert(droidDisp === '12', `Android keypad tap works (got '${droidDisp}')`);

  await browser.close();
}

server.close();

console.log(`\n\x1b[1m═══════════════════════════════════════════════════`);
console.log(` Results: ${p} passed, ${f} failed`);
console.log(`═══════════════════════════════════════════════════\x1b[0m\n`);
process.exit(f > 0 ? 1 : 0);
