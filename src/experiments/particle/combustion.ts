import { grades } from '../../core/levels';
import { arrow, fig, group, line, path, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// ものの燃え方 (6 年生)。
// - combustion: びんの中でろうそくを燃やす。上と下にすき間があると空気が入れかわり、燃え続ける。
//   酸素の中でははげしく燃え、ちっ素や二酸化炭素の中ではすぐに消える
// - gascheck: 気体検知管で、燃やす前と後の空気の酸素・二酸化炭素の割合をはかる

export type Burn = 'soon' | 'later' | 'keep' | 'bright';

export function burn(gap: string, fill: string): Burn {
  if (fill === 'oxygen') return 'bright';
  if (fill === 'nitrogen' || fill === 'co2') return 'soon';
  if (gap === 'both') return 'keep';
  if (gap === 'top') return 'later';
  return 'soon';
}

function combustionScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const gap = String(c.gap ?? 'none');
  const fill = String(c.fill ?? 'air');
  const r = result === null ? 'keep' : String(result);
  // 火の大きさ: すぐ消える・しばらくして消える・燃え続ける・はげしく燃える
  const life = result === null ? 1 : r === 'soon' ? Math.max(0, 1 - p * 3) : r === 'later' ? Math.max(0, 1 - Math.max(0, p - 0.5) * 2) : 1;
  const size = (r === 'bright' ? 1.8 : 1) * life;
  const L = 110;
  const R = 210;
  const flame = size > 0.02 ? path(`M${160 - 7 * size} 128Q${160 - 6 * size} ${128 - 16 * size} 160 ${128 - 32 * size}Q${160 + 6 * size} ${128 - 16 * size} ${160 + 7 * size} 128Z`, 'flame') : '';
  const smoke = result !== null && size <= 0.02 ? path('M160 128q-6 -10 0 -20t0 -20', 'ln thin steam') : '';
  // 空気の流れ (すき間が上と下にあるとき)
  const flow = result !== null && gap === 'both' && fill === 'air' ? arrow(96, 186, 130, 176, 'ln thin smoke') + arrow(170, 40, 190, 18, 'ln thin smoke') : '';
  return fig(
    320,
    230,
    `${{ air: '空気', oxygen: '酸素', nitrogen: 'ちっ素', co2: '二酸化炭素' }[fill]}の入ったびんで、すき間${{ none: 'なし', top: '上だけ', bottom: '下だけ', both: '上と下' }[gap]}にしてろうそくを燃やす`,
    rect(L - 20, 180, R - L + 40, 12, 'clay', 3),
    // 下のすき間は、ねん土を一部けずって作る
    gap === 'bottom' || gap === 'both' ? rect(L - 4, 180, 16, 12, 'mask') + rect(R - 12, 180, 16, 12, 'mask') : '',
    path(`M${L} 180V60Q${L} 40 140 40V30H180V40Q${R} 40 ${R} 60V180`, 'glass-jar'),
    gap === 'none' || gap === 'bottom' ? rect(132, 22, 56, 8, 'wood', 2) : rect(150, 22, 38, 8, 'wood', 2),
    rect(152, 128, 16, 52, 'paperfill', 2),
    line(160, 128, 160, 122, 'ln thin'),
    flame,
    smoke,
    flow,
    result !== null && p >= 1 ? text(160, 222, { soon: 'すぐに消えた', later: 'しばらくして消えた', keep: '燃え続けた', bright: 'はげしく燃えた' }[r] ?? '', { cls: r === 'soon' || r === 'later' ? 'result-no' : 'result-yes' }) : '',
  );
}

