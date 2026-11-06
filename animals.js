'use strict';
/* =====================================================================
   animals.js - tameable animals, rarities, followers and the Petdex.
   Sprites are drawn in code (shared templates: quadruped, bird, owl).
   Loaded between characters.js and game.js. Anything from game.js
   (T, MW, G, emit, ...) is only touched at runtime, never at load.
   ===================================================================== */

const RARITY = {
  common:    { name: 'COMMON',    col: '#c8c8d4', w: 50, rate: 0.85 },
  uncommon:  { name: 'UNCOMMON',  col: '#5fd078', w: 26, rate: 0.60 },
  rare:      { name: 'RARE',      col: '#4a9eff', w: 13, rate: 0.42 },
  epic:      { name: 'EPIC',      col: '#b06ad8', w: 8,  rate: 0.32 },
  legendary: { name: 'LEGENDARY', col: '#ffb02e', w: 3,  rate: 0.24 },
  wild:      { name: 'WILD',      col: '#ee6a3c', w: 6,  rate: 0.36 },
  secret:    { name: 'SECRET',    col: '#ff7ad9', w: 0,  rate: 0.26 }
};
const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'wild', 'secret'];
const SECRET_CYCLE = ['#ff7ad9', '#c8a0ff', '#7ad0ff', '#7affd0', '#ffe27a', '#ff9a7a'];
const HINTS = {
  common: 'EASY TO FIND IN THE MEADOWS.',
  uncommon: 'LOOK AROUND THE FOREST EDGES.',
  rare: 'SHY. STAND STILL AND LET IT COME.',
  epic: 'MAGICAL. LOOK FOR PURPLE SPARKLES.',
  legendary: 'VERY RARE. GOLDEN SPARKLES GIVE IT AWAY.',
  wild: 'JUMPY. WALK UP SLOWLY, THEN STAND STILL.',
  secret: 'ONLY AT NIGHT, NEAR THE POND...'
};
const SPARK = { epic: 2.5, legendary: 7, secret: 9 };
const SPARK_COL = {
  epic: ['#e0b8ff', '#b06ad8', '#ffffff'],
  legendary: ['#ffe27a', '#ffb02e', '#ffffff'],
  secret: ['#ff7ad9', '#7affff', '#c8a0ff', '#ffffff']
};
const TAME_R = 42, ANIMAL_TARGET = 9, MAX_PETS = 4, DEX_KEY = 'medieval_realm_collection';

