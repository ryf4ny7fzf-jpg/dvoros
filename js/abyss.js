/* ============================================================
   СВОЯ ДОРОГА — бег от демона до 100 000 метров
   ============================================================ */
'use strict';

const abyssCanvas = $('#abyssCanvas');
const abyssCtx = abyssCanvas ? abyssCanvas.getContext('2d') : null;
const TARGET_DISTANCE = 100000;
const CHECKPOINTS = [25000, 50000, 75000];
let censored = true;

const INSULTS = [
  [
    { c: 'Ты ничтожество. И ты это знаешь.', u: 'Ты ничтожество. И ты это знаешь.' },
    { c: 'Он тебя не спасёт.', u: 'Он тебя не спасёт.' },
    { c: 'Беги, беги. Дальше будет хуже.', u: 'Беги, беги. Дальше будет хуже.' },
    { c: 'Никто не ждёт тебя дома.', u: 'Никто не ждёт тебя дома.' },
    { c: 'Ты уже проиграл.', u: 'Ты уже проиграл.' },
    { c: 'Твоя вера — просто страх.', u: 'Твоя вера — просто страх.' }
  ],
  [
    { c: 'Ты жалкий кусок д#рьма.', u: 'Ты жалкий кусок дерьма.' },
    { c: 'С#ка, ты даже бежать не умеешь.', u: 'Сука, ты даже бежать не умеешь.' },
    { c: 'Пошёл ты н#хуй, урод.', u: 'Пошёл ты нахуй, урод.' },
    { c: 'Твоя жизнь — п#здец.', u: 'Твоя жизнь — пиздец.' },
    { c: 'Сдохни, мразь.', u: 'Сдохни, мразь.' },
    { c: 'Ты бежишь от себя, идиот.', u: 'Ты бежишь от себя, идиот.' }
  ],
  [
    { c: 'Я вырву твою душу, ёб#ный кусок мяса.', u: 'Я вырву твою душу, ёбанный кусок мяса.' },
    { c: 'Ты сдохнешь один, как собака, с#ка.', u: 'Ты сдохнешь один, как собака, сука.' },
    { c: 'Да кому ты нужен, долбо#б?', u: 'Да кому ты нужен, долбоёб?' },
    { c: 'П#здец тебе, ублюдок.', u: 'Пиздец тебе, ублюдок.' },
    { c: 'Ха-ха-ха, ты никому не нужен, н#хуй.', u: 'Ха-ха-ха, ты никому не нужен, нахуй.' },
    { c: 'Твой бог отвернулся от тебя, м#дак.', u: 'Твой бог отвернулся от тебя, мудак.' }
  ]
];

const A = {
  W: 0, H: 0, dpr: 1,
  raf: 0, running: false, state: 'idle',
  t: 0, speed: 450, distance: 0, lives: 3, danger: 0,
  shake: 0, flash: 0, bg1: 0, bg2: 0,
  ground: 0, last: 0, hudAcc: 0,
  p: { h: 0, vy: 0, slide: 0, inv: 0, phase: 0 },
  obstacles: [], parts: [], insults: [],
  nextSpawn: 620, insultT: 1.4,
  checkpoint: 0, toast: null,
  endT: 0, toChoice: false,
  caughtT: 0, toCaught: false
};

const keys = new Set();

/* ---------------- sizing / lifecycle ---------------- */
function sizeAbyss() {
  if (!abyssCanvas) return;
  const r = abyssCanvas.getBoundingClientRect();
  A.dpr = Math.min(2, window.devicePixelRatio || 1);
  A.W = Math.max(300, r.width || window.innerWidth);
  A.H = Math.max(300, r.height || window.innerHeight);
  abyssCanvas.width = Math.round(A.W * A.dpr);
  abyssCanvas.height = Math.round(A.H * A.dpr);
  abyssCtx.setTransform(A.dpr, 0, 0, A.dpr, 0, 0);
  A.ground = A.H * 0.76;
}

