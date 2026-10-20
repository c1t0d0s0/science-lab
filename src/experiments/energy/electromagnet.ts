import { grades } from '../../core/levels';
import type { Rng } from '../../core/rng';
import { fig, group, line, path, rect, text } from '../../diagrams/svg';
import { gauss } from '../noise';
import type { Experiment, Mission } from '../types';

// 電磁石の強さ。コイルの巻き数が多いほど、電流が大きいほど強くなる。鉄しんを入れると強くなる。
// 巻き数を変えるときは、導線の長さをそろえる (あまった導線は切らずにまとめておく)。

/** 引きつけるクリップの数 */
export function clips(turns: number, batteries: number, core: string, rng?: Rng): number {
  const base = 6 * (turns / 100) * batteries * (core === 'iron' ? 1 : 0.15);
  const n = base + (rng ? gauss(rng) * Math.max(0.6, base * 0.1) : 0);
  return Math.max(0, Math.round(n));
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const turns = Number(c.turns ?? 100);
  const batteries = Number(c.batteries ?? 1);
  const iron = c.core === 'iron';
  const count = typeof result === 'number' ? Math.round(result * Math.min(1, p * 1.4)) : 0;
  const loops = Math.round(turns / 12);
  const coilL = 70;
  const coilR = 210;
  const coil = Array.from({ length: loops }, (_, i) => {
    const x = coilL + ((coilR - coilL) * (i + 0.5)) / loops;
    return path(`M${x - 3} 64Q${x + 4} 80 ${x - 3} 96`, 'ln coil');
  }).join('');
  const clipSvg = Array.from({ length: Math.min(count, 24) }, (_, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    return group(230 + col * 14, 86 + row * 16, path('M-4 0V9A3 3 0 0 0 2 9V2', 'ln thin iron-line'));
  }).join('');
  const batteriesSvg = Array.from({ length: batteries }, (_, i) =>
    group(110 + i * 54, 170, rect(-24, -10, 48, 20, 'battery', 3), rect(24, -4, 5, 8, 'battery-tip', 1)),
  ).join('');
  return fig(
    320,
    210,
    `巻き数${turns}回、かん電池${batteries}こ、鉄しん${iron ? 'あり' : 'なし'}の電磁石`,
    iron ? rect(54, 72, 176, 16, 'iron', 3) : rect(54, 72, 176, 16, 'tube', 3),
    coil,
    path(`M${coilL} 96V170H86M${coilR} 96V170H${110 + (batteries - 1) * 54 + 29}`, 'ln wire'),
    batteries === 2 ? line(134, 170, 140, 170, 'ln wire') : '',
    batteriesSvg,
    clipSvg,
    text(20, 30, `巻き数 ${turns}回`, { anchor: 'start', cls: 'small' }),
    result !== null && p >= 1 ? text(300, 30, `クリップ ${result}こ`, { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const electromagnet: Experiment = {
  id: 'electromagnet',
  field: 'energy',
  label: '電磁石(でんじしゃく)の強(つよ)さ',
  summary: 'コイルの巻き数・電流の大きさ・鉄しんを変えて、電磁石の強さを調べよう',
  setup: '鉄しん（鉄のくぎ）にどう線を巻(ま)いてコイルを作り、かん電池につなぐと電磁石(でんじしゃく)になります。電磁石のはしに、いくつクリップが引きつけられるかで強さをくらべます。どう線の長さはどれも同じです。',
  variables: [
    { key: 'turns', kind: 'range', label: 'コイルの巻(ま)き数(すう)', min: 50, max: 200, step: 50, unit: '回', initial: 100 },
    { key: 'batteries', kind: 'range', label: 'かん電池(でんち)（直列(ちょくれつ)）', min: 1, max: 2, step: 1, unit: 'こ', initial: 1 },
    {
      key: 'core',
      kind: 'choice',
      label: '鉄(てつ)しん',
      options: [
        { value: 'iron', label: '入れる' },
        { value: 'none', label: '入れない' },
      ],
      initial: 'iron',
    },
  ],
  measure: { kind: 'number', label: '引(ひ)きつけたクリップの数(かず)', unit: 'こ', digits: 0 },
  simulate: (c, rng) => clips(Number(c.turns ?? 100), Number(c.batteries ?? 1), String(c.core ?? 'iron'), rng),
  scene,
  duration: 1200,
};

export const electromagnetMissions: Mission[] = [
  {
    id: 'em-turns',
    exp: 'electromagnet',
    levels: grades(5),
    question: 'コイルの巻(ま)き数(すう)を多くすると、電磁石(でんじしゃく)の強さは？',
    choices: ['強くなる', '弱くなる', '変わらない'],
    answer: 0,
    target: 'turns',
    need: { key: 'turns', distinct: 3 },
    finding: 'コイルの巻き数が多いほど、電磁石は強くなる（引きつけるクリップがふえる）。',
    hint: '巻き数を変えるときは、導線の長さもそろえよう（あまった導線は切らずにまとめておく）',
  },
  {
    id: 'em-current',
    exp: 'electromagnet',
    levels: grades(5),
    question: 'かん電池(でんち)を2こ直列(ちょくれつ)にして電流を大きくすると、電磁石(でんじしゃく)の強さは？',
    choices: ['強くなる', '弱くなる', '変わらない'],
    answer: 0,
    target: 'batteries',
    need: { key: 'batteries', distinct: 2 },
    finding: '流れる電流が大きいほど、電磁石は強くなる。',
  },
  {
    id: 'em-core',
    exp: 'electromagnet',
    levels: grades(5),
    question: 'コイルに鉄(てつ)しんを入れないと、電磁石(でんじしゃく)の強さは？',
    choices: ['強くなる', '弱くなる', '変わらない'],
    answer: 1,
    target: 'core',
    need: { key: 'core', distinct: 2 },
    finding: '鉄しんを入れないと、電磁石はとても弱くなる。鉄しんを入れると、鉄しんが磁石になって強くなる。',
  },
  {
    id: 'em-double',
    exp: 'electromagnet',
    levels: grades(6),
    question: '巻(ま)き数を100回から200回にすると、引きつけるクリップの数はどうなる？',
    choices: ['およそ2倍になる', 'およそ4倍になる', '変わらない', '少なくなる'],
    answer: 0,
    target: 'turns',
    noise: true,
    need: { key: 'turns', distinct: 2, among: [100, 200], repeat: 3 },
    finding: '3回ずつはかった平均をくらべると、巻き数を2倍にすると、引きつけるクリップの数もおよそ2倍になった。',
    hint: '100回と200回で、3回ずつはかろう。クリップの数は、はかるたびに少しちがうよ',
    conclusions: [
      { text: '調べた範囲では、巻き数を2倍にするとクリップの数はおよそ2倍になった', ok: true, why: '平均をくらべた、データにもとづく言い方になっている。' },
      { text: '巻き数をいくらでもふやせば、電磁石はどこまでも強くなる', ok: false, why: '調べたのは100回と200回だけ。調べていない範囲まで言いすぎている。' },
      { text: 'はかるたびに数がちがうので、巻き数と強さには関係がない', ok: false, why: '1回ごとのばらつきはあるが、平均をくらべるとはっきりした差がある。' },
    ],
  },
];

// ---- 電磁石の極 ----

/** 電磁石の左はしの極。電流の向きを反対にすると、N極とS極が入れかわる */
export function emLeftPole(direction: string): 'N' | 'S' {
  return direction === 'reverse' ? 'S' : 'N';
}

function compass(x: number, y: number, pointLeft: boolean | null): string {
  // N 極 (赤) が電磁石の S 極に引きつけられる。null なら北 (上) を指す
  const rot = pointLeft === null ? 0 : pointLeft ? -90 : 90;
  return group(x, y, `<circle class="box" cx="0" cy="0" r="18"/><g transform="rotate(${rot})"><path class="pole-n" d="M0 -14L4 0H-4Z"/><path class="pole-s" d="M0 14L4 0H-4Z"/></g>`);
}

function emPoleScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const left = result === null ? null : emLeftPole(String(c.direction));
  const on = result !== null && p > 0.2;
  const loops = Array.from({ length: 10 }, (_, i) => path(`M${94 + i * 13} 74Q${101 + i * 13} 90 ${94 + i * 13} 106`, 'ln coil')).join('');
  // 左はしが N 極なら、左の方位磁針は S 極が引かれて N 極が左 (外) を向き、
  // 右はし (S 極) の方位磁針は N 極が引かれて左 (電磁石のほう) を向く。どちらも N 極は左を向く
  const needle = on ? left === 'N' : null;
  return fig(
    320,
    210,
    `電流の向きを${c.direction === 'reverse' ? '反対' : 'ふつう'}にした電磁石の両はしに方位磁針を置く`,
    rect(84, 82, 152, 16, 'iron', 3),
    loops,
    path('M94 106V170H140M226 106V170H180', 'ln wire'),
    group(160, 170, rect(-20, -9, 40, 18, 'battery', 3), c.direction === 'reverse' ? rect(-25, -4, 5, 8, 'battery-tip', 1) : rect(20, -4, 5, 8, 'battery-tip', 1)),
    compass(50, 90, needle),
    compass(270, 90, needle),
    on && p >= 1 ? text(84, 60, `${left}極`, { cls: 'result-yes' }) + text(236, 60, `${left === 'N' ? 'S' : 'N'}極`, { cls: 'result-yes' }) : '',
  );
}

export const empole: Experiment = {
  id: 'empole',
  field: 'energy',
  label: '電磁石(でんじしゃく)の極(きょく)',
  summary: '電流の向きを変えて、電磁石のN極・S極を方位磁針で調べよう',
  setup: '鉄しんを入れたコイルをかん電池につないで電磁石にし、両はしに方位磁針を置きます。方位磁針のはりの向きから、電磁石のどちらのはしがN極かを調べます。かん電池の向きを反対にすると、電流の向きが反対になります。',
  variables: [
    {
      key: 'direction',
      kind: 'choice',
      label: '電流(でんりゅう)の向き',
      options: [
        { value: 'normal', label: 'ふつう' },
        { value: 'reverse', label: '反対(はんたい)' },
      ],
      initial: 'normal',
    },
  ],
  measure: {
    kind: 'category',
    label: '電磁石の左はし',
    options: [
      { value: 'N', label: 'N極' },
      { value: 'S', label: 'S極' },
    ],
  },
  simulate: (c) => emLeftPole(String(c.direction ?? 'normal')),
  scene: emPoleScene,
  duration: 1000,
};

export const empoleMissions: Mission[] = [
  {
    id: 'empole-reverse',
    exp: 'empole',
    levels: grades(5),
    question: '電流(でんりゅう)の向きを反対にすると、電磁石(でんじしゃく)のN極とS極は？',
    choices: ['入れかわる', '変わらない', 'なくなる'],
    answer: 0,
    target: 'direction',
    need: { key: 'direction', distinct: 2 },
    finding: '電磁石にも、棒磁石と同じようにN極とS極がある。電流の向きを反対にすると、N極とS極が入れかわる。',
  },
];