// shy: 0 = never scared .. 1 = very jumpy.  cur: curiosity (walks up to you when you stand still)
const SPECIES = [
  { id: 'cat', name: 'Cat', r: 'common', kind: 'quad', c: '#e8964a', l: '#fbd9a0', d: '#b0642a', a: '#f4a8a8',
    hr: 3.4, bw: 8, bh: 5, leg: 3, tl: 6, neck: 1, ear: 'point', eh: 3, tail: 'curl', pat: 'stripes', blush: 1,
    spd: 20, shy: 0.2, cur: 0.6, desc: 'A CURIOUS TABBY WHO NAPS IN SUNNY SPOTS.' },
  { id: 'dog', name: 'Dog', r: 'common', kind: 'quad', c: '#c28a56', l: '#f0d8b0', d: '#7a4f2a', a: '#e89aa0',
    hr: 3.6, bw: 9, bh: 5, leg: 3, tl: 4, neck: 1, ear: 'floppy', tail: 'perk', pat: 'patch', blush: 1,
    spd: 26, shy: 0, cur: 0.9, desc: 'LOYAL AND ALWAYS HAPPY TO SEE YOU.' },
  { id: 'bunny', name: 'Bunny', r: 'common', kind: 'quad', c: '#f2eee8', l: '#ffffff', d: '#cfc6bc', a: '#f4a8bc',
    hr: 3, bw: 6, bh: 5, leg: 2, tl: 3, neck: 0, ear: 'long', eh: 6, tail: 'puff', blush: 1, lw: 1,
    spd: 24, shy: 0.45, cur: 0.3, desc: 'SOFT, SHY AND VERY GOOD AT HOPPING.' },
  { id: 'duck', name: 'Duck', r: 'common', kind: 'bird', c: '#f4d84a', l: '#fff2a0', d: '#d8a82a', beak: '#f08a2a',
    hr: 2.8, bw: 9, bh: 6, leg: 2, tl: 3, spd: 16, shy: 0.3, cur: 0.4, desc: 'WADDLES ABOUT AND QUACKS AT THE CLOUDS.' },

  { id: 'fox', name: 'Fox', r: 'uncommon', kind: 'quad', c: '#e8742a', l: '#fff4e4', d: '#8a3a18', a: '#4a2418',
    hr: 3.6, bw: 9, bh: 5, leg: 3, tl: 8, neck: 1, ear: 'point', eh: 4, tail: 'fluff', paw: '#4a2418',
    spd: 28, shy: 0.55, cur: 0.25, desc: 'CLEVER AND QUICK, WITH A FLUFFY TAIL.' },
  { id: 'raccoon', name: 'Raccoon', r: 'uncommon', kind: 'quad', c: '#8e939e', l: '#d8dbe2', d: '#4a4e5a', a: '#c8ccd6',
    hr: 3.6, bw: 9, bh: 6, leg: 2, tl: 7, neck: 0, ear: 'point', eh: 2, tail: 'ring', mask: 1,
    spd: 20, shy: 0.35, cur: 0.5, desc: 'A TINY BANDIT WHO LOVES SHINY THINGS.' },

  { id: 'deer', name: 'Deer', r: 'rare', kind: 'quad', c: '#c8955a', l: '#f2dcb4', d: '#8a5a30', a: '#e8b0a0',
    hr: 3.4, bw: 11, bh: 6, leg: 8, tl: 2, neck: 5, ear: 'antler', eh: 2, tail: 'puff', pat: 'spots', antler: '#6a4a2a',
    lw: 1, spd: 30, shy: 0.7, cur: 0.2, desc: 'GRACEFUL AND GENTLE. SPOTS FADE WITH AGE.' },
  { id: 'owl', name: 'Owl', r: 'rare', kind: 'owl', c: '#a8794a', l: '#ecd9b8', d: '#6a4628',
    spd: 14, shy: 0.6, cur: 0.2, desc: 'WISE NIGHT WATCHER. BLINKS VERY SLOWLY.' },

  { id: 'unicorn', name: 'Unicorn', r: 'epic', kind: 'quad', c: '#f7f4ff', l: '#ffffff', d: '#cbbfe8', a: '#ffb8e0',
    hr: 3.8, bw: 11, bh: 6, leg: 7, tl: 7, neck: 4, ear: 'horn', eh: 2, tail: 'fluff', tipc: '#c8a0ff',
    mane: ['#ff9ad5', '#b49aff', '#8ad0ff'], glow: '#d8b8ff', nobelly: 1,
    lw: 1, spd: 32, shy: 0.5, cur: 0.4, desc: 'A MAGICAL HORSE WITH A RAINBOW MANE.' },
  { id: 'dragon', name: 'Baby Dragon', r: 'epic', kind: 'quad', c: '#5fc86a', l: '#d8f5a8', d: '#2f8a4a', a: '#ffdf6a',
    hr: 4, bw: 10, bh: 6, leg: 3, tl: 10, neck: 2, ear: 'dhorn', tail: 'dragon', wing: '#8ae08a', wl: 9,
    glow: '#9aff9a', spd: 24, shy: 0.3, cur: 0.5, desc: 'A BABY DRAGON. BREATHES WARM SPARKLES.' },

  { id: 'phoenix', name: 'Phoenix', r: 'legendary', kind: 'bird', c: '#ff7a2a', l: '#ffd24a', d: '#d8321a', beak: '#ffd24a',
    hr: 3.4, bw: 11, bh: 7, leg: 3, tl: 12, tail: 'flame', wing: '#ff9a30', wl: 11, crest: 1, legc: '#ffd24a',
    glow: '#ff9a40', spd: 22, shy: 0.15, cur: 0.15, spark: ['#ff9a40', '#ffd24a', '#ffffff'],
    desc: 'REBORN FROM FLAMES. WARMS COLD HANDS.' },
  { id: 'frostdrake', name: 'Frost Drake', r: 'legendary', kind: 'quad', c: '#8fd8f4', l: '#effcff', d: '#4a8ac8', a: '#ffffff',
    hr: 4.6, bw: 13, bh: 8, leg: 4, tl: 13, neck: 3, ear: 'dhorn', tail: 'dragon', wing: '#c4eefa', wl: 12,
    glow: '#9fe8ff', spd: 22, shy: 0.3, cur: 0.3, desc: 'AN ICE DRAGON. LOVES MOONLIT SNOW.' },

  { id: 'wolf', name: 'Wolf', r: 'wild', kind: 'quad', c: '#7c8494', l: '#d0d6e0', d: '#454c5a', a: '#2a2e38',
    hr: 4, bw: 12, bh: 6, leg: 6, tl: 8, neck: 2, ear: 'point', eh: 4, tail: 'fluff',
    lw: 1, spd: 34, shy: 0.85, cur: 0, desc: 'WILD AND PROUD. TRUSTS SLOWLY.' },
  { id: 'bear', name: 'Bear', r: 'wild', kind: 'quad', c: '#7a5230', l: '#a67a50', d: '#4a2e18', a: '#4a2e18',
    hr: 4.4, bw: 13, bh: 9, leg: 4, tl: 2, neck: 1, ear: 'round', tail: 'puff', lw: 3,
    spd: 22, shy: 0.8, cur: 0, desc: 'A BIG WILD SOFTIE WHO LOVES HONEY.' },

  { id: 'kitsune', name: 'Kitsune', r: 'secret', kind: 'quad', c: '#f4f0ff', l: '#ffffff', d: '#6a4aa8', a: '#ff7ad9',
    hr: 3.6, bw: 9, bh: 5, leg: 4, tl: 9, neck: 1, ear: 'point', eh: 4, tail: 'two', tipc: '#b49aff', glow: '#c8a0ff', nobelly: 1,
    spd: 30, shy: 0.6, cur: 0.3, desc: 'A MOONLIGHT SPIRIT WITH TWO TAILS.' },

  // ---- common
  { id: 'sheep', name: 'Sheep', r: 'common', kind: 'quad', c: '#f3efe6', l: '#ffffff', d: '#5a4a52', a: '#5a4a52',
    hr: 3.2, bw: 9, bh: 7, leg: 3, tl: 2, neck: 0, ear: 'floppy', tail: 'puff', nobelly: 1, blush: 1,
    spd: 16, shy: 0.2, cur: 0.5, desc: 'A FLUFFY CLOUD THAT SAYS BAA.' },
  { id: 'chick', name: 'Chick', r: 'common', kind: 'bird', c: '#ffe45e', l: '#fff6b0', d: '#f0c030', beak: '#f08a2a',
    hr: 2.4, bw: 5, bh: 4.4, leg: 2, tl: 1, spd: 18, shy: 0.25, cur: 0.5, desc: 'TINY, FLUFFY AND ALWAYS PEEPING.' },
  { id: 'squirrel', name: 'Squirrel', r: 'common', kind: 'quad', c: '#b8703a', l: '#f0d8b0', d: '#7a4524', a: '#f0b8a0',
    hr: 2.8, bw: 5, bh: 4, leg: 2, tl: 7, neck: 0, ear: 'point', eh: 2, tail: 'fluff', lw: 1,
    spd: 30, shy: 0.55, cur: 0.3, desc: 'HIDES ACORNS AND FORGETS WHERE.' },
  { id: 'pig', name: 'Piglet', r: 'common', kind: 'quad', c: '#f4a8b4', l: '#ffd0d8', d: '#d4707e', a: '#d4707e',
    hr: 3.2, bw: 8, bh: 6, leg: 2, tl: 2, neck: 0, ear: 'floppy', tail: 'puff', blush: 1, nobelly: 1,
    spd: 18, shy: 0.1, cur: 0.7, desc: 'LOVES MUD AND BELLY RUBS.' },
  { id: 'goose', name: 'Goose', r: 'common', kind: 'bird', c: '#f2f2f2', l: '#ffffff', d: '#c8ccd4', beak: '#f08a2a',
    hr: 2.6, bw: 10, bh: 6, leg: 3, tl: 3, neckUp: 2, spd: 18, shy: 0.4, cur: 0.3, desc: 'HONKS AT EVERYONE. MEANS WELL.' },

  // ---- uncommon
  { id: 'goat', name: 'Goat', r: 'uncommon', kind: 'quad', c: '#e8e2d4', l: '#ffffff', d: '#8a8478', a: '#c8c0b0',
    hr: 3.4, bw: 9, bh: 5, leg: 4, tl: 2, neck: 1, ear: 'antler', antler: '#b8a88a', tail: 'puff', lw: 1,
    spd: 26, shy: 0.4, cur: 0.4, desc: 'CLIMBS ANYTHING. EATS EVERYTHING.' },
  { id: 'badger', name: 'Badger', r: 'uncommon', kind: 'quad', c: '#5a5e68', l: '#f0f0f0', d: '#2a2c34', a: '#c8c8d0',
    hr: 3.6, bw: 9, bh: 5, leg: 2, tl: 2, neck: 0, ear: 'round', tail: 'puff', mask: 1,
    spd: 18, shy: 0.4, cur: 0.3, desc: 'GRUMPY BUT SECRETLY SWEET.' },
  { id: 'seagull', name: 'Seagull', r: 'uncommon', kind: 'bird', c: '#f4f6fa', l: '#ffffff', d: '#9aa4b8', beak: '#f4c030',
    hr: 2.6, bw: 9, bh: 5.4, leg: 3, tl: 4, spd: 22, shy: 0.45, cur: 0.4, desc: 'STEALS SNACKS WITH A SMILE.' },
  { id: 'otter', name: 'Otter', r: 'uncommon', kind: 'quad', c: '#8a6240', l: '#d8bc94', d: '#5a3e26', a: '#5a3e26',
    hr: 3.2, bw: 12, bh: 4.5, leg: 2, tl: 8, neck: 0, ear: 'round', tail: 'fluff', lw: 1, blush: 1,
    spd: 24, shy: 0.3, cur: 0.6, desc: 'HOLDS HANDS WHILE IT SLEEPS.' },
  { id: 'pony', name: 'Pony', r: 'uncommon', kind: 'quad', c: '#b8784a', l: '#e0b088', d: '#6a4028', a: '#e8a0a0',
    hr: 3.6, bw: 10, bh: 6, leg: 6, tl: 6, neck: 3, ear: 'point', eh: 2, tail: 'fluff', mane: ['#4a2e1c', '#6a4028'], lw: 1,
    spd: 30, shy: 0.4, cur: 0.5, desc: 'SMALL, SPEEDY AND PROUD OF ITS MANE.' },
  { id: 'pheasant', name: 'Pheasant', r: 'uncommon', kind: 'bird', c: '#c8702a', l: '#f0c880', d: '#6a8a4a', beak: '#e8d060',
    hr: 2.4, bw: 8, bh: 5.4, leg: 3, tl: 9, spd: 22, shy: 0.5, cur: 0.2, desc: 'STRUTS LIKE IT OWNS THE FIELD.' },
  { id: 'blackcat', name: 'Black Cat', r: 'uncommon', kind: 'quad', c: '#34303e', l: '#5a5468', d: '#1a1822', a: '#c08ad8',
    hr: 3.4, bw: 8, bh: 5, leg: 3, tl: 6, neck: 1, ear: 'point', eh: 3, tail: 'curl',
    spd: 22, shy: 0.4, cur: 0.5, desc: 'LUCKY, ACTUALLY. LOVES MOONLIGHT.' },

  // ---- rare
  { id: 'redpanda', name: 'Red Panda', r: 'rare', kind: 'quad', c: '#c8501e', l: '#f4e4d0', d: '#5a2410', a: '#f4e4d0',
    hr: 3.6, bw: 9, bh: 5.5, leg: 2, tl: 9, neck: 0, ear: 'round', tail: 'ring', mask: 1, blush: 1,
    spd: 20, shy: 0.55, cur: 0.3, desc: 'NAPS IN TREE HOLLOWS ALL DAY.' },
  { id: 'snowfox', name: 'Snow Fox', r: 'rare', kind: 'quad', c: '#eef4fa', l: '#ffffff', d: '#a8bcd0', a: '#9aa8c0',
    hr: 3.6, bw: 9, bh: 5, leg: 3, tl: 8, neck: 1, ear: 'point', eh: 4, tail: 'fluff', paw: '#7a8aa8',
    spd: 30, shy: 0.65, cur: 0.25, desc: 'VANISHES INTO THE SNOW.' },
  { id: 'lynx', name: 'Lynx', r: 'rare', kind: 'quad', c: '#b49a76', l: '#eee0c8', d: '#6a5a40', a: '#2a2218',
    hr: 3.8, bw: 10, bh: 6, leg: 4, tl: 2, neck: 1, ear: 'point', eh: 5, tail: 'puff', pat: 'spots', lw: 2,
    spd: 32, shy: 0.7, cur: 0.2, desc: 'SILENT PAWS, TUFTED EARS.' },
  { id: 'swan', name: 'Swan', r: 'rare', kind: 'bird', c: '#ffffff', l: '#f4f8ff', d: '#cfd8e8', beak: '#f08a2a',
    hr: 2.6, bw: 11, bh: 7, leg: 3, tl: 3, neckUp: 5, spd: 14, shy: 0.5, cur: 0.3, desc: 'GLIDES LIKE A DREAM.' },
  { id: 'moose', name: 'Moose', r: 'rare', kind: 'quad', c: '#6a4a30', l: '#9a7a58', d: '#3a2618', a: '#6a4a30',
    hr: 4.2, bw: 13, bh: 8, leg: 8, tl: 2, neck: 4, ear: 'antler', antler: '#8a6a44', tail: 'puff', lw: 2,
    spd: 24, shy: 0.6, cur: 0.15, desc: 'TALL, CALM AND VERY FLUFFY.' },
  { id: 'penguin', name: 'Penguin', r: 'rare', kind: 'bird', c: '#2a2e44', l: '#f4f4fa', d: '#161828', beak: '#f4a82a',
    hr: 2.8, bw: 6, bh: 9, leg: 1, tl: 2, legc: '#f4a82a', spd: 15, shy: 0.35, cur: 0.5, desc: 'WADDLES, SLIDES, REPEATS.' },

  // ---- epic
  { id: 'pegasus', name: 'Pegasus', r: 'epic', kind: 'quad', c: '#fdfbff', l: '#ffffff', d: '#c8d4f0', a: '#a8d0ff',
    hr: 3.8, bw: 11, bh: 6, leg: 7, tl: 7, neck: 4, ear: 'point', eh: 2, tail: 'fluff', tipc: '#a8d0ff', wing: '#e4eeff', wl: 11,
    mane: ['#a8d0ff', '#d8c8ff'], glow: '#cfe0ff', nobelly: 1, lw: 1, spd: 34, shy: 0.5, cur: 0.4, desc: 'A WINGED HORSE WHO CHASES CLOUDS.' },
  { id: 'spiritstag', name: 'Spirit Stag', r: 'epic', kind: 'quad', c: '#a8e8d8', l: '#e8fff8', d: '#5ab8a8', a: '#e8fff8',
    hr: 3.6, bw: 11, bh: 6, leg: 6, tl: 2, neck: 4, ear: 'antler', antler: '#7affe0', tail: 'puff', nobelly: 1, glow: '#7affe0',
    lw: 2, spd: 30, shy: 0.6, cur: 0.2, desc: 'ITS ANTLERS GLOW LIKE A LANTERN.' },
  { id: 'griffin', name: 'Griffin', r: 'epic', kind: 'quad', c: '#d8a448', l: '#f4e0a0', d: '#8a5a24', a: '#ffe27a',
    hr: 4, bw: 11, bh: 7, leg: 4, tl: 8, neck: 2, ear: 'dhorn', tail: 'fluff', wing: '#e8c870', wl: 11, tipc: '#8a5a24',
    glow: '#ffd070', spd: 28, shy: 0.4, cur: 0.3, desc: 'HALF EAGLE, HALF LION, ALL HEART.' },
  { id: 'jackalope', name: 'Jackalope', r: 'epic', kind: 'quad', c: '#d8b890', l: '#f4e8d8', d: '#8a6a48', a: '#f4a8b8',
    hr: 3.2, bw: 6.5, bh: 5, leg: 2, tl: 3, neck: 0, ear: 'antler', antler: '#6a4a2a', tail: 'puff', blush: 1, lw: 1,
    glow: '#ffd8a0', spd: 28, shy: 0.55, cur: 0.3, desc: 'A BUNNY WITH ANTLERS AND BIG DREAMS.' },

  // ---- legendary
  { id: 'thunderwolf', name: 'Thunder Wolf', r: 'legendary', kind: 'quad', c: '#4a5a8a', l: '#a8c0f0', d: '#222a4a', a: '#ffe85a',
    hr: 4.2, bw: 13, bh: 7, leg: 7, tl: 9, neck: 2, ear: 'point', eh: 5, tail: 'fluff', tipc: '#ffe85a', glow: '#ffe85a',
    lw: 1, spd: 38, shy: 0.4, cur: 0.15, spark: ['#ffe85a', '#ffffff', '#a8c0f0'], desc: 'ONLY HOWLS DURING STORMS.' },
  { id: 'moonstag', name: 'Moon Stag', r: 'legendary', kind: 'quad', c: '#d8d4ff', l: '#ffffff', d: '#8a84d0', a: '#fff6c0',
    hr: 4, bw: 12, bh: 7, leg: 7, tl: 2, neck: 5, ear: 'antler', antler: '#fff6c0', tail: 'puff', nobelly: 1, glow: '#e8e0ff',
    lw: 2, spd: 30, shy: 0.5, cur: 0.2, spark: ['#fff6c0', '#ffffff', '#c8c0ff'], desc: 'WALKS WHERE MOONLIGHT TOUCHES THE FOREST.' },

  // ---- wild
  { id: 'boar', name: 'Wild Boar', r: 'wild', kind: 'quad', c: '#6a4a38', l: '#8a6a52', d: '#3a281c', a: '#3a281c',
    hr: 3.8, bw: 11, bh: 7, leg: 3, tl: 2, neck: 0, ear: 'point', eh: 2, tail: 'puff', tusk: 1, lw: 2,
    spd: 30, shy: 0.8, cur: 0, desc: 'ALL TUSKS AND ATTITUDE. SHY INSIDE.' },
  { id: 'panther', name: 'Shadow Panther', r: 'wild', kind: 'quad', c: '#2a2638', l: '#4a4460', d: '#14121c', a: '#7a6aa0',
    hr: 3.8, bw: 11, bh: 5.5, leg: 4, tl: 10, neck: 1, ear: 'round', tail: 'fluff', tipc: '#7a6aa0', lw: 2,
    spd: 34, shy: 0.85, cur: 0, desc: 'ONLY YOUR EYES NOTICE IT.' },
  { id: 'polarbear', name: 'Polar Bear', r: 'wild', kind: 'quad', c: '#f2f6fa', l: '#ffffff', d: '#b8c8d8', a: '#b8c8d8',
    hr: 4.4, bw: 14, bh: 9, leg: 4, tl: 2, neck: 1, ear: 'round', tail: 'puff', lw: 3,
    spd: 22, shy: 0.8, cur: 0, desc: 'A GENTLE GIANT OF THE FROZEN PEAKS.' },

  // ---- secret
  { id: 'ghostcat', name: 'Ghost Cat', r: 'secret', kind: 'quad', c: '#dfe8f4', l: '#ffffff', d: '#8aa0c8', a: '#b8d8ff',
    hr: 3.4, bw: 8, bh: 5, leg: 3, tl: 8, neck: 1, ear: 'point', eh: 3, tail: 'curl', nobelly: 1, glow: '#bfe0ff',
    spd: 22, shy: 0.6, cur: 0.4, desc: 'DRIFTS THROUGH THE FOG NEAR OLD STONES.' },
  { id: 'moonrabbit', name: 'Moon Rabbit', r: 'secret', kind: 'quad', c: '#fff6d8', l: '#ffffff', d: '#e8c888', a: '#ffb8d0',
    hr: 3, bw: 6, bh: 5, leg: 2, tl: 3, neck: 0, ear: 'long', eh: 7, tail: 'puff', blush: 1, lw: 1, glow: '#fff0b0',
    spd: 26, shy: 0.6, cur: 0.3, desc: 'GUARDS A QUIET ALTAR UNDER THE STARS.' }
];
const BIO = {
  cat: [0, 6, 4], dog: [0, 6], bunny: [0, 6, 1, 3], duck: [5, 0, 7], sheep: [6, 0], chick: [6, 0, 7], squirrel: [1, 2, 4], pig: [6, 0], goose: [5, 6, 7],
  fox: [2, 1, 0, 6], raccoon: [1, 2, 4], goat: [3, 4], badger: [2, 4], seagull: [7, 5], otter: [5, 7], pony: [6, 0], pheasant: [6, 2], blackcat: [0, 4, 1],
  deer: [2, 1, 0, 6], owl: [1, 2, 4, 0], redpanda: [1], snowfox: [3], lynx: [2, 3], swan: [5], moose: [2, 3], penguin: [3, 7],
  unicorn: [0, 6, 1], dragon: [4, 3, 2], pegasus: [6, 7, 0], spiritstag: [2, 1], griffin: [4, 3], jackalope: [6, 1],
  phoenix: [0, 6, 7], frostdrake: [3], thunderwolf: [2, 3, 6], moonstag: [1, 2],
  wolf: [2, 3, 4], bear: [2, 1], boar: [2, 1, 6], panther: [1, 4], polarbear: [3]
};
const REGION_NAMES = ['MEADOW VILLAGE', 'MUSHROOM HOLLOW', 'WHISPERING PINES', 'FROSTPEAK', 'OLD RUINS', 'CRYSTAL LAKE', 'SUNFLOWER FIELDS', 'SUNSET SHORE'];
// extra spawn conditions: night / day only, and weather types the animal needs
const COND = { thunderwolf: { wx: ['storm'] }, moonstag: { night: 1 }, owl: { night: 1 }, panther: { night: 1 }, blackcat: { night: 0.4 },
  swan: { wxBoost: ['rain', 'fog'] }, duck: { wxBoost: ['rain'] }, otter: { wxBoost: ['rain'] }, goose: { wxBoost: ['rain'] },
  unicorn: { rainbowBoost: 1 }, pegasus: { rainbowBoost: 1 }, spiritstag: { wxBoost: ['fog'] } };
