import { grades } from '../../core/levels';
import { circle, fig, path, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// 物のとけ方 (5 年生)。水 100mL にとける量 (g) は、物と温度によってちがい、水の量に比例する。
//   食塩: 20℃ 35.8 / 40℃ 36.3 / 60℃ 37.1   ミョウバン: 20℃ 11.4 / 40℃ 23.8 / 60℃ 57.4
// 中学受験: とけるだけとかした水よう液を冷やすと、とけきれなくなった分がつぶ (結しょう) になって出てくる。

const SOLUBILITY: Record<string, Record<number, number>> = {
  salt: { 20: 35.8, 40: 36.3, 60: 37.1 },
  alum: { 20: 11.4, 40: 23.8, 60: 57.4 },
};

/** その温度・水の量で、とけるだけとかしたときの量 (g) */
export function solubility(solute: string, waterMl: number, temp: number): number {
  const per100 = SOLUBILITY[solute]?.[temp] ?? 0;
  return Math.round(((per100 * waterMl) / 100) * 10) / 10;
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const solute = String(c.solute ?? 'salt');
  const ml = Number(c.water ?? 100);
  const temp = Number(c.temp ?? 20);
  const level = 50 + ml * 0.5;
  const amount = typeof result === 'number' ? result : 0;
  const k = result === null ? 0 : Math.min(1, p * 1.3);
  // とけ残りのつぶ: とかす前はたくさん、とけるとへる (とけた分は見えなくなる)
  const extra = 60;
  const left = Math.max(0, Math.round(((extra - amount * k) / extra) * 14));
  const grains = Array.from({ length: left }, (_, i) => circle(132 + (i % 7) * 9, 172 - Math.floor(i / 7) * 6, 2.6, solute === 'alum' ? 'crystal' : 'salt')).join('');
  return fig(
    320,
    210,
    `${temp}℃の水${ml}mLに${solute === 'alum' ? 'ミョウバン' : '食塩'}をとかす`,
    rect(116, 180 - level, 88, level, temp >= 60 ? 'hot-water' : 'water'),
    path('M114 40V180H206V40', 'ln'),
    grains,
    result !== null ? path(`M160 ${180 - level + 10}q${10 * Math.sin(p * 20)} 20 0 40`, 'ln thin') : '',
    rect(232, 40, 12, 120, 'glass-tube', 6),
    rect(235, 150 - temp * 1.6, 6, 10 + temp * 1.6, 'hot'),
    text(252, 60, `${temp}℃`, { anchor: 'start', cls: 'small' }),
    text(20, 30, `水 ${ml}mL`, { anchor: 'start', cls: 'small' }),
    typeof result === 'number' && p >= 1 ? text(20, 200, `${result}gまでとけた`, { anchor: 'start', cls: 'result-yes' }) : '',
  );
}

export const dissolve: Experiment = {
  id: 'dissolve',
  field: 'particle',
  label: '物(もの)のとけ方(かた)',
  summary: '水の量や温度を変えて、食塩とミョウバンがとける量を調べよう',
  setup: 'ビーカーに水を入れ、食塩かミョウバンを少しずつ入れてかきまぜます。とけ残りが出るまでに、何gとけたかを調べます。水の量と、水の温度（20℃・40℃・60℃）を変えてくらべます。',
  variables: [
    {
      key: 'solute',
      kind: 'choice',
      label: 'とかすもの',
      options: [
        { value: 'salt', label: '食塩(しょくえん)' },
        { value: 'alum', label: 'ミョウバン' },
      ],
      initial: 'salt',
    },
    { key: 'water', kind: 'range', label: '水(みず)の量(りょう)', min: 50, max: 150, step: 50, unit: 'mL', initial: 50 },
    { key: 'temp', kind: 'range', label: '水の温度(おんど)', min: 20, max: 60, step: 20, unit: '℃', initial: 20 },
  ],
  measure: { kind: 'number', label: 'とけた量', unit: 'g', digits: 1 },
  simulate: (c) => solubility(String(c.solute ?? 'salt'), Number(c.water ?? 50), Number(c.temp ?? 20)),
  scene,
  duration: 1600,
};

export const dissolveMissions: Mission[] = [
  {
    id: 'dissolve-water',
    exp: 'dissolve',
    levels: grades(5),
    question: '水(みず)の量を2倍にすると、とける量は？',
    choices: ['2倍になる', '変わらない', '半分になる'],
    answer: 0,
    target: 'water',
    start: { solute: 'salt', temp: 20 },
    need: { key: 'water', distinct: 3 },
    finding: '水の量を2倍、3倍にすると、とける量も2倍、3倍になる。とける量は水の量に比例する。',
    hint: 'とかすものと水の温度は同じにして、水の量だけを変えよう',
  },
  {
    id: 'dissolve-temp-alum',
    exp: 'dissolve',
    levels: grades(5),
    question: '水(みず)の温度を上げると、ミョウバンのとける量は？',
    choices: ['ふえる', 'へる', '変わらない'],
    answer: 0,
    target: 'temp',
    start: { solute: 'alum', water: 50 },
    need: { key: 'temp', distinct: 3 },
    finding: 'ミョウバンは、水の温度が高いほど、たくさんとける。60℃では20℃のときの5倍くらいとける。',
  },
  {
    id: 'dissolve-temp-salt',
    exp: 'dissolve',
    levels: grades(5),
    question: '水(みず)の温度を上げると、食塩(しょくえん)のとける量は？',
    choices: ['大きくふえる', 'ほとんど変わらない', 'へる'],
    answer: 1,
    target: 'temp',
    start: { solute: 'salt', water: 50 },
    need: { key: 'temp', distinct: 3 },
    finding: '食塩は、水の温度を上げても、とける量はほとんど変わらない。物によって、温度ととける量の関係がちがう。',
  },
  {
    id: 'dissolve-crystal',
    exp: 'dissolve',
    levels: grades(5),
    exam: true,
    question: '60℃の水100mLにミョウバンをとけるだけとかし、20℃まで冷やすと、何gのつぶが出てくる？',
    choices: ['46.0g', '11.4g', '57.4g', '出てこない'],
    answer: 0,
    target: 'temp',
    start: { solute: 'alum', water: 100, temp: 60 },
    lock: ['solute', 'water'],
    need: { key: 'temp', distinct: 2, among: [20, 60] },
    finding: '60℃では57.4g、20℃では11.4gまでとける。冷やすと、とけきれなくなった 57.4−11.4＝46.0g がつぶ（結しょう）になって出てくる。',
    hint: '60℃と20℃で、とける量をくらべよう',
  },
];
