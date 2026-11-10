// Phase 23 acceptance pass: start the game headless, run every data-level test hook in the menu, then
// start a 3D match and run the match-context hooks. Prints one line per check and a summary.
// Usage: node scripts/acceptance.mjs [--2d]
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] ?? true] : [a, true]; }));
let PORT = 5179;
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--clearScreen', 'false'], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((res, rej) => { vite.stdout.on('data', d => { const m = String(d).match(/Local:\s+http:\/\/localhost:(\d+)/); if (m) { PORT = +m[1]; res(); } }); vite.on('exit', c => rej(new Error('vite exited ' + c))); setTimeout(() => rej(new Error('vite start timeout')), 20000); });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = []; page.on('pageerror', e => errors.push(String(e.message).split('\n')[0]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rows = [];
const run = async (name, expr, check) => {
  let v, ok = false, note = '';
  try { v = await page.evaluate(expr); ok = check ? !!check(v) : v != null; note = typeof v === 'object' ? JSON.stringify(v).slice(0, 110) : String(v); }
  catch (e) { note = 'ERROR ' + String(e.message).split('\n')[0].slice(0, 100); }
  rows.push([name, ok, note]); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(18)} ${note}`);
};
try {
  await page.goto(`http://localhost:${PORT}/`); await page.waitForTimeout(1500);
  for (let i = 0; i < 80 && !(await page.evaluate(() => !!window.__UF && !!window.__UF.world)); i++) await sleep(250);
  if (args['2d']) await page.evaluate(() => window.__UF.setView3d(false));
  // ---- menu / data hooks
  await run('leagues', '__UF.testLeagues()', v => v.length >= 16 && v.every(g => g.ok));
  await run('pickAny', '__UF.testPickAny()', v => v.players[0] === 11 && v.players[1] === 11);
  await run('crests', '__UF.testCrests()', v => v.full === v.clubs && v.duplicatesInLeague.length === 0);
  await run('boots', '__UF.testBoots()', v => v.distinct === v.designs);
  await run('kitSave', '__UF.testKitSave()', v => v.saved && v.world && v.resetBack && v.restored);
  await run('calendar', '__UF.testCalendar()', v => v.firstWeekday === 6 && v.gapDays === 7 && v.august);
  await run('pcCalendar', '__UF.testPCCal()', v => v.cup && v.cup.weekday === 3 && v.league >= 19);
  await run('seasonRoll', '__UF.testSeasonRoll()', v => v.after.hist.length === 1 && v.after.wk === 0 && v.after.savedHist === 1);
  await run('deleteFlow', '__UF.testDeleteFlow()', v => v.careerDeleted && v.careerBack && v.pcDeleted && v.pcBack && !v.trashAfter);
  await run('tourSetup', '__UF.testTourSetup()', v => Object.values(v).every(m => Object.values(m).every(x => x.ok)));
  await run('tourGroups', '__UF.testTourGroups()', v => v.world.ko === 16 && v.world.champ && v.nations.ko === 4 && v.nations.champ);
  await run('nationsPick', '__UF.testNationsPick()', v => v.started && v.savedWids);
  await run('nations', '__UF.testNations()', v => v.nations >= 46 && v.weak.length === 0 && v.ids);
  await run('worldCup', '__UF.testWorldCup()', v => v.entrants === 32 && v.champ && v.third);
  await run('migration', '__UF.testMigration()', v => v.after.countries === 16 && v.after.c0 === v.before.c0 && v.after.p0 === v.before.p0);
  await run('commentary', '__UF.testCommentary()', v => v.unique && v.spoken >= 10 && v.captionsDefault === false);
  await run('atmosphere', '__UF.testAtmosphere()', v => v.kinds >= 20 && v.map.goal.includes('ripple'));
  await run('saveSafety', '__UF.testSaveSafety()', v => v.careerDefaults && v.proDefaults && v.backupV);
  await run('styles', '__UF.testStyles()', v => v != null);
  await run('arch', '__UF.testArch()', v => v.missing === 0);
  await run('walkthroughs', '__UF.walkthroughs()', v => v.ok);
  // ---- match context
  await page.evaluate(() => window.__UF.quickMatch());
  for (let i = 0; i < 120 && (await page.evaluate(() => window.__UF.st)) !== 'intro'; i++) await sleep(250);
  await page.evaluate(() => window.__UF.skipIntro());
  for (let i = 0; i < 120 && (await page.evaluate(() => window.__UF.st)) !== 'play'; i++) await sleep(250);
  await sleep(1500);
  await run('matchStarts', '({st:__UF.st,r3:__UF.r3,use3d:__UF.use3d})', v => v.st === 'play' || v.st === 'aim');
  await run('pass16m', '__UF.testPass(16,.5)', v => v != null);
  await run('dribble', '__UF.testDribble(6)', v => v != null);
  await run('header', '__UF.testHeader(1.9)', v => v != null);
  await run('move90', '__UF.testMove(90,7)', v => v != null);
  await run('stepSim', '__UF.stepSim(1800)', v => v.kicks > 0);
  await run('footBall', '__UF.footBall()', v => v != null);
  await run('celebration', '__UF.testCelebration()', v => ['normal', 'equaliser', 'lateWinner', 'kneeSlide'].every(k => { const r = v[k]; return r.plan && r.plan.dur >= 8 && r.plan.dur <= 14 && Math.abs(r.elapsed - r.goalDur) < 0.1 && r.spotErrMax < 0.3 && r.minSep >= 0.35 && /* a hugging pair may stand 0.38 m apart, chest to chest */ r.hugs.every(h => h.gap > 0.36 && h.gap < 0.6 && h.faces > 0.8); })
    && v.equaliser.plan.mood === 'fiery' && v.lateWinner.plan.mood === 'showman' && v.ownGoal.plan === null && v.ownGoal.goalDur === 5
    && v.skip.skipped && v.skip.skipped.st !== 'goal' && v.skip.skipped.left === 0 && v.pause.paused && v.pause.paused.goalT === 0 && v.pause.paused.moved === 0);
  await run('gfx', '(__UF.gfx||null)', v => v && v.calls <= 260 && v.playerTris <= 90000);
} catch (e) { console.log('ACCEPTANCE ERROR:', e.message.split('\n')[0]); }
const pass = rows.filter(r => r[1]).length;
console.log(`\n${pass}/${rows.length} checks passed${errors.length ? `; PAGEERRORS: ${errors.slice(0, 5).join(' | ')}` : ''}`);
await browser.close(); vite.kill();
process.exit(pass === rows.length && !errors.length ? 0 : 1);
