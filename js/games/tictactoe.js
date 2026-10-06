Games.tictactoe = {
  name: 'Tic-Tac-Toe',
  hint: 'A1-C3 (letra = columna, número = fila) o 1-9 · el chat (X) vs IA (O)',
  create() {
    const OX = 105, OY = 95, C = 170;
    const b = Array(9).fill(0);
    const L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    let turn = 1, wait = 0, win = null;

    const idx = (c) => {
      if (/^[1-9]$/.test(c)) return +c - 1;
      const m = /^([A-C])([1-3])$/.exec(c);
      return m ? (+m[2] - 1) * 3 + m[1].charCodeAt(0) - 65 : -1;
    };
    const winner = (bd) => {
      for (const l of L) if (bd[l[0]] && bd[l[0]] === bd[l[1]] && bd[l[1]] === bd[l[2]]) return { p: bd[l[0]], cells: l };
      return null;
    };
    const minimax = (bd, p) => {
      const w = winner(bd);
      if (w) return w.p === 2 ? 10 : -10;
      if (bd.every(Boolean)) return 0;
      let best = p === 2 ? -Infinity : Infinity;
      for (let i = 0; i < 9; i++) {
        if (bd[i]) continue;
        bd[i] = p;
        const v = minimax(bd, 3 - p);
        bd[i] = 0;
        best = p === 2 ? Math.max(best, v) : Math.min(best, v);
      }
      return best;
    };
    const aiMove = () => {
      const free = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
      // 20% de jugadas al azar para que el chat pueda ganar.
      if (Math.random() < 0.2) return free[Util.rand(free.length)];
      let best = -Infinity, pick = [];
      for (const i of free) {
        b[i] = 2;
        const v = minimax(b, 1);
        b[i] = 0;
        if (v > best) { best = v; pick = [i]; } else if (v === best) pick.push(i);
      }
      return pick[Util.rand(pick.length)];
    };
    const finish = () => {
      win = winner(b);
      if (win) {
        g.over = true;
        if (win.p === 1) { g.result = '¡Ganó el chat!'; g.score = 100; } else g.result = 'Ganó la IA';
      } else if (b.every(Boolean)) { g.over = true; g.result = 'Empate'; g.score = 50; }
      return g.over;
    };

    const g = {
      score: 0, over: false, result: '',
      accepts: (c) => idx(c) >= 0,
      apply(c) {
        if (g.over || turn !== 1) return;
        const i = idx(c);
        if (b[i]) return;
        b[i] = 1;
        if (finish()) return;
        turn = 2; wait = 700;
      },
      update(dt) {
        if (g.over || turn !== 2) return;
        wait -= dt;
        if (wait > 0) return;
        b[aiMove()] = 2;
        if (!finish()) turn = 1;
      },
      draw(ctx) {
        ctx.fillStyle = Params.canvasBg;
        ctx.fillRect(0, 0, 720, 720);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = Params.accent;
        ctx.font = 'bold 30px Segoe UI, sans-serif';
        for (let i = 0; i < 3; i++) {
          ctx.fillText(String.fromCharCode(65 + i), OX + i * C + C / 2, OY - 30);
          ctx.fillText(String(i + 1), OX - 30, OY + i * C + C / 2);
        }
        ctx.strokeStyle = Params.alpha(Params.theme.grid, 0.35);
        ctx.lineWidth = 8; ctx.lineCap = 'round';
        for (let i = 1; i < 3; i++) {
          ctx.beginPath(); ctx.moveTo(OX + i * C, OY + 10); ctx.lineTo(OX + i * C, OY + 3 * C - 10); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(OX + 10, OY + i * C); ctx.lineTo(OX + 3 * C - 10, OY + i * C); ctx.stroke();
        }
        ctx.lineWidth = 16;
        for (let i = 0; i < 9; i++) {
          if (!b[i]) {
            ctx.fillStyle = Params.alpha(Params.theme.grid, 0.25);
            ctx.font = 'bold 36px Segoe UI, sans-serif';
            ctx.fillText(i + 1, OX + (i % 3) * C + C / 2, OY + Math.floor(i / 3) * C + C / 2);
            continue;
          }
          const cx = OX + (i % 3) * C + C / 2, cy = OY + Math.floor(i / 3) * C + C / 2;
          if (b[i] === 1) {
            ctx.strokeStyle = Params.theme.ttX;
            ctx.beginPath(); ctx.moveTo(cx - 42, cy - 42); ctx.lineTo(cx + 42, cy + 42);
            ctx.moveTo(cx + 42, cy - 42); ctx.lineTo(cx - 42, cy + 42); ctx.stroke();
          } else {
            ctx.strokeStyle = Params.theme.ttO;
            ctx.beginPath(); ctx.arc(cx, cy, 44, 0, 7); ctx.stroke();
          }
        }
        if (win) {
          ctx.strokeStyle = Params.accent; ctx.lineWidth = 10;
          const a = win.cells[0], z = win.cells[2];
          ctx.beginPath();
          ctx.moveTo(OX + (a % 3) * C + C / 2, OY + Math.floor(a / 3) * C + C / 2);
          ctx.lineTo(OX + (z % 3) * C + C / 2, OY + Math.floor(z / 3) * C + C / 2);
          ctx.stroke();
        }
        if (!g.over) {
          ctx.fillStyle = turn === 1 ? Params.theme.ttX : Params.theme.ttO;
          ctx.font = 'bold 28px Segoe UI, sans-serif';
          ctx.fillText(turn === 1 ? 'Turno del chat (X)' : 'Pensando la IA (O)…', 360, 645);
        }
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.lineWidth = 1;
      }
    };
    return g;
  }
};
