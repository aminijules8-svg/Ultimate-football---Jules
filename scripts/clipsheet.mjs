// Contact strips of animation clips on the real character: one image per clip, six moments side by side.
// Usage: node scripts/clipsheet.mjs --clips=jog,shot,header [--cam=side] [--strip=6] [--out=captures/sheets] [--tag=new] [--vw=1500 --vh=360]
// Clip names and their durations go to <out>/<tag>.json.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const OUT = args.out || 'captures/sheets', TAG = args.tag || 'sheet', N = +(args.strip || 6), CAM = args.cam || 'side';
mkdirSync(OUT, { recursive: true });
let PORT = 5181;
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--clearScreen', 'false'], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((res, rej) => { vite.stdout.on('data', d => { const m = String(d).match(/Local:\s+http:\/\/localhost:(\d+)/); if (m) { PORT = +m[1]; res(); } }); vite.on('exit', c => rej(new Error('vite exited ' + c))); setTimeout(() => rej(new Error('vite start timeout')), 20000); });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +(args.vw || 1500), height: +(args.vh || 360) } });
const errors = []; page.on('pageerror', e => errors.push(String(e.message).split('\n')[0]));
const info = {};
try {
  let clips = String(args.clips || 'idle').split(',');
  if (args.clips === 'all') {
    await page.goto(`http://localhost:${PORT}/viewer.html?clip=idle`);
    await page.waitForFunction(() => window.__VIEWER_READY === true, null, { timeout: 30000 });
    clips = await page.evaluate(() => Object.keys(window.__assets.clips).sort());
  }
  for (const c of clips) {
    await page.goto(`http://localhost:${PORT}/viewer.html?clip=${encodeURIComponent(c)}&strip=${N}&cam=${CAM}${args.extra ? '&' + args.extra : ''}`);
    await page.waitForFunction(() => window.__VIEWER_READY === true, null, { timeout: 30000 });
    info[c] = await page.evaluate(n => { const k = window.__assets.clips[n]; return k ? +k.duration.toFixed(2) : null; }, c);
    await page.screenshot({ path: `${OUT}/${TAG}-${c}.png` });
    console.log('saved', `${OUT}/${TAG}-${c}.png`, info[c]);
  }
} catch (e) { console.log('CLIPSHEET ERROR:', e.message.split('\n')[0]); }
writeFileSync(`${OUT}/${TAG}.json`, JSON.stringify(info, null, 1));
if (errors.length) console.log('PAGEERRORS:', errors.slice(0, 5).join(' | '));
await browser.close(); vite.kill();