const SECRETS = {
  kitsune: { night: 1, near: 'pond' },
  ghostcat: { wx: ['fog'], reg: 4 },
  moonrabbit: { night: 1, wx: ['clear'], near: 'altar' }
};
const SPECIES_BY_ID = {}; SPECIES.forEach(s => { SPECIES_BY_ID[s.id] = s; s.bio = BIO[s.id] || []; });

// ---------------------------------------------------------------- drawing helpers
function apx(g, c, x, y, w = 1, h = 1) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); }
function aTri(g, col, x0, y0, x1, y1, x2, y2) {
  g.fillStyle = col;
  const d = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
  if (!d) return;
  const minX = Math.floor(Math.min(x0, x1, x2)), maxX = Math.ceil(Math.max(x0, x1, x2));
  const minY = Math.floor(Math.min(y0, y1, y2)), maxY = Math.ceil(Math.max(y0, y1, y2));
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const px = x + 0.5, py = y + 0.5;
    const a = ((y1 - y2) * (px - x2) + (x2 - x1) * (py - y2)) / d;
    const b = ((y2 - y0) * (px - x2) + (x0 - x2) * (py - y2)) / d;
    if (a >= 0 && b >= 0 && 1 - a - b >= 0) g.fillRect(x, y, 1, 1);
  }
}
function aLine(g, col, x0, y0, x1, y1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 || 1;
  for (let i = 0; i <= n; i++) apx(g, col, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n);
}
function drawWing(g, s, rx, ry, f) {
  const wl = s.wl, t = [[0.9, 0.75], [0.45, 1.0], [1.0, 0.3]][f];
  const tx = rx + wl * t[0], ty = ry - wl * t[1];
  aTri(g, s.wing, rx - 2, ry + 1, rx + wl * 0.6, ry + 2.5, tx, ty);
  aTri(g, s.l, rx - 1, ry + 1, rx + wl * 0.3, ry + 1.5, rx + wl * 0.55, ry - wl * t[1] * 0.45);
  aLine(g, s.d, rx - 1, ry + 1, tx, ty);
}
function drawTail(g, s, tx, ty, f) {
  const tl = s.tl, k = s.tail;
  if (k === 'curl') {
    [[0, 0], [1, -1], [2, -2], [2, -3], [2, -4], [1 + (f ? 1 : 0), -5]].forEach(([x, y], i) => apx(g, i > 3 ? s.d : s.c, tx + x, ty + y));
  } else if (k === 'perk') {
    for (let i = 0; i < 4; i++) apx(g, i === 3 ? s.l : s.c, tx + i, ty - i, 2, 1);
  } else if (k === 'puff') {
    ell(g, s.l, tx + 1.5, ty + 1.5, 2, 2);
  } else if (k === 'fluff' || k === 'ring' || k === 'two') {
    const lifts = k === 'two' ? [2, 7] : [3];
    lifts.forEach(lift => {
      for (let i = 0; i < tl; i++) {
        const t = i / (tl - 1), cx = tx + 1 + t * tl * 0.9;
        const cy = ty - t * t * lift + (f === 1 ? -t * 0.8 : f === 2 ? t * 0.8 : 0);
        const r = 1.1 + Math.sin(t * Math.PI * 0.9) * 1.6;
        const col = (k === 'ring' && i % 3 === 2) ? s.d : (t > 0.78 ? (s.tipc || s.l) : s.c);
        ell(g, col, cx, cy, r, r);
      }
    });
  } else if (k === 'dragon') {
    for (let i = 0; i < tl; i++) {
      const t = i / tl, cy = ty + 1 + t * 2.5, th = Math.max(1, Math.round(3.2 * (1 - t)));
      apx(g, s.c, tx + i, cy - th / 2, 1, th);
      if (i % 3 === 2) apx(g, s.a, tx + i, cy - th / 2 - 1);
    }
    aTri(g, s.a, tx + tl - 1, ty + 2, tx + tl + 2.5, ty + 3.5, tx + tl - 1, ty + 5);
  }
}

