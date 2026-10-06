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
    persist: bool('persist', false)
  };

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
