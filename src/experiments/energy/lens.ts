import { grades } from '../../core/levels';
import { circle, ellipse, fig, group, line, path, polygon, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// 虫めがねで日光を集める (3 年生)。集めた光の円が小さいほど明るく、熱くなる。
// 大きい虫めがねほど、たくさんの光を集められる。

const SPOT: Record<string, number> = { big: 4, mid: 2, small: 0.6 }; // 円の直径 (cm)
const LENS: Record<string, number> = { small: 1, large: 2.25 }; // 集める光の量 (直径 4cm と 6cm の面積の比)

/** 黒い紙の 10 秒後の温度 (℃) */
export function spotTemp(spot: string, lens: string): number {
  const d = SPOT[spot] ?? 2;
  const rise = (6 * (LENS[lens] ?? 1)) / (d * d);
  return Math.round(Math.min(300, 20 + rise * 10));
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const d = SPOT[String(c.spot)] ?? 2;
  const large = c.lens === 'large';
  const w = large ? 66 : 46;
  const lensY = 70;
  const paperY = 160;
  const spotR = d * 7;
  const on = result !== null;
  const k = on ? Math.min(1, p * 2) : 0;
  const smoke = typeof result === 'number' && result >= 150 && p > 0.6;
  return fig(
    320,
    210,
    `${large ? '大きい' : '小さい'}虫めがねで、光の円を${{ big: '大きく', mid: '中くらいに', small: '小さく' }[String(c.spot)]}する`,
    circle(40, 24, 13, 'sun'),
    // 虫めがねに入る光と、集まった光
    polygon([[160 - w, 30], [160 + w, 30], [160 + w, lensY], [160 - w, lensY]], 'beam'),
    polygon([[160 - w, lensY], [160 + w, lensY], [160 + spotR, paperY], [160 - spotR, paperY]], 'beam'),
    ellipse(160, lensY, w, 8, 'glass'),
    line(160 + w, lensY, 160 + w + 30, lensY - 30, 'ln thick'),
    rect(60, paperY, 200, 8, 'battery', 1),
    on ? ellipse(160, paperY, spotR, 3 + spotR * 0.2, `spot spot-${d < 1 ? 3 : d < 3 ? 2 : 1}`) : '',
    smoke ? group(160, paperY - 10, path('M0 0q-6 -10 0 -20t0 -20', 'ln thin steam'), path('M8 -2q-6 -10 0 -20', 'ln thin steam')) : '',
    text(276, paperY + 4, '黒い紙', { anchor: 'start', cls: 'tiny' }),
    on && k >= 1 ? text(300, 40, `${result}℃${smoke ? '（こげた）' : ''}`, { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const lens: Experiment = {
  id: 'lens',
  field: 'energy',
  label: '虫(むし)めがねで光(ひかり)を集(あつ)める',
  summary: '虫めがねで日光を集め、光の円の大きさと、明るさ・あたたかさの関係を調べよう',
  setup: '日なたで、虫めがねを黒い紙の上にかざし、日光を集めます。虫めがねと紙のきょりを変えると、紙にうつる光の円の大きさが変わります。10秒後の、光を当てたところの温度をくらべます。（日光を集めた光を、ぜったいに目で見たり、人や生き物に当てたりしてはいけません）',
  variables: [
    {
      key: 'spot',
      kind: 'choice',
      label: '光(ひかり)の円(えん)の大きさ',
      options: [
        { value: 'big', label: '大きい' },
        { value: 'mid', label: '中くらい' },
        { value: 'small', label: '小さい' },
      ],
      initial: 'big',
    },
    {
      key: 'lens',
      kind: 'choice',
      label: '虫(むし)めがね',
      options: [
        { value: 'small', label: '小さい虫めがね' },
        { value: 'large', label: '大きい虫めがね' },
      ],
      initial: 'small',
    },
  ],
  measure: { kind: 'number', label: '光を当てたところの温度(おんど)（10秒後）', unit: '℃', digits: 0 },
  simulate: (c) => spotTemp(String(c.spot), String(c.lens)),
  scene,
  duration: 1200,
};

export const lensMissions: Mission[] = [
  {
    id: 'lens-spot',
    exp: 'lens',
    levels: grades(3),
    question: '日光(にっこう)を集(あつ)めた光の円を小さくするほど、明るさと温度(おんど)は？',
    choices: ['明るく、温度は高くなる', '暗く、温度は低くなる', '変わらない'],
    answer: 0,
    target: 'spot',
    show: ['spot'],
    need: { key: 'spot', distinct: 3 },
    finding: '光の円を小さくするほど、光がせまいところに集まって、明るく、温度も高くなる。いちばん小さくすると、黒い紙がこげることもある。',
  },
  {
    id: 'lens-size',
    exp: 'lens',
    levels: grades(3),
    question: '光(ひかり)の円の大きさを同じにして、大きい虫めがねで集めると、温度(おんど)は？',
    choices: ['小さい虫めがねより高くなる', '小さい虫めがねより低くなる', '変わらない'],
    answer: 0,
    target: 'lens',
    start: { spot: 'mid' },
    lock: ['spot'],
    need: { key: 'lens', distinct: 2 },
    finding: '大きい虫めがねは、たくさんの日光を集められるので、同じ大きさの円でも温度が高くなる。',
  },
];