function renderQuad(g, s, f) {
  const gy = 44, eye = '#1a1424', leg = s.leg, bw = s.bw, bh = s.bh, hr = s.hr;
  const hx = 10 + hr, bodyL = hx + hr * 0.45, bx = bodyL + bw / 2;
  const by = gy - leg - bh / 2, hy = by - bh * 0.2 - (s.neck || 0);
  const lw = s.lw || (bw >= 8 ? 2 : 1);
  const up = f === 1 ? [1, 0, 0, 1] : f === 2 ? [0, 1, 1, 0] : [0, 0, 0, 0];
  const topY = by - bh / 2;

  if (s.wing) drawWing(g, s, bx - 1, topY + 1.5, f);
  drawTail(g, s, bodyL + bw - 1, by - bh * 0.25, f);
  if (s.mane) for (let i = 0; i < 7; i++) apx(g, s.mane[i % s.mane.length], hx + hr * 0.5 + i * 0.5, hy - hr * 0.75 + i * 1.1, 2, 1);

  const fn = bodyL + 0.5, ff = fn + lw + 1, bn = bodyL + bw - lw - 0.5, bf = bn - lw - 1;
  [[ff, s.d, 1], [bf, s.d, 2], [fn, s.c, 0], [bn, s.c, 3]].forEach(([x, c, k]) => {
    apx(g, c, x, gy - leg - 1, lw, leg + 1 - up[k]);
    if (s.paw) apx(g, s.paw, x, gy - 1 - up[k], lw, 1);
  });

  ell(g, s.c, bx, by, bw / 2, bh / 2);
  if (!s.nobelly) ell(g, s.l, bx - 0.5, by + bh * 0.2, bw / 2 - 1.6, bh * 0.26);
  if (s.pat === 'stripes') for (let i = 0; i < 3; i++) apx(g, s.d, bodyL + 2.5 + i * 2, topY + 1, 1, 2);
  if (s.pat === 'spots') [[2, -1], [5, -2], [7, 0], [4, 1]].forEach(([x, y]) => apx(g, s.l, bodyL + x, by + y));
  if (s.pat === 'patch') ell(g, s.d, bx + 1.5, by - 1, 2.6, 1.8);

  // head
  ell(g, s.c, hx, hy, hr, hr * 0.92);
  const top = hy - hr * 0.92 + 0.5;
  if (s.ear === 'point') {
    const ew = Math.max(2, Math.round(hr * 0.8)), eh = s.eh || 3;
    [hx - hr * 0.75, hx + hr * 0.15].forEach(ex => {
      aTri(g, s.c, ex, top + 1.5, ex + ew, top + 1.5, ex + ew * 0.5, top - eh + 1);
      aTri(g, s.a, ex + ew * 0.25, top + 1.5, ex + ew * 0.75, top + 1.5, ex + ew * 0.5, top - eh + 2.4);
    });
  } else if (s.ear === 'round') {
    [hx - hr * 0.55, hx + hr * 0.5].forEach(ex => { ell(g, s.c, ex, top + 0.8, 1.7, 1.7); ell(g, s.a, ex, top + 1, 0.9, 0.9); });
  } else if (s.ear === 'long') {
    [hx - hr * 0.4, hx + hr * 0.3].forEach((ex, n) => {
      for (let k = 0; k < s.eh; k++) {
        const lean = k > s.eh / 2 ? 1 : 0;
        apx(g, n ? s.d : s.c, ex + lean, top - k + 1, 2, 1);
        if (k > 0 && k < s.eh - 1) apx(g, s.a, ex + lean, top - k + 1, 1, 1);
      }
    });
  } else if (s.ear === 'floppy') {
    apx(g, s.d, hx + hr * 0.15, hy - hr * 0.6, 2, Math.round(hr * 1.3));
    apx(g, s.d, hx - hr * 0.55, hy - hr * 0.75, 2, Math.round(hr * 0.9));
  } else if (s.ear === 'antler') {
    aTri(g, s.c, hx - hr * 0.2, top + 1.5, hx + hr * 0.6, top + 1.5, hx + hr * 0.2, top - 1.2);
    [hx - 0.5, hx + 1.5].forEach(x => {
      apx(g, s.antler, x, top - 4, 1, 5); apx(g, s.antler, x - 1, top - 3); apx(g, s.antler, x + 1, top - 4); apx(g, s.antler, x - 1, top - 5);
    });
  } else if (s.ear === 'horn') {
    aTri(g, s.c, hx + hr * 0.1, top + 1.5, hx + hr * 0.7, top + 1.5, hx + hr * 0.4, top - 1);
    for (let i = 0; i < 5; i++) apx(g, i === 4 ? '#fff6c0' : '#ffd35a', hx - hr * 0.35 - i * 0.5, top + 1 - i);
  } else if (s.ear === 'dhorn') {
    aTri(g, s.a, hx - 0.5, top + 1.5, hx + 1.5, top + 1.5, hx + 4, top - 2);
    aTri(g, s.a, hx + hr * 0.5, top + 1.5, hx + hr * 0.5 + 1.5, top + 1.5, hx + hr * 0.5 + 4, top - 1.5);
  }
  if (!s.nomuzzle) ell(g, s.l, hx - hr * 0.55, hy + hr * 0.38, hr * 0.55, hr * 0.4);
  if (s.tusk) { apx(g, '#fff6d0', hx - hr * 0.95, hy + hr * 0.5, 1, 2); apx(g, '#fff6d0', hx - hr * 0.35, hy + hr * 0.55, 1, 1); }
  if (s.mask) apx(g, s.d, hx - hr * 0.95, hy - hr * 0.4, hr * 1.1, 2);
  apx(g, '#2a1a24', hx - hr * 0.95, hy + hr * 0.15);
  apx(g, eye, hx - hr * 0.38, hy - hr * 0.2);
  if (s.blush) apx(g, '#f4a0a8', hx - hr * 0.05, hy + hr * 0.45);
}

