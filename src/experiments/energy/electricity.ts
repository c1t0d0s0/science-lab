import { grades } from '../../core/levels';
import type { Rng } from '../../core/rng';
import { circle, fig, group, line, path, rect, text } from '../../diagrams/svg';
import { gauss } from '../noise';
import type { Experiment, Mission } from '../types';

// 電気の利用 (6 年生)。
// - capacitor: 手回し発電機でコンデンサーに電気をためて、豆電球と発光ダイオードの明かりがつく時間をくらべる
// - nichrome (中学受験): 電熱線の太さ・長さ・電流と、発熱 (水の温度の上がり方)

// ---- コンデンサーと明かり ----

/** 明かりがついていた時間 (秒)。発光ダイオードは、豆電球より少ない電気で光る */
export function glowTime(turns: number, lamp: string, rng?: Rng): number {
  const base = turns * (lamp === 'led' ? 8 : 0.6);
  const t = base + (rng ? gauss(rng) * Math.max(0.5, base * 0.06) : 0);
  return Math.max(0, Math.round(t));
}

function capacitorScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const turns = Number(c.turns ?? 20);
  const led = c.lamp === 'led';
  const on = result !== null && p > 0.4;
  // ためた電気が、だんだんへっていく
  const charge = result === null ? 0 : p < 0.4 ? p / 0.4 : 1 - (p - 0.4) / 0.6;
  const crank = result !== null && p < 0.4 ? p * 360 * 6 : 0;
  return fig(
    320,
    200,
    `手回し発電機を${turns}回まわしてコンデンサーにためた電気で、${led ? '発光ダイオード' : '豆電球'}をつける`,
    // 手回し発電機
    group(60, 100, rect(-28, -20, 56, 40, 'fill-mark', 8), `<g transform="rotate(${crank.toFixed(0)} 28 0)">${line(28, 0, 52, 0, 'ln thick')}${circle(52, 0, 6, 'wood')}</g>`, text(0, 36, '発電機', { cls: 'tiny' })),
    // コンデンサー (ためた量)
    group(160, 100, rect(-14, -30, 28, 60, 'box', 6), rect(-10, 26 - 52 * charge, 20, 52 * charge, 'spot spot-3', 3), text(0, 46, 'コンデンサー', { cls: 'tiny' })),
    path('M88 100H146M174 100H230', 'ln wire'),
    // 明かり
    led
      ? group(250, 100, on ? circle(0, 0, 20 * charge + 6, 'glow') : '', path('M-8 -10H8L8 6A8 8 0 0 1 -8 6Z', on ? 'bulb-on' : 'bulb'), line(-4, 6, -4, 20, 'ln thin'), line(4, 6, 4, 20, 'ln thin'), text(0, 40, '発光ダイオード', { cls: 'tiny' }))
      : group(250, 100, on ? circle(0, -6, 22 * charge + 4, 'glow') : '', circle(0, -6, 12, on ? 'bulb-on' : 'bulb'), rect(-7, 6, 14, 8, 'socket', 2), text(0, 40, '豆電球', { cls: 'tiny' })),
    text(60, 40, `${turns}回まわす`, { cls: 'small' }),
    typeof result === 'number' && p >= 1 ? text(300, 30, `${result}秒ついた`, { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const capacitor: Experiment = {
  id: 'capacitor',
  field: 'energy',
  label: '電気(でんき)をためて使う',
  summary: '手回し発電機でためた電気で、豆電球と発光ダイオードがつく時間をくらべよう',
  setup: '手回し発電機のハンドルを決まった回数だけ回し、コンデンサーに電気をためます。そのコンデンサーに豆電球か発光ダイオードをつないで、明かりがついていた時間をストップウォッチではかります。ハンドルを回す速さは、どれも同じにします。',
  variables: [
    { key: 'turns', kind: 'range', label: 'ハンドルを回す回数', min: 10, max: 50, step: 10, unit: '回', initial: 20 },
    {
      key: 'lamp',
      kind: 'choice',
      label: 'つなぐもの',
      options: [
        { value: 'bulb', label: '豆電球(まめでんきゅう)' },
        { value: 'led', label: '発光(はっこう)ダイオード' },
      ],
      initial: 'bulb',
    },
  ],
  measure: { kind: 'number', label: '明かりがついていた時間', unit: '秒', digits: 0 },
  simulate: (c, rng) => glowTime(Number(c.turns ?? 20), String(c.lamp ?? 'bulb'), rng),
  scene: capacitorScene,
  duration: 2200,
};

// ---- 電熱線の発熱 ----

const AREA: Record<string, number> = { thin: 1, thick: 2 };

/** 電熱線を 100g の水に入れて 5 分間電流を流したときの、水の温度の上がり方 (℃) */
export function heatRise(thickness: string, lengthCm: number, batteries: number): number {
  // 発熱は 電圧² ÷ 抵抗、抵抗は 長さ ÷ 断面積 に比例する
  const v = batteries;
  const resistance = lengthCm / 10 / (AREA[thickness] ?? 1);
  return Math.round(((2 * v * v) / resistance) * 10) / 10;
}

function nichromeScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const thick = c.thickness === 'thick';
  const len = Number(c.length ?? 10);
  const n = Number(c.batteries ?? 1);
  const rise = typeof result === 'number' ? result * Math.min(1, p * 1.2) : 0;
  const coilW = len * 4;
  const glow = result !== null ? Math.min(1, rise / 8) : 0;
  let d = `M${160 - coilW / 2} 130`;
  for (let i = 0; i < 10; i++) d += `q${coilW / 20} -10 ${coilW / 10} 0`;
  const thermoTop = 40;
  const liquid = 150 - (20 + rise) * 2;
  return fig(
    320,
    210,
    `${thick ? '太い' : '細い'}電熱線${len}cmに、かん電池${n}こ（直列）で電流を流す`,
    rect(96, 80, 128, 80, 'water'),
    path('M94 70V162H226V70', 'ln'),
    path(d, `ln ${thick ? 'thick' : ''} nichrome`),
    glow > 0 ? `<g opacity="${(glow * 0.7).toFixed(2)}">${path(d, 'ln heat-glow')}</g>` : '',
    path(`M${160 - coilW / 2} 130V190H120M${160 + coilW / 2} 130V190H${120 + n * 44 + 6}`, 'ln wire'),
    ...Array.from({ length: n }, (_, i) => group(120 + 22 + i * 44, 190, rect(-20, -9, 40, 18, 'battery', 3), rect(20, -4, 5, 8, 'battery-tip', 1))),
    rect(244, thermoTop, 12, 110, 'glass-tube', 6),
    rect(247, liquid, 6, 150 - liquid, 'hot'),
    circle(250, 150, 8, 'hot'),
    text(20, 30, `${len}cm`, { anchor: 'start', cls: 'small' }),
    typeof result === 'number' && p >= 1 ? text(300, 30, `${result}℃上がった`, { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const nichrome: Experiment = {
  id: 'nichrome',
  field: 'energy',
  label: '電熱線(でんねつせん)の発熱',
  summary: '電熱線の太さ・長さ・電流の大きさを変えて、発熱のしかたを調べよう',
  setup: '電熱線を100gの水に入れ、かん電池につないで5分間電流を流します。水の温度が何℃上がったかで、発熱の大きさをくらべます。かん電池をふやすときは直列につなぎます。',
  variables: [
    {
      key: 'thickness',
      kind: 'choice',
      label: '電熱線の太さ',
      options: [
        { value: 'thin', label: '細い' },
        { value: 'thick', label: '太い（断面積が2倍）' },
      ],
      initial: 'thin',
    },
    { key: 'length', kind: 'range', label: '電熱線の長さ', min: 5, max: 20, step: 5, unit: 'cm', initial: 10 },
    { key: 'batteries', kind: 'range', label: 'かん電池（直列）', min: 1, max: 2, step: 1, unit: 'こ', initial: 1 },
  ],
  measure: { kind: 'number', label: '水の温度の上がり方（5分間）', unit: '℃', digits: 1 },
  simulate: (c) => heatRise(String(c.thickness ?? 'thin'), Number(c.length ?? 10), Number(c.batteries ?? 1)),
  scene: nichromeScene,
  duration: 1600,
};

export const electricityMissions: Mission[] = [
  {
    id: 'cap-led',
    exp: 'capacitor',
    levels: grades(6),
    question: '同じだけためた電気で、長く明かりがつくのは、豆電球と発光ダイオードのどちら？',
    choices: ['豆電球', '発光ダイオード', '同じ'],
    answer: 1,
    target: 'lamp',
    noise: true,
    start: { turns: 20 },
    lock: ['turns'],
    need: { key: 'lamp', distinct: 2, repeat: 2 },
    finding: '発光ダイオードは、豆電球よりずっと長く光った。発光ダイオードは少ない電気で光るので、電気を効率よく使える。',
    conclusions: [
      { text: '同じ量の電気なら、発光ダイオードのほうが長く光る（少ない電気で光る）', ok: true, why: '回す回数をそろえ、何回かはかった結果にもとづいている。' },
      { text: '発光ダイオードは、電気を使わずに光る', ok: false, why: 'コンデンサーの電気がなくなると消えた。少ない電気で光るだけ。' },
      { text: '豆電球のほうが明るいので、豆電球のほうが電気を効率よく使っている', ok: false, why: '同じ電気で光る時間は、発光ダイオードのほうがずっと長かった。' },
    ],
  },
  {
    id: 'cap-turns',
    exp: 'capacitor',
    levels: grades(6),
    question: 'ハンドルを回す回数を2倍にすると、豆電球がつく時間は？',
    choices: ['およそ2倍', '変わらない', '半分'],
    answer: 0,
    target: 'turns',
    noise: true,
    start: { lamp: 'bulb', turns: 20 },
    lock: ['lamp'],
    need: { key: 'turns', distinct: 2, among: [20, 40], repeat: 2 },
    finding: 'たくさん回すほど、コンデンサーにたまる電気がふえ、明かりも長くつく。回数を2倍にすると、つく時間もおよそ2倍になった。',
  },
  {
    id: 'nichrome-thick',
    exp: 'nichrome',
    levels: grades(6),
    exam: true,
    question: '同じ長さの電熱線で、太くすると発熱はどうなる？（かん電池に直接つなぐとき）',
    choices: ['大きくなる', '小さくなる', '変わらない'],
    answer: 0,
    target: 'thickness',
    need: { key: 'thickness', distinct: 2 },
    finding: '太い電熱線のほうが電流がたくさん流れ、発熱が大きい。断面積が2倍になると、発熱も2倍になった。',
  },
  {
    id: 'nichrome-length',
    exp: 'nichrome',
    levels: grades(6),
    exam: true,
    question: '電熱線を長くすると、発熱はどうなる？（かん電池に直接つなぐとき）',
    choices: ['大きくなる', '小さくなる', '変わらない'],
    answer: 1,
    target: 'length',
    need: { key: 'length', distinct: 3 },
    finding: '電熱線が長いほど電流が流れにくくなり、発熱は小さくなる。長さを2倍にすると、発熱は半分になる。',
  },
  {
    id: 'nichrome-battery',
    exp: 'nichrome',
    levels: grades(6),
    exam: true,
    question: 'かん電池を1こから2こ（直列）にすると、同じ電熱線の発熱は何倍？',
    choices: ['2倍', '4倍', '変わらない'],
    answer: 1,
    target: 'batteries',
    need: { key: 'batteries', distinct: 2 },
    finding: '電池を2こ直列にすると、電流が2倍になり、発熱は2×2＝4倍になる。',
    conclusions: [
      { text: 'この電熱線では、電池を2こにすると発熱がおよそ4倍になった', ok: true, why: '温度の上がり方をくらべた結果どおり。' },
      { text: '電池の数と発熱は比例する', ok: false, why: '電池が2倍のとき、発熱は2倍ではなく4倍だった。' },
      { text: '電熱線の太さが変わっても、電池をふやせば同じだけ発熱する', ok: false, why: '太さを変えると発熱も変わる。調べていないことまで言っている。' },
    ],
  },
];
