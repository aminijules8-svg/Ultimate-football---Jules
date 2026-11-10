// Dev tool: simulate N matches per difficulty level headless (2D mode, AI vs AI or passive human)
// and print goals for/against so the difficulty curve can be tuned.
// Usage: node scripts/simdiff.mjs [--n=8] [--passive]
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const N = +(args.n || 8);
let PORT = 5179;
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--clearScreen', 'false'], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((res, rej) => { vite.stdout.on('data', d => { const m = String(d).match(/Local:\s+http:\/\/localhost:(\d+)/); if (m) { PORT = +m[1]; res(); } }); setTimeout(() => rej(new Error('vite start timeout')), 20000); });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
const errors = []; page.on('pageerror', e => errors.push(e.message));
try {
  await page.goto(`http://localhost:${PORT}/?auto=2d`);
  await page.waitForFunction(() => window.__UF && window.__UF.st === 'intro', null, { timeout: 60000, polling: 500 });
  const names = await page.evaluate(() => ['Beginner', 'Amateur', 'Regular', 'Professional', 'Legendary', 'Superstar', 'World Class']);
  console.log(`difficulty       | matches | human-side GF | AI GA  | AI wins`);
  for (let d = 0; d < 7; d++) {
    const t0 = Date.now();
    const res = await page.evaluate(([d, n, passive]) => window.__UF.simMatch(d, n, passive), [d, N, !!args.passive]);
    const avg = i => (res.reduce((a, r) => a + (r[i] || 0), 0) / res.length).toFixed(2), w = res.filter(r => r[1] > r[0]).length;
    const pc = i => { const ok = res.reduce((a, r) => a + (r[i + 2] || 0), 0), n = res.reduce((a, r) => a + (r[i] || 0), 0); return n ? Math.round(ok / n * 100) + '%' : '-'; }, ps = res.reduce((a, r) => a + (r[10] || 0), 0), pt = ps + res.reduce((a, r) => a + (r[11] || 0), 0);
    console.log(`${names[d].padEnd(16)} | ${String(res.length).padStart(7)} | ${avg(0).padStart(13)} | ${avg(1).padStart(6)} | ${w}/${res.length}   shots ${avg(3)}:${avg(4)} passes ${avg(6)}:${avg(7)} (${pc(6)}:${pc(7)}) poss ${pt ? Math.round(ps / pt * 100) : "-"}% thr ${avg(12)}:${avg(13)} runs ${avg(14)}:${avg(15)} box ${avg(16)}:${avg(17)} long ${avg(18)}:${avg(19)} tk ${avg(20)}:${avg(21)} hdr ${avg(22)}:${avg(23)}  (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  }
} catch (e) { console.log('SIM FAILED:', e.message.split('\n')[0]); }
if (errors.length) console.log('PAGEERRORS:\n' + errors.slice(0, 5).join('\n'));
await browser.close(); vite.kill();
