import { grades } from '../../core/levels';
import { circle, fig, line, path, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// モノコード (5 年生・中学受験)。弦が短いほど、細いほど、強くはるほど、高い音 (ふるえる回数が多い) になる。
// ふるえる回数 (振動数) は 長さに反比例し、はる力の平方根に比例し、太さ (直径) に反比例する。

const THICK: Record<string, number> = { thin: 1, thick: 2 };

/** 1 秒間にふるえる回数 (回) */
export function frequency(lengthCm: number, thickness: string, weightG: number): number {
  return Math.round((440 * (40 / lengthCm) * Math.sqrt(weightG / 400)) / (THICK[thickness] ?? 1));
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const L = Number(c.length ?? 40);
  const thick = c.thickness === 'thick';
  const w = Number(c.weight ?? 400);
  const x0 = 40;
  const x1 = x0 + L * 3;
  const y = 90;
  // 弦がふるえるようす (音が高いほど、こまかくふるえる)
  const f = typeof result === 'number' ? result : 0;
  const amp = result === null ? 0 : 8 * (1 - p);
  const waves = Math.max(1, Math.round(f / 220));
  const d = `M${x0} ${y}` + Array.from({ length: 12 }, (_, i) => {
    const t = (i + 1) / 12;
    return `L${(x0 + (x1 - x0) * t).toFixed(1)} ${(y + Math.sin(t * Math.PI) * amp * Math.sin(p * 60 * waves)).toFixed(1)}`;
  }).join('');
  return fig(
    320,
    210,
    `長さ${L}cm、${thick ? '太い' : '細い'}弦を${w}gのおもりではったモノコード`,
    rect(24, 100, 274, 26, 'wood', 4),
    path(d, thick ? 'ln thick' : 'ln'),
    path(`M${x0} ${y}V100M${x1} ${y}L${x1 - 6} 100H${x1 + 6}Z`, 'ln'),
    line(x1, y, 296, y, thick ? 'ln thick' : 'ln'),
    line(296, y, 296, 150, 'ln thin'),
    rect(284, 150, 24, 14 + w / 40, 'iron', 3),
    text(296, 196, `${w}g`, { cls: 'tiny' }),
    circle(296, y, 5, 'box'),
    text(x0 + (x1 - x0) / 2, 120, `${L}cm`, { cls: 'tiny on-dark' }),
    typeof result === 'number' && p >= 1 ? text(150, 40, `1秒間に${result}回ふるえる`, { cls: 'result-yes' }) : '',
  );
}

export const monochord: Experiment = {
  id: 'monochord',
  field: 'energy',
  label: 'モノコード（音(おと)の高さ）',
  summary: '弦の長さ・太さ・はる強さを変えて、音の高さを調べよう',
  setup: '木の箱に弦(げん)をはったモノコードです。弦のはしにおもりをつるしてはる強さを決め、ことじ（三角の台）を動かして、はじく部分の長さを変えます。弦をはじいて、1秒間にふるえる回数をはかります。回数が多いほど高い音です。',
  variables: [
    { key: 'length', kind: 'range', label: 'はじく弦(げん)の長さ', min: 20, max: 80, step: 10, unit: 'cm', initial: 40 },
    {
      key: 'thickness',
      kind: 'choice',
      label: '弦の太さ',
      options: [
        { value: 'thin', label: '細い' },
        { value: 'thick', label: '太い（2倍）' },
      ],
      initial: 'thin',
    },
    { key: 'weight', kind: 'range', label: 'はる強さ（おもり）', min: 100, max: 900, step: 100, unit: 'g', initial: 400 },
  ],
  measure: { kind: 'number', label: '1秒間にふるえる回数', unit: '回', digits: 0 },
  simulate: (c) => frequency(Number(c.length ?? 40), String(c.thickness ?? 'thin'), Number(c.weight ?? 400)),
  scene,
  duration: 1400,
};

export const monochordMissions: Mission[] = [
  {
    id: 'mono-length',
    exp: 'monochord',
    levels: grades(5),
    exam: true,
    question: 'はじく弦(げん)の長さを短くすると、音の高さは？',
    choices: ['高くなる', '低くなる', '変わらない'],
    answer: 0,
    target: 'length',
    need: { key: 'length', distinct: 3 },
    finding: '弦を短くするほど、1秒間にふるえる回数が多くなり、音は高くなる。長さを半分にすると、ふるえる回数は2倍になる。',
  },
  {
    id: 'mono-thick',
    exp: 'monochord',
    levels: grades(5),
    exam: true,
    question: '弦(げん)を太くすると、音の高さは？',
    choices: ['高くなる', '低くなる', '変わらない'],
    answer: 1,
    target: 'thickness',
    need: { key: 'thickness', distinct: 2 },
    finding: '太い弦ほど、ふるえる回数が少なくなり、音は低くなる。',
  },
  {
    id: 'mono-tension',
    exp: 'monochord',
    levels: grades(5),
    exam: true,
    question: '弦(げん)を強くはると（おもりを重くすると）、音の高さは？',
    choices: ['高くなる', '低くなる', '変わらない'],
    answer: 0,
    target: 'weight',
    need: { key: 'weight', distinct: 3 },
    finding: '強くはるほど、ふるえる回数が多くなり、音は高くなる。おもりを4倍にすると、ふるえる回数は2倍になる。',
    hint: '100g・400g・900gでくらべると、きまりが見つけやすいよ',
  },
];
