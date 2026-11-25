/* ============================================================
   ПУТЬ СВЕТА — арена: догони хранителя, собери крест
   ============================================================ */
'use strict';

const lightCanvas = $('#lightCanvas');
const lightCtx = lightCanvas ? lightCanvas.getContext('2d') : null;

const L = {
  W: 0, H: 0, dpr: 1,
  raf: 0, running: false, state: 'idle',
  level: 1, frag: 0, total: 7, time: 0, maxTime: 52,
  t: 0, shake: 0, hitFlash: 0,
  wonT: 0, lostT: 0, panelShown: false,
  last: 0, hudAcc: 0,
  player: { x: 0, y: 0, inv: 0 },
  robot: { x: 0, y: 0, cd: 0, dash: 0 },
  monsters: [], pieces: [], parts: [], motes: [],
  pointer: { on: false, x: 0, y: 0 }
};

/* ---------------- sizing ---------------- */
function sizeLight() {
  if (!lightCanvas) return;
  const r = lightCanvas.getBoundingClientRect();
  L.dpr = Math.min(2, window.devicePixelRatio || 1);
  L.W = Math.max(300, r.width || window.innerWidth);
  L.H = Math.max(300, r.height || window.innerHeight);
  lightCanvas.width = Math.round(L.W * L.dpr);
  lightCanvas.height = Math.round(L.H * L.dpr);
  lightCtx.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
  if (!L.motes.length) {
    for (let i = 0; i < 62; i++) {
      L.motes.push({
        x: Math.random() * L.W,
        y: Math.random() * L.H,
        r: rnd(0.6, 2.1),
        s: rnd(5, 18),
        a: rnd(0.08, 0.4),
        ph: rnd(0, TAU)
      });
    }
  }
}

/* ---------------- lifecycle ---------------- */
function startLight(level) {
  audio();
  setScreen('s-light');
  requestAnimationFrame(() => {
    if (current !== 's-light') return;
    sizeLight();
    initLight(level);
    if (!L.running) {
      L.running = true;
      L.last = performance.now();
      L.raf = requestAnimationFrame(lightLoop);
    }
  });
}

function lightStop() {
  L.running = false;
  if (L.raf) cancelAnimationFrame(L.raf);
  L.raf = 0;
  L.state = 'idle';
  const panel = $('#lightResult');
  if (panel) panel.classList.remove('show');
}

function initLight(level) {
  L.level = level;
  L.frag = 0;
  L.time = Math.max(30, 52 - (level - 1) * 3);
  L.maxTime = L.time;
  L.t = 0;
  L.shake = 0;
  L.hitFlash = 0;
  L.wonT = 0;
  L.lostT = 0;
  L.panelShown = false;
  L.hudAcc = 1;
  L.player = { x: L.W * 0.5, y: L.H * 0.68, inv: 0 };
  L.robot = { x: L.W * 0.5, y: L.H * 0.3, cd: 1.2, dash: 0 };
  L.monsters = [];
  L.pieces = [];
  L.parts = [];
  const n = clamp(level - 1, 0, 6);
  for (let i = 0; i < n; i++) spawnMonster();
  L.state = 'play';
  L.pointer.on = false;
  buildDots();
  updateLightHUD();
  const panel = $('#lightResult');
  if (panel) panel.classList.remove('show');
}

/* ---------------- HUD ---------------- */
function buildDots() {
  const box = $('#lightDots');
  if (!box) return;
  box.innerHTML = '';
  for (let i = 0; i < L.total; i++) {
    const s = document.createElement('span');
    box.appendChild(s);
  }
}

function updateLightHUD() {
  const lvl = $('#lightLevel');
  const time = $('#lightTime');
  const bar = $('#lightTimeBar');
  if (lvl) lvl.textContent = L.level;
  if (time) time.textContent = Math.ceil(L.time);
  if (bar) {
    const ratio = clamp(L.time / (L.maxTime || 1), 0, 1);
    bar.style.width = (ratio * 100).toFixed(1) + '%';
    const tb = bar.parentElement;
    if (tb) tb.classList.toggle('low', ratio < 0.28);
  }
  const dots = $('#lightDots');
  if (dots) {
    Array.from(dots.children).forEach((d, i) => d.classList.toggle('on', i < L.frag));
  }
}

