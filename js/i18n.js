/* ============================================================
   ЯЗЫК — русский / English for people who come from the USA etc.
   ============================================================ */
'use strict';

const RU = /^ru\b/i.test(String(navigator.language || '').toLowerCase());
const LANG = RU ? 'ru' : 'en';

const TEX = {
  landing_kicker: RU ? 'Интерактивная притча' : 'Interactive parable',
  landing_h1: RU ? 'Две дороги' : 'Two Roads',
  landing_lead: RU ? 'Он стоит перед тобой и протягивает руку.<br/>Выбор — только твой.' :
    'He stands before you and reaches out.<br/>The choice is yours alone.',
  landing_light: RU ? 'Пойти с Ним' : 'Follow Him',
  landing_abyss: RU ? 'Своим путём' : 'On my own path',
  landing_meta: RU ? '2 пути · 2 финала · ≈ 4 минуты' : '2 paths · 2 endings · ≈ 4 minutes',
  landing_quote: '«Я есмь путь и истина и жизнь»',
  landing_quote_verse: 'Ин. 14:6',

  light_intro_kicker: RU ? 'Путь первый' : 'First path',
  light_intro_h2: 'Свет',
  light_intro_lead: RU ? 'Хранитель рассыпал крест на семь осколков и убегает. Догони его, собери осколки и почини крест — пока не истекло время.' :
    'The guardian broke the cross into seven shards and runs away. Chase him, collect the shards and repair the cross — before the time runs out.',
  light_intro_move: RU ? 'Движение — WASD, стрелки или палец по экрану.' :
    'Move — WASD, arrows, or drag the finger on the screen.',
  light_intro_pieces: RU ? 'Осколки — коснись хранителя, чтобы он выронил часть креста.' :
    'Shards — touch the guardian so he drops a piece.',
  light_intro_monsters: RU ? 'Монстры — со второго уровня будут отнимать время.' :
    'Monsters — from level 2 they drain time.',
  light_intro_goal: RU ? 'Цель — пройти семь уровней. Каждый — быстрее и темнее.' :
    'Goal — pass seven levels. Each one is faster and darker.',
  light_intro_rules: [
    [RU ? 'Движение' : 'Move', RU ? 'WASD, стрелки или палец по экрану.' : 'WASD, arrows, or drag the finger on the screen.'],
    [RU ? 'Осколки' : 'Shards', RU ? 'Коснись хранителя, чтобы он выронил часть креста.' :
      'Touch the guardian so he drops a piece of the cross.'],
    [RU ? 'Монстры' : 'Monsters', RU ? 'Со второго уровня будут отнимать время.' :
      'From level 2 they drain the time.'],
    [RU ? 'Цель' : 'Goal', RU ? 'Пройти семь уровней. Каждый — быстрее и темнее.' :
      'Pass seven levels. Each one is faster and darker.'],
  ],
  light_intro_start: RU ? 'Начать путь' : 'Begin the path',
  light_intro_home: RU ? 'Назад' : 'Back',

  light_hud_level: RU ? 'Уровень' : 'Level',
  light_hud_cross: RU ? 'Крест' : 'Cross',
  light_hud_time: RU ? 'Время' : 'Time',
  light_hud_time_sec: RU ? 'сек' : 'sec',
  light_hint: RU ? 'WASD / стрелки · на телефоне — веди пальцем · Esc — выйти' :
    'WASD / arrows · phone — drag your finger · Esc — exit',

  light_result_won: RU ? 'Крест собран' : 'Cross assembled',
  light_result_lost: RU ? 'Время вышло' : 'Out of time',
  light_result_next: RU ? 'Дальше' : 'Next',
  light_result_restart: RU ? 'В начало' : 'To the beginning',
  light_result_won: RU ? 'Крест собран' : 'Cross assembled',
  light_result_lost: RU ? 'Время вышло' : 'Out of time',
  light_result_level_end: RU ? 'Путь света пройден' : 'The path of light is complete',
  light_level: RU ? 'Уровень' : 'Level',
  light_won_text: RU ? 'Семь осколков соединились. Следующий круг — быстрее и темнее.' :
    'Seven shards joined. The next circle is faster and darker.',
  light_won_next: RU ? 'Следующий уровень' : 'Next level',
  light_lost_text: RU ? 'Осколки рассыпались. Тьма сгустилась чуть сильнее — но круг можно пройти снова.' :
    'The shards scattered. The darkness gathers slightly stronger — but the circle can be passed again.',
  light_result_level_end_text: RU ? 'Семь кругов позади. Крест цел — и свет больше не гаснет.' :
    'Seven circles behind you. The cross is whole — and the light no longer goes out.',
  light_result_level_end_btn: RU ? 'К свету' : 'To the light',
  light_end_kicker: RU ? 'Путь света · финал' : 'Path of light · ending',
  light_end_title: RU ? 'Крест цел' : 'The cross is whole',
  light_end_text: RU ? 'Семь кругов позади. Крест цел — и свет больше не гаснет.' :
    'Seven circles behind you. The cross is whole — and the light no longer goes out.',
  light_end_text: RU ? 'Семь кругов позади. Крест цел — и свет больше не гаснет.' :
    'Seven circles behind you. The cross is whole — and the light no longer goes out.',

  abyss_intro_kicker: RU ? 'Путь второй' : 'Second path',
  abyss_intro_h2: 'Своя дорога',
  abyss_intro_lead: RU ? 'Ты выбрал идти один. Позади — демон. Он не отстаёт и говорит то, что ты и сам боялся услышать.' :
    'You chose to walk alone. Behind — a demon. He does not give up and says what you yourself were afraid to hear.',
  abyss_intro_rules: [
    [RU ? 'Беги' : 'Run', RU ? 'прыжок: ↑ / пробел / тап' : 'jump: ↑ / space / tap'],
    [RU ? 'Подкат' : 'Slide', RU ? '↓ / S' : '↓ / S'],
    [RU ? 'Цель' : 'Goal', RU ? '100 000 метров. Только тогда он устанет.' : '100 000 m. Only then will he tire.'],
    [RU ? 'Финал' : 'Ending', RU ? 'У павшего демона будет выбор. Окончательный.' : 'The fallen demon will make a choice. Final.'],
  ],
  abyss_intro_censor: RU ? 'Цензура в речи демона' : 'Censor in the demon’s speech',
  abyss_intro_tiny: RU ? 'Сними галочку, если готов услышать его без фильтра.' :
    'Uncheck if you are ready to hear it without a filter.',
  abyss_intro_start: RU ? 'Бежать' : 'Run',
  abyss_intro_back: RU ? 'Назад' : 'Back',

  abyss_hud_danger: RU ? 'он близко' : 'he is close',
  abyss_hud_goal: RU ? 'цель — 100 000 м' : 'target — 100 000 m',
  abyss_hud_progress: RU ? 'цель — 100 000 м' : 'target — 100 000 m',
  abyss_hud_exit: RU ? 'выйти' : 'exit',
  abyss_intro_jump: RU ? 'Прыжок' : 'Jump',
  abyss_intro_slide: RU ? 'Подкат' : 'Slide',

  choice_kicker: RU ? '100 000 метров' : '100 000 m',
  choice_title: RU ? 'Он больше не бежит' : 'He is no longer running',
  choice_p1: RU ? 'Демон выбился из сил. Он опустился на колени и смотрит на тебя.' :
    'The demon is spent. He lowers to his knees and looks at you.',
  choice_q: RU ? 'Что ты сделаешь?' : 'What will you do?',
  choice_kill: RU ? 'Убить его' : 'Kill him',
  choice_spare: RU ? 'Пощадить' : 'Spare him',
  choice_note: RU ? 'Выбор окончательный.' : 'The choice is final.',

  void_q: RU ? 'Оно того стоило?' : 'Was it worth it?',
  void_reset: RU ? 'начать заново' : 'start again',

  grace_kicker: RU ? 'Своя дорога · финал' : 'On my own path · ending',
  grace_title: RU ? 'Ты не поднял руку' : 'You did not raise your hand',
  grace_p1: RU ? 'Демон остался жив. И мир не исчез — он растворился в свете.' :
    'The demon stayed alive. And the world did not disappear — it dissolved in light.',
  grace_p2: RU ? 'Иисус подошёл, поблагодарил тебя… и поцеловал в лоб.' :
    'Jesus came, thanked you… and kisses you on the forehead.',
  grace_line: RU ? '«Ты выбрал милость. Это и есть путь».' :
    '«You chose grace. That is the path.»',
  grace_proverb: RU ? '«Не убивай врага своего — убив его, ты не убьёшь вражду.»' :
    '«Do not kill your enemy — for when you kill him, you do not kill his hostility.»',
  grace_proverb_ver: RU ? 'древняя мудрость' : 'ancient wisdom',
  grace_btn: RU ? 'Начать заново' : 'Start again',

  caught_kicker: RU ? 'Он догнал тебя' : 'He caught you',
  caught_title: RU ? 'Тьма' : 'Darkness',
  caught_p: RU ? 'Демон не устал. Он просто больше не отпускал.' :
    'The demon is not tired. He just did not let go.',
  caught_btn1: RU ? 'Ещё раз' : 'Again',
  caught_btn2: RU ? 'В начало' : 'To the beginning',
  home_title: RU ? 'Две дороги' : 'Two Roads',
  home_noscript: RU ? 'Для этой притчи нужен JavaScript.' : 'This parable needs JavaScript.',
  mute: RU ? 'Выключить звук' : 'Mute',
  mute_on: RU ? 'Выключить звук' : 'Mute',
  mute_off: RU ? 'Включить звук' : 'Unmute',
};

function T(key) {
  const v = TEX[key];
  return v === undefined ? key : (Array.isArray(v) ? v.map((x) => T(x)) : v);
}

function TALL() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = T(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = T(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-rules]').forEach((el) => {
    const items = T(el.dataset.rules) || [];
    el.innerHTML = '';
    items.forEach(([label, text]) => {
      const li = document.createElement('li');
      const b = document.createElement('b');
      b.textContent = label;
      li.appendChild(b);
      if (text) li.appendChild(document.createTextNode(' ' + text));
      el.appendChild(li);
    });
  });
}
