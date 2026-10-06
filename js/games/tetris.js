Games.tetris = {
  name: 'Tetris',
  hint: 'A ← · D → · W rotar · S bajar · E caída total',
  create(o) {
    const W = 10, H = 20, C = 34, OX = 110, OY = 20;
    const SHAPES = {
      I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
      O: [[1, 1], [1, 1]],
      T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
      S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
      Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
      J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
      L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]]
    };
    const COLORS = { I: '#26c6da', O: '#fdd835', T: '#ab47bc', S: '#66bb6a', Z: '#ef5350', J: '#42a5f5', L: '#ffa726' };
    const board = Array.from({ length: H }, () => Array(W).fill(null));
    let bag = [], cur = null, next = null, acc = 0, lines = 0;

    const draw1 = () => {
      if (!bag.length) {
        bag = Object.keys(SHAPES);
        for (let i = bag.length - 1; i > 0; i--) {
          const j = Util.rand(i + 1);
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
      }
      return bag.pop();
    };
    const rot = (m) => m.map((_, y) => m.map((_, x) => m[m.length - 1 - x][y]));
    const fits = (m, px, py) => {
      for (let y = 0; y < m.length; y++) for (let x = 0; x < m.length; x++) {
        if (!m[y][x]) continue;
        const bx = px + x, by = py + y;
        if (bx < 0 || bx >= W || by >= H) return false;
        if (by >= 0 && board[by][bx]) return false;
      }
      return true;
    };
    const spawn = () => {
      const t = next || draw1();
      next = draw1();
      const m = SHAPES[t].map((r) => r.slice());
      cur = { t, m, x: Math.floor((W - m.length) / 2), y: 0 };
      if (!fits(cur.m, cur.x, cur.y)) g.over = true;
    };
    const level = () => Math.floor(lines / 10);
    const lock = () => {
      cur.m.forEach((r, y) => r.forEach((v, x) => {
        if (v && cur.y + y >= 0) board[cur.y + y][cur.x + x] = cur.t;
      }));
      let n = 0;
      for (let y = H - 1; y >= 0; y--) {
        if (board[y].every(Boolean)) { board.splice(y, 1); board.unshift(Array(W).fill(null)); n++; y++; }
      }
      if (n) {
        g.score += [0, 100, 300, 500, 800][n] * (level() + 1);
        lines += n;
      }
      spawn();
    };
    const down = () => {
      if (fits(cur.m, cur.x, cur.y + 1)) { cur.y++; return true; }
      lock();
      return false;
    };
    const ghostY = () => {
      let y = cur.y;
      while (fits(cur.m, cur.x, y + 1)) y++;
      return y;
    };
    const cell = (ctx, x, y, color, a) => {
      ctx.globalAlpha = a || 1;
      ctx.fillStyle = color;
      Util.roundRect(ctx, x + 1, y + 1, C - 2, C - 2, 5);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const g = {
      score: 0, over: false, result: 'Game Over',
      accepts: (c) => c.length === 1 && 'ADWSE'.includes(c),
      apply(c) {
        if (g.over) return;
        if (c === 'A' && fits(cur.m, cur.x - 1, cur.y)) cur.x--;
        else if (c === 'D' && fits(cur.m, cur.x + 1, cur.y)) cur.x++;
        else if (c === 'W') {
          const m = rot(cur.m);
          for (const k of [0, -1, 1, -2, 2]) {
            if (fits(m, cur.x + k, cur.y)) { cur.m = m; cur.x += k; break; }
          }
        } else if (c === 'S') { g.score += 1; down(); acc = 0; }
        else if (c === 'E') {
          const y = ghostY();
          g.score += 2 * (y - cur.y);
          cur.y = y;
          lock();
          acc = 0;
        }
      },
      update(dt) {
        acc += dt;
        const iv = Math.max(90, 800 * Math.pow(0.85, level())) / o.speed;
        while (acc >= iv && !g.over) { acc -= iv; down(); }
      },
      draw(ctx) {
        ctx.fillStyle = '#10151f';
        ctx.fillRect(0, 0, 720, 720);
        ctx.fillStyle = '#0a0d14';
        ctx.fillRect(OX, OY, W * C, H * C);
        ctx.strokeStyle = 'rgba(255,255,255,.05)';
        for (let x = 0; x <= W; x++) { ctx.beginPath(); ctx.moveTo(OX + x * C, OY); ctx.lineTo(OX + x * C, OY + H * C); ctx.stroke(); }
        for (let y = 0; y <= H; y++) { ctx.beginPath(); ctx.moveTo(OX, OY + y * C); ctx.lineTo(OX + W * C, OY + y * C); ctx.stroke(); }
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          if (board[y][x]) cell(ctx, OX + x * C, OY + y * C, COLORS[board[y][x]]);
        }
        if (cur && !g.over) {
          const gy = ghostY();
          cur.m.forEach((r, y) => r.forEach((v, x) => {
            if (v) {
              cell(ctx, OX + (cur.x + x) * C, OY + (gy + y) * C, COLORS[cur.t], 0.2);
              cell(ctx, OX + (cur.x + x) * C, OY + (cur.y + y) * C, COLORS[cur.t]);
            }
          }));
        }
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px Segoe UI, sans-serif';
        ctx.fillText('SIGUIENTE', 490, 50);
        const nm = SHAPES[next];
        nm.forEach((r, y) => r.forEach((v, x) => { if (v) cell(ctx, 490 + x * C, 70 + y * C, COLORS[next]); }));
        ctx.fillStyle = '#fff';
        ctx.fillText('LÍNEAS ' + lines, 490, 260);
        ctx.fillText('NIVEL ' + (level() + 1), 490, 295);
      }
    };
    spawn();
    return g;
  }
};
