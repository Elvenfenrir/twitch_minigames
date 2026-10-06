Games.breakout = {
  name: 'Breakout',
  hint: 'A ← · D → (mueve la barra)',
  create(o) {
    const COLS = 10, ROWS = 6, BW = 64, BH = 24, GAP = 4, OX = 20, OY = 80;
    const PW = 120, PH = 14, PY = 670, R = 9;
    const COLORS = ['#ef5350', '#ff9800', '#fdd835', '#66bb6a', '#42a5f5', '#ab47bc'];
    const bricks = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      bricks.push({ x: OX + c * (BW + GAP), y: OY + r * (BH + GAP), r, alive: true });
    }
    let left = bricks.length, lives = 3, hits = 0;
    let px = 360, target = 360;
    const ball = { x: 360, y: PY - R - 2, vx: 0, vy: 0, held: 1200 };

    const speed = () => Math.min(900, 400 + hits * 4) * o.speed;
    const serve = () => {
      ball.held = 1200;
      ball.vx = 0; ball.vy = 0;
    };

    const g = {
      score: 0, over: false, result: 'Game Over',
      accepts: (c) => c === 'A' || c === 'D',
      apply(c) { target = Math.max(PW / 2, Math.min(720 - PW / 2, target + (c === 'A' ? -100 : 100))); },
      update(dt) {
        const s = dt / 1000;
        const d = target - px;
        px += Math.sign(d) * Math.min(Math.abs(d), 1400 * s);
        if (ball.held > 0) {
          ball.x = px; ball.y = PY - R - 2;
          ball.held -= dt;
          if (ball.held <= 0) {
            const a = (Math.random() * 0.8 - 0.4) - Math.PI / 2;
            ball.vx = Math.cos(a) * speed(); ball.vy = Math.sin(a) * speed();
          }
          return;
        }
        const steps = Math.ceil((Math.hypot(ball.vx, ball.vy) * s) / 6) || 1;
        for (let i = 0; i < steps && !g.over && ball.held <= 0; i++) move(s / steps);
      },
      draw(ctx) {
        ctx.fillStyle = '#10151f';
        ctx.fillRect(0, 0, 720, 720);
        bricks.forEach((b) => {
          if (!b.alive) return;
          ctx.fillStyle = COLORS[b.r];
          Util.roundRect(ctx, b.x, b.y, BW, BH, 4);
          ctx.fill();
        });
        ctx.fillStyle = '#eceff1';
        Util.roundRect(ctx, px - PW / 2, PY, PW, PH, 7);
        ctx.fill();
        ctx.beginPath(); ctx.arc(ball.x, ball.y, R, 0, 7); ctx.fill();
        ctx.fillStyle = '#ef5350';
        for (let i = 0; i < lives; i++) { ctx.beginPath(); ctx.arc(30 + i * 28, 40, 9, 0, 7); ctx.fill(); }
      }
    };

    function move(s) {
      ball.x += ball.vx * s; ball.y += ball.vy * s;
      if (ball.x < R) { ball.x = R; ball.vx = Math.abs(ball.vx); }
      if (ball.x > 720 - R) { ball.x = 720 - R; ball.vx = -Math.abs(ball.vx); }
      if (ball.y < R) { ball.y = R; ball.vy = Math.abs(ball.vy); }
      if (ball.vy > 0 && ball.y + R >= PY && ball.y + R <= PY + PH + 10 && Math.abs(ball.x - px) <= PW / 2 + R) {
        const k = Math.max(-1, Math.min(1, (ball.x - px) / (PW / 2)));
        const a = -Math.PI / 2 + k * 1.0;
        ball.vx = Math.cos(a) * speed(); ball.vy = Math.sin(a) * speed();
        ball.y = PY - R;
      }
      for (const b of bricks) {
        if (!b.alive) continue;
        const cx = Math.max(b.x, Math.min(ball.x, b.x + BW));
        const cy = Math.max(b.y, Math.min(ball.y, b.y + BH));
        if (Math.hypot(ball.x - cx, ball.y - cy) >= R) continue;
        b.alive = false; left--; hits++;
        g.score += (ROWS - b.r) * 10;
        const dx = Math.abs(ball.x - (b.x + BW / 2)) / BW;
        const dy = Math.abs(ball.y - (b.y + BH / 2)) / BH;
        if (dx > dy) ball.vx = -ball.vx; else ball.vy = -ball.vy;
        const sp = speed(), cur = Math.hypot(ball.vx, ball.vy);
        ball.vx *= sp / cur; ball.vy *= sp / cur;
        break;
      }
      if (left === 0) { g.over = true; g.result = '¡Victoria!'; g.score += lives * 100; }
      if (ball.y > 740) {
        lives--;
        if (lives <= 0) g.over = true; else serve();
      }
    }
    return g;
  }
};
