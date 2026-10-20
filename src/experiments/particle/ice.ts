import { grades } from '../../core/levels';
import { circle, fig, group, path, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// こおりを とかす (2 年生)。あたたかい ところほど はやく とける。ちいさく わると はやく とける。

const PLACE: Record<string, number> = { hand: 3, sun: 8, shade: 20 };
const SIZE: Record<string, number> = { big: 1, small: 0.4 };

/** ぜんぶ とけるまでの じかん (ふん) */
export function meltTime(place: string, size: string): number {
  return Math.round((PLACE[place] ?? 8) * (SIZE[size] ?? 1));
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const place = String(c.place ?? 'sun');
  const small = c.size === 'small';
  const left = result === null ? 1 : Math.max(0, 1 - p);
  const s = (small ? 16 : 28) * (0.25 + 0.75 * left);
  const ice = small
    ? [-14, 6].map((dx) => rect(160 + dx - s / 2, 132 - s, s, s, 'ice', 3)).join('')
    : rect(160 - s / 2, 132 - s, s, s, 'ice', 4);
  const puddle = result === null ? '' : path(`M${160 - 20 - 30 * p} 134Q160 ${138 + 4 * p} ${160 + 20 + 30 * p} 134Z`, 'water');
  const bg =
    place === 'sun'
      ? circle(40, 34, 16, 'sun')
      : place === 'shade'
        ? rect(0, 0, 320, 110, 'darkbox')
        : group(160, 116, path('M-50 18Q-40 -6 -20 -10H20Q40 -6 50 18Z', 'hand'));
  return fig(
    320,
    200,
    `${{ sun: 'ひなた', shade: 'ひかげ', hand: 'てで にぎる' }[place]}で ${small ? 'ちいさく わった ' : ''}こおりを とかす`,
    bg,
    place === 'hand' ? '' : rect(80, 134, 160, 6, 'box', 3),
    puddle,
    ice,
    result !== null ? text(296, 190, `${Math.round(Number(result) * Math.min(1, p))}ふん`, { anchor: 'end', cls: 'small' }) : '',
    typeof result === 'number' && p >= 1 ? text(160, 30, `${result}ふんで とけた`, { cls: 'result-yes' }) : '',
  );
}

export const ice: Experiment = {
  id: 'ice',
  field: 'particle',
  label: 'こおりを とかす',
  summary: 'こおりを おく ばしょや おおきさを かえて、とける はやさを くらべよう',
  setup: 'おなじ おおきさの こおりを、ひなた・ひかげに おいたり、てで にぎったりします。ぜんぶ とけて みずに なるまでの じかんを はかります。',
  kanaSetup: 'おなじ おおきさの こおりを、いろいろな ばしょに おくよ。ぜんぶ とけるまでの じかんを くらべよう。',
  variables: [
    {
      key: 'place',
      kind: 'choice',
      label: 'こおりを おく ばしょ',
      options: [
        { value: 'sun', label: 'ひなた' },
        { value: 'shade', label: 'ひかげ' },
        { value: 'hand', label: 'てで にぎる' },
      ],
      initial: 'sun',
    },
    {
      key: 'size',
      kind: 'choice',
      label: 'こおりの おおきさ',
      options: [
        { value: 'big', label: 'おおきい まま' },
        { value: 'small', label: 'ちいさく わる' },
      ],
      initial: 'big',
    },
  ],
  measure: { kind: 'number', label: 'とけるまでの じかん', unit: 'ふん', digits: 0 },
  simulate: (c) => meltTime(String(c.place ?? 'sun'), String(c.size ?? 'big')),
  scene,
  duration: 1600,
};

export const iceMissions: Mission[] = [
  {
    id: 'ice-sun',
    exp: 'ice',
    levels: grades(2),
    question: 'ひなたと ひかげ、こおりが はやく とけるのは どっち？',
    choices: ['ひなた', 'ひかげ', 'おなじ'],
    answer: 0,
    target: 'place',
    show: ['place'],
    need: { key: 'place', distinct: 2, among: ['sun', 'shade'] },
    finding: 'ひなたの ほうが はやく とけた。あたたかい ところほど、こおりは はやく とけるよ。',
  },
  {
    id: 'ice-hand',
    exp: 'ice',
    levels: grades(2),
    question: 'こおりを てで にぎると、とける はやさは？',
    choices: ['はやく なる', 'おそく なる', 'かわらない'],
    answer: 0,
    target: 'place',
    show: ['place'],
    need: { key: 'place', distinct: 2, among: ['hand', 'sun', 'shade'] },
    finding: 'てで にぎると いちばん はやく とけた。てが あたたかいからだね。',
  },
  {
    id: 'ice-size',
    exp: 'ice',
    levels: grades(2),
    question: 'こおりを ちいさく わると、とける はやさは？',
    choices: ['はやく なる', 'おそく なる', 'かわらない'],
    answer: 0,
    target: 'size',
    start: { place: 'shade' },
    lock: ['place'],
    need: { key: 'size', distinct: 2 },
    finding: 'ちいさく わった こおりの ほうが はやく とけた。',
  },
];