function startAbyss() {
  audio();
  setScreen('s-abyss');
  requestAnimationFrame(() => {
    if (current !== 's-abyss') return;
    sizeAbyss();
    initAbyss();
    if (!A.running) {
      A.running = true;
      A.last = performance.now();
      A.raf = requestAnimationFrame(abyssLoop);
    }
  });
}

function abyssStop() {
  A.running = false;
  if (A.raf) cancelAnimationFrame(A.raf);
  A.raf = 0;
}

function initAbyss() {
  A.t = 0;
  A.speed = 450;
  A.distance = 0;
  A.lives = 3;
  A.danger = 0;
  A.shake = 0;
  A.flash = 0;
  A.bg1 = 0;
  A.bg2 = 0;
  A.ruinLine = 0;
  A.p = { h: 0, vy: 0, slide: 0, inv: 0, phase: 0 };
  A.obstacles = [];
  A.parts = [];
  A.insults = [];
  A.nextSpawn = 640;
  A.insultT = 1.4;
  A.checkpoint = 0;
  A.toast = null;
  A.endT = 0;
  A.toChoice = false;
  A.caughtT = 0;
  A.toCaught = false;
  A.hudAcc = 1;
  A.state = 'run';
  const box = $('#censor');
  if (box) censored = box.checked;
  updateAbyssHUD();
}

/* ---------------- helpers ---------------- */
function playerX() {
  if (A.W < 620) return 315;
  return Math.max(128, A.W * 0.3);
}

function speedScale() {
  return A.W < 620 ? 0.8 : 1;
}

function demonPos() {
  const gap = A.W < 620
    ? 86 - A.danger * 0.2
    : Math.max(108, A.W * 0.24 - A.danger * 0.9);
  const base = A.W < 620 ? 0.92 : 1.02;
  return {
    x: playerX() - gap,
    scale: base + A.danger * 0.0022
  };
}

function burstAbyss(x, y, n) {
  for (let i = 0; i < n; i++) {
    A.parts.push({
      x, y,
      vx: rnd(-170, 170),
      vy: rnd(-230, -20),
      r: rnd(1, 2.6),
      t: 0,
      life: rnd(0.4, 1.1),
      ember: true
    });
  }
}

function abyssJump() {
  if (current !== 's-abyss' || A.state !== 'run') return;
  if (A.p.h <= 0.5) {
    A.p.h = 0.5;
    A.p.vy = 940;
    tone(330, 0.1, 'triangle', 0.055, 520);
  }
}

function abyssSlide() {
  if (current !== 's-abyss' || A.state !== 'run') return;
  A.p.slide = 0.55;
  if (A.p.h > 0.5) A.p.vy = Math.min(A.p.vy, -480);
  else noise(0.18, 0.05, 1600);
}

function spawnObstacle() {
  const r = Math.random();
  if (r < 0.42) {
    A.obstacles.push({ type: 'crate', x: A.W + 80, w: 52, h: 58 });
  } else if (r < 0.72) {
    A.obstacles.push({ type: 'beam', x: A.W + 80, w: 70 });
  } else {
    A.obstacles.push({ type: 'fire', x: A.W + 80, w: 46 });
  }
}

function hitObstacle(o) {
  if (A.p.inv > 0 || A.state !== 'run') return;
  o.hit = true;
  A.lives--;
  A.danger = clamp(A.danger + 40, 0, 100);
  A.p.inv = 1.3;
  A.p.vy = Math.max(A.p.vy, 240);
  A.shake = 20;
  A.flash = 1;
  noise(0.34, 0.24, 900);
  tone(90, 0.3, 'square', 0.11, 45);
  burstAbyss(playerX(), A.ground - 46, 16);
  updateAbyssHUD();
  if (A.lives <= 0 || A.danger >= 100) abyssCaught();
}

