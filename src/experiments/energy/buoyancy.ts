import { grades } from '../../core/levels';
import { fig, group, line, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// 浮力 (6 年生・中学受験)。液体に入れた物は、おしのけた液体の重さだけ軽くなる (アルキメデスの原理)。
// 水 1cm³ は 1g、このこい食塩水 1cm³ は 1.2g。

const DENSITY: Record<string, number> = { alu: 2.7, iron: 7.9 };
const LIQUID: Record<string, number> = { air: 0, water: 1, salt: 1.2 };

/** ばねばかりの目もり (g) */
export function scaleReading(volume: number, material: string, liquid: string): number {
  const weight = volume * (DENSITY[material] ?? 2.7);
  const buoy = volume * (LIQUID[liquid] ?? 0);
  return Math.round((weight - buoy) * 10) / 10;
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const v = Number(c.volume ?? 100);
  const liquid = String(c.liquid ?? 'air');
  const iron = c.material === 'iron';
  const side = 14 + Math.cbrt(v) * 3.4;
  const k = result === null ? 0 : Math.min(1, p * 1.5);
  const dip = liquid === 'air' ? 0 : 60 * k;
  const objTop = 96 + dip;
  return fig(
    320,
    220,
    `体積${v}cm³の${iron ? '鉄' : 'アルミニウム'}を${{ air: '空気中', water: '水', salt: '食塩水' }[liquid]}でばねばかりにつるす`,
    rect(110, 10, 100, 8, 'wood', 2),
    // ばねばかり
    group(160, 18, rect(-12, 0, 24, 54, 'box', 4), line(0, 54, 0, objTop - 72 + 54 + 18, 'ln')),
    rect(160 - side / 2, objTop, side, side, iron ? 'iron' : 'alu', 3),
    liquid === 'air' ? '' : rect(100, 140, 120, 66, liquid === 'salt' ? 'water salt-water' : 'water') + rect(98, 120, 124, 88, 'ln', 6),
    text(240, 200, `${v}cm³`, { anchor: 'start', cls: 'tiny' }),
    typeof result === 'number' && p >= 1 ? text(20, 40, `ばねばかり ${result}g`, { anchor: 'start', cls: 'result-yes' }) : '',
  );
}

export const buoyancy: Experiment = {
  id: 'buoyancy',
  field: 'energy',
  label: '浮力(ふりょく)',
  summary: '物をばねばかりにつるして水や食塩水に入れ、軽くなる分（浮力）を調べよう',
  setup: '金ぞくのおもりをばねばかりにつるし、空気中と、水や食塩水の中に全部しずめたときの目もりをはかります。目もりが軽くなった分が、物が液体から受ける上向きの力（浮力）です。水1cm³は1g、この食塩水1cm³は1.2gです。',
  variables: [
    { key: 'volume', kind: 'range', label: 'おもりの体積', min: 50, max: 200, step: 50, unit: 'cm³', initial: 100 },
    {
      key: 'material',
      kind: 'choice',
      label: 'おもりの金ぞく',
      options: [
        { value: 'alu', label: 'アルミニウム（1cm³で2.7g）' },
        { value: 'iron', label: '鉄（1cm³で7.9g）' },
      ],
      initial: 'alu',
    },
    {
      key: 'liquid',
      kind: 'choice',
      label: 'つるす場所',
      options: [
        { value: 'air', label: '空気中' },
        { value: 'water', label: '水の中' },
        { value: 'salt', label: '食塩水の中' },
      ],
      initial: 'air',
    },
  ],
  measure: { kind: 'number', label: 'ばねばかりの目もり', unit: 'g', digits: 0 },
  simulate: (c) => scaleReading(Number(c.volume ?? 100), String(c.material ?? 'alu'), String(c.liquid ?? 'air')),
  scene,
  duration: 1200,
};

export const buoyancyMissions: Mission[] = [
  {
    id: 'buoy-water',
    exp: 'buoyancy',
    levels: grades(6),
    exam: true,
    question: '体積100cm³のアルミニウムのおもりを水に全部しずめると、ばねばかりの目もりは何gへる？',
    choices: ['100g', '270g', '50g', 'へらない'],
    answer: 0,
    target: 'liquid',
    start: { volume: 100, material: 'alu' },
    lock: ['volume', 'material'],
    need: { key: 'liquid', distinct: 2, among: ['air', 'water'] },
    finding: '空気中で270g、水の中で170g。100gへった。おしのけた水（100cm³＝100g）の重さだけ、上向きの力（浮力）を受ける。',
  },
  {
    id: 'buoy-material',
    exp: 'buoyancy',
    levels: grades(6),
    exam: true,
    question: '同じ体積のアルミニウムと鉄を水にしずめると、受ける浮力(ふりょく)はどうなる？',
    choices: ['同じ', '重い鉄のほうが大きい', '軽いアルミニウムのほうが大きい'],
    answer: 0,
    target: 'material',
    start: { volume: 100, liquid: 'water' },
    lock: ['volume'],
    need: { key: 'material', distinct: 2, fair: false },
    finding: 'アルミニウムも鉄も、水に入れると100gずつ軽くなった。浮力は物の重さではなく、物の体積（おしのけた液体の体積）で決まる。',
    hint: 'それぞれ、空気中と水の中の両方ではかって、へった分をくらべよう',
    conclusions: [
      { text: '体積が同じなら、金ぞくの種類がちがっても浮力は同じだった', ok: true, why: 'へった重さ（浮力）をくらべていて、データと合っている。' },
      { text: '水の中の目もりは鉄のほうが大きいので、鉄のほうが浮力が大きい', ok: false, why: '目もりそのものではなく、空気中からへった分が浮力。へった分は同じ。' },
      { text: '重い物ほど、水の中では軽くなりにくい', ok: false, why: 'どちらも同じ100g軽くなった。' },
    ],
  },
  {
    id: 'buoy-salt',
    exp: 'buoyancy',
    levels: grades(6),
    exam: true,
    question: '水のかわりに食塩水（1cm³で1.2g）にしずめると、ばねばかりの目もりは、水のときとくらべて？',
    choices: ['小さくなる', '大きくなる', '同じ'],
    answer: 0,
    target: 'liquid',
    start: { volume: 100, material: 'alu', liquid: 'water' },
    lock: ['volume', 'material'],
    need: { key: 'liquid', distinct: 2, among: ['water', 'salt'] },
    finding: '食塩水では、おしのけた液体の重さが100cm³×1.2g＝120gになるので、浮力が大きく、目もりはさらに小さくなる（150g）。',
  },
];
