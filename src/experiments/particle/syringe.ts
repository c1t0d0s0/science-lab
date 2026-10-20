import { grades } from '../../core/levels';
import { arrow, fig, group, line, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// とじこめた空気と水 (4 年生)。とじこめた空気はおしちぢめられ、おすほど体積は小さく、おし返す力は大きくなる。
// とじこめた水はおしちぢめられない。

const PUSH: Record<string, number> = { none: 0, weak: 1, strong: 2 };

/** ちゅうしゃ器の中の体積 (mL)。はじめは 20mL */
export function syringeVolume(content: string, push: string): number {
  if (content === 'water') return 20;
  return [20, 14, 10][PUSH[push] ?? 0];
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const water = c.content === 'water';
  const push = PUSH[String(c.push)] ?? 0;
  const vol = typeof result === 'number' ? 20 - (20 - result) * Math.min(1, p * 1.5) : 20;
  const L = 60;
  const len = vol * 8; // 1mL を 8px でかく
  const tip = L;
  const plunger = tip + len;
  const ticks = [0, 5, 10, 15, 20].map((m) => line(tip + m * 8, 86, tip + m * 8, 94, 'ln thin') + text(tip + m * 8, 80, String(m), { cls: 'tiny' })).join('');
  // 手ごたえ: とじこめた空気がおし返す力 (矢印の長さ)
  const back = !water && result !== null ? (20 - vol) * 4 : water && push > 0 && result !== null ? 40 : 0;
  return fig(
    320,
    200,
    `ちゅうしゃ器にとじこめた${water ? '水' : '空気'}を${{ none: 'おさない', weak: '弱くおす', strong: '強くおす' }[String(c.push)]}`,
    rect(tip - 14, 96, 14, 20, 'rubber', 3),
    rect(tip, 92, 180, 28, 'glass-tube', 4),
    water ? rect(tip, 94, len, 24, 'water') : rect(tip, 94, len, 24, 'air-fill'),
    group(plunger, 106, rect(0, -12, 8, 24, 'wood', 2), rect(8, -3, 60, 6, 'wood', 2), rect(68, -14, 8, 28, 'wood', 2)),
    ticks,
    text(tip + 80, 70, 'mL', { cls: 'tiny' }),
    push > 0 && result !== null ? arrow(plunger + 98, 106, plunger + 80, 106, 'ln red') : '',
    back > 0 && p > 0.5 ? arrow(plunger + 30, 140, plunger + 30 + back, 140, 'ln') + text(plunger + 30, 160, 'おし返す力', { anchor: 'start', cls: 'tiny' }) : '',
    typeof result === 'number' && p >= 1 ? text(160, 40, `体積 ${result}mL`, { cls: 'result-yes' }) : '',
  );
}

export const syringe: Experiment = {
  id: 'syringe',
  field: 'particle',
  label: 'とじこめた空気(くうき)と水(みず)',
  summary: 'ちゅうしゃ器にとじこめた空気や水をおして、体積と手ごたえを調べよう',
  setup: 'ちゅうしゃ器に空気か水を20mL入れ、先をゴムの板にしっかりおし当てて、中のものがにげないようにとじこめます。ピストンをおして、中の体積（目もり）と、手ごたえ（おし返す力）を調べます。',
  variables: [
    {
      key: 'content',
      kind: 'choice',
      label: 'とじこめるもの',
      options: [
        { value: 'air', label: '空気(くうき)' },
        { value: 'water', label: '水(みず)' },
      ],
      initial: 'air',
    },
    {
      key: 'push',
      kind: 'choice',
      label: 'ピストンのおし方',
      options: [
        { value: 'none', label: 'おさない' },
        { value: 'weak', label: '弱(よわ)くおす' },
        { value: 'strong', label: '強(つよ)くおす' },
      ],
      initial: 'none',
    },
  ],
  measure: { kind: 'number', label: '中の体積(たいせき)', unit: 'mL', digits: 0 },
  simulate: (c) => syringeVolume(String(c.content ?? 'air'), String(c.push ?? 'none')),
  scene,
  duration: 1200,
};

export const syringeMissions: Mission[] = [
  {
    id: 'syringe-air',
    exp: 'syringe',
    levels: grades(4),
    question: 'とじこめた空気(くうき)をおすと、体積(たいせき)はどうなる？',
    choices: ['小さくなる', '変わらない', '大きくなる'],
    answer: 0,
    target: 'push',
    start: { content: 'air' },
    lock: ['content'],
    need: { key: 'push', distinct: 3 },
    finding: 'とじこめた空気はおしちぢめられて、体積が小さくなる。強くおすほど、体積は小さくなる。',
  },
  {
    id: 'syringe-back',
    exp: 'syringe',
    levels: grades(4),
    question: 'とじこめた空気(くうき)を強くおすほど、おし返す力（手ごたえ）は？',
    choices: ['大きくなる', '小さくなる', '変わらない'],
    answer: 0,
    target: 'push',
    start: { content: 'air' },
    lock: ['content'],
    need: { key: 'push', distinct: 3 },
    finding: '空気は、おしちぢめられるほど、もとにもどろうとしておし返す力が大きくなる。手をはなすと、ピストンはもとの位置にもどる。',
  },
  {
    id: 'syringe-water',
    exp: 'syringe',
    levels: grades(4),
    question: 'とじこめた水(みず)をおすと、体積(たいせき)はどうなる？',
    choices: ['小さくなる', '変わらない', '大きくなる'],
    answer: 1,
    target: 'push',
    start: { content: 'water' },
    lock: ['content'],
    need: { key: 'push', distinct: 2 },
    finding: 'とじこめた水は、強くおしても体積が変わらない。水はおしちぢめられない。',
  },
];
