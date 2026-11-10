// Dev tool: two headless browsers play an online friendly against each other through the real PeerJS
// broker (needs internet). Checks the room handshake, that the guest receives frames and mirrors the
// host's state, that a guest key press moves the guest's player on the host, and that a goal's celebration plays the
// same on both screens. --nation: the host picks a national team
// from the league-first picker; the guest's lobby and match must show it.
// Usage: node scripts/nettest.mjs [--secs=12]
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true]; }));
let PORT = 5181;
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--clearScreen', 'false'], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((res, rej) => { vite.stdout.on('data', d => { const m = String(d).match(/Local:\s+http:\/\/localhost:(\d+)/); if (m) { PORT = +m[1]; res(); } }); setTimeout(() => rej(new Error('vite did not start')), 30000); });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [];
const mk = async name => { const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } }); const p = await ctx.newPage(); /* own context = own window, so neither tab is throttled as a background tab */ p.on('pageerror', e => errors.push(name + ': ' + e.message)); await p.goto(`http://localhost:${PORT}/`, { timeout: 90000 }); await p.waitForFunction(() => window.__UF && window.__UF.world, null, { timeout: 60000, polling: 500 }); return p; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const out = {};
try {
  const A = await mk('host'), B = await mk('guest');
  if (!args['3d']) for (const p of [A, B]) await p.evaluate(() => window.__UF.setView3d(false));  // 2D keeps the headless frame rate up; --3d to render both in 3D
  if (args.nation) { for (let i = 0; i < 60 && !(await A.evaluate(() => !!window.__UF.world)); i++) await sleep(250); await A.evaluate(() => window.__UF.go('online')); out.pick = await A.evaluate(() => window.__UF.pickAny(0, 'nations', 0)); console.log('host picks a national team:', out.pick); }
  const code = await A.evaluate(() => window.__UF.netHost()); out.code = code; console.log('room', code);
  if (!code) throw new Error('no room code');
  out.join = await B.evaluate(c => window.__UF.netJoin(c), code); console.log('join', out.join);
  for (let i = 0; i < 60; i++) { const s = await A.evaluate(() => window.__UF.netInfo()); if (s && /Friend connected/.test(s.status)) break; await sleep(250); }
  out.hostBefore = await A.evaluate(() => window.__UF.netInfo()); console.log('host', JSON.stringify(out.hostBefore));
  await sleep(600); out.lobby = await B.evaluate(() => (window.__UF.netInfo() || {}).lobby); console.log('guest lobby', JSON.stringify(out.lobby));
  out.started = await A.evaluate(() => window.__UF.netStart()); console.log('started', out.started);
  await sleep(800); out.guestTeams = await B.evaluate(() => (window.__UF.netInfo() || {}).teams); console.log('guest teams', JSON.stringify(out.guestTeams));
  for (let i = 0; i < 80; i++) { const s = await B.evaluate(() => window.__UF.netInfo()); if (s && s.playing && s.rx > 10) break; await sleep(250); }
  await A.evaluate(() => window.__UF.skipIntro()); await sleep(1500);
  const secs = +(args.secs || 10);
  // guest holds right for a while: its player on the host should move
  await B.keyboard.down('ArrowRight'); await sleep(1800);
  out.hostMid = await A.evaluate(() => window.__UF.netInfo()); out.guestMid = await B.evaluate(() => window.__UF.netInfo());
  await B.keyboard.up('ArrowRight'); await sleep(Math.max(0, secs * 1000 - 3300));
  out.hostEnd = await A.evaluate(() => window.__UF.netInfo()); out.guestEnd = await B.evaluate(() => window.__UF.netInfo());
  console.log('host mid', JSON.stringify(out.hostMid)); console.log('guest mid', JSON.stringify(out.guestMid));
  console.log('host end', JSON.stringify(out.hostEnd)); console.log('guest end', JSON.stringify(out.guestEnd));
  // a goal on the host: the guest must play the same celebration (same plan, same people doing something)
  await A.evaluate(() => window.__UF.celebrate(0)); await sleep(2500);
  out.celHost = await A.evaluate(() => window.__UF.celInfo()); out.celGuest = await B.evaluate(() => window.__UF.celInfo());
  const celOk = out.celHost.st === 'goal' && out.celGuest.st === 'goal' && !!out.celHost.plan && out.celGuest.plan === out.celHost.plan && out.celGuest.acts === out.celHost.acts;
  console.log('celebration host', out.celHost.st, out.celHost.acts, 'players · guest', out.celGuest.st, out.celGuest.acts, 'players, same plan:', out.celGuest.plan === out.celHost.plan);
  const ok = celOk && out.started && out.guestEnd && out.guestEnd.playing && out.guestEnd.rx > 6 * secs && out.hostMid.h1 && Math.abs(out.hostMid.h1.vx) + Math.abs(out.hostMid.h1.vy) > 0.5 && out.guestEnd.st === out.hostEnd.st;
  const natOk = !args.nation || (out.lobby && out.lobby.homeLg === 'National teams' && out.guestTeams && out.guestTeams[0] === out.pick);
  console.log(ok && natOk ? 'NET TEST PASSED' : 'NET TEST FAILED' + (natOk ? '' : ' (nation pick not mirrored)'));
} catch (e) { console.log('NET TEST ERROR:', e.message.split('\n')[0]); }
if (errors.length) console.log('PAGEERRORS:\n' + errors.slice(0, 6).join('\n'));
await browser.close(); vite.kill();
