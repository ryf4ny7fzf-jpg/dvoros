/* ============================================================
   ЗАПУСК — управление, ввод, адаптивность
   ============================================================ */
'use strict';

/* ---------- цензура ---------- */
const censorBox = $('#censor');
if (censorBox) {
  censored = censorBox.checked;
  censorBox.addEventListener('change', () => {
    censored = censorBox.checked;
  });
}

/* ---------- клавиатура ---------- */
document.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();

  if (e.key === 'Escape') {
    if (current === 's-light' || current === 's-abyss') goHome();
    return;
  }

  if (k === 'arrowup' || k === 'arrowdown' || k === 'arrowleft' || k === 'arrowright' || k === ' ') {
    e.preventDefault();
  }

  if (current === 's-abyss' && !e.repeat) {
    if (k === 'arrowup' || k === ' ' || k === 'w') abyssJump();
    if (k === 'arrowdown' || k === 's') abyssSlide();
  }

  if (current === 's-light') keys.add(k);
});

document.addEventListener('keyup', (e) => {
  keys.delete(e.key.toLowerCase());
});

window.addEventListener('blur', () => keys.clear());

/* ---------- мышь / палец: арена ---------- */
function setLightPointer(e) {
  const r = lightCanvas.getBoundingClientRect();
  L.pointer.x = e.clientX - r.left;
  L.pointer.y = e.clientY - r.top;
}

if (lightCanvas) {
  lightCanvas.addEventListener('pointerdown', (e) => {
    if (current !== 's-light' || L.state !== 'play') return;
    L.pointer.on = true;
    setLightPointer(e);
    try { lightCanvas.setPointerCapture(e.pointerId); } catch (err) { }
  });

  lightCanvas.addEventListener('pointermove', (e) => {
    if (L.pointer.on) setLightPointer(e);
  });

  ['pointerup', 'pointercancel'].forEach((ev) => {
    lightCanvas.addEventListener(ev, () => { L.pointer.on = false; });
  });
}

/* ---------- мышь / палец: бег ---------- */
if (abyssCanvas) {
  abyssCanvas.addEventListener('pointerdown', (e) => {
    if (current !== 's-abyss') return;
    e.preventDefault();
    abyssJump();
  });
}

const btnJump = $('#btnJump');
const btnSlide = $('#btnSlide');
if (btnJump) {
  btnJump.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    abyssJump();
  });
}
if (btnSlide) {
  btnSlide.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    abyssSlide();
  });
}

/* ---------- resize ---------- */
window.addEventListener('resize', () => {
  if (current === 's-light') sizeLight();
  if (current === 's-abyss') sizeAbyss();
});
