(function () {
  const P = Params, G = Games;
  const $ = (id) => document.getElementById(id);
  const canvas = $('stage'), ctx = canvas.getContext('2d');
  const ALIASES = {
    buscaminas: 'minesweeper', arkanoid: 'breakout', conecta4: 'connect4', c4: 'connect4',
    serpiente: 'snake', '2048': '2048', tictactoe: 'tictactoe', gato: 'tictactoe', tresenraya: 'tictactoe', ttt: 'tictactoe'
  };
  const norm = (s) => {
    s = String(s || '').trim().toLowerCase();
    return G[s] ? s : ALIASES[s] || null;
  };
  const ids = Object.keys(G);

  let pool = ids;
  if (P.game && P.game.toLowerCase() !== 'random') {
    const l = P.game.split(',').map(norm).filter(Boolean);
    if (l.length) pool = l;
  }
  const fixed = pool.length === 1;

  document.documentElement.style.setProperty('--bg', P.bg);
  document.documentElement.style.setProperty('--accent', P.accent);
  document.documentElement.style.setProperty('--r', P.radius);
  document.body.classList.toggle('rounded', P.radius > 0);
  document.body.classList.toggle('transparent', P.transparent);
  document.body.classList.toggle('debug', P.debug);
  $('status').classList.toggle('hidden', !P.status);

  // Estadísticas (opcionalmente persistentes)
  const KEY = 'minigames.stats';
  const stats = { users: {}, banked: 0 };
  if (P.persist) {
    try { Object.assign(stats, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
  }
  const save = () => { if (P.persist) localStorage.setItem(KEY, JSON.stringify(stats)); };
  let topDirty = true;

  const S = { id: null, def: null, game: null, over: false, next: null, votes: null };
  const pick = (excl) => {
    const c = pool.filter((i) => i !== excl);
    const a = c.length ? c : pool;
    return a[Util.rand(a.length)];
  };

  function start(id) {
    S.id = id; S.def = G[id];
    S.game = S.def.create({ speed: P.speed });
    S.over = false; S.next = null; S.votes = null;
    $('hint').textContent = P.hint ? S.def.hint : '';
  }

  function onOver() {
    S.over = true;
    stats.banked += S.game.score;
    save();
    if (!S.next) S.next = { id: fixed ? S.id : pick(S.id), at: performance.now() + P.gameOverSec * 1000, announce: false };
  }

  function schedule(id) {
    const at = performance.now() + P.switchSec * 1000;
    if (S.next) {
      S.next.id = id; S.next.at = Math.min(S.next.at, at); S.next.announce = true;
    } else S.next = { id, at, announce: true };
  }

  function onCustom(p) {
    if (typeof p === 'string') p = { game: p };
    if (!p || typeof p !== 'object') return;
    let g = p.game ?? p.name ?? p.command ?? (p.action ? '' : 'random');
    if (String(p.action || '').toLowerCase() === 'restart') g = S.id;
    const id = String(g).toLowerCase() === 'random' ? pick(S.id) : norm(g);
    if (id) schedule(id);
  }

  function onChat(user, text) {
    if (!S.game || S.over || text.length > 12) return;
    const cmd = text.trim().toUpperCase().replace(/\s+/g, ' ');
    if (!S.game.accepts(cmd)) return;
    stats.users[user] = (stats.users[user] || 0) + 1;
    topDirty = true;
    if (P.mode === 'vote') {
      const now = performance.now();
      if (!S.votes) S.votes = { end: now + P.voteMs, counts: new Map() };
      S.votes.counts.set(cmd, (S.votes.counts.get(cmd) || 0) + 1);
    } else S.game.apply(cmd);
  }

  function resolveVotes(now) {
    if (!S.votes || now < S.votes.end) return;
    const e = [...S.votes.counts.entries()];
    const max = Math.max(...e.map((x) => x[1]));
    const tied = e.filter((x) => x[1] === max);
    S.game.apply(tied[Util.rand(tied.length)][0]);
    S.votes = null;
  }

  const sb = new StreamerBot({
    host: P.host, port: P.port, endpoint: P.endpoint, ssl: P.ssl, password: P.password,
    onChat, onCustom,
    onStatus: (ok) => $('status').classList.toggle('ok', ok)
  });
  sb.connect();

  if (P.debug) {
    $('dbg').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const v = e.target.value.trim();
      e.target.value = '';
      if (v.startsWith('/')) onCustom({ game: v.slice(1) });
      else onChat('debug', v);
    });
  }

  // HUD
  const cache = {};
  const setText = (id, t) => { if (cache[id] !== t) { cache[id] = t; $(id).textContent = t; } };
  function hud(now) {
    if (P.score) {
      const total = stats.banked + (S.over ? 0 : S.game.score);
      const k = S.game.score + '|' + total + '|' + S.def.name;
      if (cache.score !== k) {
        cache.score = k;
        $('score').innerHTML = `<small>${S.def.name.toUpperCase()}</small>Score ${S.game.score}<small>TOTAL ${total}</small>`;
      }
    }
    if (P.top > 0 && topDirty) {
      topDirty = false;
      const box = $('top');
      box.textContent = '';
      const rows = Object.entries(stats.users).sort((a, b) => b[1] - a[1]).slice(0, P.top);
      if (rows.length) {
        const h = document.createElement('h4');
        h.textContent = 'TOP COMANDOS';
        const ol = document.createElement('ol');
        rows.forEach(([n, c]) => {
          const li = document.createElement('li');
          const a = document.createElement('span'); a.textContent = n;
          const b = document.createElement('b'); b.textContent = c;
          li.append(a, b); ol.append(li);
        });
        box.append(h, ol);
      }
    }
    const secs = S.next ? Math.max(0, Math.ceil((S.next.at - now) / 1000)) : 0;
    setText('banner', S.next && S.next.announce && !S.over ? `Cambiando a ${G[S.next.id].name} en ${secs}s` : '');
    const ov = $('overlay');
    ov.classList.toggle('show', S.over);
    if (S.over) {
      const t = `${S.def.name}|${S.game.result}|${S.game.score}|${secs}|${S.next.id}`;
      if (cache.ov !== t) {
        cache.ov = t;
        $('overlay-box').innerHTML =
          `<h1>${S.game.result}</h1><p>Score: <b>${S.game.score}</b></p><p>Siguiente: ${G[S.next.id].name} en ${secs}s</p>`;
      }
    }
    if (S.votes) {
      const e = [...S.votes.counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
      setText('votes', e.map(([c, n]) => `${c} (${n})`).join('  ') + `  · ${Math.max(0, (S.votes.end - now) / 1000).toFixed(1)}s`);
    } else setText('votes', '');
  }

  start(pick());
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(50, now - last);
    last = now;
    if (!S.over) {
      S.game.update(dt);
      if (S.game.over) onOver();
    }
    resolveVotes(now);
    if (S.next && now >= S.next.at) start(S.next.id);
    ctx.clearRect(0, 0, 720, 720);
    S.game.draw(ctx);
    hud(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