/* ---------------- entities ---------------- */
function spawnMonster() {
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if (edge === 0) { x = rnd(44, L.W - 44); y = -34; }
  else if (edge === 1) { x = L.W + 34; y = rnd(78, L.H - 34); }
  else if (edge === 2) { x = rnd(44, L.W - 44); y = L.H + 34; }
  else { x = -34; y = rnd(78, L.H - 34); }
  L.monsters.push({ x, y, ph: rnd(0, TAU), sp: rnd(0.9, 1.15) });
}

function burst(x, y, n, color, spd) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, TAU);
    const s = rnd((spd || 180) * 0.25, spd || 180);
    L.parts.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: rnd(0.35, 0.95),
      t: 0,
      c: color || '#f4d78a',
      r: rnd(1.2, 3.1)
    });
  }
}

function winLight() {
  if (L.state !== 'play') return;
  L.state = 'won';
  L.wonT = 0;
  L.panelShown = false;
  [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 1.1, 'sine', 0.07), i * 120));
  L.shake = 6;
}

function loseLight() {
  if (L.state !== 'play') return;
  L.state = 'lost';
  L.lostT = 0;
  L.panelShown = false;
  L.time = 0;
  tone(170, 0.7, 'sine', 0.1, 65);
  updateLightHUD();
}

/* ---------------- loop ---------------- */
function lightLoop(ts) {
  if (!L.running) return;
  const dt = Math.min(0.05, Math.max(0, (ts - L.last) / 1000));
  L.last = ts;
  updateLight(dt);
  drawLight();
  if (L.running) L.raf = requestAnimationFrame(lightLoop);
  else L.raf = 0;
}