function spawnInsult() {
  const tier = A.distance < 30000 ? 0 : (A.distance < 70000 ? 1 : 2);
  const arr = INSULTS[tier];
  const pair = arr[Math.floor(Math.random() * arr.length)];
  const text = censored ? pair.c : pair.u;
  const d = demonPos();
  const stack = Math.min(A.insults.length, 2);
  A.insults.push({
    text,
    age: 0,
    life: 2.8,
    x: d.x + 84 * d.scale + rnd(-8, 8),
    y: A.ground - 196 * d.scale - stack * 54
  });
  A.shake = Math.max(A.shake, 6);
  tone(rnd(62, 88), 0.22, 'sawtooth', 0.035, rnd(38, 52));
}

function finishAbyss() {
  if (A.state !== 'run') return;
  A.state = 'end';
  A.endT = 0;
  A.toChoice = false;
  A.distance = TARGET_DISTANCE;
  A.obstacles = [];
  A.insults = [];
  A.toast = { text: '100 000 м', t: 0 };
  A.speed = Math.max(A.speed, 700);
  A.flash = 0.4;
  noise(0.8, 0.22, 420);
  tone(196, 1.4, 'sine', 0.09, 98);
  tone(392, 1.4, 'sine', 0.05, 196);
  updateAbyssHUD();
}

function abyssCaught() {
  if (A.state !== 'run') return;
  A.state = 'caught';
  A.caughtT = 0;
  A.toCaught = false;
  A.shake = 28;
  A.flash = 1;
  noise(0.7, 0.28, 320);
  tone(68, 0.9, 'sawtooth', 0.13, 32);
}

/* ---------------- HUD ---------------- */
function updateAbyssHUD() {
  const dist = $('#abyssDist');
  if (dist) dist.textContent = Math.floor(A.distance).toLocaleString('ru-RU');
  const prog = $('#abyssProgress');
  if (prog) prog.style.width = (clamp(A.distance / TARGET_DISTANCE, 0, 1) * 100).toFixed(1) + '%';
  const danger = $('#abyssDanger');
  if (danger) danger.style.width = clamp(A.danger, 0, 100).toFixed(1) + '%';
  const hearts = $('#abyssHearts');
  if (hearts) {
    Array.from(hearts.children).forEach((h, i) => h.classList.toggle('off', i >= A.lives));
  }
}

/* ---------------- loop ---------------- */
function abyssLoop(ts) {
  if (!A.running) return;
  const dt = Math.min(0.05, Math.max(0, (ts - A.last) / 1000));
  A.last = ts;
  updateAbyss(dt);
  drawAbyss();
  if (A.running) A.raf = requestAnimationFrame(abyssLoop);
  else A.raf = 0;
}

