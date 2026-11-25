/* ============================================================
   ДВЕ ДОРОГИ — ядро: утилиты, звук, экраны, навигация
   ============================================================ */
'use strict';

/* ---------------- utils ---------------- */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rnd = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
const fract = (x) => x - Math.floor(x);
const TOTAL_LEVELS = 7;

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ---------------- audio ---------------- */
let AC = null;
let muted = false;
try { muted = localStorage.getItem('dr_muted') === '1'; } catch (e) { }

function audio() {
  if (!AC) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (C) { try { AC = new C(); } catch (e) { } }
  }
  if (AC && AC.state === 'suspended') { try { AC.resume(); } catch (e) { } }
  return AC;
}

function tone(freq, dur, type, vol, to) {
  if (muted) return;
  const c = audio();
  if (!c) return;
  const t0 = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || 0.08, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.03);
}

function noise(dur, vol, freq) {
  if (muted) return;
  const c = audio();
  if (!c) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq || 900;
  const g = c.createGain();
  g.gain.value = vol || 0.15;
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start();
}

function chord(freqs, dur, vol) {
  freqs.forEach((f, i) => setTimeout(() => tone(f, dur, 'sine', vol || 0.06), i * 100));
}

/* mute */
const muteBtn = $('#mute');
function syncMute() {
  if (!muteBtn) return;
  muteBtn.classList.toggle('off', muted);
  muteBtn.title = muted ? T('mute_on') : T('mute_off');
  try { localStorage.setItem('dr_muted', muted ? '1' : '0'); } catch (e) { }
}
syncMute();
if (muteBtn) {
  muteBtn.addEventListener('click', () => {
    muted = !muted;
    syncMute();
    if (!muted) tone(660, 0.1, 'sine', 0.07);
  });
}

/* ---------------- screens ---------------- */
let current = 's-landing';
let revealTimers = [];

function clearReveals() {
  revealTimers.forEach(clearTimeout);
  revealTimers = [];
}

function revealScreen(id) {
  const root = document.getElementById(id);
  if (!root) return;
  root.querySelectorAll('.reveal').forEach((el) => el.classList.remove('on'));
  root.querySelectorAll('.reveal').forEach((el) => {
    const d = parseInt(el.dataset.d || '0', 10);
    revealTimers.push(setTimeout(() => el.classList.add('on'), 250 + d));
  });
}

function voidSequence() {
  const q = $('#voidQ');
  const r = $('#voidReset');
  if (!q || !r) return;
  q.textContent = T('void_q');
  r.textContent = T('void_reset');
  q.classList.remove('on');
  r.classList.remove('on');
  revealTimers.push(setTimeout(() => q.classList.add('on'), 1600));
  revealTimers.push(setTimeout(() => r.classList.add('on'), 12000));
}

function setScreen(id) {
  if (id !== 's-light') lightStop();
  if (id !== 's-abyss') abyssStop();
  clearReveals();
  TALL();
  $$('.screen').forEach((s) => s.classList.toggle('show', s.id === id));
  current = id;
  document.body.classList.toggle('is-void', id === 's-void');
  if (id === 's-void') voidSequence();
  if (id === 's-grace' || id === 's-light-end') revealScreen(id);
}

function goHome() {
  setScreen('s-landing');
}

/* ---------------- global actions ---------------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  audio();
  const act = el.dataset.act;
  if (act === 'light') {
    setScreen('s-light-intro');
  } else if (act === 'abyss') {
    setScreen('s-abyss-intro');
  } else if (act === 'home' || act === 'restart') {
    goHome();
  } else if (act === 'startLight') {
    startLight(1);
  } else if (act === 'startAbyss') {
    startAbyss();
  } else if (act === 'kill') {
    setScreen('s-void');
    tone(45, 3, 'sine', 0.05, 25);
  } else if (act === 'spare') {
    setScreen('s-grace');
    chord([392, 523, 659, 784], 1.8, 0.05);
  }
});
