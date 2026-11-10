// Goal celebrations in a real match, headless: the scripted checks (__UF.testCelebration), then live goals drawn in 3D
// with screenshots along the way and the contact / foot-slide numbers from the drawn frames.
// Usage: node scripts/celtest.mjs [--shots=6] [--goals=2] [--out=captures/cel] [--contact: only the paired-contact check]
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const OUT = args.out || 'captures/cel', SHOTS = +(args.shots || 6), GOALS = +(args.goals || 2);
mkdirSync(OUT, { recursive: true });
let PORT = 5183;
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--clearScreen', 'false'], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((res, rej) => { vite.stdout.on('data', d => { const m = String(d).match(/Local:\s+http:\/\/localhost:(\d+)/); if (m) { PORT = +m[1]; res(); } }); vite.on('exit', c => rej(new Error('vite exited ' + c))); setTimeout(() => rej(new Error('vite start timeout')), 20000); });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = []; page.on('pageerror', e => errors.push(String(e.message).split('\n')[0]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const report = {};
try {
  await page.goto(`http://localhost:${PORT}/`);
  for (let i = 0; i < 80 && !(await page.evaluate(() => !!window.__UF && !!window.__UF.world)); i++) await sleep(250);
  await page.evaluate(() => window.__UF.quickMatch());
  for (let i = 0; i < 120 && (await page.evaluate(() => window.__UF.st)) !== 'intro'; i++) await sleep(250);
  await page.evaluate(() => window.__UF.skipIntro());
  for (let i = 0; i < 120 && (await page.evaluate(() => window.__UF.st)) !== 'play'; i++) await sleep(250);
  await sleep(1000);
  report.contact = { hug: await page.evaluate(() => window.__UF.testContact('hug')), five: await page.evaluate(() => window.__UF.testContact('five')) };
  console.log('contact', JSON.stringify(report.contact, null, 1));
  if (args.contact) throw new Error('contact only');
  report.scripted = await page.evaluate(() => window.__UF.testCelebration());
  console.log(JSON.stringify(report.scripted, null, 1));
  report.live = [];
  for (let g = 0; g < GOALS; g++) {
    for (let i = 0; i < 80 && (await page.evaluate(() => window.__UF.st)) !== 'play'; i++) await sleep(250);
    const plan = await page.evaluate(t => window.__UF.celebrate(t), g % 2);
    const t0 = Date.now(), shots = [];
    // real time in the headless browser runs slow; sample the celebration by its own clock
    for (let k = 0; k < SHOTS; k++) {
      const want = 1.2 + k * (plan.dur - 2) / Math.max(1, SHOTS - 1);
      for (let i = 0; i < 400; i++) { const s = await page.evaluate(() => ({ st: window.__UF.st, t: window.__UF.celT })); if (s.st !== 'goal' || s.t >= want) break; await sleep(100); }
      if ((await page.evaluate(() => window.__UF.st)) !== 'goal') break;
      const f = `${OUT}/goal${g}-${k}.png`;  // software rendering is slow and uneven: a long timeout, one retry, then skip the shot
      for (let tr = 0; tr < 2; tr++) { try { await page.screenshot({ path: f, timeout: 90000 }); shots.push(f); break; } catch (e) { console.log('shot', g, k, 'retry', tr); } }
    }
    for (let i = 0; i < 600 && (await page.evaluate(() => window.__UF.st)) === 'goal'; i++) await sleep(100);
    report.live.push({ plan, shots, seconds: (Date.now() - t0) / 1000 });
    console.log('goal', g, JSON.stringify(plan), shots.length, 'shots');
    await page.evaluate(() => { if (window.__UF.st === 'replay') window.__UF.skipReplay && window.__UF.skipReplay(); });
  }
  report.stat = await page.evaluate(() => window.__UF.celebrationStat());
  console.log('drawn frames:', JSON.stringify(report.stat));
} catch (e) { console.log('CELTEST ERROR:', e.message.split('\n')[0]); }
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
if (errors.length) console.log('PAGEERRORS:', errors.slice(0, 5).join(' | '));
await browser.close(); vite.kill();