function updateAbyss(dt) {
  A.t += dt;
  A.shake *= Math.pow(0.015, dt);
  if (A.shake < 0.25) A.shake = 0;
  A.flash = Math.max(0, A.flash - dt * 1.4);

  if (A.state === 'run') {
    A.ruinLine = Math.min(1, Math.max(0, (A.distance - 24000) / 76000)) * A.W;
  }

  for (const p of A.parts) {
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.pow(0.35, dt);
    p.vy += 60 * dt;
  }
  A.parts = A.parts.filter((p) => p.t < p.life);

  if (A.state === 'run') {
    A.speed = (450 + Math.min(760, A.t * 7.4)) * speedScale();
    A.distance += A.speed * dt * 1.35 / speedScale();
    A.bg1 += A.speed * dt * 0.12;
    A.bg2 += A.speed * dt * 0.3;

    while (A.checkpoint < CHECKPOINTS.length && A.distance >= CHECKPOINTS[A.checkpoint]) {
      A.toast = { text: CHECKPOINTS[A.checkpoint].toLocaleString('ru-RU') + ' м', t: 0 };
      A.checkpoint++;
      tone(523, 0.2, 'sine', 0.05, 784);
    }

    const p = A.p;
    p.vy -= 2700 * dt;
    p.h += p.vy * dt;
    if (p.h < 0) { p.h = 0; p.vy = 0; }
    p.slide = Math.max(0, p.slide - dt);
    p.inv = Math.max(0, p.inv - dt);
    if (p.h < 1 && p.slide <= 0) p.phase += dt * Math.max(7, A.speed / 65);
    else p.phase += dt * 3;

    /* spawn */
    A.nextSpawn -= A.speed * dt;
    if (A.nextSpawn <= 0) {
      spawnObstacle();
      A.nextSpawn = rnd(560, 780) + A.speed * 0.15;
    }

    /* obstacles */
    const px = playerX();
    const hgt = (p.slide > 0 && p.h < 6) ? 42 : 82;
    for (const o of A.obstacles) {
      o.x -= A.speed * dt;
      if (o.hit) continue;
      const oy1 = o.type === 'beam' ? A.ground - 168 : A.ground - (o.type === 'fire' ? 36 : o.h);
      const oy2 = o.type === 'beam' ? A.ground - 58 : A.ground;
      if (p.inv <= 0 && px + 16 > o.x && px - 16 < o.x + o.w) {
        const bottom = A.ground - p.h;
        const top = bottom - hgt;
        if (bottom > oy1 && top < oy2) hitObstacle(o);
      }
    }
    A.obstacles = A.obstacles.filter((o) => !o.hit && o.x > -180);

    /* insults */
    A.insultT -= dt;
    if (A.insultT <= 0) {
      spawnInsult();
      A.insultT = rnd(2.5, 4.6);
    }
    for (const ins of A.insults) ins.age += dt;
    A.insults = A.insults.filter((i) => i.age < i.life);

    A.danger = Math.max(0, A.danger - 6 * dt);

    /* embers */
    if (Math.random() < dt * 34) {
      A.parts.push({
        x: rnd(0, A.W),
        y: A.ground - rnd(0, 90),
        vx: rnd(-110, -25),
        vy: rnd(-80, -15),
        r: rnd(0.8, 2.2),
        t: 0,
        life: rnd(0.9, 2.3),
        ember: true
      });
    }

    if (A.distance >= TARGET_DISTANCE) finishAbyss();
  } else if (A.state === 'end') {
    A.endT += dt;
    A.speed *= Math.pow(0.06, dt);
    A.bg1 += A.speed * dt * 0.12;
    A.bg2 += A.speed * dt * 0.3;
    A.p.phase += dt * 5;
    A.distance = TARGET_DISTANCE;
    if (A.endT > 2.6 && !A.toChoice) {
      A.toChoice = true;
      setScreen('s-choice');
      return;
    }
  } else if (A.state === 'caught') {
    A.caughtT += dt;
    if (A.caughtT > 1.7 && !A.toCaught) {
      A.toCaught = true;
      setScreen('s-caught');
      return;
    }
  }

  if (A.toast) {
    A.toast.t += dt;
    if (A.toast.t > 2.6) A.toast = null;
  }

  A.hudAcc += dt;
  if (A.hudAcc > 0.08) {
    A.hudAcc = 0;
    updateAbyssHUD();
  }
}