export const combustion: Experiment = {
  id: 'combustion',
  field: 'particle',
  label: 'ものの燃(も)え方(かた)',
  summary: 'びんのすき間の位置や、中の気体を変えて、ろうそくの燃え方を調べよう',
  setup: 'ねん土にろうそくを立てて火をつけ、底のないびんをかぶせます。ふたや、ねん土のすき間を作るところを変えて、ろうそくが燃え続けるかを調べます。びんの中を酸素・ちっ素・二酸化炭素で満たして燃やすこともできます。線香のけむりで、空気の動きも見ます。',
  variables: [
    {
      key: 'gap',
      kind: 'choice',
      label: 'すき間',
      options: [
        { value: 'none', label: 'なし（ふたをする）' },
        { value: 'top', label: '上だけ' },
        { value: 'bottom', label: '下だけ' },
        { value: 'both', label: '上と下' },
      ],
      initial: 'none',
    },
    {
      key: 'fill',
      kind: 'choice',
      label: 'びんの中の気体(きたい)',
      options: [
        { value: 'air', label: '空気' },
        { value: 'oxygen', label: '酸素(さんそ)' },
        { value: 'nitrogen', label: 'ちっ素' },
        { value: 'co2', label: '二酸化炭素(にさんかたんそ)' },
      ],
      initial: 'air',
    },
  ],
  measure: {
    kind: 'category',
    label: 'ろうそくの燃え方',
    options: [
      { value: 'soon', label: 'すぐに消える' },
      { value: 'later', label: 'しばらくして消える' },
      { value: 'keep', label: '燃え続ける' },
      { value: 'bright', label: 'はげしく燃える' },
    ],
  },
  simulate: (c) => burn(String(c.gap ?? 'none'), String(c.fill ?? 'air')),
  scene: combustionScene,
  duration: 2400,
};

// ---- 気体検知管 ----

/** 空気中の酸素・二酸化炭素の割合 (%)。燃やしたあとは、びんの中のろうそくが消えたとき */
export function gasPercent(gas: string, timing: string): number {
  if (gas === 'oxygen') return timing === 'after' ? 17 : 21;
  return timing === 'after' ? 3 : 0.04;
}

function gascheckScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const o2 = c.gas === 'oxygen';
  const after = c.timing === 'after';
  const v = typeof result === 'number' ? result : 0;
  const k = result === null ? 0 : Math.min(1, p * 1.4);
  // 検知管の目もり (酸素は 0〜24%、二酸化炭素は 0〜4%)
  const max = o2 ? 24 : 4;
  const color = (v / max) * 150 * k;
  return fig(
    320,
    200,
    `燃やす${after ? '後' : '前'}の空気の${o2 ? '酸素' : '二酸化炭素'}を気体検知管ではかる`,
    path('M40 180V80Q40 60 60 60H90Q110 60 110 80V180Z', 'glass-jar'),
    after ? rect(68, 150, 14, 30, 'paperfill', 2) + line(75, 150, 75, 144, 'ln thin') : '',
    group(150, 100, rect(0, -10, 160, 20, 'glass-tube', 8), rect(4, -6, color, 12, o2 ? 'tube-o2' : 'tube-co2', 4)),
    ...Array.from({ length: 5 }, (_, i) => text(154 + i * 37.5, 128, String((max / 4) * i), { cls: 'tiny' })),
    text(230, 146, '%', { cls: 'tiny' }),
    line(110, 100, 150, 100, 'ln'),
    typeof result === 'number' && p >= 1 ? text(230, 60, `${o2 ? '酸素' : '二酸化炭素'} ${result}%`, { cls: 'result-yes' }) : '',
  );
}

export const gascheck: Experiment = {
  id: 'gascheck',
  field: 'particle',
  label: '燃(も)やす前(まえ)と後(あと)の空気(くうき)',
  summary: '気体検知管で、ろうそくを燃やす前と後の空気の酸素・二酸化炭素の割合を調べよう',
  setup: 'びんの中の空気を、気体検知管ではかります。燃やす前の空気と、ふたをしたびんの中でろうそくを燃やして火が消えたあとの空気で、酸素と二酸化炭素の割合（％）をくらべます。',
  variables: [
    {
      key: 'gas',
      kind: 'choice',
      label: 'はかる気体',
      options: [
        { value: 'oxygen', label: '酸素(さんそ)' },
        { value: 'co2', label: '二酸化炭素(にさんかたんそ)' },
      ],
      initial: 'oxygen',
    },
    {
      key: 'timing',
      kind: 'choice',
      label: 'はかる空気',
      options: [
        { value: 'before', label: '燃やす前' },
        { value: 'after', label: '燃やした後' },
      ],
      initial: 'before',
    },
  ],
  measure: { kind: 'number', label: '気体の割合', unit: '%', digits: 2 },
  simulate: (c) => gasPercent(String(c.gas ?? 'oxygen'), String(c.timing ?? 'before')),
  scene: gascheckScene,
  duration: 1200,
};

