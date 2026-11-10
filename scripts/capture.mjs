// Dev tool: start Vite, load the game headless, jump into a match, report errors, save screenshots.
// Usage: node scripts/capture.mjs [--menu] [--2d] [--wx=0..3] [--out=captures] [--wait=4000]
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const W = +(args.w || 1280), H = +(args.h || 720);
const OUT = args.out || 'captures'; mkdirSync(OUT, { recursive: true });
let PORT = 5179;

const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--clearScreen', 'false'], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((res, rej) => { vite.stdout.on('data', d => { const m = String(d).match(/Local:\s+http:\/\/localhost:(\d+)/); if (m) { PORT = +m[1]; res(); } }); vite.stderr.on('data', d => process.stderr.write(d)); vite.on('exit', c => rej(new Error('vite exited ' + c))); setTimeout(() => rej(new Error('vite start timeout')), 20000); });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type().toUpperCase() + ' ' + m.text()); });
const cdp = await page.context().newCDPSession(page);
const shot = async (name) => { const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true }); const { writeFileSync } = await import('node:fs'); writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, 'base64')); console.log('saved', `${OUT}/${name}.png`); };

try {
  if (args.viewer) {
    await page.goto(`http://localhost:${PORT}/viewer.html?${args.viewer === true ? '' : args.viewer}`);
    await page.waitForFunction(() => window.__VIEWER_READY === true, null, { timeout: 20000 });
    if (args.eval) console.log('eval', JSON.stringify(await page.evaluate(String(args.eval))));
    await page.waitForTimeout(800); await shot('viewer-' + String(args.viewer === true ? 'default' : args.viewer).replace(/[^a-z0-9]+/gi, '_').slice(0, 40));
  } else if (args.menu) {
    await page.goto(`http://localhost:${PORT}/`); await page.waitForTimeout(1500);
    if (args.clicks) for (const c of String(args.clicks).split(';')) { const [x, y] = c.split(',').map(Number); await page.mouse.move(x, y); await page.waitForTimeout(150); await page.mouse.click(x, y); await page.waitForTimeout(600); }
    if (args.eval) { console.log('eval', JSON.stringify(await page.evaluate(String(args.eval)))); await page.waitForTimeout(500); }
    if (args.reload) { await page.reload(); await page.waitForTimeout(2500); if (args.eval2) console.log('eval2', JSON.stringify(await page.evaluate(String(args.eval2)))); }
    console.log('overlay', await page.evaluate(() => ({ cls: document.getElementById('uf-overlay')?.className, mode: window.__UF?.overlay?.mode, scr: window.__UF?.scr })));
    await shot(args.name || 'menu');
  } else {
    const q = `auto=${args['2d'] ? '2d' : '1'}&wx=${args.wx || 0}` + (args.q != null ? `&q=${args.q}` : '');
    await page.goto(`http://localhost:${PORT}/?${q}`);
    await page.waitForFunction(() => window.__UF && window.__UF.st === 'intro', null, { timeout: 60000, polling: 500 });
    await page.waitForTimeout(+(args.introms || 1200)); await shot(args.introname || 'intro');
    await page.evaluate(() => window.__UF.skipIntro());
    await page.waitForFunction(() => window.__UF.st === 'play', null, { timeout: 60000, polling: 500 });
    if (args.keys) for (const k of String(args.keys).split(',')) { await page.keyboard.press(k); await page.waitForTimeout(300); }
    if (args.evalplay) { await page.waitForTimeout(+(args.prewait || 0)); console.log('evalplay', JSON.stringify(await page.evaluate(String(args.evalplay)))); }
    if (args.card) { await page.evaluate(() => window.__UF.cardTest()); await page.waitForTimeout(+(args.cardwait || 1200)); await shot('card'); }
    if (args.goal) { await page.waitForTimeout(1500); await page.evaluate(() => window.__UF.shootTest()); await page.waitForTimeout(+(args.goalwait || 1800)); await shot('goal'); if (args.replaywait) { await page.waitForTimeout(+args.replaywait); await shot('replay'); } }
    await page.waitForTimeout(+(args.wait || 4000));
    await shot(args['2d'] ? 'match-2d' : (args.name || 'match'));
    if (!args['2d']) { const r3 = await page.evaluate(() => window.__UF.r3); if (!r3) errors.push('PAGEERROR 3D init failed (fell back to 2D)'); }
    const s = await page.evaluate(() => ({ st: __UF.st, gt: Math.round(__UF.gt), use3d: __UF.use3d, r3: __UF.r3, score: __UF.teams.map(t => t.score), quality: __UF.quality ? __UF.quality.describe() : null, gfx: __UF.gfx, gpu: __UF.quality ? __UF.quality.probe.gpu : null }));
    if (args.stepdown) { const r = await page.evaluate(n => { const out = []; for (let i = 0; i < n; i++) out.push(window.__UF.quality.step(-1) ? window.__UF.quality.describe() : 'no-change'); return out; }, +args.stepdown); console.log('stepdown', JSON.stringify(r)); await page.waitForTimeout(1500); await shot((args.name || 'match') + '-stepped'); }
    console.log('state', JSON.stringify(s));
  }
} catch (err) {
  console.log('CAPTURE FAILED:', err.message.split('\n')[0]);
  try { console.log('state', JSON.stringify(await page.evaluate(() => window.__UF ? { st: __UF.st, scr: __UF.scr, use3d: __UF.use3d, r3: __UF.r3 } : 'no __UF'))); } catch (e) { console.log('no state', e.message.split('\n')[0]); }
  errors.push('PAGEERROR capture failed');
} finally {
  console.log(errors.length ? `ERRORS (${errors.length}):\n` + Object.entries(errors.reduce((m, e) => (m[e] = (m[e] || 0) + 1, m), {})).slice(0, 20).map(([e, n]) => `${n}× ${e}`).join('\n') : 'no console errors');  // distinct messages with counts
  await browser.close(); vite.kill();
  process.exit(errors.some(e => e.startsWith('PAGEERROR')) ? 1 : 0);
}
