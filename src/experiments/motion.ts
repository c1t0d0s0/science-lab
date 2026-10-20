import { grades } from '../core/levels';
import { circle, fig, group, line, path, rect, text } from '../diagrams/svg';
import type { Experiment, Mission } from './types';

// 風(かぜ)とゴムの力で動く車。力が大きいほど、車は遠くまで進む。

const TRACK_X = 40;
const PX_PER_M = 44;
const TRACK_MAX = 6;

function car(x: number, y: number, sail: boolean): string {
  return group(
    x,
    y,
    rect(-22, -16, 44, 14, 'car', 3),
    circle(-13, 0, 6, 'wheel'),
    circle(13, 0, 6, 'wheel'),
    sail ? line(-8, -16, -8, -50, 'ln') + path('M-8 -50Q14 -36 -8 -20Z', 'sail') : '',
  );
}

function track(): string {
  const marks = Array.from({ length: TRACK_MAX + 1 }, (_, m) =>
    line(TRACK_X + m * PX_PER_M, 168, TRACK_X + m * PX_PER_M, 176, 'ln thin') + text(TRACK_X + m * PX_PER_M, 192, `${m}m`, { cls: 'tiny' }),
  ).join('');
  return rect(10, 160, 300, 8, 'ground') + marks;
}

/** 進んだきょりまで、だんだんおそくなりながら進む */
const travel = (d: number, p: number) => d * (1 - (1 - Math.min(1, p)) ** 2.4);

// ---- 風 ----

const WIND: Record<string, number> = { weak: 1.2, mid: 2.6, strong: 4.4 };

export function windDistance(strength: string, sail: string): number {
  return Math.round((WIND[strength] ?? WIND.mid) * (sail === 'none' ? 0.25 : 1) * 10) / 10;
}

function windScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const d = typeof result === 'number' ? result : 0;
  const x = TRACK_X + travel(d, p) * PX_PER_M;
  const strong = { weak: 1, mid: 2, strong: 3 }[String(c.strength)] ?? 2;
  const gust =
    result !== null && p < 0.8
      ? Array.from({ length: strong + 1 }, (_, i) => path(`M${4 + ((p * 120 + i * 18) % 40)} ${110 + i * 14}q10 -6 20 0t20 0`, 'ln thin wind')).join('')
      : '';
  return fig(
    320,
    200,
    `送風機で風を当てて車を動かす`,
    track(),
    group(14, 116, rect(-10, -24, 18, 48, 'box', 4), circle(-1, 0, 14, 'fan')),
    gust,
    car(Math.max(TRACK_X, x), 154, c.sail !== 'none'),
    result !== null && p >= 1 ? text(296, 30, `${d}m`, { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const wind: Experiment = {
  id: 'wind',
  label: '風(かぜ)で動(うご)く車(くるま)',
  kana: 'かぜで うごく くるま',
  summary: '風の強さや ほのあるなしを変えて、車の進むきょりを調べよう',
  kanaSummary: 'かぜを あてて、くるまを うごかそう',
  variables: [
    {
      key: 'strength',
      kind: 'choice',
      label: '風(かぜ)の強(つよ)さ',
      kana: 'かぜの つよさ',
      options: [
        { value: 'weak', label: '弱(よわ)い', kana: 'よわい' },
        { value: 'mid', label: '中(ちゅう)くらい', kana: 'ちゅうくらい' },
        { value: 'strong', label: '強(つよ)い', kana: 'つよい' },
      ],
      initial: 'weak',
    },
    {
      key: 'sail',
      kind: 'choice',
      label: 'ほ',
      options: [
        { value: 'sail', label: 'あり' },
        { value: 'none', label: 'なし' },
      ],
      initial: 'sail',
    },
  ],
  measure: { kind: 'number', label: '進(すす)んだきょり', kana: 'すすんだ きょり', unit: 'm', digits: 1 },
  simulate: (c) => windDistance(String(c.strength), String(c.sail)),
  scene: windScene,
  duration: 1800,
};

// ---- ゴム ----

export function rubberDistance(stretch: number, bands: number): number {
  return Math.round(Math.max(0, 0.3 * stretch - 0.6) * (bands >= 2 ? 1.6 : 1) * 10) / 10;
}

function rubberScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const d = typeof result === 'number' ? result : 0;
  const stretch = Number(c.stretch ?? 10);
  const bands = Number(c.bands ?? 1);
  const pull = result === null ? stretch * 1.6 : Math.max(0, stretch * 1.6 * (1 - p * 6));
  const x = TRACK_X + travel(d, p) * PX_PER_M;
  const hookX = 30;
  const rubber = Array.from({ length: bands }, (_, i) =>
    path(`M${hookX - 8} ${132 + i * 6}L${hookX - pull + 8} ${142}L${hookX - 8} ${150 - i * 6}`, 'ln band'),
  ).join('');
  return fig(
    320,
    200,
    `ゴムを${stretch}cmのばして車を発しゃする`,
    track(),
    rect(10, 124, 6, 34, 'wood', 2),
    rect(hookX - 10, 124, 6, 34, 'wood', 2),
    rubber,
    car(result === null ? TRACK_X : x, 154, false),
    result === null ? text(160, 40, `${stretch}cm のばす`, { cls: 'small' }) : '',
    result !== null && p >= 1 ? text(296, 30, `${d}m`, { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const rubber: Experiment = {
  id: 'rubber',
  label: 'ゴムで動(うご)く車(くるま)',
  summary: 'ゴムをのばす長さや本数を変えて、車の進むきょりを調べよう',
  variables: [
    { key: 'stretch', kind: 'range', label: 'ゴムをのばす長(なが)さ', min: 5, max: 15, step: 5, unit: 'cm', initial: 5 },
    { key: 'bands', kind: 'range', label: 'ゴムの本数(ほんすう)', min: 1, max: 2, step: 1, unit: '本', initial: 1 },
  ],
  measure: { kind: 'number', label: '進(すす)んだきょり', unit: 'm', digits: 1 },
  simulate: (c) => rubberDistance(Number(c.stretch ?? 10), Number(c.bands ?? 1)),
  scene: rubberScene,
  duration: 1800,
};

export const motionMissions: Mission[] = [
  {
    id: 'wind-strength-low',
    exp: 'wind',
    levels: grades(1, 2),
    question: 'かぜを つよく すると、くるまは？',
    choices: ['とおくまで すすむ', 'ちかくで とまる', 'かわらない'],
    answer: 0,
    target: 'strength',
    show: ['strength'],
    need: { key: 'strength', distinct: 3 },
    finding: 'かぜが つよいほど、くるまは とおくまで すすむ。',
  },
  {
    id: 'wind-sail',
    exp: 'wind',
    levels: grades(1, 2),
    question: 'ほが ある くるまと ない くるま、よく すすむのは どっち？',
    choices: ['ほが ある くるま', 'ほが ない くるま', 'おなじ'],
    answer: 0,
    target: 'sail',
    need: { key: 'sail', distinct: 2 },
    finding: 'ほが あると、かぜを たくさん うけて よく すすむ。',
    hint: 'かぜの つよさは おなじに して、ほだけを かえてみよう',
  },
  {
    id: 'wind-strength',
    exp: 'wind',
    levels: grades(3, 4),
    question: '風(かぜ)が弱(よわ)いときと強(つよ)いときでくらべると、車(くるま)の進(すす)むきょりは？',
    choices: ['強いほうが遠くまで進む', '弱いほうが遠くまで進む', '変(か)わらない'],
    answer: 0,
    target: 'strength',
    start: { sail: 'sail' },
    need: { key: 'strength', distinct: 2 },
    finding: '風が強いほど、物を動かすはたらきは大きく、車は遠くまで進む。',
  },
  {
    id: 'rubber-stretch',
    exp: 'rubber',
    levels: grades(3, 4),
    question: 'ゴムを長(なが)くのばすほど、車(くるま)の進(すす)むきょりは？',
    choices: ['長くなる', '短(みじか)くなる', '変(か)わらない'],
    answer: 0,
    target: 'stretch',
    start: { bands: 1 },
    need: { key: 'stretch', distinct: 3 },
    finding: 'ゴムを長くのばすほど、ゴムがもとにもどろうとする力が大きくなり、車は遠くまで進む。',
  },
  {
    id: 'rubber-bands',
    exp: 'rubber',
    levels: grades(3, 4),
    question: 'ゴムを1本から2本にふやすと、車(くるま)の進(すす)むきょりは？',
    choices: ['長くなる', '短(みじか)くなる', '変(か)わらない'],
    answer: 0,
    target: 'bands',
    start: { stretch: 10 },
    need: { key: 'bands', distinct: 2 },
    finding: 'ゴムの本数をふやすと、もとにもどろうとする力が大きくなり、車は遠くまで進む。',
    hint: 'のばす長さは同じにして、本数だけを変えてくらべよう',
  },
];
