import { grades } from '../../core/levels';
import { circle, ellipse, fig, group, line, path, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// アサガオを そだてる (1 年生)。みずを やると めが でて、つるが のび、はなが さいて、たねが できる。

export type Stage = 'seed' | 'sprout' | 'vine' | 'flower' | 'seeds';

const BY_DAY: Record<number, Stage> = { 10: 'sprout', 30: 'vine', 60: 'flower', 90: 'seeds' };

export function asagaoStage(water: string, days: number): Stage {
  if (water === 'no') return 'seed';
  return BY_DAY[days] ?? 'sprout';
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const stage = (result ?? 'seed') as Stage;
  const k = result === null ? 0 : Math.min(1, p * 1.3);
  const order: Stage[] = ['seed', 'sprout', 'vine', 'flower', 'seeds'];
  const n = order.indexOf(stage);
  const pot = path('M110 150L120 196H200L210 150Z', 'clay') + rect(104, 142, 112, 10, 'clay', 3);
  const soil = rect(112, 150, 96, 8, 'soil-rich', 2);
  const parts: string[] = [];
  if (n === 0) parts.push(ellipse(160, 150, 6, 4, 'seed'));
  if (n >= 1) {
    const h = n === 1 ? 20 : 20 + 90 * k;
    parts.push(path(`M160 150V${150 - h}`, 'ln stem'), group(160, 150 - h, ellipse(-9, -3, 9, 6, 'leaf'), ellipse(9, -3, 9, 6, 'leaf')));
    if (n >= 2) parts.push(line(176, 150, 176, 30, 'ln thin wood-line'), path(`M160 ${150 - h}Q176 ${120 - h / 2} 172 ${150 - h * 0.6}`, 'ln stem'), ellipse(140, 110, 10, 7, 'leaf'), ellipse(184, 90, 10, 7, 'leaf'));
    if (n === 3) parts.push(group(186, 58, circle(0, 0, 14, 'morning-glory'), circle(0, 0, 4, 'fill-mark')), group(140, 80, circle(0, 0, 11, 'morning-glory'), circle(0, 0, 3, 'fill-mark')));
    if (n === 4) parts.push(group(186, 58, circle(0, 0, 8, 'wood'), ellipse(-2, 1, 2.4, 3, 'seed'), ellipse(3, -1, 2.4, 3, 'seed')), group(140, 80, circle(0, 0, 7, 'wood')));
  }
  return fig(
    320,
    210,
    `みずを ${c.water === 'no' ? 'やらない' : 'やる'} アサガオの ${c.days}にちめ`,
    circle(40, 34, 14, 'sun'),
    c.water === 'yes' && result !== null && p < 0.6 ? group(250, 90, path('M0 0L-30 10L-26 22L4 12Z', 'alu'), ...[0, 1, 2].map((i) => line(-30 + i * 2, 18 + i * 4, -44 + i * 3, 40 + i * 6, 'ln thin wind'))) : '',
    soil,
    pot,
    ...parts,
    text(296, 200, `${c.days}にちめ`, { anchor: 'end', cls: 'small' }),
    result !== null && p >= 1
      ? text(160, 24, { seed: 'めが でない', sprout: 'めが でた', vine: 'つるが のびた', flower: 'はなが さいた', seeds: 'たねが できた' }[stage], { cls: stage === 'seed' ? 'result-no' : 'result-yes' })
      : '',
  );
}

export const asagao: Experiment = {
  id: 'asagao',
  field: 'life',
  label: 'アサガオを そだてる',
  summary: 'みずを やるか どうかや、ひにちを かえて、アサガオの そだちかたを みよう',
  setup: 'うえきばちに アサガオの たねを まきます。みずを やる・やらないを きめて、なんにちめに どんな ようすに なるかを みます。',
  kanaSetup: 'うえきばちに アサガオの たねを まくよ。みずを やるか きめて、なんにちめに どう なるか みよう。',
  variables: [
    {
      key: 'water',
      kind: 'choice',
      label: 'みず',
      options: [
        { value: 'yes', label: 'まいにち やる' },
        { value: 'no', label: 'やらない' },
      ],
      initial: 'yes',
    },
    {
      key: 'days',
      kind: 'choice',
      label: 'たねを まいてから',
      options: [10, 30, 60, 90].map((d) => ({ value: String(d), label: `${d}にちめ` })),
      initial: '10',
    },
  ],
  measure: {
    kind: 'category',
    label: 'アサガオの ようす',
    options: [
      { value: 'seed', label: 'めが でない' },
      { value: 'sprout', label: 'めが でた' },
      { value: 'vine', label: 'つるが のびた' },
      { value: 'flower', label: 'はなが さいた' },
      { value: 'seeds', label: 'たねが できた' },
    ],
  },
  simulate: (c) => asagaoStage(String(c.water ?? 'yes'), Number(c.days ?? 10)),
  scene,
  duration: 1600,
};

export const asagaoMissions: Mission[] = [
  {
    id: 'asagao-water',
    exp: 'asagao',
    levels: grades(1),
    question: 'みずを やらないと、アサガオの めは でる？',
    choices: ['でる', 'でない'],
    answer: 1,
    target: 'water',
    start: { days: '10' },
    lock: ['days'],
    need: { key: 'water', distinct: 2 },
    finding: 'みずを やらないと めが でなかった。たねが めを だすには みずが いるよ。',
  },
  {
    id: 'asagao-seeds',
    exp: 'asagao',
    levels: grades(1),
    question: 'はなが さいた あとに できるのは なに？',
    choices: ['たね', 'あたらしい は', 'ねっこ'],
    answer: 0,
    target: 'days',
    start: { water: 'yes', days: '30' },
    lock: ['water'],
    need: { key: 'days', distinct: 3, among: ['30', '60', '90'] },
    finding: 'はなが さいた あとには、たねが できた。そだった アサガオから、また たねが とれるんだね。',
  },
];
