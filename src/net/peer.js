// Peer-to-peer link for online friendlies: WebRTC data channel brokered by the free public PeerJS
// server (no server of our own). The host's peer id is derived from a short room code the friend types in.
import Peer from 'peerjs';

const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const makeCode = () => Array.from({ length: 5 }, () => ALPHA[Math.random() * ALPHA.length | 0]).join('');
const idOf = code => 'ultimate-football-' + String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

export class NetLink {
  constructor() { this.peer = null; this.conn = null; this.role = ''; this.code = ''; this.onMessage = null; this.onClose = null; this.onError = null; this.rx = 0; this.tx = 0; this.open = false; }
  _peer(id) {
    return new Promise((res, rej) => {
      const p = new Peer(id, { debug: 0 }); this.peer = p; let done = false;
      p.on('open', () => { done = true; res(p); });
      p.on('error', e => { if (!done) { done = true; rej(e); } else if (this.onError) this.onError(e); });
      setTimeout(() => { if (!done) { done = true; rej(new Error('No answer from the connection service (check your internet).')); } }, 12000);
    });
  }
  _wire(c) {
    this.conn = c; c.on('data', d => { this.rx++; if (this.onMessage) this.onMessage(d); });
    c.on('close', () => { this.open = false; if (this.onClose) this.onClose(); });
    c.on('error', e => { if (this.onError) this.onError(e); });
  }
  /** Host a room; resolves with the code once the friend is connected (onWaiting gets the code first). */
  async host(onWaiting) {
    this.role = 'host'; this.code = makeCode(); await this._peer(idOf(this.code)); if (onWaiting) onWaiting(this.code);
    return new Promise(res => { this.peer.on('connection', c => { if (this.conn) { c.close(); return; } this._wire(c); c.on('open', () => { this.open = true; res(this.code); }); }); });
  }
  /** Join a friend's room by code. */
  async join(code) {
    this.role = 'guest'; this.code = String(code).trim().toUpperCase(); await this._peer(undefined);
    const c = this.peer.connect(idOf(this.code), { reliable: true, serialization: 'binary' }); this._wire(c);
    await new Promise((res, rej) => { c.on('open', () => { this.open = true; res(); }); c.on('error', rej); setTimeout(() => rej(new Error('Could not reach that room. Check the code, and that your friend is still waiting.')), 15000); });
  }
  send(obj) { if (this.conn && this.open) { try { this.conn.send(obj); this.tx++; } catch (e) { /* channel closing */ } } }
  close() { this.open = false; try { this.conn && this.conn.close(); } catch (e) {} try { this.peer && this.peer.destroy(); } catch (e) {} this.conn = null; this.peer = null; }
}
