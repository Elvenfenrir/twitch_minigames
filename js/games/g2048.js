Games['2048'] = {
  name: '2048',
  hint: 'A ← · D → · W ↑ · S ↓',
  create() {
    const N = 4, T = 150, GAP = 12, OX = 30, OY = 30;
    const COLORS = {
      0: '#2a3246', 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563', 32: '#f67c5f',
      64: '#f65e3b', 128: '#edcf72', 256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: '#edc22e'
    };
    const grid = Array.from({ length: N }, () => Array(N).fill(0));
    const spawn = () => {
      const free = [];
      grid.forEach((r, y) => r.forEach((v, x) => { if (!v) free.push([x, y]); }));
      if (!free.length) return;
      const [x, y] = free[Util.rand(free.length)];
      grid[y][x] = Math.random() < 0.9 ? 2 : 4;
    };
    const pos = (d, i, j) => ({ A: [j, i], D: [N - 1 - j, i], W: [i, j], S: [i, N - 1 - j] }[d]);

    function slide(d, commit) {
      let moved = false, gained = 0;
      for (let i = 0; i < N; i++) {
        const vals = [];
        for (let j = 0; j < N; j++) { const [x, y] = pos(d, i, j); if (grid[y][x]) vals.push(grid[y][x]); }
        const out = [];
        for (let k = 0; k < vals.length; k++) {
          if (vals[k] === vals[k + 1]) { out.push(vals[k] * 2); gained += vals[k] * 2; k++; }
          else out.push(vals[k]);
        }
        for (let j = 0; j < N; j++) {
          const [x, y] = pos(d, i, j);
          const v = out[j] || 0;
          if (grid[y][x] !== v) moved = true;
          if (commit) grid[y][x] = v;
        }
      }
      return { moved, gained };
    }

    const g = {
      score: 0, over: false, result: 'Sin movimientos',
      accepts: (c) => c.length === 1 && 'ADWS'.includes(c),
      apply(c) {
        if (g.over) return;
        const r = slide(c, true);
        if (!r.moved) return;
        g.score += r.gained;
        spawn();
        if (!'ADWS'.split('').some((d) => slide(d, false).moved)) g.over = true;
      },
      update() {},
      draw(ctx) {
        ctx.fillStyle = Params.canvasBg;
        ctx.fillRect(0, 0, 720, 720);
        ctx.fillStyle = Params.accent;
        Util.roundRect(ctx, OX - GAP, OY - GAP, N * T + (N + 1) * GAP, N * T + (N + 1) * GAP, 14);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const v = grid[y][x];
          const px = OX + x * (T + GAP) , py = OY + y * (T + GAP);
          ctx.fillStyle = v ? (COLORS[v] || '#3c3a32') : Params.theme.tileEmpty;
          Util.roundRect(ctx, px, py, T, T, 10);
          ctx.fill();
          if (v) {
            ctx.fillStyle = v <= 4 ? '#776e65' : '#fff';
            ctx.font = `bold ${v < 100 ? 64 : v < 1000 ? 54 : 44}px Segoe UI, sans-serif`;
            ctx.fillText(v, px + T / 2, py + T / 2 + 3);
          }
        }
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    };
    spawn(); spawn();
    return g;
  }
};


