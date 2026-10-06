Games.connect4 = {
  name: 'Conecta 4',
  hint: 'Elige columna: 1-7 (o A-G) · el chat juega rojo contra la IA',
  create() {
    const COLS = 7, ROWS = 6, C = 100, OX = 10, OY = 70;
    const b = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    let turn = 1, aiWait = 0, win = null, moves = 0;

    const col = (c) => (/^[1-7]$/.test(c) ? +c - 1 : /^[A-G]$/.test(c) ? c.charCodeAt(0) - 65 : -1);
    const drop = (bd, c, p) => {
      for (let r = ROWS - 1; r >= 0; r--) if (!bd[r][c]) { bd[r][c] = p; return r; }
      return -1;
    };
    const lines = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      [[0, 1], [1, 0], [1, 1], [1, -1]].forEach(([dr, dc]) => {
        const l = [];
        for (let k = 0; k < 4; k++) l.push([r + dr * k, c + dc * k]);
        if (l.every(([y, x]) => y >= 0 && y < ROWS && x >= 0 && x < COLS)) lines.push(l);
      });
    }
    const winner = (bd) => {
      for (const l of lines) {
        const v = bd[l[0][0]][l[0][1]];
        if (v && l.every(([y, x]) => bd[y][x] === v)) return { p: v, cells: l };
      }
      return null;
    };
    const full = (bd) => bd[0].every(Boolean);
    const evalBoard = (bd) => {
      let s = 0;
      for (let r = 0; r < ROWS; r++) if (bd[r][3] === 2) s += 3;
      for (const l of lines) {
        let a = 0, h = 0;
        l.forEach(([y, x]) => { if (bd[y][x] === 2) a++; else if (bd[y][x] === 1) h++; });
        if (a && h) continue;
        if (a === 3) s += 5; else if (a === 2) s += 2;
        if (h === 3) s -= 6; else if (h === 2) s -= 2;
      }
      return s;
    };
    const order = [3, 2, 4, 1, 5, 0, 6];
    const search = (bd, depth, alpha, beta, p) => {
      const w = winner(bd);
      if (w) return w.p === 2 ? 100000 + depth : -100000 - depth;
      if (full(bd) || depth === 0) return evalBoard(bd);
      let best = p === 2 ? -Infinity : Infinity;
      for (const c of order) {
        if (bd[0][c]) continue;
        const r = drop(bd, c, p);
        const v = search(bd, depth - 1, alpha, beta, 3 - p);
        bd[r][c] = 0;
        if (p === 2) { best = Math.max(best, v); alpha = Math.max(alpha, v); }
        else { best = Math.min(best, v); beta = Math.min(beta, v); }
        if (beta <= alpha) break;
      }
      return best;
    };
    const aiMove = () => {
      let best = -Infinity, bc = order.find((c) => !b[0][c]);
      for (const c of order) {
        if (b[0][c]) continue;
        const r = drop(b, c, 2);
        const v = search(b, 5, -Infinity, Infinity, 1);
        b[r][c] = 0;
        if (v > best) { best = v; bc = c; }
      }
      return bc;
    };
    const finish = () => {
      win = winner(b);
      if (win) {
        g.over = true;
        if (win.p === 1) { g.result = '¡Ganó el chat!'; g.score = 100 + (ROWS * COLS - moves) * 10; }
        else { g.result = 'Ganó la IA'; g.score = 0; }
      } else if (full(b)) {
        g.over = true; g.result = 'Empate'; g.score = 50;
      }
      return g.over;
    };

    const g = {
      score: 0, over: false, result: '',
      accepts: (c) => col(c) >= 0,
      apply(c) {
        if (g.over || turn !== 1) return;
        const x = col(c);
        if (b[0][x]) return;
        drop(b, x, 1); moves++;
        if (finish()) return;
        turn = 2; aiWait = 700;
      },
      update(dt) {
        if (g.over || turn !== 2) return;
        aiWait -= dt;
        if (aiWait > 0) return;
        drop(b, aiMove(), 2); moves++;
        if (!finish()) turn = 1;
      },
      draw(ctx) {
        ctx.fillStyle = '#10151f';
        ctx.fillRect(0, 0, 720, 720);
        ctx.fillStyle = '#1e40af';
        Util.roundRect(ctx, OX, OY, COLS * C, ROWS * C, 16);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#9aa5b8';
        ctx.font = 'bold 26px Segoe UI, sans-serif';
        for (let c = 0; c < COLS; c++) ctx.fillText(`${c + 1} · ${String.fromCharCode(65 + c)}`, OX + c * C + C / 2, OY - 30);
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          ctx.fillStyle = b[r][c] === 1 ? '#ef5350' : b[r][c] === 2 ? '#fdd835' : '#0b0e17';
          ctx.beginPath();
          ctx.arc(OX + c * C + C / 2, OY + r * C + C / 2, 39, 0, 7);
          ctx.fill();
        }
        if (win) {
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 6;
          win.cells.forEach(([r, c]) => {
            ctx.beginPath(); ctx.arc(OX + c * C + C / 2, OY + r * C + C / 2, 39, 0, 7); ctx.stroke();
          });
        }
        if (!g.over) {
          ctx.fillStyle = turn === 1 ? '#ef5350' : '#fdd835';
          ctx.font = 'bold 28px Segoe UI, sans-serif';
          ctx.fillText(turn === 1 ? 'Turno del chat' : 'Pensando la IA…', 360, 700);
        }
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.lineWidth = 1;
      }
    };
    return g;
  }
};
