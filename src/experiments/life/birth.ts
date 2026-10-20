import { grades } from '../../core/levels';
import { circle, ellipse, fig, group, line, path, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// 生命のつながり (5 年生)。
// - pollination: ヘチマのめばなは、受粉すると実ができ、中に種ができる。受粉しないと実はできずにかれる。おばなには実ができない
// - medaka: メダカの受精卵は、水温 25℃ではおよそ 11 日でかえる。水温が低いと、かえるまでに日数がかかる

// ---- 花から実へ ----

export function fruitOf(flower: string, pollen: string): 'fruit' | 'wither' {
  return flower === 'female' && pollen === 'yes' ? 'fruit' : 'wither';
}

function pollinationScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const female = c.flower !== 'male';
  const pollen = c.pollen === 'yes';
  const k = result === null ? 0 : Math.min(1, p * 1.2);
  const fruit = result === 'fruit';
  const flowerSvg = group(
    160,
    80,
    ...[0, 72, 144, 216, 288].map((a) => `<ellipse class="${k > 0.6 ? 'petal-wither' : 'petal'}" cx="0" cy="-18" rx="10" ry="16" transform="rotate(${a})"/>`),
    circle(0, 0, 8, female ? 'pistil' : 'stamen'),
    female ? ellipse(0, 40, 6, 14, 'leaf') : '',
  );
  const grow = fruit ? ellipse(160, 120 + 10 * k, 8 + 14 * k, 14 + 34 * k, 'luffa') : '';
  return fig(
    320,
    220,
    `ヘチマの${female ? 'めばな' : 'おばな'}に、${pollen ? '受粉させる' : '受粉させない'}`,
    path('M40 20Q120 40 160 60', 'ln stem'),
    k < 0.6 ? flowerSvg : '',
    grow,
    // つぼみにかけたふくろ
    k < 0.3 ? path('M120 40Q160 0 200 40V120Q160 140 120 120Z', 'bag') : '',
    pollen && result !== null && k < 0.5 ? group(230, 60, line(0, 0, -50, 16, 'ln thin'), circle(-52, 17, 4, 'fill-mark')) : '',
    text(20, 210, female ? 'めばな（下に小さなふくらみ）' : 'おばな', { anchor: 'start', cls: 'tiny' }),
    result !== null && p >= 1 ? text(300, 30, fruit ? '実ができた（中に種）' : '実ができずにかれた', { anchor: 'end', cls: fruit ? 'result-yes small' : 'result-no small' }) : '',
  );
}

export const pollination: Experiment = {
  id: 'pollination',
  field: 'life',
  label: '花(はな)から実(み)へ',
  summary: 'ヘチマのめばな・おばなに、受粉させる・させないで、実ができるかを調べよう',
  setup: '次の日にさきそうなヘチマのつぼみに、ふくろをかけて、ほかの花の花粉がつかないようにします。花がさいたら、筆でおばなの花粉をめしべにつける（受粉させる）か、つけないかを決め、またふくろをかけておきます。しばらくして、実ができるかを調べます。',
  variables: [
    {
      key: 'flower',
      kind: 'choice',
      label: '花',
      options: [
        { value: 'female', label: 'めばな' },
        { value: 'male', label: 'おばな' },
      ],
      initial: 'female',
    },
    {
      key: 'pollen',
      kind: 'choice',
      label: '受粉(じゅふん)',
      options: [
        { value: 'yes', label: '花粉をつける' },
        { value: 'no', label: '花粉をつけない' },
      ],
      initial: 'yes',
    },
  ],
  measure: {
    kind: 'category',
    label: '花のあと',
    options: [
      { value: 'fruit', label: '実ができる（中に種）' },
      { value: 'wither', label: '実ができずにかれる' },
    ],
  },
  simulate: (c) => fruitOf(String(c.flower ?? 'female'), String(c.pollen ?? 'yes')),
  scene: pollinationScene,
  duration: 1600,
};

// ---- メダカのたんじょう ----

export type Egg = 'fertilized' | 'body' | 'eyes' | 'move' | 'hatch';
const EGG_STAGES: Egg[] = ['fertilized', 'body', 'eyes', 'move', 'hatch'];
/** 水温 25℃のとき、それぞれのようすになる日数 */
const EGG_DAYS = [0, 2, 4, 7, 11];

export function eggStage(day: number, temp: number): Egg {
  // 水温が低いと、育つ速さがおそくなる (15℃では 25℃の半分ぐらい)
  const effective = (day * (temp >= 25 ? 1 : 0.5));
  let i = 0;
  for (let j = 0; j < EGG_DAYS.length; j++) if (effective >= EGG_DAYS[j]) i = j;
  return EGG_STAGES[i];
}

function medakaScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const stage = (result ?? 'fertilized') as Egg;
  const i = EGG_STAGES.indexOf(stage);
  const k = result === null ? 1 : Math.min(1, p * 1.5);
  let inside = '';
  if (stage === 'hatch') {
    inside = group(160, 100, ellipse(0, 0, 40, 12, 'fish'), circle(-30, -3, 4, 'battery'), ellipse(-6, 10, 10, 7, 'yolk'), path('M40 0L56 -10V10Z', 'fish'));
  } else {
    inside =
      circle(160, 100, 40, 'egg') +
      (i === 0 ? circle(150, 96, 14, 'yolk') + [0, 1, 2].map((j) => circle(172 + j * 3, 84 + j * 8, 3, 'bubble')).join('') : '') +
      (i >= 1 ? ellipse(160, 108, 22, 14, 'yolk') + path('M140 96Q160 80 180 96', 'ln thick fish-line') : '') +
      (i >= 2 ? circle(146, 92, 5, 'battery') + circle(160, 112, 3, 'heart') : '') +
      (i >= 3 ? path(`M140 96Q160 ${80 + Math.sin(p * 30) * 6 * k} 182 98`, 'ln thick fish-line') : '');
  }
  return fig(
    320,
    200,
    `水温${c.temp}℃で受精してから${c.day}日目のメダカのたまご`,
    rect(40, 30, 240, 140, 'water', 10),
    inside,
    text(296, 190, `${c.day}日目・${c.temp}℃`, { anchor: 'end', cls: 'small' }),
    result !== null && p >= 1 ? text(20, 24, { fertilized: '受精したたまご', body: '体のもとができてきた', eyes: '目がはっきりし、心ぞうが動く', move: 'たまごの中でよく動く', hatch: 'かえった！（はらに養分のふくろ）' }[stage], { anchor: 'start', cls: 'result-yes small' }) : '',
  );
}

export const medaka: Experiment = {
  id: 'medaka',
  field: 'life',
  label: 'メダカのたんじょう',
  summary: 'メダカの受精卵が、日がたつにつれてどう変わるか、水温を変えて調べよう',
  setup: 'めすがうんだたまごが、おすの出す精子と結びつくと受精卵になります。受精卵を水草ごとペトリ皿に入れ、かいぼうけんび鏡で、日にちごとにたまごの中のようすを観察します。水温は25℃か15℃にします。',
  variables: [
    { key: 'day', kind: 'range', label: '受精してからの日数', min: 0, max: 12, step: 1, unit: '日', initial: 0 },
    { key: 'temp', kind: 'choice', label: '水温', options: [{ value: '25', label: '25℃' }, { value: '15', label: '15℃' }], initial: '25' },
  ],
  measure: {
    kind: 'category',
    label: 'たまごのようす',
    options: [
      { value: 'fertilized', label: '受精したたまご（あわのようなつぶ）' },
      { value: 'body', label: '体のもとができる' },
      { value: 'eyes', label: '目がはっきりし、心ぞうが動く' },
      { value: 'move', label: 'たまごの中でよく動く' },
      { value: 'hatch', label: 'かえる（はらに養分のふくろ）' },
    ],
  },
  simulate: (c) => eggStage(Number(c.day ?? 0), Number(c.temp ?? 25)),
  scene: medakaScene,
  duration: 1000,
};

export const birthMissions: Mission[] = [
  {
    id: 'pollen-need',
    exp: 'pollination',
    levels: grades(5),
    question: 'ヘチマのめばなに受粉(じゅふん)させないと、実はできる？',
    choices: ['できる', 'できない'],
    answer: 1,
    target: 'pollen',
    start: { flower: 'female' },
    lock: ['flower'],
    need: { key: 'pollen', distinct: 2 },
    finding: '受粉させためばなには実ができ、中に種ができた。受粉させないと、実はできずにかれた。実ができるには受粉が必要。',
    hint: 'ふくろをかけて、ほかの花粉がつかないようにしてくらべているよ',
  },
  {
    id: 'pollen-male',
    exp: 'pollination',
    levels: grades(5),
    question: 'ヘチマのおばなに、実はできる？',
    choices: ['できる', 'できない'],
    answer: 1,
    target: 'flower',
    start: { pollen: 'yes' },
    lock: ['pollen'],
    need: { key: 'flower', distinct: 2 },
    finding: '実ができるのは、めしべのあるめばなだけ。おばなにはおしべがあり、花粉をつくる。',
  },
  {
    id: 'medaka-days',
    exp: 'medaka',
    levels: grades(5),
    question: 'メダカの受精卵(じゅせいらん)は、水温25℃では、何日ぐらいでかえる？',
    choices: ['約11日', '約2日', '約30日'],
    answer: 0,
    target: 'day',
    start: { temp: '25' },
    lock: ['temp'],
    need: { key: 'day', distinct: 5 },
    finding: '受精卵は、体のもとができ、目がはっきりして心ぞうが動き、たまごの中で動くようになって、約11日でかえる。かえったばかりの子メダカは、はらのふくろの養分で育つ。',
  },
  {
    id: 'medaka-temp',
    exp: 'medaka',
    levels: grades(5),
    question: '水温を15℃に下げると、かえるまでの日数は？',
    choices: ['長くなる', '短くなる', '変わらない'],
    answer: 0,
    target: 'temp',
    start: { day: 11 },
    lock: ['day'],
    need: { key: 'temp', distinct: 2 },
    finding: '11日目、25℃のたまごはかえったが、15℃のたまごはまだ目ができたところだった。水温が低いと、たまごが育つのがおそくなる。',
  },
];
