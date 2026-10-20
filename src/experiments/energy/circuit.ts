import { grades } from '../../core/levels';
import { circle, fig, group, line, path, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission, Option } from '../types';

// かん電池・豆電球・スイッチの回路。
// 3 年生: 回路が 1 つのわになると明かりがつく。金ぞくは電気を通す。
// 4 年生: かん電池 2 こを直列につなぐと明るくなり、へい列では 1 このときと同じ明るさ。

interface GapThing extends Option {
  conducts: boolean;
}

const GAP: GapThing[] = [
  { value: 'wire', label: 'どう線(せん)でつなぐ', conducts: true },
  { value: 'open', label: 'つながない（はなす）', conducts: false },
  { value: 'nail', label: '鉄(てつ)くぎ', conducts: true },
  { value: 'foil', label: 'アルミはく', conducts: true },
  { value: 'coin10', label: '10円玉(えんだま)', conducts: true },
  { value: 'chopstick', label: 'わりばし', conducts: false },
  { value: 'eraser', label: '消(け)しゴム', conducts: false },
];

const gapOf = (v: unknown) => GAP.find((g) => g.value === v) ?? GAP[0];

/** 豆電球にかかる電圧 (かん電池 1 この何倍か)。回路がつながっていなければ 0 */
export function voltage(c: Record<string, number | string>): number {
  if (c.switch === 'off' || !gapOf(c.gap).conducts) return 0;
  return Number(c.batteries ?? 1) >= 2 && c.wiring === 'series' ? 2 : 1;
}

function battery(x: number, y: number): string {
  // 上が + きょく
  return group(x, y, rect(-10, -20, 20, 40, 'battery', 3), rect(-4, -25, 8, 5, 'battery-tip', 1), text(0, -6, '+', { cls: 'tiny on-dark' }), text(0, 14, '−', { cls: 'tiny on-dark' }));
}

function gapThing(value: string): string {
  switch (value) {
    case 'wire':
      return line(-24, 0, 24, 0, 'ln wire');
    case 'open':
      return '';
    case 'nail':
      return rect(-24, -3, 6, 6, 'iron', 1) + path('M-18 -2H18L24 0L18 2H-18Z', 'iron');
    case 'foil':
      return path('M-22 -4L22 -6L20 5L-20 6Z', 'alu');
    case 'coin10':
      return circle(0, 0, 11, 'copper');
    case 'chopstick':
      return rect(-26, -3, 52, 6, 'wood', 2);
    default:
      return rect(-18, -7, 36, 14, 'rubber', 3);
  }
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const v = voltage(c);
  const lit = result !== null && v > 0;
  const glow = lit ? Math.min(1, p * 3) : 0;
  const L = 50;
  const R = 270;
  const T = 44;
  const B = 172;
  const parallel = Number(c.batteries ?? 1) >= 2 && c.wiring === 'parallel';
  const two = Number(c.batteries ?? 1) >= 2;
  const switchOn = c.switch !== 'off';
  const gap = String(c.gap ?? 'wire');

  // 導線 (部品のところは、あとから上にかくして、部品をかく)
  const wires = path(`M${L} ${T}H${R}V${B}H${L}Z`, 'ln wire');
  let batteries = '';
  if (!two) batteries = rect(L - 12, 84, 24, 52, 'mask') + battery(L, 110);
  else if (!parallel) batteries = rect(L - 12, 60, 24, 100, 'mask') + battery(L, 84) + battery(L, 132);
  else
    batteries =
      rect(L - 12, 74, 24, 72, 'mask') +
      path(`M${L} 80H${L - 30}V140H${L}M${L} 80H${L + 30}V140H${L}`, 'ln wire') +
      rect(L - 42, 86, 72, 48, 'mask') +
      battery(L - 30, 110) +
      battery(L + 30, 110);
  const bulb = group(
    160,
    T,
    lit ? circle(0, -14, 20 + 10 * (v - 1) * glow, `glow glow-${v}`) : '',
    rect(-8, -2, 16, 10, 'socket', 2),
    circle(0, -14, 12, lit ? 'bulb-on' : 'bulb'),
    path('M-4 -8L-2 -16H2L4 -8', 'ln thin'),
  );
  const sw = group(
    R,
    108,
    rect(-6, -24, 12, 48, 'mask'),
    circle(0, -18, 3, 'ink'),
    circle(0, 18, 3, 'ink'),
    switchOn ? line(0, 18, 0, -18, 'ln thick') : line(0, 18, -20, -10, 'ln thick'),
  );
  const gapSvg = group(160, B, rect(-28, -10, 56, 20, 'mask'), circle(-28, 0, 3, 'ink'), circle(28, 0, 3, 'ink'), gapThing(gap));
  return fig(
    320,
    200,
    `かん電池${two ? `2こを${parallel ? 'へい列' : '直列'}に` : '1こを'}つないだ回路`,
    wires,
    batteries,
    bulb,
    sw,
    gapSvg,
    text(R + 18, 112, switchOn ? 'ON' : 'OFF', { anchor: 'start', cls: 'tiny' }),
    result === null ? '' : text(160, 120, { off: 'つかない', normal: 'ついた！', bright: '明るくついた！' }[String(result)] ?? '', { cls: lit ? 'result-yes' : 'result-no' }),
  );
}