function updateLight(dt) {
  L.t += dt;
  L.shake *= Math.pow(0.015, dt);
  L.hitFlash = Math.max(0, L.hitFlash - dt * 1.8);
  if (L.shake < 0.2) L.shake = 0;

  for (const m of L.motes) {
    m.y -= m.s * dt;
    m.x += Math.sin(L.t * 0.7 + m.ph) * 8 * dt;
    if (m.y < -12) { m.y = L.H + 12; m.x = Math.random() * L.W; }
    if (m.x < -12) m.x = L.W + 12;
    if (m.x > L.W + 12) m.x = -12;
  }

  for (const p of L.parts) {
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const damp = Math.pow(0.1, dt);
    p.vx *= damp;
    p.vy = p.vy * damp + 120 * dt;
  }
  L.parts = L.parts.filter((p) => p.t < p.life);

  if (L.state === 'won') {
    L.wonT += dt;
    if (L.wonT > 1.15 && !L.panelShown) {
      L.panelShown = true;
      showLightResult(true);
    }
    return;
  }
  if (L.state === 'lost') {
    L.lostT += dt;
    if (L.lostT > 0.9 && !L.panelShown) {
      L.panelShown = true;
      showLightResult(false);
    }
    return;
  }
  if (L.state !== 'play') return;

  /* timer */
  L.time -= dt;
  if (L.time <= 0) {
    L.time = 0;
    loseLight();
    updateLightHUD();
    return;
  }

  /* player */
  const p = L.player;
  p.inv = Math.max(0, p.inv - dt);
  let ax = 0;
  let ay = 0;
  if (keys.has('a') || keys.has('arrowleft')) ax -= 1;
  if (keys.has('d') || keys.has('arrowright')) ax += 1;
  if (keys.has('w') || keys.has('arrowup')) ay -= 1;
  if (keys.has('s') || keys.has('arrowdown')) ay += 1;
  if (L.pointer.on) {
    const pdx = L.pointer.x - p.x;
    const pdy = L.pointer.y - p.y;
    const pd = Math.hypot(pdx, pdy);
    if (pd > 10) { ax = pdx / pd; ay = pdy / pd; }
  }
  if (ax || ay) {
    const len = Math.hypot(ax, ay) || 1;
    ax /= len; ay /= len;
  }
  const spd = 274;
  p.x = clamp(p.x + ax * spd * dt, 28, L.W - 28);
  p.y = clamp(p.y + ay * spd * dt, 86, L.H - 30);

  /* robot */
  const r = L.robot;
  r.cd = Math.max(0, r.cd - dt);
  r.dash = Math.max(0, r.dash - dt);
  const dx = r.x - p.x;
  const dy = r.y - p.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const swirl = 0.72 * Math.sin(L.t * 1.15 + L.level * 0.9);
  let vx = ux + -uy * swirl;
  let vy = uy + ux * swirl;
  const margin = Math.min(130, L.W * 0.18);
  if (r.x < margin) vx += (margin - r.x) / margin * 1.8;
  if (r.x > L.W - margin) vx -= (r.x - (L.W - margin)) / margin * 1.8;
  if (r.y < margin + 50) vy += (margin + 50 - r.y) / margin * 1.8;
  if (r.y > L.H - margin) vy -= (r.y - (L.H - margin)) / margin * 1.8;
  const vl = Math.hypot(vx, vy) || 1;
  const rsp = (115 + L.level * 9) * (r.dash > 0 ? 2.9 : 1);
  r.x += (vx / vl) * rsp * dt;
  r.y += (vy / vl) * rsp * dt;
  r.x = clamp(r.x, 44, L.W - 44);
  r.y = clamp(r.y, 100, L.H - 40);

  /* catch robot */
  if (d < 42 && r.cd <= 0 && L.frag < L.total) {
    r.cd = 1.15;
    r.dash = 0.32;
    const a = Math.atan2(uy, ux);
    L.pieces.push({
      x: r.x, y: r.y,
      vx: Math.cos(a) * 170 + rnd(-55, 55),
      vy: Math.sin(a) * 170 + rnd(-55, 55),
      t: 0, dead: false
    });
    burst(r.x, r.y - 10, 16, '#f2d79a', 220);
    tone(720, 0.12, 'triangle', 0.09, 980);
    L.shake = Math.max(L.shake, 5);
  }

  /* pieces */
  for (const pc of L.pieces) {
    pc.t += dt;
    if (pc.vx || pc.vy) {
      pc.x += pc.vx * dt;
      pc.y += pc.vy * dt;
      const f = Math.pow(0.02, dt);
      pc.vx *= f;
      pc.vy *= f;
      pc.x = clamp(pc.x, 22, L.W - 22);
      pc.y = clamp(pc.y, 94, L.H - 24);
      if (Math.hypot(pc.vx, pc.vy) < 6) { pc.vx = 0; pc.vy = 0; }
    }
    if (pc.t > 0.25) {
      const ddx = p.x - pc.x;
      const ddy = p.y - pc.y;
      const dd = Math.hypot(ddx, ddy) || 1;
      if (dd < 76) {
        pc.x += (ddx / dd) * 170 * dt;
        pc.y += (ddy / dd) * 170 * dt;
      }
      if (dd < 27) {
        pc.dead = true;
        L.frag++;
        burst(pc.x, pc.y - 6, 14, '#ffe6ac', 200);
        tone(880, 0.1, 'sine', 0.08, 1200);
        updateLightHUD();
        if (L.frag >= L.total) winLight();
      }
    }
  }
  L.pieces = L.pieces.filter((pc) => !pc.dead);

  /* monsters */
  for (const m of L.monsters) {
    m.ph += dt * 3;
    const mdx = p.x - m.x;
    const mdy = p.y - m.y;
    const md = Math.hypot(mdx, mdy) || 1;
    const msp = (50 + L.level * 10) * m.sp;
    m.x += (mdx / md) * msp * dt;
    m.y += (mdy / md) * msp * dt;
    if (md < 30 && p.inv <= 0 && L.state === 'play') {
      p.inv = 1.6;
      L.time = Math.max(0, L.time - 6);
      L.shake = 16;
      L.hitFlash = 1;
      noise(0.32, 0.18, 700);
      tone(95, 0.3, 'sawtooth', 0.12, 48);
      m.x -= (mdx / md) * 90;
      m.y -= (mdy / md) * 90;
      burst(p.x, p.y - 24, 12, '#d8503a', 180);
      updateLightHUD();
      if (L.time <= 0) { loseLight(); return; }
    }
  }

  L.hudAcc += dt;
  if (L.hudAcc > 0.1) {
    L.hudAcc = 0;
    updateLightHUD();
  }
}

