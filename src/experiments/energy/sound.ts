import { grades } from '../../core/levels';
import { circle, fig, group, line, path, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// 音のふしぎ。音は物がふるえて出て、ふるえが伝わって聞こえる。
// - itodenwa (1・3 年生): 糸電話。糸をぴんとはると聞こえ、たるませたり つまんだりすると聞こえない
// - drum (3 年生): たいこ。強くたたくほど大きな音で、ふるえも大きい。手でおさえるとふるえが止まり、音も止まる

// ---- 糸電話 ----

function heard(c: Record<string, number | string>): boolean {
  return c.string === 'tight' && c.pinch === 'no';
}

function cup(x: number, flip: boolean): string {
  const d = flip ? `M${x} 92L${x + 24} 82V118L${x} 108Z` : `M${x} 92L${x - 24} 82V118L${x} 108Z`;
  return path(d, 'paperfill');
}

function itodenwaScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const tight = c.string === 'tight';
  const pinch = c.pinch === 'yes';
  const L = 70;
  const R = 250;
  const sag = tight ? 0 : 34;
  const str = path(`M${L} 100Q160 ${100 + sag * 2} ${R} 100`, 'ln thin');
  // 声のふるえが、糸を通って右のコップまで伝わる
  const reach = result === null ? 0 : Math.min(1, p * 1.4);
  const stop = !tight ? 0.25 : pinch ? 0.5 : 1;
  const front = Math.min(reach, stop);
  const xAt = L + (R - L) * front;
  const yAt = 100 + (tight ? 0 : sag * 2 * 2 * front * (1 - front));
  const pulse = result !== null && reach > 0 ? circle(xAt, yAt, 4, 'fill-mark') : '';
  const waves =
    result === 'hear' && reach >= 1
      ? [0, 1, 2].map((i) => path(`M${R + 34 + i * 10} ${86 - i * 4}q8 14 0 28`, 'ln thin wind')).join('')
      : '';
  return fig(
    320,
    200,
    `糸電話。糸を${tight ? 'ぴんとはる' : 'たるませる'}${pinch ? '、まん中をつまむ' : ''}`,
    cup(L, false),
    cup(R, true),
    str,
    pinch ? group(160, tight ? 100 : 100 + sag, circle(-5, -8, 7, 'hand'), circle(5, 8, 7, 'hand')) : '',
    pulse,
    waves,
    text(L - 14, 140, 'はなす', { cls: 'small' }),
    text(R + 14, 140, 'きく', { cls: 'small' }),
    result === null || reach < 1 ? '' : text(160, 30, result === 'hear' ? 'きこえた！' : 'きこえない', { cls: result === 'hear' ? 'result-yes' : 'result-no' }),
  );
}

export const itodenwa: Experiment = {
  id: 'itodenwa',
  field: 'energy',
  label: '糸電話(いとでんわ)',
  kana: 'いとでんわ',
  summary: '糸のはり方を変えて、声が聞こえるか調べよう',
  kanaSummary: 'いとの はりかたを かえて、こえが きこえるか しらべよう',
  setup: '紙コップ2つの底(そこ)を糸でつないだ糸電話です。左のコップに声を出し、右のコップで聞きます。糸のはり方を変えたり、糸のまん中をつまんだりして、声が聞こえるかを調べます。',
  kanaSetup: 'かみコップ 2つを いとで つないだ いとでんわだよ。ひだりで はなして、みぎで きくよ。いとの はりかたを かえて みよう。',
  variables: [
    {
      key: 'string',
      kind: 'choice',
      label: '糸(いと)のはり方(かた)',
      kana: 'いとの はりかた',
      options: [
        { value: 'tight', label: 'ぴんとはる', kana: 'ぴんと はる' },
        { value: 'loose', label: 'たるませる', kana: 'たるませる' },
      ],
      initial: 'tight',
    },
    {
      key: 'pinch',
      kind: 'choice',
      label: '糸(いと)のまん中(なか)を',
      kana: 'いとの まんなかを',
      options: [
        { value: 'no', label: 'つままない', kana: 'つままない' },
        { value: 'yes', label: '指(ゆび)でつまむ', kana: 'ゆびで つまむ' },
      ],
      initial: 'no',
    },
  ],
  measure: {
    kind: 'category',
    label: '声(こえ)が',
    kana: 'こえが',
    options: [
      { value: 'hear', label: '聞(き)こえる', kana: 'きこえる' },
      { value: 'no', label: '聞こえない', kana: 'きこえない' },
    ],
  },
  simulate: (c) => (heard(c) ? 'hear' : 'no'),
  scene: itodenwaScene,
  duration: 1400,
};

// ---- たいこ ----

const STRENGTH: Record<string, number> = { none: 0, weak: 1, strong: 2 };

export function drumSound(c: Record<string, number | string>): 'none' | 'small' | 'big' {
  if (c.hold === 'yes') return 'none';
  return (['none', 'small', 'big'] as const)[STRENGTH[String(c.hit)] ?? 1];
}

function drumScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const s = result === null ? 0 : { none: 0, small: 1, big: 2 }[String(result)] ?? 0;
  const hit = STRENGTH[String(c.hit)] ?? 1;
  const top = 96;
  // たいこの皮の上の ビーズ が、ふるえの大きさだけ はねる
  const bounce = s * 9 * Math.abs(Math.sin(p * Math.PI * 6)) * (1 - p * 0.3);
  const beads = [-36, -18, 0, 18, 36].map((dx, i) => circle(160 + dx, top - 5 - bounce * (0.7 + (i % 2) * 0.5), 4, 'fill-mark')).join('');
  const waves = s > 0 && result !== null ? Array.from({ length: s * 2 }, (_, i) => path(`M${236 + i * 12} ${96 - i * 5}q10 ${20 + i * 5} 0 ${40 + i * 10}`, 'ln thin wind')).join('') : '';
  const stick = result === null ? -30 : -30 + 30 * Math.max(0, 1 - p * 5);
  return fig(
    320,
    210,
    `たいこを${{ none: 'たたかない', weak: '弱くたたく', strong: '強くたたく' }[String(c.hit)] ?? ''}`,
    rect(96, top, 128, 60, 'wood', 4),
    path(`M96 ${top}Q160 ${top - 6 + (s ? Math.sin(p * 40) * s * 2 : 0)} 224 ${top}`, 'ln thick'),
    beads,
    hit > 0 ? group(252, top - 40 + stick, line(0, 0, -50, 30, 'ln thick'), circle(-50, 30, 6, 'iron')) : '',
    c.hold === 'yes' ? group(120, top - 10, path('M-14 6Q-10 -8 4 -6L18 -4Q22 2 16 6Z', 'hand')) : '',
    waves,
    result === null || p < 1 ? '' : text(160, 36, { none: '音が出ない', small: '小さい音', big: '大きい音！' }[String(result)] ?? '', { cls: s ? 'result-yes' : 'result-no' }),
  );
}

export const drum: Experiment = {
  id: 'drum',
  field: 'energy',
  label: '音(おと)のふしぎ（たいこ）',
  summary: 'たいこのたたき方を変えて、音の大きさと、ふるえ方を調べよう',
  setup: 'たいこの皮(かわ)の上に、小さなビーズをのせます。たたく強さを変えて、音の大きさと、ビーズのはね方（皮のふるえ方）をくらべます。鳴っているたいこの皮を手でおさえることもできます。',
  variables: [
    {
      key: 'hit',
      kind: 'choice',
      label: 'たたき方(かた)',
      options: [
        { value: 'weak', label: '弱(よわ)くたたく' },
        { value: 'strong', label: '強(つよ)くたたく' },
      ],
      initial: 'weak',
    },
    {
      key: 'hold',
      kind: 'choice',
      label: '皮(かわ)を手(て)で',
      options: [
        { value: 'no', label: 'おさえない' },
        { value: 'yes', label: 'おさえる' },
      ],
      initial: 'no',
    },
  ],
  measure: {
    kind: 'category',
    label: '音(おと)とふるえ',
    options: [
      { value: 'none', label: '音が出ない（ふるえない）' },
      { value: 'small', label: '小さい音（ふるえが小さい）' },
      { value: 'big', label: '大きい音（ふるえが大きい）' },
    ],
  },
  simulate: (c) => drumSound(c),
  scene: drumScene,
  duration: 1500,
};

export const soundMissions: Mission[] = [
  {
    id: 'itodenwa-loose',
    exp: 'itodenwa',
    levels: grades(1),
    question: 'いとを たるませると、こえは きこえる？',
    choices: ['きこえる', 'きこえない'],
    answer: 1,
    target: 'string',
    show: ['string'],
    need: { key: 'string', distinct: 2 },
    finding: 'いとが ぴんと はって いると きこえるけど、たるませると きこえない。',
  },
  {
    id: 'itodenwa-pinch',
    exp: 'itodenwa',
    levels: grades(1),
    question: 'いとの まんなかを ゆびで つまむと、こえは どうなる？',
    choices: ['よく きこえる', 'きこえなく なる', 'かわらない'],
    answer: 1,
    target: 'pinch',
    start: { string: 'tight' },
    lock: ['string'],
    need: { key: 'pinch', distinct: 2 },
    finding: 'いとを つまむと きこえなく なった。こえは いとを つたわって とどくんだね。',
  },
  {
    id: 'itodenwa-why',
    exp: 'itodenwa',
    levels: grades(3),
    question: '糸電話(いとでんわ)で声(こえ)が聞こえるのは、何(なに)が伝(つた)わるから？',
    choices: ['糸のふるえ', '糸の中を通る空気', 'コップの中の空気だけ'],
    answer: 0,
    target: 'pinch',
    need: { key: 'pinch', distinct: 2 },
    finding: '声を出すとコップがふるえ、そのふるえが糸を伝わって、もう1つのコップをふるわせる。糸をつまんでふるえを止めると、聞こえなくなる。',
  },
  {
    id: 'drum-strength',
    exp: 'drum',
    levels: grades(3),
    question: 'たいこを強(つよ)くたたくと、音(おと)と皮(かわ)のふるえはどうなる？',
    choices: ['音が大きくなり、ふるえも大きくなる', '音は大きくなるが、ふるえは小さくなる', '音もふるえも変わらない'],
    answer: 0,
    target: 'hit',
    show: ['hit'],
    need: { key: 'hit', distinct: 2 },
    finding: '強くたたくと、皮のふるえが大きくなり、大きな音が出る。音の大きさと、ふるえの大きさは関係している。',
  },
  {
    id: 'drum-hold',
    exp: 'drum',
    levels: grades(3),
    question: '鳴(な)っているたいこの皮(かわ)を手(て)でおさえると、音はどうなる？',
    choices: ['止まる', '大きくなる', '変わらない'],
    answer: 0,
    target: 'hold',
    need: { key: 'hold', distinct: 2 },
    finding: '手でおさえてふるえを止めると、音も止まる。音は、物がふるえることで出ている。',
  },
];
