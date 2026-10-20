import { grades } from '../../core/levels';
import { circle, fig, group, line, path, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// モーターと検流計 (4 年生)。かん電池の向きを変えると電流の向きが変わり、モーターは反対に回る。
// かん電池 2 こを直列につなぐと電流が大きくなり速く回る。へい列では 1 このときと同じくらい。

/** 電流の大きさ (かん電池 1 こ = 1)。向きは +1 / −1 */
export function motorCurrent(c: Record<string, number | string>): number {
  const n = Number(c.batteries ?? 1);
  const size = n >= 2 && c.wiring === 'series' ? 2 : 1;
  return size * (c.direction === 'reverse' ? -1 : 1);
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const cur = motorCurrent(c);
  const on = result !== null;
  const spin = on ? p * 360 * 3 * cur : 0;
  const n = Number(c.batteries ?? 1);
  const parallel = n >= 2 && c.wiring === 'parallel';
  const rev = c.direction === 'reverse';
  const battery = (x: number, y: number) =>
    group(x, y, rect(-22, -10, 44, 20, 'battery', 3), rev ? rect(-27, -4, 5, 8, 'battery-tip', 1) : rect(22, -4, 5, 8, 'battery-tip', 1), text(rev ? -14 : 14, 4, '+', { cls: 'tiny on-dark' }));
  const batteries =
    n === 1 ? battery(160, 170) : parallel ? battery(160, 156) + battery(160, 184) + path('M132 156V184M188 156V184', 'ln wire') : battery(134, 170) + battery(186, 170);
  // 検流計: はりは電流の向きにふれ、大きさだけ大きくふれる
  const needle = on ? cur * 22 * Math.min(1, p * 3) : 0;
  return fig(
    320,
    210,
    `かん電池${n}こ${n === 2 ? (parallel ? 'をへい列' : 'を直列') : ''}につないだモーター。電池の向き${rev ? '反対' : 'ふつう'}`,
    path('M60 170H110M210 170H260V60H200M120 60H60V170', 'ln wire'),
    batteries,
    // モーターとプロペラ
    group(
      90,
      60,
      rect(-20, -16, 40, 32, 'iron', 6),
      line(20, 0, 34, 0, 'ln thick'),
      group(34, 0, `<g transform="rotate(${spin.toFixed(1)})">${path('M0 0L-4 -30Q0 -34 4 -30Z', 'fill-mark')}${path('M0 0L-4 30Q0 34 4 30Z', 'fill-mark')}</g>`, circle(0, 0, 3, 'ink')),
    ),
    // 検流計
    group(
      160,
      60,
      rect(-34, -24, 68, 40, 'box', 6),
      path('M-24 8A26 26 0 0 1 24 8', 'ln thin'),
      `<g transform="rotate(${needle.toFixed(1)} 0 10)">${line(0, 10, 0, -14, 'ln red')}</g>`,
      text(0, 14, '検流計', { cls: 'tiny' }),
    ),
    on && p >= 1 ? text(300, 120, cur > 0 ? '右に回る' : '左に回る', { anchor: 'end', cls: 'result-yes' }) : '',
    on && p >= 1 ? text(300, 140, Math.abs(cur) >= 2 ? '速い' : 'ふつう', { anchor: 'end', cls: 'small' }) : '',
  );
}

export const motor: Experiment = {
  id: 'motor',
  field: 'energy',
  label: 'モーターと電流(でんりゅう)',
  summary: 'かん電池の向き・数・つなぎ方を変えて、モーターの回り方と電流を調べよう',
  setup: 'かん電池・検流計(けんりゅうけい)・プロペラをつけたモーターを、どう線で1つのわにつなぎます。検流計のはりのふれる向きで電流の向き、ふれはばで電流の大きさが分かります。',
  variables: [
    {
      key: 'direction',
      kind: 'choice',
      label: 'かん電池(でんち)の向(む)き',
      options: [
        { value: 'normal', label: 'ふつう' },
        { value: 'reverse', label: '反対(はんたい)' },
      ],
      initial: 'normal',
    },
    { key: 'batteries', kind: 'range', label: 'かん電池の数(かず)', min: 1, max: 2, step: 1, unit: 'こ', initial: 1 },
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
    label: 'モーターの回り方',
    options: [
      { value: 'cw', label: '右に回る（ふつう）' },
      { value: 'cw-fast', label: '右に速く回る' },
      { value: 'ccw', label: '左に回る（ふつう）' },
      { value: 'ccw-fast', label: '左に速く回る' },
    ],
  },
  simulate: (c) => {
    const cur = motorCurrent(c);
    return `${cur > 0 ? 'cw' : 'ccw'}${Math.abs(cur) >= 2 ? '-fast' : ''}`;
  },
  scene,
  duration: 1600,
};

export const motorMissions: Mission[] = [
  {
    id: 'motor-direction',
    exp: 'motor',
    levels: grades(4),
    question: 'かん電池(でんち)の向きを反対にすると、モーターの回る向きは？',
    choices: ['反対になる', '同じ', '止まる'],
    answer: 0,
    target: 'direction',
    show: ['direction'],
    need: { key: 'direction', distinct: 2 },
    finding: 'かん電池の向きを反対にすると、検流計のはりも反対にふれた。電流の向きが反対になり、モーターも反対に回る。',
  },
  {
    id: 'motor-series',
    exp: 'motor',
    levels: grades(4),
    question: 'かん電池2こを直列(ちょくれつ)につなぐと、モーターの回る速さは？',
    choices: ['速くなる', 'おそくなる', '変わらない'],
    answer: 0,
    target: 'batteries',
    start: { wiring: 'series', direction: 'normal' },
    lock: ['wiring', 'direction'],
    need: { key: 'batteries', distinct: 2 },
    finding: '直列つなぎでは、検流計のはりが大きくふれた。電流が大きくなり、モーターは速く回る。',
  },
  {
    id: 'motor-parallel',
    exp: 'motor',
    levels: grades(4),
    question: 'かん電池2こをへい列(れつ)につなぐと、モーターの回る速さは？',
    choices: ['速くなる', 'おそくなる', '1このときと同じくらい'],
    answer: 2,
    target: 'batteries',
    start: { wiring: 'parallel', direction: 'normal' },
    lock: ['wiring', 'direction'],
    need: { key: 'batteries', distinct: 2 },
    finding: 'へい列つなぎでは、電流の大きさは1このときとほぼ同じで、回る速さも同じくらい。',
  },
];