/* ---------------- result ---------------- */
function showLightResult(win) {
  const panel = $('#lightResult');
  const btn = $('#lrNext');
  if (!panel || !btn) return;
  const kicker = $('#lrKicker');
  const title = $('#lrTitle');
  const text = $('#lrText');

  if (win) {
    kicker.textContent = 'Уровень ' + L.level + ' / ' + TOTAL_LEVELS;
    if (L.level < TOTAL_LEVELS) {
      title.textContent = 'Крест собран';
      text.textContent = 'Семь осколков соединились. Следующий круг — быстрее и темнее.';
      btn.textContent = 'Следующий уровень';
      btn.onclick = () => {
        panel.classList.remove('show');
        startLight(L.level + 1);
      };
    } else {
      title.textContent = 'Путь света пройден';
      text.textContent = 'Семь кругов позади. Крест цел, и свет больше не гаснет.';
      btn.textContent = 'К свету';
      btn.onclick = () => {
        panel.classList.remove('show');
        setScreen('s-light-end');
      };
    }
  } else {
    kicker.textContent = 'Уровень ' + L.level + ' / ' + TOTAL_LEVELS;
    title.textContent = 'Время вышло';
    text.textContent = 'Осколки рассыпались. Тьма сгустилась чуть сильнее — но круг можно пройти снова.';
    btn.textContent = 'Ещё раз';
    btn.onclick = () => {
      panel.classList.remove('show');
      startLight(L.level);
    };
  }
  panel.classList.add('show');
  tone(win ? 880 : 180, win ? 0.5 : 0.6, 'sine', 0.08, win ? 1200 : 70);
}

