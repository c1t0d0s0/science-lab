import { grades } from '../../core/levels';
import { arrow, circle, fig, group, line, path, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// 磁石の極 (3 年生)。同じ極どうしはしりぞけ合い、ちがう極どうしは引き合う。
// 方位磁針の N 極は北を指す。磁石につけた鉄は、磁石になる。

export function poleForce(left: unknown, right: unknown): 'attract' | 'repel' {
  return left === right ? 'repel' : 'attract';
}

function bar(x: number, y: number, leftPole: string): string {
  const [a, b] = leftPole === 'N' ? ['N', 'S'] : ['S', 'N'];
  const cls = (p: string) => (p === 'N' ? 'pole-n' : 'pole-s');
  return rect(x, y, 44, 20, cls(a), 3) + rect(x + 44, y, 44, 20, cls(b), 3) + text(x + 22, y + 15, a, { cls: 'pole-text' }) + text(x + 66, y + 15, b, { cls: 'pole-text' });
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  // 左の磁石は右はしが left の極、右の磁石は左はしが right の極になるよう置く
  const leftFace = String(c.left ?? 'N');
  const rightFace = String(c.right ?? 'S');
  const k = result === null ? 0 : Math.min(1, p * 1.4);
  const gap = result === 'attract' ? 40 * (1 - k) : result === 'repel' ? 40 + 50 * k : 40;
  const lx = 160 - gap / 2 - 88;
  const rx = 160 + gap / 2;
  return fig(
    320,
    200,
    `${leftFace}極と${rightFace}極を近づける`,
    rect(10, 128, 300, 6, 'ground'),
    bar(lx, 106, leftFace === 'N' ? 'S' : 'N'),
    bar(rx, 106, rightFace),
    result === 'attract' && k < 1 ? arrow(lx + 70, 96, lx + 88, 96, 'ln red') + arrow(rx + 18, 96, rx, 96, 'ln red') : '',
    result === 'repel' && k > 0 ? arrow(lx + 88, 96, lx + 66, 96, 'ln red') + arrow(rx, 96, rx + 22, 96, 'ln red') : '',
    // 方位磁針 (北は上)。N 極は北を指す
    group(276, 52, circle(0, 0, 22, 'box'), path('M0 -18L5 0H-5Z', 'pole-n'), path('M0 18L5 0H-5Z', 'pole-s'), text(0, -26, '北', { cls: 'tiny' })),
    line(260, 92, 292, 92, 'ln thin faint'),
    result === null || k < 1 ? '' : text(140, 50, result === 'attract' ? '引き合った！' : 'しりぞけ合った！', { cls: 'result-yes' }),
  );
}

export const poles: Experiment = {
  id: 'poles',
  field: 'energy',
  label: '磁石(じしゃく)の極(きょく)',
  summary: '2つの棒磁石の極を近づけて、引き合うか しりぞけ合うかを調べよう',
  setup: '2つの棒磁石を、つくえの上で向かい合わせに置きます。向かい合うはしの極（N極かS極）を変えて、近づけたときに引き合うか、しりぞけ合うかを調べます。右上の方位磁針は、上が北です。',
  variables: [
    {
      key: 'left',
      kind: 'choice',
      label: '左(ひだり)の磁石の、向かい合う極',
      options: [
        { value: 'N', label: 'N極(きょく)' },
        { value: 'S', label: 'S極' },
      ],
      initial: 'N',
    },
    {
      key: 'right',
      kind: 'choice',
      label: '右(みぎ)の磁石の、向かい合う極',
      options: [
        { value: 'N', label: 'N極(きょく)' },
        { value: 'S', label: 'S極' },
      ],
      initial: 'S',
    },
  ],
  measure: {
    kind: 'category',
    label: '2つの磁石は',
    options: [
      { value: 'attract', label: '引(ひ)き合う' },
      { value: 'repel', label: 'しりぞけ合う' },
    ],
  },
  simulate: (c) => poleForce(c.left, c.right),
  scene,
  duration: 1000,
};

export const polesMissions: Mission[] = [
  {
    id: 'poles-same',
    exp: 'poles',
    levels: grades(3),
    question: '同(おな)じ極(きょく)どうし（N極とN極）を近づけると、どうなる？',
    choices: ['引き合う', 'しりぞけ合う', '何も起きない'],
    answer: 1,
    target: 'right',
    start: { left: 'N', right: 'S' },
    lock: ['left'],
    need: { key: 'right', distinct: 2 },
    finding: '同じ極どうしはしりぞけ合い、ちがう極どうし（N極とS極）は引き合う。',
  },
  {
    id: 'poles-pairs',
    exp: 'poles',
    levels: grades(3),
    question: '引(ひ)き合うのは、どんな極(きょく)の組み合わせのとき？',
    choices: ['N極とS極のとき', 'N極とN極のとき', 'S極とS極のとき', 'どんな組み合わせでも引き合う'],
    answer: 0,
    target: 'right',
    need: { key: 'right', distinct: 2, fair: false },
    finding: 'N極とS極のように、ちがう極どうしのときだけ引き合う。N極とN極、S極とS極はしりぞけ合う。',
    hint: '左の極も変えて、4つの組み合わせをためしてみよう',
  },
];