export const combustionMissions: Mission[] = [
  {
    id: 'burn-gap',
    exp: 'combustion',
    levels: grades(6),
    question: 'びんの中でろうそくが燃え続けるのは、すき間がどこにあるとき？',
    choices: ['上だけ', '下だけ', '上と下', 'すき間がなくても燃え続ける'],
    answer: 2,
    target: 'gap',
    start: { fill: 'air' },
    lock: ['fill'],
    need: { key: 'gap', distinct: 4 },
    finding: '上と下にすき間があると、下から新しい空気が入り、燃えたあとの空気が上から出ていくので、燃え続ける。すき間がないと、やがて火は消える。',
    conclusions: [
      { text: '調べた4つのうち、燃え続けたのは上と下にすき間があるときだけだった', ok: true, why: '4つの条件をくらべた結果どおり。' },
      { text: 'すき間が1つでもあれば、ろうそくは燃え続ける', ok: false, why: '上だけ・下だけのときは、やがて消えた。' },
      { text: 'すき間がないと、ろうそくはすぐに燃えなくなるので、びんの中の酸素は0％になる', ok: false, why: '火が消えたあとも、酸素は17％ほど残っている（気体検知管の実験）。' },
    ],
  },
  {
    id: 'burn-gas',
    exp: 'combustion',
    levels: grades(6),
    question: '酸素(さんそ)を満たしたびんの中でろうそくを燃やすと？',
    choices: ['空気中よりはげしく燃える', 'すぐに消える', '空気中と同じ'],
    answer: 0,
    target: 'fill',
    start: { gap: 'none' },
    lock: ['gap'],
    need: { key: 'fill', distinct: 3, among: ['air', 'oxygen', 'nitrogen', 'co2'] },
    finding: '酸素の中ではろうそくがはげしく燃えた。ちっ素や二酸化炭素の中ではすぐに消えた。酸素には、物を燃やすはたらきがある。',
  },
  {
    id: 'gas-after',
    exp: 'gascheck',
    levels: grades(6),
    question: 'ろうそくが燃えたあとの空気は、燃やす前とくらべて、酸素(さんそ)と二酸化炭素(にさんかたんそ)の割合がどう変わる？',
    choices: ['酸素がへり、二酸化炭素がふえる', '酸素がふえ、二酸化炭素がへる', 'どちらも変わらない'],
    answer: 0,
    target: 'timing',
    need: { key: 'timing', distinct: 2, fair: false },
    finding: '燃やす前は酸素が約21％、二酸化炭素が約0.04％。燃やしたあとは、酸素が約17％にへり、二酸化炭素が約3％にふえた。ろうそくが燃えると、酸素の一部が使われ、二酸化炭素ができる。',
    hint: '酸素と二酸化炭素の両方を、燃やす前と後ではかろう',
    conclusions: [
      { text: '燃えたあとも酸素は17％ほど残っていた。酸素がすべてなくなるわけではない', ok: true, why: '気体検知管の値にもとづいている。' },
      { text: '酸素がすべて二酸化炭素に変わった', ok: false, why: '燃やしたあとも酸素は残っていた。' },
      { text: '二酸化炭素がふえたのは、ちっ素が二酸化炭素に変わったから', ok: false, why: 'へったのは酸素。ちっ素は燃焼にかかわらない。' },
    ],
  },
];