/* ---------------- render ---------------- */
function drawAbyss() {
  if (!abyssCtx) return;
  const ctx = abyssCtx;
  const W = A.W;
  const H = A.H;
  const gy = A.ground;

  ctx.save();
  if (A.shake > 0.3) ctx.translate(rnd(-A.shake, A.shake), rnd(-A.shake, A.shake));

  /* sky */
  const sky = ctx.createLinearGradient(0, 0, 0, gy);
  sky.addColorStop(0, '#0a0610');
  sky.addColorStop(0.55, '#240a14');
  sky.addColorStop(1, '#4a1118');
  ctx.fillStyle = sky;
  ctx.fillRect(-40, -40, W + 80, gy + 40);

  /* moon */
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const mg = ctx.createRadialGradient(W * 0.72, H * 0.18, 8, W * 0.72, H * 0.18, H * 0.38);
  mg.addColorStop(0, 'rgba(255,120,90,.32)');
  mg.addColorStop(1, 'rgba(255,80,60,0)');
  ctx.fillStyle = mg;
  ctx.fillRect(0, 0, W, gy);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,168,132,.5)';
  ctx.beginPath();
  ctx.arc(W * 0.72, H * 0.18, Math.min(38, W * 0.045), 0, TAU);
  ctx.fill();

  /* city */
  drawSkyline(ctx, A.bg1, gy, '#160b16', 180, H * 0.1, H * 0.33, 'rgba(255,120,70,.18)', A.ruinLine);
  drawSkyline(ctx, A.bg2, gy, '#0b060c', 140, H * 0.07, H * 0.22, 'rgba(255,90,60,.14)', A.ruinLine);

  /* ground */
  ctx.fillStyle = '#08050a';
  ctx.fillRect(0, gy, W, H - gy);
  const gg = ctx.createLinearGradient(0, gy, 0, H);
  gg.addColorStop(0, '#1a0e12');
  gg.addColorStop(1, '#060407');
  ctx.fillStyle = gg;
  ctx.fillRect(0, gy + 2, W, H - gy);
  ctx.fillStyle = 'rgba(200,70,40,.42)';
  ctx.fillRect(0, gy - 1, W, 2);

  const off = A.bg2 % 140;
  ctx.strokeStyle = 'rgba(120,60,50,.3)';
  ctx.lineWidth = 2;
  for (let x = -off; x < W + 140; x += 140) {
    ctx.beginPath();
    ctx.moveTo(x, gy + 26);
    ctx.lineTo(x - 34, H);
    ctx.stroke();
  }

  /* obstacles */
  drawObstacles(ctx);

  /* demon */
  const d = demonPos();
  drawDemon(ctx, d.x, gy, d.scale);

  /* player */
  drawRunner(ctx, playerX(), gy, A.p);

  /* embers */
  for (const p of A.parts) {
    const a = 1 - p.t / p.life;
    ctx.globalAlpha = Math.max(0, a) * 0.9;
    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
    grd.addColorStop(0, 'rgba(255,180,100,.9)');
    grd.addColorStop(1, 'rgba(255,80,30,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 3, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  /* insults */
  drawInsults(ctx);

  ctx.restore();

  if (A.flash > 0) {
    ctx.fillStyle = 'rgba(150,20,10,' + (A.flash * 0.35) + ')';
    ctx.fillRect(0, 0, W, H);
  }

  if (A.toast) {
    const t = A.toast.t;
    const a = t < 0.25 ? t / 0.25 : Math.max(0, 1 - (t - 0.25) / 2.2);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '400 ' + Math.round(Math.min(46, W * 0.055)) + 'px Forum, Georgia, serif';
    ctx.fillStyle = '#f3e2bf';
    ctx.shadowColor = 'rgba(240,200,130,.6)';
    ctx.shadowBlur = 24;
    ctx.fillText(A.toast.text, W * 0.5, H * 0.27);
    ctx.restore();
  }
}

function drawSkyline(ctx, offset, baseY, color, step, minH, maxH, winColor, ruinLine) {
  const first = Math.floor(offset / step) - 1;
  const count = Math.ceil(A.W / step) + 3;
  const rem = offset % step;
  for (let k = 0; k < count; k++) {
    const idx = first + k;
    const n = fract(Math.sin(idx * 127.1 + 13.7) * 43758.5453);
    let h = minH + (maxH - minH) * n;
    const w = step * (0.55 + 0.35 * fract(Math.sin(idx * 311.7) * 12543.21));
    const x = idx * step - rem;
    if (ruinLine && x + w < ruinLine) {
      h = Math.max(h * 0.4, 16);
      ctx.fillStyle = color;
      ctx.fillRect(x, baseY - h, w, h);
      ctx.strokeStyle = 'rgba(60,20,10,.55)';
      ctx.lineWidth = 1.5;
      const broken = fract(Math.sin(idx * 71.13 + 5.9) * 6181.6) > 0.4;
      for (let i = 0; i < 2 && broken; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 3, baseY - 6);
        ctx.lineTo(x + 7, baseY + 4);
        ctx.stroke();
      }
      continue;
    }
    ctx.fillStyle = color;
    ctx.fillRect(x, baseY - h, w, h);

    if (winColor) {
      const rows = Math.floor(h / 34);
      for (let rw = 1; rw < rows; rw++) {
        if (fract(Math.sin(idx * 53 + rw * 17) * 3121.7) > 0.76) {
          ctx.fillStyle = winColor;
          ctx.fillRect(x + w * 0.22, baseY - h + rw * 30, 3, 5);
          ctx.fillRect(x + w * 0.55, baseY - h + rw * 30, 3, 5);
        }
      }
    }
  }
}

