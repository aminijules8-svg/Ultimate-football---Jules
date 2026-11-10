// IndexedDB persistence for the procedural world (too large for localStorage). Falls back to
// regenerating from the seed when IndexedDB is unavailable.
const DB = 'ultimate-football', STORE = 'world';
function open() {
  return new Promise((res, rej) => { if (!('indexedDB' in globalThis)) return rej(new Error('no indexedDB')); const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
export async function loadWorld() {
  try { const db = await open(); return await new Promise((res, rej) => { const t = db.transaction(STORE, 'readonly').objectStore(STORE).get('current'); t.onsuccess = () => res(t.result || null); t.onerror = () => rej(t.error); }); } catch (e) { return null; }
}
let pending = null;
export function saveWorld(world) {
  // coalesce rapid saves (transfers, weekly sims)
  if (pending) return pending;
  pending = new Promise(r => setTimeout(r, 400)).then(async () => { pending = null; try { const db = await open(); await new Promise((res, rej) => { const t = db.transaction(STORE, 'readwrite').objectStore(STORE).put(world, 'current'); t.onsuccess = res; t.onerror = () => rej(t.error); }); return true; } catch (e) { return false; } });
  return pending;
}
export async function clearWorld() { try { const db = await open(); await new Promise((res, rej) => { const t = db.transaction(STORE, 'readwrite').objectStore(STORE).delete('current'); t.onsuccess = res; t.onerror = () => rej(t.error); }); } catch (e) { /* ignore */ } }