function renderBird(g, s, f) {
  const gy = 44, eye = '#1a1424', leg = s.leg, bw = s.bw, bh = s.bh, hr = s.hr;
  const bx = 14 + hr + bw / 2, by = gy - leg - bh / 2;
  const nu = s.neckUp || 0, hx = bx - bw / 2 + 1, hy = by - bh / 2 - hr * 0.35 - nu;
  const up = f === 1 ? [1, 0] : f === 2 ? [0, 1] : [0, 0], lc = s.legc || '#e8902a';
  apx(g, lc, bx - 1.5, gy - leg, 1, leg - up[0]); apx(g, lc, bx + 1, gy - leg, 1, leg - up[1]);
  apx(g, lc, bx - 2.5, gy - 1 - up[0], 2, 1); apx(g, lc, bx, gy - 1 - up[1], 2, 1);
  if (s.wing) drawWing(g, s, bx + 0.5, by - bh / 2 + 1.5, f);
  const txs = bx + bw / 2 - 1.5;
  if (s.tail === 'flame') {
    aTri(g, s.d, txs, by - 1, txs + s.tl, by + 4, txs, by + 3);
    aTri(g, s.c, txs, by - 2, txs + s.tl * 0.85, by + 1.5, txs, by + 2);
    aTri(g, s.l, txs, by - 1.5, txs + s.tl * 0.6, by, txs, by + 1);
  } else aTri(g, s.d, txs, by - 1.5, txs + s.tl, by - 3, txs, by + 1.5);
  ell(g, s.c, bx, by, bw / 2, bh / 2);
  ell(g, s.l, bx - 1.2, by + bh * 0.2, bw / 2 - 2, bh / 3.2);
  if (!s.wing) ell(g, s.d, bx + 1, by - 0.5 + (f === 1 ? -1 : f === 2 ? 0.5 : 0), bw / 2 - 2.2, bh / 2 - 1.6);
  if (nu) { rect(g, s.c, Math.round(hx - 1), Math.round(hy), 3, Math.round(nu + hr * 0.6)); rect(g, s.d, Math.round(hx + 1), Math.round(hy), 1, Math.round(nu + hr * 0.6)); }
  ell(g, s.c, hx, hy, hr, hr * 0.95);
  if (s.crest) { aTri(g, s.d, hx - 1, hy - hr + 1, hx + 1, hy - hr + 1, hx + 2.5, hy - hr - 3); aTri(g, s.l, hx - 1, hy - hr + 1, hx, hy - hr + 1, hx - 1.5, hy - hr - 2.5); }
  aTri(g, s.beak, hx - hr + 0.5, hy - 0.9, hx - hr - 2.4, hy + 0.6, hx - hr + 0.5, hy + 1.7);
  apx(g, eye, hx - hr * 0.35, hy - 0.6);
}

function renderOwl(g, s, f) {
  const gy = 44, bx = 24, eye = '#1a1424';
  g.save(); g.translate(0, f === 1 ? -1 : 0);
  ell(g, s.d, bx - 5, gy - 8, 1.7, 3.8); ell(g, s.d, bx + 5, gy - 8, 1.7, 3.8);
  ell(g, s.c, bx, gy - 8, 4.8, 5.4);
  ell(g, s.l, bx, gy - 7, 3, 3.8);
  for (const [x, y] of [[-1, -8], [1, -7], [-1, -5], [1, -4]]) apx(g, s.d, bx + x, gy + y);
  ell(g, s.c, bx, gy - 14, 5.2, 3.9);
  aTri(g, s.c, bx - 5.2, gy - 14.5, bx - 2.2, gy - 16.5, bx - 5.4, gy - 20);
  aTri(g, s.c, bx + 5.2, gy - 14.5, bx + 2.2, gy - 16.5, bx + 5.4, gy - 20);
  for (const sx of [-1, 1]) {
    ell(g, '#c88a2a', bx + sx * 2.3, gy - 14, 2.2, 2.2);
    ell(g, '#fff0b8', bx + sx * 2.3, gy - 14, 1.7, 1.7);
    apx(g, eye, bx + sx * 2.3 - 0.5, gy - 14.5, 1, 2);
  }
  aTri(g, '#f0a02a', bx - 0.9, gy - 13, bx + 0.9, gy - 13, bx, gy - 11.2);
  apx(g, '#e8902a', bx - 2.5, gy - 1, 2, 1); apx(g, '#e8902a', bx + 0.5, gy - 1, 2, 1);
  g.restore();
}

