import { grades } from '../core/levels';
import { circle, fig, group, line, path, rect, text } from '../diagrams/svg';
import type { Experiment, Mission } from './types';

// 水をあたためたときの温度の変わり方。
// 上がる温度は、火の強さ × 時間 に比例し、水の量に反比例する。100℃近くでふっとうすると、それ以上は上がらない。

const FIRE: Record<string, number> = { weak: 0.5, mid: 1, strong: 1.5 };
const START = 20;

/** あたためたあとの水の温度 (℃) */
export function waterTemp(ml: number, fire: string, minutes: number): number {
  const rise = 8 * (FIRE[fire] ?? 1) * minutes * (100 / ml);
  return Math.round(Math.min(100, START + rise));
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const ml = Number(c.water ?? 100);
  const fire = String(c.fire ?? 'mid');
  const minutes = Number(c.time ?? 4);
  const shown = result === null ? START : waterTemp(ml, fire, minutes * Math.min(1, p));
  const level = 30 + ml * 0.32; // 水面の高さ (px)
  const beakerBottom = 128;
  const flame = (FIRE[fire] ?? 1) * 22;
  const thermoTop = 22;
  const thermoBottom = 150;
  const liquid = thermoBottom - 8 - ((shown - 0) / 110) * (thermoBottom - thermoTop - 16);
  const boiling = shown >= 100;
  const bubbles = boiling
    ? [0, 1, 2, 3, 4].map((i) => circle(120 + i * 18, beakerBottom - 8 - ((p * 160 + i * 23) % (level - 10)), 3 + (i % 2), 'bubble')).join('')
    : '';
  return fig(
    320,
    210,
    `水${ml}mLを${{ weak: '弱火', mid: '中火', strong: '強火' }[fire]}で${minutes}分あたためる`,
    rect(115 - 30, beakerBottom - level, 120, level, 'water'),
    path(`M84 30V${beakerBottom}H206V30`, 'ln'),
    bubbles,
    // 金あみと三きゃく
    line(70, beakerBottom + 4, 220, beakerBottom + 4, 'ln thick'),
    line(88, beakerBottom + 4, 76, 200, 'ln'),
    line(202, beakerBottom + 4, 214, 200, 'ln'),
    // 火
    result !== null
      ? group(145, 186, path(`M-${flame * 0.5} 0Q-${flame * 0.4} -${flame} 0 -${flame * 1.9}Q${flame * 0.4} -${flame} ${flame * 0.5} 0Z`, 'flame'))
      : '',
    rect(126, 186, 38, 14, 'box', 3),
    // 温度計
    rect(236, thermoTop, 14, thermoBottom - thermoTop, 'glass-tube', 7),
    circle(243, thermoBottom, 10, 'hot'),
    rect(240, liquid, 6, thermoBottom - liquid, 'hot'),
    ...[0, 20, 40, 60, 80, 100].map((t) => {
      const y = thermoBottom - 8 - (t / 110) * (thermoBottom - thermoTop - 16);
      return line(250, y, 256, y, 'ln thin') + text(260, y + 4, String(t), { anchor: 'start', cls: 'tiny' });
    }),
    text(20, 24, `${ml}mL`, { anchor: 'start', cls: 'small' }),
    text(20, 44, `${Math.round(minutes * (result === null ? 0 : Math.min(1, p)))}分`, { anchor: 'start', cls: 'small' }),
    result !== null && p >= 1 ? text(160, 22, `${result}℃${boiling ? '（ふっとう）' : ''}`, { cls: 'result-yes' }) : '',
  );
}

export const heating: Experiment = {
  id: 'heating',
  label: '水(みず)をあたためる',
  summary: '水の量・火の強さ・あたためる時間を変えて、水の温度の上がり方を調べよう',
  setup: 'ビーカーに20℃の水を入れ、金あみの上で熱します。水の量・火の強さ・あたためる時間を変えて、あたためたあとの水の温度を温度計ではかります。',
  variables: [
    { key: 'water', kind: 'range', label: '水(みず)の量(りょう)', min: 50, max: 200, step: 50, unit: 'mL', initial: 100 },
    {
      key: 'fire',
      kind: 'choice',
      label: '火(ひ)の強(つよ)さ',
      options: [
        { value: 'weak', label: '弱火(よわび)' },
        { value: 'mid', label: '中火(ちゅうび)' },
        { value: 'strong', label: '強火(つよび)' },
      ],
      initial: 'mid',
    },
    { key: 'time', kind: 'range', label: 'あたためる時間(じかん)', min: 1, max: 12, step: 1, unit: '分', initial: 3 },
  ],
  measure: { kind: 'number', label: '水(みず)の温度(おんど)', unit: '℃', digits: 0 },
  simulate: (c) => waterTemp(Number(c.water ?? 100), String(c.fire ?? 'mid'), Number(c.time ?? 3)),
  scene,
  duration: 2000,
};

export const heatingMissions: Mission[] = [
  {
    id: 'heating-boil',
    exp: 'heating',
    levels: grades(4, 5),
    question: '水(みず)をあたため続(つづ)けると、温度(おんど)はどうなる？',
    choices: ['いつまでも上がり続ける', '100℃近くで上がらなくなる', 'とちゅうから下がる'],
    answer: 1,
    target: 'time',
    show: ['time'],
    start: { water: 100, fire: 'strong', time: 2 },
    need: { key: 'time', distinct: 5, among: [2, 4, 6, 8, 10, 12] },
    finding: '水は、あたためると温度が上がるが、100℃近くになるとふっとうし、あたため続けても温度は上がらなくなる。',
    hint: '2分、4分、6分…と、2分ずつ長くして、温度の変わり方をグラフで見よう',
  },
  {
    id: 'heating-amount',
    exp: 'heating',
    levels: grades(5),
    question: '水(みず)の量(りょう)を2倍にして同じ時間あたためると、温度(おんど)の上がり方は？',
    choices: ['大きくなる', '小さくなる（約半分）', '変(か)わらない'],
    answer: 1,
    target: 'water',
    start: { water: 100, fire: 'mid', time: 3 },
    need: { key: 'water', distinct: 2, among: [50, 100, 200] },
    finding: '水の量が多いほど、温度は上がりにくい。100mLから200mLにすると、上がる温度はおよそ半分になる。',
    hint: '火の強さと時間はそのままにして、水の量だけを変えよう',
  },
  {
    id: 'heating-fire',
    exp: 'heating',
    levels: grades(5),
    question: '火(ひ)を強くすると、同じ時間での温度(おんど)の上がり方は？',
    choices: ['大きくなる', '小さくなる', '変(か)わらない'],
    answer: 0,
    target: 'fire',
    start: { water: 100, fire: 'weak', time: 3 },
    need: { key: 'fire', distinct: 3 },
    finding: '火が強いほど、同じ時間で温度は大きく上がる。',
  },
];
