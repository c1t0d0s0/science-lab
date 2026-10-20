import { grades } from '../core/levels';
import { circle, fig, group, line, path, text } from '../diagrams/svg';
import type { Experiment, Mission } from './types';

// 月の形と、太陽・地球・月の位置。北極の上から見て、太陽は右がわ (ずっと遠く) にある。
// 月は地球のまわりを反時計回りに回る。angle は、地球から見た太陽の方向と月の方向の間の角度 (0 で新月、180 で満月)。

export const PHASES: Record<number, string> = {
  0: 'new',
  45: 'crescent',
  90: 'first',
  135: 'waxing',
  180: 'full',
  225: 'waning',
  270: 'last',
  315: 'old',
};

const PHASE_LABEL: Record<string, string> = {
  new: '新月(しんげつ)（見えない）',
  crescent: '三日月(みかづき)（右がわが細く光る）',
  first: '上弦(じょうげん)の月（右半分が光る）',
  waxing: '右がわがふくらんだ月',
  full: '満月(まんげつ)',
  waning: '左がわがふくらんだ月',
  last: '下弦(かげん)の月（左半分が光る）',
  old: '明け方の細い月（左がわが光る）',
};

/**
 * 日本から南の空を見たときの月の形 (半径 r、中心 0,0)。光っている部分の path を返す。
 * 満ちていく月は右がわ (西がわ)、欠けていく月は左がわが光る。
 */
export function litPath(angle: number, r: number): string {
  const a = ((angle % 360) + 360) % 360;
  if (a === 0) return '';
  const phi = (a * Math.PI) / 180;
  const rx = Math.abs(Math.cos(phi)) * r;
  if (a === 180) return `M0 ${-r}A${r} ${r} 0 1 1 0 ${r}A${r} ${r} 0 1 1 0 ${-r}Z`;
  if (a < 180) {
    // 右半分の外がわ + 明暗の境目 (三日月は右へ、ふくらんだ月は左へ張り出す)
    return `M0 ${-r}A${r} ${r} 0 0 1 0 ${r}A${rx} ${r} 0 0 ${a < 90 ? 0 : 1} 0 ${-r}Z`;
  }
  return `M0 ${-r}A${r} ${r} 0 0 0 0 ${r}A${rx} ${r} 0 0 ${a > 270 ? 1 : 0} 0 ${-r}Z`;
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const angle = Number(c.angle ?? 0);
  const ex = 110;
  const ey = 105;
  const orbit = 66;
  // 北極の上から見た図。太陽の方向 (右) から反時計回りに angle 度
  const rad = (angle * Math.PI) / 180;
  const mx = ex + orbit * Math.cos(rad);
  const my = ey - orbit * Math.sin(rad);
  const rays = [40, 80, 120, 160].map((y) => line(300, y + 4, 262, y + 4, 'ln thin sunbeam')).join('');
  const shown = result === null ? 0 : Math.min(1, p * 1.6);
  return fig(
    320,
    210,
    `太陽・地球・月の位置 (角度${angle}度)`,
    text(296, 24, '太陽の光', { anchor: 'end', cls: 'tiny' }),
    rays,
    circle(ex, ey, orbit, 'ln thin dash'),
    group(ex, ey, circle(0, 0, 14, 'earth'), path('M0 -14A14 14 0 0 0 0 14Z', 'night')),
    text(ex, ey + 30, '地球', { cls: 'tiny' }),
    group(mx, my, circle(0, 0, 8, 'moon-dark'), path('M0 -8A8 8 0 0 1 0 8Z', 'moon-lit')),
    // 右上に、地球から見た月の形
    shown > 0
      ? group(250, 150, circle(0, 0, 30, 'moon-dark'), `<g opacity="${shown.toFixed(2)}">${litPath(angle, 30) ? path(litPath(angle, 30), 'moon-lit') : ''}</g>`, text(0, 48, '地球から見た形', { cls: 'tiny' }))
      : '',
  );
}

export const moon: Experiment = {
  id: 'moon',
  label: '月(つき)と太陽(たいよう)',
  summary: '月の位置を動かして、太陽・地球・月の位置と月の形の関係を調べよう',
  variables: [
    {
      key: 'angle',
      kind: 'range',
      label: '月の位置（太陽の方向からの角度(かくど)）',
      min: 0,
      max: 315,
      step: 45,
      unit: '°',
      initial: 0,
    },
  ],
  measure: {
    kind: 'category',
    label: '月の形',
    options: Object.values(PHASES).map((v) => ({ value: v, label: PHASE_LABEL[v] })),
  },
  simulate: (c) => PHASES[Number(c.angle ?? 0)] ?? 'new',
  scene,
  duration: 1200,
};

export const moonMissions: Mission[] = [
  {
    id: 'moon-full',
    exp: 'moon',
    levels: grades(6),
    question: '地球から見て、月が太陽と反対(はんたい)がわにあるとき、月の形は？',
    choices: ['新月', '三日月', '半月', '満月'],
    answer: 3,
    target: 'angle',
    need: { key: 'angle', distinct: 4, among: [0, 90, 180, 270, 45, 135, 225, 315] },
    finding: '太陽と反対がわ（180°）にあるとき、太陽の光が当たっている面が全部見えるので満月になる。太陽と同じ方向（0°）では、光っている面が見えず新月になる。',
  },
  {
    id: 'moon-first',
    exp: 'moon',
    levels: grades(6),
    question: '夕方、南の空に見える半月(はんげつ)（90°の位置）は、どちらがわが光っている？',
    choices: ['右（西）がわ', '左（東）がわ', '上がわ', '下がわ'],
    answer: 0,
    target: 'angle',
    start: { angle: 45 },
    need: { key: 'angle', distinct: 2, among: [90, 270] },
    finding: '90°の位置の月（上弦の月）は右（西）がわが光り、270°の位置の月（下弦の月）は左（東）がわが光る。',
    hint: '90°と270°をくらべよう',
  },
  {
    id: 'moon-sun-side',
    exp: 'moon',
    levels: grades(6),
    question: '月の光って見えるがわには、いつも何がある？',
    choices: ['太陽', '地球', '何もない'],
    answer: 0,
    target: 'angle',
    need: { key: 'angle', distinct: 5 },
    finding: '月の光っているがわには、いつも太陽がある。月は自分で光らず、太陽の光をはね返してかがやいている。位置によって光って見える部分が変わるので、形が変わって見える。',
    conclusions: [
      { text: '調べた位置ではどれも、月の光っているがわが太陽の方向だった', ok: true, why: '調べたすべての位置で同じことが言えている。' },
      { text: '満月のときは、月が自分で強く光っている', ok: false, why: '月は自分では光らない。太陽の光を受けている面が全部見えるのが満月。' },
      { text: '月の形が変わるのは、地球のかげが月にうつるから', ok: false, why: '地球のかげがうつるのは月食のとき。ふだんの形の変化は、太陽・月・地球の位置で決まる。' },
    ],
  },
];