function drawObstacles(ctx) {
  for (const o of A.obstacles) {
    if (o.type === 'crate') {
      ctx.fillStyle = '#3a2418';
      ctx.fillRect(o.x, A.ground - o.h, o.w, o.h);
      ctx.strokeStyle = 'rgba(220,160,90,.25)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(o.x + 1.5, A.ground - o.h + 1.5, o.w - 3, o.h - 3);
      ctx.beginPath();
      ctx.moveTo(o.x + 4, A.ground - o.h + 4);
      ctx.lineTo(o.x + o.w - 4, A.ground - 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(o.x + o.w - 4, A.ground - o.h + 4);
      ctx.lineTo(o.x + 4, A.ground - 4);
      ctx.stroke();
    } else if (o.type === 'beam') {
      const top = A.ground - 168;
      const bot = A.ground - 58;
      ctx.strokeStyle = 'rgba(180,170,160,.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(o.x + 8, -10);
      ctx.lineTo(o.x + 8, top);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(o.x + o.w - 8, -10);
      ctx.lineTo(o.x + o.w - 8, top);
      ctx.stroke();
      const g = ctx.createLinearGradient(o.x, top, o.x, bot);
      g.addColorStop(0, '#2a2626');
      g.addColorStop(1, '#171314');
      ctx.fillStyle = g;
      ctx.fillRect(o.x, top, o.w, bot - top);
      ctx.fillStyle = 'rgba(220,70,40,.62)';
      for (let i = 0; i < 3; i++) ctx.fillRect(o.x + 8, top + 20 + i * 24, o.w - 16, 4);
    } else {
      const cx = o.x + o.w / 2;
      const tt = A.t * 10;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const fg = ctx.createRadialGradient(cx, A.ground - 16, 2, cx, A.ground - 16, 46);
      fg.addColorStop(0, 'rgba(255,190,90,.75)');
      fg.addColorStop(1, 'rgba(255,70,20,0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(cx, A.ground - 16, 46, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,120,40,.9)';
      for (let i = 0; i < 3; i++) {
        const h = 26 + Math.sin(tt + i * 2) * 10;
        ctx.beginPath();
        ctx.moveTo(o.x + 9 + i * 14, A.ground);
        ctx.quadraticCurveTo(o.x + 4 + i * 14, A.ground - h * 0.5, o.x + 13 + i * 14, A.ground - h);
        ctx.quadraticCurveTo(o.x + 22 + i * 14, A.ground - h * 0.5, o.x + 17 + i * 14, A.ground);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

function drawRunner(ctx, x, gy, p) {
  const sliding = p.slide > 0 && p.h < 6;
  const h = sliding ? 42 : 82;
  const feet = gy - p.h;

  ctx.save();
  ctx.translate(x, feet);

  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.beginPath();
  ctx.ellipse(0, p.h + 4, 24, 6, 0, 0, TAU);
  ctx.fill();

  ctx.scale(1.22, 1.22);

  if (p.inv > 0 && Math.floor(A.t * 14) % 2 === 0) ctx.globalAlpha = 0.35;

  const bodyColor = '#eadfc6';

  if (sliding) {
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, -20, 26, 14, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(20, -28, 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a1b16';
    ctx.beginPath();
    ctx.arc(20, -30, 8, Math.PI, TAU);
    ctx.fill();
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, -14);
    ctx.lineTo(-26, -8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.lineTo(-24, -4);
    ctx.stroke();
  } else {
    const swing = Math.sin(p.phase);
    const airborne = p.h > 0.5;

    /* back arm */
    ctx.strokeStyle = '#c6b99f';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-2, -63);
    ctx.lineTo(-3 - swing * 9, -49);
    ctx.stroke();

    /* back leg */
    ctx.strokeStyle = '#241c24';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(swing * 9, airborne ? -17 : -14);
    ctx.lineTo(swing * 13, airborne ? -9 : 0);
    ctx.stroke();

    /* coat tail */
    ctx.fillStyle = '#cfc2a8';
    ctx.beginPath();
    ctx.moveTo(-4, -62);
    ctx.quadraticCurveTo(-26, -52 + swing * 3, -31, -34);
    ctx.lineTo(-13, -29);
    ctx.lineTo(2, -46);
    ctx.closePath();
    ctx.fill();

    /* torso */
    ctx.fillStyle = '#e9dfc7';
    ctx.beginPath();
    ctx.moveTo(-9, -66);
    ctx.lineTo(8, -68);
    ctx.lineTo(13, -34);
    ctx.lineTo(-8, -32);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#7a5b35';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, -36);
    ctx.lineTo(12, -38);
    ctx.stroke();

    /* front leg */
    ctx.strokeStyle = '#2b222c';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(1, -32);
    ctx.lineTo(-swing * 9, airborne ? -18 : -13);
    ctx.lineTo(-swing * 13, airborne ? -10 : 0);
    ctx.stroke();

    /* front arm */
    ctx.strokeStyle = '#f0e6cf';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(6, -64);
    ctx.lineTo(13 + swing * 8, -50);
    ctx.lineTo(10 + swing * 10, -40);
    ctx.stroke();

    /* scarf */
    ctx.fillStyle = 'rgba(170,40,35,.95)';
    ctx.beginPath();
    ctx.moveTo(-2, -72);
    ctx.quadraticCurveTo(-28, -74 + Math.sin(A.t * 8) * 6, -42, -62 + Math.sin(A.t * 9) * 7);
    ctx.lineTo(-30, -54);
    ctx.quadraticCurveTo(-20, -62, -4, -64);
    ctx.closePath();
    ctx.fill();

    /* head */
    ctx.fillStyle = '#e3c6a2';
    ctx.beginPath();
    ctx.arc(8, -76, 8.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#241610';
    ctx.beginPath();
    ctx.arc(8, -78, 8.7, Math.PI * 0.85, Math.PI * 2.05);
    ctx.fill();

    /* rim */
    ctx.strokeStyle = 'rgba(255,235,190,.4)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-9, -64);
    ctx.lineTo(-8, -33);
    ctx.stroke();
  }

  ctx.restore();
}

function drawDemon(ctx, x, gy, s) {
  const t = A.t;
  const sway = Math.sin(t * 1.4) * 4;
  ctx.save();
  ctx.translate(x + sway, gy);
  ctx.scale(s, s);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const sg = ctx.createRadialGradient(0, -110, 20, 0, -110, 175);
  sg.addColorStop(0, 'rgba(140,15,10,.24)');
  sg.addColorStop(1, 'rgba(120,0,0,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(-210, -310, 420, 330);
  ctx.restore();

  ctx.fillStyle = '#0b0507';
  ctx.beginPath();
  ctx.moveTo(-52, 0);
  ctx.quadraticCurveTo(-78, -40, -44, -108);
  ctx.quadraticCurveTo(-32, -152, -6, -160);
  ctx.quadraticCurveTo(-4, -172, 6, -172);
  ctx.quadraticCurveTo(34, -164, 44, -110);
  ctx.quadraticCurveTo(76, -48, 50, 0);
  ctx.closePath();
  ctx.fill();

  const rg = ctx.createLinearGradient(-60, -180, 60, 0);
  rg.addColorStop(0, 'rgba(210,60,40,0)');
  rg.addColorStop(1, 'rgba(190,40,25,.42)');
  ctx.strokeStyle = rg;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-30, -150);
  ctx.quadraticCurveTo(-82, -196, -92, -236);
  ctx.quadraticCurveTo(-60, -208, -14, -172);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(30, -150);
  ctx.quadraticCurveTo(82, -196, 92, -236);
  ctx.quadraticCurveTo(60, -208, 14, -172);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.shadowColor = '#ff2f10';
  ctx.shadowBlur = 22;
  ctx.fillStyle = '#ff7a45';
  ctx.beginPath();
  ctx.ellipse(-17, -150, 6.5, 3.5, -0.12, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(17, -150, 6.5, 3.5, 0.12, 0, TAU);
  ctx.fill();
  ctx.restore();

  /* gaping maw */
  ctx.fillStyle = '#180507';
  ctx.beginPath();
  ctx.ellipse(0, -131, 27, 15, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(120,20,14,.55)';
  ctx.beginPath();
  ctx.ellipse(0, -128, 19, 9, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#d9c1a0';
  for (let i = -2; i <= 2; i++) {
    const tx = i * 10;
    ctx.beginPath();
    ctx.moveTo(tx - 3.5, -143);
    ctx.lineTo(tx, -135);
    ctx.lineTo(tx + 3.5, -143);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#c1a684';
  for (let i = -1; i <= 1; i++) {
    const tx = i * 12;
    ctx.beginPath();
    ctx.moveTo(tx - 3, -123);
    ctx.lineTo(tx, -116);
    ctx.lineTo(tx + 3, -123);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(180,40,25,.35)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, -131, 27, 15, 0, 0, TAU);
  ctx.stroke();

  ctx.strokeStyle = '#0b0507';
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-44, -104);
  ctx.quadraticCurveTo(-100, -96, -120, -64);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(44, -106);
  ctx.quadraticCurveTo(104, -92, 122, -50);
  ctx.stroke();

  ctx.strokeStyle = '#1c0a0b';
  ctx.lineWidth = 4;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-120, -64);
    ctx.lineTo(-136 + i * 10, -42);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(122, -50);
    ctx.lineTo(138 + i * 10, -28);
    ctx.stroke();
  }

  ctx.restore();
}

function drawInsults(ctx) {
  for (const ins of A.insults) {
    const k = ins.age / ins.life;
    let a = Math.min(1, ins.age * 5);
    if (k > 0.7) a *= 1 - (k - 0.7) / 0.3;
    const y = ins.y - ins.age * 26;
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.font = '600 21px "Cormorant Garamond", Georgia, serif';
    const w = Math.min(ctx.measureText(ins.text).width + 32, A.W - 24);
    const x = clamp(ins.x - w / 2, 12, A.W - w - 12);
    ctx.fillStyle = 'rgba(12,4,6,.86)';
    ctx.strokeStyle = 'rgba(210,60,40,.65)';
    ctx.lineWidth = 1;
    roundRect(ctx, x, y - 35, w, 46, 9);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5 - 10, y + 10);
    ctx.lineTo(x + w * 0.5, y + 22);
    ctx.lineTo(x + w * 0.5 + 10, y + 10);
    ctx.fill();
    ctx.fillStyle = '#ff8a68';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ins.text, x + w / 2, y - 12, w - 24);
    ctx.restore();
  }
}
