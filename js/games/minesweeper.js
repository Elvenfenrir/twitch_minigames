Games.minesweeper = {
  name: 'Buscaminas',
  hint: 'A1 descubrir (letra = columna, número = fila) · F A1 bandera',
  create() {
    const N = 10, MINES = 14, C = 60, OX = 60, OY = 60;
    const NUM = ['', '#42a5f5', '#66bb6a', '#ef5350', '#7e57c2', '#ff7043', '#26c6da', '#eee', '#999'];
    const MS = Params.theme;
    const cells = Array.from({ length: N * N }, () => ({ mine: false, open: false, flag: false, n: 0 }));
    let started = false, opened = 0;
    const at = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? null : cells[y * N + x]);
    const neigh = (x, y) => {
      const r = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if ((dx || dy) && at(x + dx, y + dy)) r.push([x + dx, y + dy]);
      }
      return r;
    };
    const parse = (c) => {
      const m = /^(F )?([A-J])(10|[1-9])$/.exec(c);
      return m && { flag: !!m[1], x: m[2].charCodeAt(0) - 65, y: parseInt(m[3], 10) - 1 };
    };
    const plant = (sx, sy) => {
      let placed = 0;
      while (placed < MINES) {
        const x = Util.rand(N), y = Util.rand(N);
        if (Math.abs(x - sx) <= 1 && Math.abs(y - sy) <= 1) continue;
        const c = at(x, y);
        if (c.mine) continue;
        c.mine = true; placed++;
      }
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        at(x, y).n = neigh(x, y).filter(([a, b]) => at(a, b).mine).length;
      }
    };
    const flood = (x, y) => {
      const st = [[x, y]];
      while (st.length) {
        const [cx, cy] = st.pop();
        const c = at(cx, cy);
        if (c.open || c.flag) continue;
        c.open = true; opened++; g.score += 10;
        if (c.n === 0) neigh(cx, cy).forEach((p) => st.push(p));
      }
    };

    const g = {
      score: 0, over: false, result: '',
      accepts: (c) => !!parse(c),
      apply(c) {
        if (g.over) return;
        const p = parse(c);
        const cell = at(p.x, p.y);
        if (p.flag) { if (!cell.open) cell.flag = !cell.flag; return; }
        if (cell.open || cell.flag) return;
        if (!started) { started = true; plant(p.x, p.y); }
        if (cell.mine) {
          cell.open = true;
          g.over = true; g.result = '¡BOOM!';
          return;
        }
        flood(p.x, p.y);
        if (opened === N * N - MINES) { g.over = true; g.result = '¡Tablero despejado!'; g.score += 500; }
      },
      update() {},
      draw(ctx) {
        ctx.fillStyle = Params.canvasBg;
        ctx.fillRect(0, 0, 720, 720);
        ctx.fillStyle = Params.accent;
        ctx.font = 'bold 28px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < N; i++) {
          ctx.fillText(String.fromCharCode(65 + i), OX + i * C + C / 2, OY - 28);
          ctx.fillText(String(i + 1), OX - 30, OY + i * C + C / 2);
        }
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const c = at(x, y);
          const px = OX + x * C, py = OY + y * C;
          const showMine = g.over && c.mine;
          ctx.fillStyle = showMine ? (c.open ? MS.msMine : Params.alpha(MS.msMine, 0.5)) : c.open ? MS.msOpen : MS.msClosed;
          Util.roundRect(ctx, px + 2, py + 2, C - 4, C - 4, 6);
          ctx.fill();
          if (c.open && !c.mine && c.n) {
            ctx.fillStyle = NUM[c.n];
            ctx.font = 'bold 32px Segoe UI, sans-serif';
            ctx.fillText(c.n, px + C / 2, py + C / 2 + 2);
          } else if (showMine) {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(px + C / 2, py + C / 2, 11, 0, 7); ctx.fill();
          } else if (c.flag) {
            ctx.fillStyle = MS.msFlag;
            ctx.beginPath(); ctx.moveTo(px + 20, py + 14); ctx.lineTo(px + 44, py + 24); ctx.lineTo(px + 20, py + 34); ctx.fill();
            ctx.fillRect(px + 18, py + 14, 3, 32);
          }
        }
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    };
    return g;
  }
};


