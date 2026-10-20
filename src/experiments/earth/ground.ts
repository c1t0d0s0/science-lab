import { grades } from '../../core/levels';
import { arrow, circle, fig, group, line, path, polygon, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission, Option } from '../types';

// 地面のようす。
// - groundtemp (3 年生): 日なたの地面は日光であたためられ、日かげより温度が高い。朝より昼のほうが高い
// - drainage (4 年生): つぶが大きい土ほど、水が早くしみこむ
// - flow (4 年生): 雨水は、地面の高いところから低いところへ流れる

// ---- 日なたと日かげ ----

const GROUND: Record<string, Record<string, number>> = { sun: { '9': 16, '12': 26 }, shade: { '9': 13, '12': 15 } };

export function groundTemp(place: string, time: string): number {
  return GROUND[place]?.[time] ?? 15;
}

function groundScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const sun = c.place === 'sun';
  const noon = c.time === '12';
  const t = typeof result === 'number' ? 10 + (result - 10) * Math.min(1, p * 1.4) : 10;
  return fig(
    320,
    200,
    `${noon ? '正午' : '午前9時'}の${sun ? '日なた' : '日かげ'}の地面の温度をはかる`,
    circle(noon ? 160 : 60, noon ? 26 : 50, 14, 'sun'),
    sun ? '' : rect(180, 40, 120, 110, 'wall') + polygon([[180, 150], [300, 150], [260, 170], [140, 170]], 'shadow-area'),
    rect(0, 150, 320, 50, 'ground'),
    // 温度計 (液だめを土にうめて、おおいをかける)
    group(sun ? 100 : 240, 70, rect(-5, 0, 10, 90, 'glass-tube', 5), rect(-2, 90 - t * 2.4, 4, t * 2.4, 'hot'), circle(0, 92, 6, 'hot'), rect(-12, 74, 24, 10, 'paperfill', 2)),
    text(sun ? 120 : 260, 80, sun ? '日なた' : '日かげ', { anchor: 'start', cls: 'tiny' }),
    typeof result === 'number' && p >= 1 ? text(20, 190, `地面の温度 ${result}℃`, { anchor: 'start', cls: 'result-yes' }) : '',
  );
}

export const groundtemp: Experiment = {
  id: 'groundtemp',
  field: 'earth',
  label: '日(ひ)なたと日(ひ)かげの地面(じめん)',
  summary: '日なたと日かげで、朝と昼の地面の温度をくらべよう',
  setup: '日なたと日かげに、地面を少しほって温度計の液だめをうめ、日光が直せつ当たらないようにおおいをかけます。午前9時と正午に、地面の温度をはかってくらべます。地面を手でさわって、あたたかさもくらべます。',
  variables: [
    { key: 'place', kind: 'choice', label: 'はかる場所', options: [{ value: 'sun', label: '日なた' }, { value: 'shade', label: '日かげ' }], initial: 'sun' },
    { key: 'time', kind: 'choice', label: '時(じ)こく', options: [{ value: '9', label: '午前(ごぜん)9時(じ)' }, { value: '12', label: '正午(しょうご)' }], initial: '9' },
  ],
  measure: { kind: 'number', label: '地面の温度', unit: '℃', digits: 0 },
  simulate: (c) => groundTemp(String(c.place ?? 'sun'), String(c.time ?? '9')),
  scene: groundScene,
  duration: 1200,
};

// ---- 雨水のゆくえ ----

interface Soil extends Option {
  seconds: number;
  grain: number;
}

const SOILS: Soil[] = [
  { value: 'gravel', label: 'じゃり（つぶが大きい）', seconds: 5, grain: 7 },
  { value: 'sand', label: '砂場(すなば)の砂（つぶが中くらい）', seconds: 20, grain: 3 },
  { value: 'soil', label: '校庭(こうてい)の土（つぶが小さい）', seconds: 120, grain: 1.4 },
];

export function soakTime(soil: string): number {
  return (SOILS.find((s) => s.value === soil) ?? SOILS[0]).seconds;
}

function drainageScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const s = SOILS.find((x) => x.value === c.soil) ?? SOILS[0];
  const k = result === null ? 0 : Math.min(1, p);
  const grains: string[] = [];
  for (let y = 96; y < 170; y += s.grain * 2 + 1) for (let x = 124 + ((y / 3) % 2) * s.grain; x < 196; x += s.grain * 2 + 1) grains.push(circle(x, y, s.grain, s.value === 'gravel' ? 'stone' : s.value === 'sand' ? 'sand' : 'soil-grain'));
  const waterTop = 70;
  const waterH = 22 * (1 - k);
  return fig(
    320,
    210,
    `${s.label.replace(/（.*/, '')}に水を注いで、しみこむ時間をはかる`,
    path('M118 60V174Q118 180 124 180H196Q202 180 202 174V60', 'ln'),
    ...grains,
    waterH > 0 ? rect(120, waterTop + 22 - waterH, 80, waterH, 'water') : '',
    // 下にたまった水
    rect(130, 186, 60, 4 + 14 * k, 'water'),
    path('M126 182L150 196H170L194 182', 'ln thin'),
    typeof result === 'number' && p >= 1 ? text(300, 30, `${result}秒でしみこんだ`, { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const drainage: Experiment = {
  id: 'drainage',
  field: 'earth',
  label: '雨水(あまみず)のしみこみ方',
  summary: 'つぶの大きさのちがう土に水を注いで、しみこむ時間をくらべよう',
  setup: 'そこに小さなあなをあけたプラスチックのコップに、同じ量のじゃり・砂場の砂・校庭の土を入れます。上から同じ量の水を注いで、水が全部しみこむまでの時間をはかります。',
  variables: [{ key: 'soil', kind: 'choice', label: 'コップに入れるもの', options: SOILS, initial: 'gravel' }],
  measure: { kind: 'number', label: '水がしみこむまでの時間', unit: '秒', digits: 0 },
  simulate: (c) => soakTime(String(c.soil ?? 'gravel')),
  scene: drainageScene,
  duration: 1800,
};

// ---- 地面のかたむきと水の流れ ----

export function flowTo(high: string): 'left' | 'right' {
  return high === 'left' ? 'right' : 'left';
}

function flowScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const highLeft = c.high === 'left';
  const k = result === null ? 0 : Math.min(1, p);
  const yl = highLeft ? 110 : 150;
  const yr = highLeft ? 150 : 110;
  // 低いほうのはしに、水がたまっていく
  const pool = result === null ? '' : rect(highLeft ? 320 - 80 * k : 0, (highLeft ? yr : yl) - 6, 80 * k, 6, 'water');
  return fig(
    320,
    200,
    `${highLeft ? '左' : '右'}が高い地面に雨がふる`,
    polygon([[0, yl], [320, yr], [320, 200], [0, 200]], 'ground'),
    ...[60, 120, 180, 240].map((x) => line(x, 20 + ((p * 200 + x) % 60), x - 6, 34 + ((p * 200 + x) % 60), 'ln thin wind')),
    pool,
    result !== null && k > 0.2 ? arrow(highLeft ? 110 : 210, (yl + yr) / 2 - 14, highLeft ? 210 : 110, (yl + yr) / 2 - 2, 'ln red') : '',
    text(highLeft ? 30 : 290, highLeft ? 100 : 100, '高い', { cls: 'tiny' }),
    text(highLeft ? 290 : 30, 140, '低い', { cls: 'tiny' }),
    result !== null && p >= 1 ? text(160, 190, `${result === 'right' ? '右' : '左'}（低いほう）に流れて、たまった`, { cls: 'result-yes small' }) : '',
  );
}

export const flow: Experiment = {
  id: 'flow',
  field: 'earth',
  label: '地面(じめん)のかたむきと雨水(あまみず)',
  summary: '地面のかたむきを変えて、雨水がどちらへ流れるか調べよう',
  setup: '雨がふった校庭で、水が流れているところの地面のかたむきを、ビー玉やトレーに入れた水の面で調べます。どちらが高く、水がどちらへ流れて、どこにたまるかを見ます。',
  variables: [{ key: 'high', kind: 'choice', label: '高いほう', options: [{ value: 'left', label: '左が高い' }, { value: 'right', label: '右が高い' }], initial: 'left' }],
  measure: {
    kind: 'category',
    label: '雨水の流れる向き',
    options: [
      { value: 'left', label: '左へ流れる' },
      { value: 'right', label: '右へ流れる' },
    ],
  },
  simulate: (c) => flowTo(String(c.high ?? 'left')),
  scene: flowScene,
  duration: 1600,
};

export const groundMissions: Mission[] = [
  {
    id: 'ground-sun',
    exp: 'groundtemp',
    levels: grades(3),
    question: '日なたと日かげ、地面の温度(おんど)が高いのはどっち？',
    choices: ['日なた', '日かげ', '同じ'],
    answer: 0,
    target: 'place',
    need: { key: 'place', distinct: 2 },
    finding: '日なたの地面は、日光であたためられるので、日かげより温度が高い。さわっても、日なたのほうがあたたかい。',
  },
  {
    id: 'ground-noon',
    exp: 'groundtemp',
    levels: grades(3),
    question: '日なたの地面の温度(おんど)を、午前9時と正午でくらべると？',
    choices: ['正午のほうが高い', '午前9時のほうが高い', '同じ'],
    answer: 0,
    target: 'time',
    start: { place: 'sun' },
    lock: ['place'],
    need: { key: 'time', distinct: 2 },
    finding: '日なたの地面は、日光が当たり続けるので、正午のほうが温度が高くなる。日かげの地面は、温度があまり変わらない。',
  },
  {
    id: 'drain-fast',
    exp: 'drainage',
    levels: grades(4),
    question: '水がいちばん早くしみこむのはどれ？',
    choices: ['じゃり', '砂場の砂', '校庭の土'],
    answer: 0,
    target: 'soil',
    need: { key: 'soil', distinct: 3 },
    finding: 'つぶの大きいじゃりがいちばん早く、つぶの小さい校庭の土がいちばんおそくしみこんだ。土のつぶが大きいほど、水はしみこみやすい。',
  },
  {
    id: 'flow-low',
    exp: 'flow',
    levels: grades(4),
    question: '雨水は、地面のどちらへ流れる？',
    choices: ['高いところから低いところへ', '低いところから高いところへ', '流れずに止まったまま'],
    answer: 0,
    target: 'high',
    need: { key: 'high', distinct: 2 },
    finding: '雨水は、地面の高いところから低いところへ流れ、低いところにたまる。',
  },
];
