Games.snake = {
  name: 'Snake',
  hint: 'A ← · D → · W/E ↑ · S ↓',
  create(o) {
    const N = 20, C = 36;
    const DIRS = { A: [-1, 0], D: [1, 0], W: [0, -1], E: [0, -1], S: [0, 1] };
    let snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    let dir = { x: 1, y: 0 };
    let queue = [];
    let acc = 0, apples = 0;
    let food = null;

    const placeFood = () => {
      const free = [];
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        if (!snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
      }
      food = free.length ? free[Util.rand(free.length)] : null;
    };
    placeFood();

    const g = {
      score: 0, over: false, result: 'Game Over',
      accepts: (c) => c in DIRS,
      apply(c) {
        const d = DIRS[c];
        const last = queue.length ? queue[queue.length - 1] : dir;
        if (last.x + d[0] === 0 && last.y + d[1] === 0) return;
        if (last.x === d[0] && last.y === d[1]) return;
        if (queue.length < 3) queue.push({ x: d[0], y: d[1] });
      },
      update(dt) {
        const step = (1000 / (7 * o.speed)) * Math.max(0.45, 1 - 0.02 * apples);
        acc += dt;
        while (acc >= step && !g.over) { acc -= step; tick(); }
      },
      draw(ctx) {
        ctx.fillStyle = '#10151f';
        ctx.fillRect(0, 0, 720, 720);
        ctx.strokeStyle = 'rgba(255,255,255,.04)';
        for (let i = 0; i <= N; i++) {
          ctx.beginPath(); ctx.moveTo(i * C, 0); ctx.lineTo(i * C, 720); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, i * C); ctx.lineTo(720, i * C); ctx.stroke();
        }
        if (food) {
          ctx.fillStyle = '#ff5252';
          ctx.beginPath();
          ctx.arc(food.x * C + C / 2, food.y * C + C / 2, C * 0.35, 0, 7);
          ctx.fill();
        }
        snake.forEach((s, i) => {
          ctx.fillStyle = i === 0 ? '#b9f6ca' : `hsl(${140 - Math.min(i, 40)}, 70%, ${52 - Math.min(i, 30) * 0.5}%)`;
          Util.roundRect(ctx, s.x * C + 2, s.y * C + 2, C - 4, C - 4, 8);
          ctx.fill();
        });
      }
    };

    function tick() {
      if (queue.length) dir = queue.shift();
      const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      const eat = food && h.x === food.x && h.y === food.y;
      const body = eat ? snake : snake.slice(0, -1);
      if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || body.some((s) => s.x === h.x && s.y === h.y)) {
        g.over = true;
        return;
      }
      snake.unshift(h);
      if (eat) { apples++; g.score += 10; placeFood(); if (!food) { g.over = true; g.result = '¡Victoria!'; } }
      else snake.pop();
    }
    return g;
  }
};
