import { grades } from '../core/levels';
import { fig, group, line, path, polygon, rect, text } from '../diagrams/svg';
import type { Experiment, Mission } from './types';

// 実験用てこ。「おもりの重さ × 支点からのきょり(目もり)」が左右で等しいとき、水平につり合う。

export function tilt(c: Record<string, number | string>): 'left' | 'balance' | 'right' {
  const left = Number(c.lw) * Number(c.lp);
  const right = Number(c.rw) * Number(c.rp);
  return left === right ? 'balance' : left > right ? 'left' : 'right';
}

const STEP = 22;

function weight(x: number, y: number, grams: number): string {
  const h = 10 + grams / 3;
  return group(x, y, line(0, 0, 0, 14, 'ln thin'), rect(-11, 14, 22, h, 'iron', 3), text(0, 14 + h + 13, `${grams}g`, { cls: 'tiny' }));
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const state = result === null ? 'balance' : String(result);
  // 左が下がるときは、左はしが下 (反時計回りに見える向き)
  const target = state === 'left' ? -10 : state === 'right' ? 10 : 0;
  const k = result === null ? 0 : Math.min(1, p * 1.5);
  const angle = target * (1 - (1 - k) ** 3);
  const rad = (angle * Math.PI) / 180;
  const cx = 160;
  const cy = 70;
  const at = (pos: number): [number, number] => [cx + pos * STEP * Math.cos(rad), cy + pos * STEP * Math.sin(rad)];
  const ticks = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]
    .map((i) => {
      const [x, y] = at(i);
      return line(x, y - 4, x, y + 4, 'ln thin') + text(x, y - 8, String(Math.abs(i)), { cls: 'tiny' });
    })
    .join('');
  const [lx, ly] = at(-Number(c.lp));
  const [rx, ry] = at(Number(c.rp));
  return fig(
    320,
    210,
    `左の目もり${c.lp}に${c.lw}g、右の目もり${c.rp}に${c.rw}gをつるしたてこ`,
    polygon([[cx, cy], [cx - 14, 196], [cx + 14, 196]], 'wood'),
    rect(40, 196, 240, 6, 'ground'),
    line(...at(-6.6), ...at(6.6), 'ln thick'),
    ticks,
    path(`M${cx - 4} ${cy}a4 4 0 1 0 8 0a4 4 0 1 0 -8 0`, 'ink'),
    weight(lx, ly, Number(c.lw)),
    weight(rx, ry, Number(c.rw)),
    result === null || k < 1
      ? ''
      : text(cx, 24, { left: '左が下がった', right: '右が下がった', balance: 'つり合った！' }[state] ?? '', { cls: state === 'balance' ? 'result-yes' : 'result-no' }),
  );
}

export const lever: Experiment = {
  id: 'lever',
  label: 'てこのきまり',
  summary: 'おもりの重さと位置を変えて、てこがつり合うきまりを見つけよう',
  setup: '実験用てこの左右のうでに、おもりをつるします。目もりの数字は、支点(してん)（まん中）からのきょりです。てこが どちらにかたむくか、水平につり合うかを調べます。',
  variables: [
    { key: 'lw', kind: 'range', label: '左(ひだり)のおもり', min: 10, max: 60, step: 10, unit: 'g', initial: 30 },
    { key: 'lp', kind: 'range', label: '左のおもりの目(め)もり', min: 1, max: 6, step: 1, unit: '', initial: 2 },
    { key: 'rw', kind: 'range', label: '右(みぎ)のおもり', min: 10, max: 60, step: 10, unit: 'g', initial: 10 },
    { key: 'rp', kind: 'range', label: '右のおもりの目もり', min: 1, max: 6, step: 1, unit: '', initial: 3 },
  ],
  measure: {
    kind: 'category',
    label: 'てこのかたむき',
    options: [
      { value: 'left', label: '左(ひだり)が下がる' },
      { value: 'balance', label: 'つり合う' },
      { value: 'right', label: '右(みぎ)が下がる' },
    ],
  },
  simulate: (c) => tilt(c),
  scene,
  duration: 1200,
};

export const leverMissions: Mission[] = [
  {
    id: 'lever-find',
    exp: 'lever',
    levels: grades(6),
    question: '左の目もり2に30gをつるした。右の目もり3に何gをつるすと、つり合う？',
    choices: ['10g', '20g', '30g', '45g'],
    answer: 1,
    target: 'rw',
    start: { lw: 30, lp: 2, rw: 10, rp: 3 },
    lock: ['lw', 'lp', 'rp'],
    need: { key: 'rw', distinct: 3 },
    finding: '右の目もり3に20gをつるすとつり合った。左は 30g×2＝60、右は 20g×3＝60 で、「重さ×きょり」が等しい。',
  },
  {
    id: 'lever-rule',
    exp: 'lever',
    levels: grades(6),
    question: 'てこが水平につり合うのは、どんなとき？',
    choices: ['左右のおもりの重さが等しいとき', '左右の目もりが等しいとき', '「重さ×目もり」が左右で等しいとき'],
    answer: 2,
    target: 'rp',
    start: { lw: 20, lp: 3, rw: 10, rp: 1 },
    need: { key: 'rp', distinct: 3, result: 'balance', fair: false },
    finding: 'つり合ったときは、どれも「おもりの重さ×支点からのきょり」が左右で等しかった。重さがちがっても、きょりで つり合わせることができる。',
    hint: '右の目もりを変えて、つり合う組み合わせを3つ見つけよう。重さも変えていいよ',
    conclusions: [
      { text: '見つけた3つの組み合わせでは、どれも「重さ×目もり」が左右で等しかった', ok: true, why: '実際につり合った組み合わせを根拠にしている。' },
      { text: '重いおもりのほうが、いつも下がる', ok: false, why: '軽いおもりでも、支点から遠くにつるすとつり合ったり、下がったりした。' },
      { text: '3回つり合ったので、どんなてこでも、左右の重さを同じにすればつり合う', ok: false, why: '重さが同じでも、目もりがちがうとつり合わない。データとちがうことを言っている。' },
    ],
  },
];
