(function () {
  const q = new URLSearchParams(location.search);
  const str = (k, d) => (q.has(k) ? q.get(k) : d);
  const num = (k, d) => {
    const v = parseFloat(q.get(k));
    return isFinite(v) ? v : d;
  };
  const bool = (k, d) => {
    if (!q.has(k)) return d;
    const v = q.get(k).toLowerCase();
    if (v === '') return true;
    return !['0', 'false', 'off', 'no'].includes(v);
  };

  // Acepta "ff8800" o "#ff8800" (el # rompe las URLs).
  const color = (k, d) => {
    const v = (q.get(k) || '').trim();
    return /^[0-9a-f]{3,8}$/i.test(v) ? '#' + v : v || d;
  };

  window.Params = {
    host: str('host', '127.0.0.1'),
    port: num('port', 8080),
    endpoint: str('endpoint', '/'),
    ssl: bool('ssl', false),
    password: str('password', ''),
    game: str('game', 'random'),
    mode: str('mode', 'instant').toLowerCase() === 'vote' ? 'vote' : 'instant',
    voteMs: Math.max(200, num('voteMs', 1500)),
    score: bool('score', true),
    top: Math.max(0, Math.floor(num('top', 0))),
    transparent: bool('transparent', false),
    gameOverSec: Math.max(1, num('gameOverSec', 10)),
    switchSec: Math.max(0, num('switchSec', 10)),
    speed: Math.max(0.2, num('speed', 1)),
    hint: bool('hint', true),
    status: bool('status', true),
    debug: bool('debug', false),
    persist: bool('persist', false),
    radius: Math.max(0, num('radius', 0)),
  };

  // Tema: [clave, color por defecto, etiqueta, grupo]. Cada clave se puede
  // sobrescribir por query param (ej. ?msClosed=ff0000) o elegir un preset (?theme=light).
  const THEME = [
    ['bg', '#10151f', 'Fondo', 'General'],
    ['accent', '#ffd54a', 'Acento (títulos, etiquetas, cabeza snake)', 'General'],
    ['grid', '#ffffff', 'Líneas / cuadrícula (se aplica con transparencia)', 'General'],
    ['board', '#0a0d14', 'Fondo del tablero (Tetris)', 'Tetris'],
    ['pI', '#26c6da', 'Pieza I', 'Tetris'], ['pO', '#fdd835', 'Pieza O', 'Tetris'],
    ['pT', '#ab47bc', 'Pieza T', 'Tetris'], ['pS', '#66bb6a', 'Pieza S', 'Tetris'],
    ['pZ', '#ef5350', 'Pieza Z', 'Tetris'], ['pJ', '#42a5f5', 'Pieza J', 'Tetris'],
    ['pL', '#ffa726', 'Pieza L', 'Tetris'],
    ['snake', '#43a047', 'Cuerpo', 'Snake'], ['food', '#ff5252', 'Comida', 'Snake'],
    ['msClosed', '#3b4560', 'Casilla cerrada', 'Buscaminas'], ['msOpen', '#232a3a', 'Casilla abierta', 'Buscaminas'],
    ['msMine', '#e53935', 'Mina', 'Buscaminas'], ['msFlag', '#ffd54a', 'Bandera', 'Buscaminas'],
    ['brick1', '#ef5350', 'Ladrillos fila 1', 'Breakout'], ['brick2', '#ff9800', 'Ladrillos fila 2', 'Breakout'],
    ['brick3', '#fdd835', 'Ladrillos fila 3', 'Breakout'], ['brick4', '#66bb6a', 'Ladrillos fila 4', 'Breakout'],
    ['brick5', '#42a5f5', 'Ladrillos fila 5', 'Breakout'], ['brick6', '#ab47bc', 'Ladrillos fila 6', 'Breakout'],
    ['ball', '#ef5350', 'Pelota', 'Breakout'],
    ['tileEmpty', '#2a3246', 'Casilla vacía', '2048'],
    ['c4board', '#1e40af', 'Tablero', 'Conecta 4'], ['c4empty', '#0b0e17', 'Hueco vacío', 'Conecta 4'],
    ['c4p1', '#ef5350', 'Fichas del chat', 'Conecta 4'], ['c4p2', '#fdd835', 'Fichas de la IA', 'Conecta 4'],
    ['ttX', '#ef5350', 'X (chat)', 'Tic-Tac-Toe'], ['ttO', '#42a5f5', 'O (IA)', 'Tic-Tac-Toe']
  ];
  const PRESETS = {
    light: { bg: '#f1f3f8', accent: '#d81b60', grid: '#000000', board: '#dfe3ee', msClosed: '#b8c0d6', msOpen: '#e6e9f2', tileEmpty: '#cfd5e6', c4empty: '#f1f3f8', c4board: '#3949ab' },
    neon: { bg: '#05010f', accent: '#00ffd5', board: '#0d0222', msClosed: '#2b1055', msOpen: '#12062b', ttX: '#ff2bd6', ttO: '#00e5ff', c4p1: '#ff2bd6', c4p2: '#00ffd5', c4board: '#4a148c', snake: '#00ff9d', food: '#ff2bd6' },
    arien: {
      bg: '#2a1830', accent: '#ff9ccf', grid: '#ffd6ea', board: '#3a2142',
      pI: '#9fe7f5', pO: '#ffe8a3', pT: '#d9b3ff', pS: '#b8f0c8', pZ: '#ff9fb8', pJ: '#a8c4ff', pL: '#ffc9a3',
      snake: '#ffb3d9', food: '#fff1a8',
      msClosed: '#6b4a78', msOpen: '#3a2545', msMine: '#ff6f9f', msFlag: '#ffe28a',
      brick1: '#ff9fb8', brick2: '#ffc4a3', brick3: '#ffe8a3', brick4: '#b8f0c8', brick5: '#a8c4ff', brick6: '#d9b3ff', ball: '#fff1f7',
      tileEmpty: '#4a2f55', c4board: '#c26aa5', c4empty: '#2a1830', c4p1: '#ffd1e6', c4p2: '#b5e3ff',
      ttX: '#ff9ccf', ttO: '#a8d8ff'
    },
    fenrir: {
      bg: '#14171c', accent: '#39ff14', grid: '#ffffff', board: '#0b0d10',
      pI: '#39ff14', pO: '#f5e6b8', pT: '#ffffff', pS: '#7dff5a', pZ: '#e0b341', pJ: '#c9ffb8', pL: '#f0d58a',
      snake: '#f4f4f4', food: '#39ff14',
      msClosed: '#e9edf0', msOpen: '#1f242b', msMine: '#39ff14', msFlag: '#e0b341',
      brick1: '#ffffff', brick2: '#39ff14', brick3: '#f5e6b8', brick4: '#2b2f36', brick5: '#e0b341', brick6: '#7dff5a', ball: '#39ff14',
      tileEmpty: '#232830', c4board: '#2b2f36', c4empty: '#0b0d10', c4p1: '#39ff14', c4p2: '#f5f1e6',
      ttX: '#39ff14', ttO: '#f5e6b8'
    },
    retro: { bg: '#1a1c13', accent: '#c6e48b', board: '#232618', snake: '#8bc34a', food: '#ff7043', msClosed: '#4a5233', msOpen: '#2a2f1e', c4board: '#6d4c41', c4empty: '#1a1c13', tileEmpty: '#2f3322' }
  };
  const preset = PRESETS[str('theme', '').toLowerCase()] || {};
  Params.theme = {};
  THEME.forEach(([k, d]) => { Params.theme[k] = color(k, preset[k] || d); });
  Params.bg = Params.theme.bg;
  Params.accent = Params.theme.accent;
  // Color de línea con transparencia a partir del color "grid".
  Params.alpha = (c, a) => {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})/i.exec(c || '');
    if (!m) return c;
    let h = m[1];
    if (h.length === 3) h = h.replace(/./g, '$&$&');
    return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
  };
  if (Params.transparent) Params.canvasBg = 'rgba(0,0,0,0)'; else Params.canvasBg = Params.bg;

  // SHA-256 propio: crypto.subtle no siempre existe en file:// u OBS.
  const frac = (x) => x - Math.floor(x);
  const primes = [];
  for (let n = 2; primes.length < 64; n++) {
    if (primes.every((p) => n % p)) primes.push(n);
  }
  const K = primes.map((p) => Math.floor(frac(Math.cbrt(p)) * 4294967296) >>> 0);
  const H0 = primes.slice(0, 8).map((p) => Math.floor(frac(Math.sqrt(p)) * 4294967296) >>> 0);

  function sha256(bytes) {
    const l = bytes.length;
    const total = (((l + 9 + 63) >> 6) << 6);
    const buf = new Uint8Array(total);
    buf.set(bytes);
    buf[l] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(total - 8, Math.floor((l * 8) / 4294967296));
    dv.setUint32(total - 4, (l * 8) >>> 0);
    const h = H0.slice();
    const w = new Array(64);
    const rr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let o = 0; o < total; o += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i++) {
        const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
        const mj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + mj) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
    }
    const out = new Uint8Array(32);
    const odv = new DataView(out.buffer);
    h.forEach((v, i) => odv.setUint32(i * 4, v));
    return out;
  }

  const enc = new TextEncoder();
  window.Util = {
    THEME,
    PRESETS,
    sha256Base64(text) {
      return btoa(String.fromCharCode(...sha256(enc.encode(text))));
    },
    roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },
    rand(n) {
      return Math.floor(Math.random() * n);
    }
  };
  window.Games = {};
})();

