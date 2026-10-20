import { grades } from '../../core/levels';
import { arrow, circle, fig, group, line, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// かっ車と輪じく (6 年生・中学受験)。かっ車やひもの重さは考えない。
// - 定かっ車: 力の大きさは同じ (向きだけ変わる)
// - 動かっ車: 力は半分 (ひもを引く長さは 2 倍)
// - 動かっ車 2 こ: 力は 4 分の 1
// - 輪じく (大きい輪の半径 30cm・小さい輪 10cm): 力は 3 分の 1

const RATIO: Record<string, number> = { fixed: 1, moving: 2, double: 4, axle: 3 };

/** おもりを持ち上げるのに必要な、ひもを引く力 (g) */
export function pullForce(tool: string, weightG: number): number {
  return Math.round((weightG / (RATIO[tool] ?? 1)) * 10) / 10;
}

function weightBox(x: number, y: number, g: number): string {
  return group(x, y, rect(-16, 0, 32, 22 + g / 40, 'iron', 3), text(0, 16, `${g}g`, { cls: 'tiny on-dark' }));
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const tool = String(c.tool ?? 'fixed');
  const w = Number(c.weight ?? 300);
  const lift = result === null ? 0 : 18 * Math.min(1, p * 1.3);
  const ceiling = rect(20, 10, 280, 8, 'wood', 2);
  const reading = typeof result === 'number' && p >= 1 ? text(300, 200, `引く力 ${result}g`, { anchor: 'end', cls: 'result-yes' }) : '';
  let body = '';
  if (tool === 'fixed') {
    body =
      line(160, 18, 160, 40, 'ln') +
      circle(160, 52, 14, 'box') +
      circle(160, 52, 3, 'ink') +
      line(146, 52, 146, 120 - lift, 'ln') +
      weightBox(146, 120 - lift, w) +
      line(174, 52, 174, 150 + lift, 'ln') +
      arrow(174, 150 + lift, 174, 180 + lift, 'ln red');
  } else if (tool === 'moving') {
    // 天井から下りたひもが動かっ車をくぐり、定かっ車を通って手で引く
    const y = 110 - lift;
    body =
      line(102, 18, 102, y, 'ln') +
      circle(120, y, 18, 'box') +
      circle(120, y, 3, 'ink') +
      line(138, y, 138, 52, 'ln') +
      line(152, 18, 152, 38, 'ln') +
      circle(152, 52, 14, 'box') +
      circle(152, 52, 3, 'ink') +
      line(120, y + 18, 120, y + 28, 'ln') +
      weightBox(120, y + 28, w) +
      line(166, 52, 166, 150 + lift * 2, 'ln') +
      arrow(166, 150 + lift * 2, 166, 180 + lift * 2, 'ln red');
  } else if (tool === 'double') {
    // 動かっ車 A におもり。A のひもの 1 本は天井、もう 1 本は動かっ車 B につながる。
    // B のひもの 1 本は天井、もう 1 本は定かっ車を通って手で引く
    const ya = 150 - lift;
    const yb = 96 - lift * 2;
    body =
      line(94, 18, 94, ya, 'ln') +
      circle(110, ya, 16, 'box') +
      circle(110, ya, 3, 'ink') +
      line(126, ya, 126, yb + 16, 'ln') +
      line(110, 18, 110, yb, 'ln') +
      circle(126, yb, 16, 'box') +
      circle(126, yb, 3, 'ink') +
      line(142, yb, 142, 40, 'ln') +
      line(156, 18, 156, 26, 'ln') +
      circle(156, 40, 14, 'box') +
      circle(156, 40, 3, 'ink') +
      line(110, ya + 16, 110, ya + 22, 'ln') +
      weightBox(110, ya + 22, w) +
      line(170, 40, 170, 150 + lift * 4, 'ln') +
      arrow(170, 150 + lift * 4, 170, 180 + lift * 4, 'ln red') +
      text(76, ya + 4, 'A', { cls: 'tiny' }) +
      text(92, yb + 4, 'B', { cls: 'tiny' });
  } else {
    // 輪じく: 小さい輪におもり、大きい輪のひもを引く
    body =
      line(160, 18, 160, 70, 'ln') +
      circle(160, 80, 30, 'box') +
      circle(160, 80, 10, 'fill-soft') +
      circle(160, 80, 3, 'ink') +
      line(150, 80, 150, 140 - lift, 'ln') +
      weightBox(150, 140 - lift, w) +
      line(190, 80, 190, 150 + lift * 3, 'ln') +
      arrow(190, 150 + lift * 3, 190, 180 + lift * 3, 'ln red') +
      text(250, 70, '大きい輪 半径30cm', { cls: 'tiny' }) +
      text(250, 84, '小さい輪 半径10cm', { cls: 'tiny' });
  }
  return fig(
    320,
    220,
    `${{ fixed: '定かっ車', moving: '動かっ車', double: '動かっ車2こ', axle: '輪じく' }[tool] ?? ''}で${w}gのおもりを持ち上げる`,
    ceiling,
    body,
    reading,
  );
}

export const pulley: Experiment = {
  id: 'pulley',
  field: 'energy',
  label: 'かっ車と輪(りん)じく',
  summary: '定かっ車・動かっ車・輪じくを使って、おもりを持ち上げる力を調べよう',
  setup: 'かっ車や輪じくにひもをかけ、おもりをつるします。ひもの はしを ばねばかりで引いて、おもりをゆっくり持ち上げるときの力をはかります。かっ車・ひもの重さは考えません。輪じくは、大きい輪の半径が30cm、小さい輪が10cmです。',
  variables: [
    {
      key: 'tool',
      kind: 'choice',
      label: '使う道具',
      options: [
        { value: 'fixed', label: '定(てい)かっ車' },
        { value: 'moving', label: '動(どう)かっ車' },
        { value: 'double', label: '動かっ車2こ' },
        { value: 'axle', label: '輪(りん)じく' },
      ],
      initial: 'fixed',
    },
    { key: 'weight', kind: 'range', label: 'おもりの重さ', min: 100, max: 600, step: 100, unit: 'g', initial: 300 },
  ],
  measure: { kind: 'number', label: 'ひもを引く力', unit: 'g', digits: 0 },
  simulate: (c) => pullForce(String(c.tool ?? 'fixed'), Number(c.weight ?? 300)),
  scene,
  duration: 1400,
};

export const pulleyMissions: Mission[] = [
  {
    id: 'pulley-moving',
    exp: 'pulley',
    levels: grades(6),
    exam: true,
    question: '動(どう)かっ車を使うと、おもりを持ち上げる力は、定(てい)かっ車のときの何倍？',
    choices: ['半分', '同じ', '2倍'],
    answer: 0,
    target: 'tool',
    need: { key: 'tool', distinct: 2, among: ['fixed', 'moving'] },
    finding: '定かっ車では、引く力はおもりの重さと同じ（力の向きが変わるだけ）。動かっ車では、おもりを2本のひもで支えるので、引く力は半分になる。そのかわり、ひもを引く長さは2倍になる。',
    conclusions: [
      { text: '調べた重さでは、動かっ車の力は定かっ車のちょうど半分だった', ok: true, why: 'どの重さでもくらべた結果にもとづいている。' },
      { text: '動かっ車を使えば、引く長さも半分ですむ', ok: false, why: '力は半分になるが、引く長さは2倍になる。力と長さの両方で得をすることはない。' },
      { text: '動かっ車は、おもりが重いときだけ力が半分になる', ok: false, why: '軽いおもりでも重いおもりでも、力は半分だった。' },
    ],
  },
  {
    id: 'pulley-double',
    exp: 'pulley',
    levels: grades(6),
    exam: true,
    question: '動(どう)かっ車を2こ組み合わせて400gのおもりを持ち上げると、引く力は何g？',
    choices: ['400g', '200g', '100g', '50g'],
    answer: 2,
    target: 'tool',
    start: { weight: 400 },
    lock: ['weight'],
    need: { key: 'tool', distinct: 3, among: ['fixed', 'moving', 'double'] },
    finding: '動かっ車1こで半分の200g、2こでさらに半分の100gになる。動かっ車が1こふえるごとに、力は半分になる。',
  },
  {
    id: 'pulley-axle',
    exp: 'pulley',
    levels: grades(6),
    exam: true,
    question: '輪(りん)じく（半径30cmと10cm）で、小さい輪につるした300gのおもりを持ち上げる。大きい輪のひもを引く力は何g？',
    choices: ['100g', '150g', '300g', '900g'],
    answer: 0,
    target: 'weight',
    start: { tool: 'axle', weight: 300 },
    lock: ['tool'],
    need: { key: 'weight', distinct: 2 },
    finding: '輪じくは、てこと同じで「力×半径」が等しくなる。300g×10cm＝□×30cm より、□＝100g。',
    conclusions: [
      { text: '輪じくでは、引く力×大きい輪の半径 ＝ おもり×小さい輪の半径 になっていた', ok: true, why: 'てこのきまりと同じ形で、はかった値と合っている。' },
      { text: '輪じくでは、いつも力が半分になる', ok: false, why: '半径が3倍ちがうので、力は3分の1だった。半径の比で決まる。' },
      { text: 'おもりが重いほど、輪じくは楽にならない', ok: false, why: 'どの重さでも、力は3分の1だった。' },
    ],
  },
];