function buildSprite(s) {
  const W0 = 56, H0 = 48, fn = s.kind === 'bird' ? renderBird : s.kind === 'owl' ? renderOwl : renderQuad;
  const raw = [0, 1, 2].map(f => { const [c, g] = mk(W0, H0); fn(g, s, f); return c; });
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (const c of raw) {
    const d = c.getContext('2d').getImageData(0, 0, W0, H0).data;
    for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) if (d[(y * W0 + x) * 4 + 3] > 0) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const left = raw.map(c => { const [o, og] = mk(w, h); og.drawImage(c, x0, y0, w, h, 0, 0, w, h); return o; });
  const right = left.map(src => { const [o, og] = mk(w, h); og.translate(w, 0); og.scale(-1, 1); og.drawImage(src, 0, 0); return o; });
  const [sil, sg] = mk(w, h);
  sg.drawImage(left[0], 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#2b1d44'; sg.fillRect(0, 0, w, h);
  return { frames: { left, right }, w, h, sil };
}

// ---------------------------------------------------------------- manager
const Animals = {
  spr: {}, heart: null, dexT: 0,

  init() {
    for (const s of SPECIES) this.spr[s.id] = buildSprite(s);
    this.heart = fromRows(['.aa.aa.', 'ahaaaaa', 'aaaaaaa', '.aaaaa.', '..aaa..', '...a...'], { a: '#ff6f9c', h: '#ffc0d4' });
  },
  loadCol() { try { return JSON.parse(localStorage.getItem(DEX_KEY) || '{}') || {}; } catch (e) { return {}; } },
  saveCol() { try { localStorage.setItem(DEX_KEY, JSON.stringify(G.col)); } catch (e) { /* ignore */ } },

  reset() {
    G.animals = []; G.pets = []; G.trail = []; G.toasts = []; G.hearts = [];
    G.dex = false; G.dexSel = 0; G.taming = null; G.spawnT = 2; G.col = this.loadCol();
    const p = G.p, near = (id, a, b) => { const t = this.findTile(a, b); if (t) G.animals.push(this.make(SPECIES_BY_ID[id], t.x, t.y)); };
    near('cat', 3.5, 6); near('dog', 5, 8); near('bunny', 7, 10);
    for (let i = 0; i < 4; i++) { const s = this.pick(0); if (s) { const t = this.findTile(9, 22); if (t) G.animals.push(this.make(s, t.x, t.y)); } }
  },

  isNight() { const h = G.min / 60; return h >= 20 || h < 5; },
  secretOk(c) {
    if (c.night && !this.isNight()) return false;
    if (c.wx && !c.wx.includes(G.wx ? G.wx.type : 'clear')) return false;
    if (c.reg !== undefined && G.w.region[Math.floor(G.p.y / T) * MW + Math.floor(G.p.x / T)] !== c.reg) return false;
    return true;
  },
  isStorm() { return G.wx && G.wx.type === 'storm'; },
  // choose a rarity first (so the 7 rarity rates hold no matter how many species exist), then a species that fits the place and weather
  pick(reg) {
    const wx = G.wx ? G.wx.type : 'clear', night = this.isNight(), rb = G.rainbow > 0;
    const weightOf = s => {
      if (s.r === 'secret') return 0;
      if ((s.r === 'epic' || s.r === 'legendary') && (G.animals.some(a => a.s === s) || G.pets.some(a => a.s === s))) return 0;
      const c = COND[s.id] || {};
      if (c.wx && !c.wx.includes(wx)) return 0;
      if (c.night === 1 && !night) return 0;
      let w = s.bio.includes(reg) ? 1 : (s.bio.length ? 0.04 : 0.2);
      if (c.night && c.night !== 1) w *= night ? 2.5 : 0.3;
      if (c.wxBoost && c.wxBoost.includes(wx)) w *= 3;
      if (c.rainbowBoost && rb) w *= 6;
      return w;
    };
    const byR = {};
    for (const s of SPECIES) { const w = weightOf(s); if (w > 0) (byR[s.r] = byR[s.r] || []).push([s, w]); }
    let rars = Object.keys(byR).filter(r => byR[r].some(e => e[0].bio.includes(reg)));
    if (!rars.length) rars = ['common'];
    let tot = 0; for (const r of rars) tot += RARITY[r].w;
    if (!tot) return null;
    let x = Math.random() * tot, rar = rars[0];
    for (const r of rars) { x -= RARITY[r].w; if (x <= 0) { rar = r; break; } }
    const inb = byR[rar].filter(e => e[0].bio.includes(reg)), pool = inb.length ? inb : byR[rar]; let y = Math.random() * pool.reduce((q, e) => q + e[1], 0);
    for (const [sp, w] of pool) { y -= w; if (y <= 0) return sp; }
    return pool[0][0];
  },
  findTile(minD, maxD, pred) {
    const w = G.w, p = G.p;
    for (let n = 0; n < 250; n++) {
      const tx = 2 + Math.floor(Math.random() * (MW - 4)), ty = 2 + Math.floor(Math.random() * (MH - 4)), i = ty * MW + tx;
      if (w.solid[i] || w.ground[i] === 2 || w.ground[i] === 3) continue;
      const x = tx * T + 8, y = ty * T + 12, d = Math.hypot(x - p.x, y - p.y);
      if (d < minD * T || d > maxD * T) continue;
      if (pred && !pred(tx, ty, w.ground[i])) continue;
      return { x, y };
    }
    return null;
  },
  make(s, x, y) {
    const sp = this.spr[s.id];
    return { s, x, y, dir: Math.random() < 0.5 ? 'left' : 'right', state: 'idle', t: Math.random() * 2, vx: 0, vy: 0, anim: 0,
      moving: false, alert: 0, prog: 0, heartT: 0, blocked: 0, sgn: Math.random() < 0.5 ? 1 : -1,
      hw: Math.max(3, Math.min(6, Math.round(sp.w * 0.22))), hh: 3 };
  },
  spawnOne() {
    for (let n = 0; n < 6; n++) {
      const t = this.findTile(9, 24); if (!t) return;
      const reg = G.w.region[Math.floor(t.y / T) * MW + Math.floor(t.x / T)];
      const s = this.pick(reg); if (!s) continue;
      if (s.r === 'wild' && G.w.ground[Math.floor(t.y / T) * MW + Math.floor(t.x / T)] === 1) continue;
      G.animals.push(this.make(s, t.x, t.y)); return;
    }
  },
  toast(l1, l2, col) { G.toasts.push({ l1, l2, col, t: 3.6 }); sfx.toast(); },
  heart1(x, y) { G.hearts.push({ x: x + (Math.random() - 0.5) * 8, y, t: 0 }); },

  // ------------------------------------------------------------ update
  update(dt) {
    const p = G.p;
    for (const q of G.toasts) q.t -= dt;
    G.toasts = G.toasts.filter(q => q.t > 0);
    for (const h of G.hearts) h.t += dt;
    G.hearts = G.hearts.filter(h => h.t < 1.2);

    // keep the meadow populated; the secret one only comes out at night near the pond
    G.spawnT -= dt;
    if (G.spawnT <= 0) {
      G.spawnT = 3;
      const wxk = G.wx ? G.wx.type : 'clear', target = wxk === 'storm' ? 5 : wxk === 'rain' ? 7 : ANIMAL_TARGET;
      if (G.animals.filter(a => a.s.r !== 'secret' && !a.keep).length < target) this.spawnOne();
      // animals far behind you go home, so the count stays fresh as you explore
      G.animals = G.animals.filter(a => a.keep || Math.hypot(a.x - p.x, a.y - p.y) < 36 * T);
      for (const id in SECRETS) {
        const c = SECRETS[id], sp = SPECIES_BY_ID[id], ok = this.secretOk(c), have = G.animals.find(a => a.s === sp);
        if (have && !have.keep && !ok) {
          emit(have.x, have.y - 8, 20, { sp: 50, life: 0.8, c: SPARK_COL.secret });
          G.animals = G.animals.filter(a => a !== have);
        } else if (!have && ok && !G.pets.some(a => a.s === sp) && Math.random() < 0.06) {
          let t = null;
          if (c.near) { const o = G.w[c.near]; t = this.findTile(3, 60, (tx, ty, g) => g !== 2 && Math.hypot(tx - o.x, ty - o.y) > 4 && Math.hypot(tx - o.x, ty - o.y) < 10); }
          else t = this.findTile(6, 40, (tx, ty) => G.w.region[ty * MW + tx] === c.reg);
          if (t) { G.animals.push(this.make(sp, t.x, t.y)); this.toast('A STRANGE GLOW SHIMMERS...', id === 'ghostcat' ? 'SOMETHING DRIFTS IN THE FOG' : id === 'moonrabbit' ? 'SOMETHING STIRS AT THE ALTAR' : 'SOMETHING STIRS BY THE POND', '#c8a0ff'); }
        }
      }
    }

    // taming
    let cand = null, best = 1e9;
    for (const a of G.animals) {
      const d = Math.hypot(a.x - p.x, a.y - p.y);
      if (d < TAME_R && a.state !== 'flee' && d < best) { cand = a; best = d; }
    }
    const holding = down('KeyF');
    G.taming = null;
    for (const a of G.animals) {
      if (a === cand && holding && !p.run) {
        a.prog += RARITY[a.s.r].rate * dt; G.taming = a;
        a.heartT -= dt;
        if (a.heartT <= 0) { a.heartT = 0.4; this.heart1(a.x, a.y - this.spr[a.s.id].h - 2); }
      } else a.prog = Math.max(0, a.prog - dt * 0.5);
    }
    if (holding && !cand) {
      for (const a of G.pets) if (Math.hypot(a.x - p.x, a.y - p.y) < 34) {
        a.heartT -= dt; if (a.heartT <= 0) { a.heartT = 0.8; this.heart1(a.x, a.y - this.spr[a.s.id].h - 2); Bonds.pet(a); }
      }
    }
    if (G.taming && G.taming.prog >= 1) this.tame(G.taming);

    for (const a of G.animals) this.updateWild(a, dt);
    G.pets.forEach((a, i) => this.updatePet(a, i, dt));

    // rarity sparkles
    for (const a of G.animals.concat(G.pets)) {
      const rate = SPARK[a.s.r] || 0, cols = a.s.spark || SPARK_COL[a.s.r];
      if (rate && Math.random() < rate * dt) {
        const sp = this.spr[a.s.id];
        emit(a.x + (Math.random() - 0.5) * sp.w, a.y - Math.random() * sp.h, 1, { sp: 5, life: 0.9, vy: -12, c: cols });
      }
    }
  },

  step(a, vx, vy, dt) {
    const ok1 = moveEntity(a, vx * dt, 0, a.hw, a.hh), ok2 = moveEntity(a, 0, vy * dt, a.hw, a.hh);
    a.moving = true;
    if (vx < -1) a.dir = 'left'; else if (vx > 1) a.dir = 'right';
    a.anim += dt * Math.hypot(vx, vy) * 0.14;
    a.blocked = (ok1 && ok2) ? 0 : a.blocked + dt;
    return ok1 && ok2;
  },

  updateWild(a, dt) {
    const p = G.p, s = a.s, dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy) || 1;
    a.t -= dt; a.moving = false;
    if (G.taming === a) { a.dir = dx < 0 ? 'left' : 'right'; return; }
    if (p.moving && d < 6 * T && s.shy > 0) a.alert += dt * s.shy * (p.run ? 3.5 : 1.2) * (G.wx && G.wx.type === 'storm' && s.id !== 'thunderwolf' ? 1.8 : 1);
    else a.alert = Math.max(0, a.alert - dt * 0.6);
    if (a.alert >= 1 && a.state !== 'flee') {
      a.state = 'flee'; a.t = 1.6 + Math.random(); a.alert = 0.5;
      emit(a.x, a.y - this.spr[s.id].h, 4, { sp: 25, life: 0.4, c: ['#ffffff'] });
    }
    if (a.state === 'flee') {
      let vx = -dx / d, vy = -dy / d;
      if (a.blocked > 0.15) { [vx, vy] = [-vy * a.sgn, vx * a.sgn]; }
      this.step(a, vx * s.spd * 2.4, vy * s.spd * 2.4, dt);
      if (a.t <= 0) { a.state = 'idle'; a.t = 1 + Math.random() * 2; }
      return;
    }
    if (a.state === 'walk') {
      const ok = this.step(a, a.vx, a.vy, dt);
      if (!ok || a.t <= 0) { a.state = 'idle'; a.t = 1 + Math.random() * 3; }
      return;
    }
    if (d < 5 * T) a.dir = dx < 0 ? 'left' : 'right';
    if (a.t <= 0) {
      a.state = 'walk'; a.t = 0.8 + Math.random() * 2;
      let ang = Math.random() * TAU, sp = s.spd * (0.5 + Math.random() * 0.5);
      if (!p.moving && d > 1.8 * T && d < 7 * T && Math.random() < s.cur) {
        ang = Math.atan2(dy, dx); sp = s.spd * 0.8; a.t = Math.max(0.2, Math.min(a.t, (d - 1.6 * T) / sp));
      }
      a.vx = Math.cos(ang) * sp; a.vy = Math.sin(ang) * sp;
    }
  },

  updatePet(a, i, dt) {
    if (a.digT > 0) { a.moving = false; return; }
    const p = G.p, tr = G.trail, tgt = tr[Math.min(tr.length - 1, (i + 1) * 6)] || p;
    const far = Math.hypot(a.x - p.x, a.y - p.y);
    a.moving = false;
    if (far > 10 * T || a.blocked > 1.2 || boxHits(a.x, a.y, a.hw, a.hh)) {
      a.x = p.x; a.y = p.y; a.blocked = 0;
      emit(a.x, a.y - 6, 6, { sp: 30, life: 0.4, c: ['#ffffff', '#ffd0e0'] });
      return;
    }
    const dx = tgt.x - a.x, dy = tgt.y - a.y, d = Math.hypot(dx, dy);
    if (d > 4) {
      const sp = Math.min(95, 20 + d * 5);
      this.step(a, dx / d * sp, dy / d * sp, dt);
    } else {
      a.blocked = 0;
      const q = p.x - a.x; if (Math.abs(q) > 6) a.dir = q < 0 ? 'left' : 'right';
    }
  },

  tame(a) {
    const s = a.s, sp = this.spr[s.id], ri = RARITY_ORDER.indexOf(s.r);
    G.animals = G.animals.filter(q => q !== a);
    a.prog = 0; a.state = 'idle'; G.taming = null; G.pets.push(a); Bonds.onTame(a);
    const isNew = !G.col[s.id];
    G.col[s.id] = (G.col[s.id] || 0) + 1; this.saveCol();
    const col = s.r === 'secret' ? SECRET_CYCLE[0] : RARITY[s.r].col;
    this.toast((isNew ? 'NEW! ' : '') + s.name.toUpperCase() + ' JOINED YOU', RARITY[s.r].name, col);
    for (let i = 0; i < 6; i++) this.heart1(a.x, a.y - sp.h - 2 - i * 2);
    emit(a.x, a.y - sp.h / 2, 26, { sp: 70, life: 0.9, c: SPARK_COL[s.r] || ['#ffd0e0', '#ffffff', '#ff6f9c'] });
    sfx.tame(ri);
    if (G.pets.length > MAX_PETS) {
      const old = G.pets.shift(), osp = this.spr[old.s.id];
      emit(old.x, old.y - osp.h / 2, 16, { sp: 40, life: 0.6, c: ['#ffffff', '#ffd0e0'] });
      this.toast(old.s.name.toUpperCase() + ' WENT HOME TO REST', 'YOU CAN ALWAYS TAME MORE', '#b9a6d8');
    }
  },

  // ------------------------------------------------------------ drawing
  pushItems(items, cx, cy) {
    for (const a of G.animals.concat(G.pets)) {
      const sp = this.spr[a.s.id];
      if (a.x + sp.w < cx || a.x - sp.w > cx + W || a.y + 6 < cy || a.y - sp.h > cy + H) continue;
      items.push({
        y: a.y, draw: () => {
          const fr = a.moving ? SEQ[Math.floor(a.anim) % 4] : 0;
          ell(ctx, 'rgba(0,0,0,0.25)', Math.round(a.x) - cx, Math.round(a.y) - cy, sp.w * 0.38, 2);
          ctx.drawImage(sp.frames[a.dir][fr], Math.round(a.x - sp.w / 2) - cx, Math.round(a.y) - sp.h - cy);
        }
      });
    }
  },
  lightHoles(dg, cx, cy) {
    for (const a of G.animals.concat(G.pets)) if (a.s.glow) hole(dg, a.x - cx, a.y - this.spr[a.s.id].h / 2 - cy, 30, 0.55);
  },
  drawGlows(cx, cy) {
    ctx.globalCompositeOperation = 'lighter';
    for (const a of G.animals.concat(G.pets)) {
      if (!a.s.glow) continue;
      const sp = this.spr[a.s.id], x = a.x - cx, y = a.y - sp.h / 2 - cy;
      if (x < -40 || x > W + 40 || y < -40 || y > H + 40) continue;
      const gr = ctx.createRadialGradient(x, y, 1, x, y, 22);
      const al = 0.28 * (0.8 + 0.2 * Math.sin(G.t * 3 + a.x));
      const c = a.s.glow;
      gr.addColorStop(0, c + Math.round(al * 255).toString(16).padStart(2, '0')); gr.addColorStop(1, c + '00');
      ctx.fillStyle = gr; ctx.fillRect(x - 24, y - 24, 48, 48);
    }
    ctx.globalCompositeOperation = 'source-over';
  },
  drawOverlay(cx, cy) {
    const p = G.p;
    for (const h of G.hearts) {
      ctx.globalAlpha = clamp(1.2 - h.t, 0, 1);
      ctx.drawImage(this.heart, Math.round(h.x) - cx - 3, Math.round(h.y - h.t * 14) - cy);
    }
    ctx.globalAlpha = 1;
    for (const a of G.animals) {
      const sp = this.spr[a.s.id], d = Math.hypot(a.x - p.x, a.y - p.y);
      if (d > 5.2 * T) continue;
      const lx = Math.round(a.x) - cx, ly = Math.round(a.y - sp.h) - cy - 10;
      const col = a.s.r === 'secret' ? SECRET_CYCLE[Math.floor(G.t * 4) % 6] : RARITY[a.s.r].col;
      textC(ctx, a.s.name, lx, ly, col, 1, '#1d1030');
      if (a.prog > 0.01) {
        rect(ctx, '#1d1030', lx - 15, ly - 7, 30, 5); rect(ctx, '#3b2a5a', lx - 14, ly - 6, 28, 3);
        rect(ctx, col, lx - 14, ly - 6, Math.round(28 * clamp(a.prog, 0, 1)), 3);
      } else if (d < TAME_R && a.state !== 'flee') {
        textC(ctx, 'HOLD F', lx, Math.round(a.y) - cy + 4, '#ffffff', 1, '#1d1030');
      }
    }
  },
  drawToasts() {
    G.toasts.forEach((q, i) => {
      const w = Math.max(textW(q.l1), textW(q.l2)) + 18, x = Math.round((W - w) / 2), y = 38 + i * 24;
      ctx.globalAlpha = clamp(q.t / 0.5, 0, 1);
      rect(ctx, 'rgba(24,12,44,0.9)', x, y, w, 21); box(ctx, x, y, w, 21, q.col);
      textC(ctx, q.l1, W / 2, y + 4, '#ffffff'); textC(ctx, q.l2, W / 2, y + 12, q.col);
      ctx.globalAlpha = 1;
    });
  },

  // ------------------------------------------------------------ Petdex
  updateDex(dt) {
    this.dexT += dt;
    let i = G.dexSel;
    if (hit('ArrowLeft', 'KeyA')) i = Math.max(0, i - 1);
    if (hit('ArrowRight', 'KeyD')) i = Math.min(SPECIES.length - 1, i + 1);
    if (hit('ArrowUp', 'KeyW')) i = Math.max(0, i - 5);
    if (hit('ArrowDown', 'KeyS')) i = Math.min(SPECIES.length - 1, i + 5);
    if (hit('PageDown', 'KeyE')) i = Math.min(SPECIES.length - 1, i + 15);
    if (hit('PageUp', 'KeyQ')) i = Math.max(0, i - 15);
    if (i !== G.dexSel) { G.dexSel = i; sfx.move(); }
  },
  drawDex() {
    rect(ctx, 'rgba(12,6,28,0.94)', 0, 0, W, H);
    box(ctx, 6, 6, W - 12, H - 12, '#f0c94d');
    text(ctx, 'PETDEX', 14, 12, '#f6d365', 2, '#5a2a10');
    const n = Object.keys(G.col).length;
    textR(ctx, 'TAMED ' + n + '/' + SPECIES.length, W - 14, 16, '#ffffff');
    const pg = Math.floor(G.dexSel / 15), pages = Math.ceil(SPECIES.length / 15);
    textC(ctx, 'PAGE ' + (pg + 1) + '/' + pages + '   Q / E: FLIP PAGE', W / 2, 16, '#9a88c0');
    SPECIES.forEach((s, i) => {
      if (Math.floor(i / 15) !== pg) return;
      const j = i % 15;
      const x = 12 + (j % 5) * 72, y = 30 + ((j / 5) | 0) * 46, got = G.col[s.id], sel = i === G.dexSel;
      const rc = s.r === 'secret' ? SECRET_CYCLE[Math.floor(this.dexT * 4) % 6] : RARITY[s.r].col;
      rect(ctx, '#241540', x, y, 68, 44);
      box(ctx, x, y, 68, 44, sel ? (Math.sin(this.dexT * 8) > 0 ? '#fff2a8' : '#f0c94d') : (got ? rc : '#3f3060'));
      const sp = this.spr[s.id], sc = (sp.w * 2 <= 62 && sp.h * 2 <= 30) ? 2 : 1, w = sp.w * sc, h = sp.h * sc;
      const bob = got && sel ? Math.round(Math.sin(this.dexT * 5) * 0.8) : 0;
      ctx.drawImage(got ? sp.frames.right[0] : sp.sil, Math.round(x + 34 - w / 2), y + 31 - h + bob, w, h);
      if (!got) textC(ctx, '?', x + 34, y + 8, '#6a5a90', 1);
      textC(ctx, got ? s.name : '???', x + 34, y + 34, got ? rc : '#6a5a90');
      if (got > 1) textR(ctx, 'X' + got, x + 65, y + 3, '#ffffff');
    });
    const s = SPECIES[G.dexSel], got = G.col[s.id];
    const rc = s.r === 'secret' ? SECRET_CYCLE[Math.floor(this.dexT * 4) % 6] : RARITY[s.r].col;
    rect(ctx, '#241540', 12, 169, W - 24, 28); box(ctx, 12, 169, W - 24, 28, '#5a4a8a');
    text(ctx, got ? s.name.toUpperCase() : '???', 18, 173, '#ffffff');
    textR(ctx, RARITY[s.r].name, W - 18, 173, rc);
    text(ctx, got ? s.desc : HINTS[s.r], 18, 184, got ? '#d9c2ff' : '#9a88c0');
    if (got && s.bio.length) textR(ctx, 'LIVES IN: ' + s.bio.map(r => REGION_NAMES[r]).slice(0, 2).join(', '), W - 18, 184, '#8ec8ff');
    textC(ctx, 'ARROWS: BROWSE   TAB / ESC: CLOSE', W / 2, 200, '#7a6aa0');
  }
};