/* ---------------- render ---------------- */
function drawLight() {
  if (!lightCtx) return;
  const ctx = lightCtx;
  const W = L.W;
  const H = L.H;

  ctx.save();
  if (L.shake > 0.3) ctx.translate(rnd(-L.shake, L.shake), rnd(-L.shake, L.shake));

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0d0b14');
  bg.addColorStop(0.55, '#08070d');
  bg.addColorStop(1, '#040407');
  ctx.fillStyle = bg;
  ctx.fillRect(-40, -40, W + 80, H + 80);

  /* god rays */
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const sway = Math.sin(L.t * 0.12 + i * 1.7) * W * 0.05;
    const x = W * 0.5 + sway + (i - 2) * W * 0.14;
    const g = ctx.createLinearGradient(x, 0, x + (i - 2) * W * 0.1, H * 0.9);
    g.addColorStop(0, 'rgba(255,222,150,.075)');
    g.addColorStop(1, 'rgba(255,222,150,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 26, -20);
    ctx.lineTo(x + 26, -20);
    ctx.lineTo(x + (i - 2) * W * 0.12 + 150, H);
    ctx.lineTo(x + (i - 2) * W * 0.12 - 150, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  /* floor */
  const fl = ctx.createRadialGradient(W * 0.5, H * 0.62, 20, W * 0.5, H * 0.62, H * 0.6);
  fl.addColorStop(0, 'rgba(230,194,122,.11)');
  fl.addColorStop(1, 'rgba(230,194,122,0)');
  ctx.fillStyle = fl;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(W * 0.5, H * 0.8);
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.ellipse(0, 0, W * 0.15 * i, H * 0.04 * i, 0, 0, TAU);
    ctx.strokeStyle = 'rgba(230,194,122,' + (0.1 - i * 0.015) + ')';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();

  /* motes */
  for (const m of L.motes) {
    ctx.globalAlpha = m.a * (0.6 + 0.4 * Math.sin(L.t * 2 + m.ph));
    ctx.fillStyle = '#f4d794';
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  /* pieces */
  for (const pc of L.pieces) drawPiece(ctx, pc);

  /* monsters */
  for (const m of L.monsters) drawMonster(ctx, m);

  /* robot */
  if (L.state === 'play' || L.state === 'won') drawRobot(ctx, L.robot.x, L.robot.y);

  /* player */
  const blink = L.player.inv > 0 && Math.floor(L.t * 14) % 2 === 0;
  drawHoly(ctx, L.player.x, L.player.y, blink);

  /* particles */
  for (const p of L.parts) {
    const a = 1 - p.t / p.life;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.4, p.r * a), 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (L.state === 'won') drawCross(ctx, W, H);

  ctx.restore();

  if (L.hitFlash > 0) {
    const hf = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.2, W * 0.5, H * 0.5, H * 0.78);
    hf.addColorStop(0, 'rgba(120,10,10,0)');
    hf.addColorStop(1, 'rgba(140,12,10,' + (L.hitFlash * 0.5) + ')');
    ctx.fillStyle = hf;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawHoly(ctx, x, y, blink) {
  if (blink) return;
  ctx.save();
  const bob = Math.sin(L.t * 2.2) * 1.6;
  ctx.translate(x, y + bob);
  ctx.scale(1.22, 1.22);

  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 17, 5.5, 0, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const hg = ctx.createRadialGradient(0, -58, 1, 0, -58, 30);
  hg.addColorStop(0, 'rgba(255,231,170,.5)');
  hg.addColorStop(1, 'rgba(255,231,170,0)');
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(0, -58, 30, 0, TAU);
  ctx.fill();
  ctx.restore();

  const rg = ctx.createLinearGradient(0, -46, 0, 0);
  rg.addColorStop(0, '#fff4d8');
  rg.addColorStop(0.55, '#e2c184');
  rg.addColorStop(1, '#a47a3e');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.moveTo(-9, -45);
  ctx.quadraticCurveTo(-13, -20, -17, 0);
  ctx.lineTo(17, 0);
  ctx.quadraticCurveTo(13, -20, 9, -45);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#f0dcae';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -40);
  ctx.lineTo(-15, -24);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(8, -40);
  ctx.lineTo(15, -26);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(160,45,35,.75)';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-8, -28);
  ctx.quadraticCurveTo(0, -24, 8, -30);
  ctx.stroke();

  ctx.fillStyle = '#e8c8a2';
  ctx.beginPath();
  ctx.arc(0, -50, 7.2, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = '#3a2417';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, -51, 7, Math.PI * 1.02, Math.PI * 1.98);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,232,170,.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, -62, 10, 3.2, 0, 0, TAU);
  ctx.stroke();

  ctx.restore();
}

function drawRobot(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y + Math.sin(L.t * 3) * 1.2);
  ctx.scale(1.18, 1.18);

  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 15, 5, 0, 0, TAU);
  ctx.fill();

  const g = ctx.createLinearGradient(0, -34, 0, 0);
  g.addColorStop(0, '#9aa2ad');
  g.addColorStop(0.5, '#5d6673');
  g.addColorStop(1, '#2c3139');
  ctx.fillStyle = g;
  roundRect(ctx, -12, -30, 24, 28, 7);
  ctx.fill();

  ctx.fillStyle = 'rgba(120,220,220,.16)';
  roundRect(ctx, -7, -24, 14, 10, 3);
  ctx.fill();

  ctx.save();
  ctx.shadowColor = '#7fe7e0';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#9ef4ec';
  ctx.beginPath();
  ctx.arc(0, -26, 2.6, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#7c848f';
  roundRect(ctx, -8, -43, 16, 13, 4);
  ctx.fill();
  ctx.fillStyle = '#0c0e12';
  roundRect(ctx, -5, -39, 10, 5, 2);
  ctx.fill();

  ctx.strokeStyle = '#8f98a4';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -43);
  ctx.lineTo(2, -50);
  ctx.stroke();
  ctx.fillStyle = '#f2c979';
  ctx.beginPath();
  ctx.arc(2, -51, 1.8, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = '#6c7480';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-11, -22);
  ctx.lineTo(-17, -12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(11, -22);
  ctx.lineTo(17, -16);
  ctx.stroke();

  ctx.save();
  ctx.translate(17, -16);
  ctx.rotate(L.t * 2);
  ctx.fillStyle = '#f6de9e';
  ctx.shadowColor = '#f6de9e';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(4, 0);
  ctx.lineTo(0, 6);
  ctx.lineTo(-4, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawMonster(ctx, m) {
  const t = L.t;
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.scale(1.2, 1.2);

  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 15, 4.5, 0, 0, TAU);
  ctx.fill();

  ctx.beginPath();
  const pts = 12;
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * TAU;
    const rr = 15 + Math.sin(t * 4 + i * 1.7 + m.ph) * 3 + (i % 2 ? 2 : -1);
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr * 0.9 - 14;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(0, -16, 2, 0, -14, 22);
  g.addColorStop(0, 'rgba(62,26,66,.98)');
  g.addColorStop(1, 'rgba(12,6,16,.94)');
  ctx.fillStyle = g;
  ctx.fill();

  ctx.save();
  ctx.shadowColor = '#ff3a2a';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#ff6a4a';
  const wob = Math.sin(t * 3 + m.ph) * 1.2;
  ctx.beginPath();
  ctx.arc(-5 + wob, -18, 2.2, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(5 + wob, -18, 2.2, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(44,18,52,.9)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 8, -2);
    ctx.quadraticCurveTo(i * 10 + Math.sin(t * 3 + i) * 4, 6, i * 8 + Math.sin(t * 2 + i) * 6, 12);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPiece(ctx, pc) {
  const bob = Math.sin(L.t * 3 + pc.x * 0.05) * 3;
  ctx.save();
  ctx.translate(pc.x, pc.y - 12 + bob);
  ctx.rotate(L.t * 1.1);
  ctx.shadowColor = 'rgba(255,220,150,.9)';
  ctx.shadowBlur = 18;
  const g = ctx.createLinearGradient(-8, -12, 8, 12);
  g.addColorStop(0, '#fff3cf');
  g.addColorStop(0.5, '#e8c479');
  g.addColorStop(1, '#a87c34');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(7, -1);
  ctx.lineTo(2, 11);
  ctx.lineTo(-7, 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.35;
  const gg = ctx.createRadialGradient(pc.x, pc.y, 0, pc.x, pc.y, 30);
  gg.addColorStop(0, 'rgba(255,220,150,.5)');
  gg.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = gg;
  ctx.beginPath();
  ctx.arc(pc.x, pc.y, 30, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawCross(ctx, W, H) {
  const k = clamp(L.wonT / 0.9, 0, 1);
  const e = 1 - Math.pow(1 - k, 3);
  ctx.save();
  ctx.fillStyle = 'rgba(4,4,8,' + (0.44 * e) + ')';
  ctx.fillRect(0, 0, W, H);

  ctx.translate(W * 0.5, H * 0.44);
  ctx.scale(0.6 + 0.4 * e, Math.max(0.01, e));
  ctx.shadowColor = 'rgba(255,220,150,.85)';
  ctx.shadowBlur = 50 + 20 * Math.sin(L.t * 3);
  const g = ctx.createLinearGradient(0, -130, 0, 130);
  g.addColorStop(0, '#fff6da');
  g.addColorStop(0.5, '#efce8c');
  g.addColorStop(1, '#a97c3c');
  ctx.fillStyle = g;
  ctx.fillRect(-13, -130, 26, 260);
  ctx.fillRect(-78, -64, 156, 26);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.26 * e;
  const rg = ctx.createRadialGradient(W * 0.5, H * 0.44, 0, W * 0.5, H * 0.44, H * 0.55);
  rg.addColorStop(0, 'rgba(255,232,170,.8)');
  rg.addColorStop(1, 'rgba(255,232,170,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