export const circuit: Experiment = {
  id: 'circuit',
  field: 'energy',
  label: '電気(でんき)の通(とお)り道(みち)',
  summary: 'かん電池・豆電球・スイッチをつないで、明かりがつくつなぎ方を調べよう',
  setup: 'かん電池(でんち)・豆電球(まめでんきゅう)・スイッチを、どう線でつないだ回路(かいろ)です。回路のとちゅうに物をはさんだり、かん電池の数やつなぎ方を変えたりして、豆電球に明かりがつくかを調べます。',
  variables: [
    { key: 'gap', kind: 'choice', label: '回路(かいろ)のとちゅうにつなぐ物(もの)', options: GAP, initial: 'wire' },
    {
      key: 'switch',
      kind: 'choice',
      label: 'スイッチ',
      options: [
        { value: 'on', label: '入(い)れる' },
        { value: 'off', label: '切(き)る' },
      ],
      initial: 'on',
    },
    { key: 'batteries', kind: 'range', label: 'かん電池(でんち)の数(かず)', min: 1, max: 2, step: 1, unit: 'こ', initial: 1 },
    {
      key: 'wiring',
      kind: 'choice',
      label: '2このつなぎ方(かた)',
      options: [
        { value: 'series', label: '直列(ちょくれつ)つなぎ' },
        { value: 'parallel', label: 'へい列(れつ)つなぎ' },
      ],
      initial: 'series',
    },
  ],
  measure: {
    kind: 'category',
    label: '豆電球(まめでんきゅう)',
    options: [
      { value: 'off', label: 'つかない' },
      { value: 'normal', label: 'つく' },
      { value: 'bright', label: '明(あか)るくつく' },
    ],
  },
  simulate: (c) => ['off', 'normal', 'bright'][voltage(c)],
  scene,
  duration: 700,
};

export const circuitMissions: Mission[] = [
  {
    id: 'circuit-loop',
    exp: 'circuit',
    levels: grades(3),
    question: '豆電球(まめでんきゅう)に明かりがつくのは、どんなときかな？',
    choices: ['かん電池の+きょくだけにつないだとき', 'かん電池・豆電球・どう線が1つのわになったとき', 'どう線が1か所でもつながっていれば、いつでも'],
    answer: 1,
    target: 'gap',
    show: ['gap', 'switch'],
    need: { key: 'gap', distinct: 2, among: ['wire', 'open'] },
    finding: 'かん電池の+きょく、豆電球、−きょくが、どう線で1つのわのようにつながると電気が流れ、明かりがつく。この電気の通り道を回路という。とちゅうが切れていると、つかない。',
    hint: '「どう線でつなぐ」と「つながない」をくらべてみよう',
  },
  {
    id: 'circuit-conductor',
    exp: 'circuit',
    levels: grades(3),
    question: '回路(かいろ)のとちゅうにつないだとき、明かりがつくのはどれ？',
    choices: ['鉄くぎ・アルミはく・10円玉（金(きん)ぞく）', 'わりばし・消しゴム', '全部つく', 'どれもつかない'],
    answer: 0,
    target: 'gap',
    show: ['gap'],
    start: { gap: 'nail' },
    need: { key: 'gap', distinct: 5, among: ['nail', 'foil', 'coin10', 'chopstick', 'eraser'] },
    finding: '鉄・アルミニウム・銅(どう)などの金ぞくは電気を通す。木やゴムは電気を通さない。',
  },
  {
    id: 'circuit-series',
    exp: 'circuit',
    levels: grades(4),
    question: 'かん電池(でんち)2こを直列(ちょくれつ)につなぐと、1このときとくらべて豆電球(まめでんきゅう)の明るさは？',
    choices: ['明るくなる', '暗(くら)くなる', '同じ'],
    answer: 0,
    target: 'batteries',
    show: ['batteries', 'wiring'],
    start: { wiring: 'series' },
    lock: ['wiring'],
    need: { key: 'batteries', distinct: 2 },
    finding: 'かん電池2こを直列につなぐと、回路に流れる電流が大きくなり、豆電球は1このときより明るくなる。',
  },
  {
    id: 'circuit-parallel',
    exp: 'circuit',
    levels: grades(4),
    question: 'かん電池(でんち)2こをへい列(れつ)につなぐと、1このときとくらべて豆電球(まめでんきゅう)の明るさは？',
    choices: ['明るくなる', '暗(くら)くなる', '同じくらい'],
    answer: 2,
    target: 'batteries',
    show: ['batteries', 'wiring'],
    start: { wiring: 'parallel' },
    lock: ['wiring'],
    need: { key: 'batteries', distinct: 2 },
    finding: 'へい列つなぎでは、流れる電流の大きさはかん電池1このときとほぼ同じなので、明るさも同じくらい。',
  },
];
