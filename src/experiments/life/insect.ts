import { grades } from '../../core/levels';
import { circle, ellipse, fig, group, line, path, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission, Option } from '../types';

// 身近な生き物 (3 年生)。
// - insect: こん虫は、体が頭・むね・はらの 3 つに分かれ、むねに 6 本のあしがある。
//   チョウやカブトムシはさなぎになり (完全変態)、バッタやトンボはさなぎにならない
// - plantlife: 植物は、種 → 子葉 → 葉がふえる → くきがのびる → 花 → 実 (種) の順に育つ。体は根・くき・葉からできている

interface Animal extends Option {
  legs: 6 | 8 | 14;
  body: 'three' | 'two' | 'many';
  growth: 'pupa' | 'nopupa' | 'other';
}

const ANIMALS: Animal[] = [
  { value: 'butterfly', label: 'モンシロチョウ', legs: 6, body: 'three', growth: 'pupa' },
  { value: 'beetle', label: 'カブトムシ', legs: 6, body: 'three', growth: 'pupa' },
  { value: 'grasshopper', label: 'ショウリョウバッタ', legs: 6, body: 'three', growth: 'nopupa' },
  { value: 'dragonfly', label: 'トンボ', legs: 6, body: 'three', growth: 'nopupa' },
  { value: 'ant', label: 'アリ', legs: 6, body: 'three', growth: 'pupa' },
  { value: 'spider', label: 'クモ', legs: 8, body: 'two', growth: 'other' },
  { value: 'pillbug', label: 'ダンゴムシ', legs: 14, body: 'many', growth: 'other' },
];

const animal = (v: unknown) => ANIMALS.find((a) => a.value === v) ?? ANIMALS[0];

export function observe(name: string, look: string): string {
  const a = animal(name);
  if (look === 'legs') return `legs${a.legs}`;
  if (look === 'body') return `body-${a.body}`;
  return `growth-${a.growth}`;
}

/** 生き物の体を上から見た図。体の部分の数と、あしの数がわかる */
function bodyFig(a: Animal, highlight: string): string {
  const parts = a.body === 'three' ? [10, 12, 20] : a.body === 'two' ? [14, 22] : [8, 8, 8, 8, 8, 8, 8];
  let x = 90;
  const segs: string[] = [];
  const centers: number[] = [];
  parts.forEach((r, i) => {
    const cx = x + r;
    centers.push(cx);
    segs.push(ellipse(cx, 100, r, a.body === 'many' ? 18 : r * 0.8, highlight === 'body' ? `bug-part bug-part-${i % 3}` : 'bug'));
    x = cx + r - 2;
  });
  // あしは、こん虫ならむね (2 つ目) から、クモなら前の部分から、ダンゴムシは体のふしごとに出る
  const legBase = a.body === 'three' ? [centers[1]] : a.body === 'two' ? [centers[0]] : centers;
  const perSide = a.legs / 2;
  const legs: string[] = [];
  for (let i = 0; i < perSide; i++) {
    const base = legBase.length === 1 ? legBase[0] - 8 + (16 * i) / Math.max(1, perSide - 1) : legBase[i % legBase.length];
    const dx = (i - (perSide - 1) / 2) * 10;
    const cls = highlight === 'legs' ? 'ln bug-leg-hl' : 'ln';
    legs.push(path(`M${base} 92L${base + dx} 72L${base + dx * 1.4} 60`, cls), path(`M${base} 108L${base + dx} 128L${base + dx * 1.4} 140`, cls));
  }
  const antenna = a.body === 'three' ? path(`M${centers[0] - 8} 96Q70 76 60 70M${centers[0] - 8} 104Q70 124 60 130`, 'ln thin') : '';
  return legs.join('') + segs.join('') + antenna;
}

function growthFig(a: Animal): string {
  const steps = a.growth === 'pupa' ? ['たまご', 'よう虫', 'さなぎ', '成虫'] : a.growth === 'nopupa' ? ['たまご', 'よう虫', '成虫'] : ['たまご', '子ども（だっぴしながら大きくなる）'];
  return steps
    .map((s, i) => {
      const x = 40 + i * (240 / Math.max(1, steps.length - 1));
      return group(x, 100, rect(-30, -16, 60, 32, s === 'さなぎ' ? 'fill-mark' : 'box', 8), text(0, 5, s.length > 6 ? '子ども' : s, { cls: 'tiny' })) + (i < steps.length - 1 ? line(x + 32, 100, x + 240 / Math.max(1, steps.length - 1) - 32, 100, 'ln thin') : '');
    })
    .join('');
}

function insectScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const a = animal(c.animal);
  const look = String(c.look ?? 'legs');
  const show = result !== null && p > 0.3;
  return fig(
    320,
    200,
    `${a.label}の${{ legs: 'あしの数', body: '体の分かれ方', growth: '育ち方' }[look]}を調べる`,
    look === 'growth' && show ? growthFig(a) : bodyFig(a, show ? look : ''),
    text(160, 186, a.label, { cls: 'small' }),
    show && p >= 1 && look !== 'growth'
      ? text(300, 30, look === 'legs' ? `あし ${a.legs}本` : { three: '頭・むね・はら', two: '2つ', many: 'たくさんのふし' }[a.body], { anchor: 'end', cls: 'result-yes' })
      : '',
  );
}

export const insect: Experiment = {
  id: 'insect',
  field: 'life',
  label: 'こん虫(ちゅう)の体(からだ)',
  summary: 'いろいろな生き物のあしの数・体の分かれ方・育ち方を調べて、こん虫のなかまを見つけよう',
  setup: '虫めがねで、いろいろな生き物の体を観察します。あしの数、体がいくつの部分に分かれているか、たまごから成虫までの育ち方を調べて、くらべます。',
  variables: [
    { key: 'animal', kind: 'choice', label: '生き物', options: ANIMALS, initial: 'butterfly' },
    {
      key: 'look',
      kind: 'choice',
      label: '調べること',
      options: [
        { value: 'legs', label: 'あしの数' },
        { value: 'body', label: '体の分かれ方' },
        { value: 'growth', label: '育ち方' },
      ],
      initial: 'legs',
    },
  ],
  measure: {
    kind: 'category',
    label: '観察(かんさつ)の結果',
    options: [
      { value: 'legs6', label: 'あしは6本（むねから）' },
      { value: 'legs8', label: 'あしは8本' },
      { value: 'legs14', label: 'あしは14本' },
      { value: 'body-three', label: '頭・むね・はらの3つに分かれる' },
      { value: 'body-two', label: '2つに分かれる' },
      { value: 'body-many', label: 'たくさんのふしに分かれる' },
      { value: 'growth-pupa', label: 'たまご→よう虫→さなぎ→成虫' },
      { value: 'growth-nopupa', label: 'たまご→よう虫→成虫（さなぎにならない）' },
      { value: 'growth-other', label: 'たまご→子ども（だっぴしながら大きくなる）' },
    ],
  },
  simulate: (c) => observe(String(c.animal ?? 'butterfly'), String(c.look ?? 'legs')),
  scene: insectScene,
  duration: 900,
};

// ---- 植物の育ち方 ----

export type PlantStage = 'cotyledon' | 'leaves' | 'tall' | 'flower' | 'fruit';
const PLANT_DAYS: Record<number, PlantStage> = { 10: 'cotyledon', 30: 'leaves', 50: 'tall', 70: 'flower', 90: 'fruit' };

export function plantStage(days: number): PlantStage {
  return PLANT_DAYS[days] ?? 'cotyledon';
}

function plantScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const days = Number(c.days ?? 10);
  const stage = result === null ? 'cotyledon' : (result as PlantStage);
  const n = ['cotyledon', 'leaves', 'tall', 'flower', 'fruit'].indexOf(stage);
  const h = [16, 40, 90, 110, 110][n] * (result === null ? 0.5 : Math.min(1, 0.4 + p));
  const top = 160 - h;
  const leaves = Array.from({ length: n === 0 ? 0 : Math.min(6, n * 2) }, (_, i) => ellipse(160 + (i % 2 ? 14 : -14), 160 - (h * (i + 1)) / 7, 12, 5, stage === 'fruit' ? 'leaf-pale' : 'leaf')).join('');
  return fig(
    320,
    210,
    `ホウセンカの${days}日目`,
    rect(60, 160, 200, 30, 'soil-rich', 2),
    // 根・くき・葉
    path('M160 160L150 182M160 160L170 186M160 160V190M155 172L144 178M165 176L176 182', 'ln thin root'),
    path(`M160 160V${top}`, 'ln stem'),
    n === 0 ? group(160, top, ellipse(-8, 0, 8, 5, 'leaf'), ellipse(8, 0, 8, 5, 'leaf')) : leaves,
    n === 3 ? circle(160, top - 6, 9, 'morning-glory') : '',
    n === 4 ? ellipse(160, top - 6, 6, 10, 'fruit') : '',
    text(250, 60, '葉', { cls: 'tiny' }),
    text(250, 140, 'くき', { cls: 'tiny' }),
    text(250, 182, '根', { cls: 'tiny' }),
    result !== null && p >= 1 ? text(20, 30, { cotyledon: '子葉が出た', leaves: '葉がふえた', tall: 'くきがのびた', flower: '花がさいた', fruit: '実ができ、かれ始めた' }[stage], { anchor: 'start', cls: 'result-yes' }) : '',
  );
}

export const plantlife: Experiment = {
  id: 'plantlife',
  field: 'life',
  label: '植物(しょくぶつ)の育(そだ)ち方(かた)',
  summary: 'ホウセンカを育てて、育つ順番と、体のつくりを調べよう',
  setup: 'ホウセンカの種をまいて、日なたで育てます。種をまいてからの日数ごとに、ようすと体のつくり（根・くき・葉）を観察します。',
  variables: [
    {
      key: 'days',
      kind: 'range',
      label: '種をまいてからの日数',
      min: 10,
      max: 90,
      step: 20,
      unit: '日',
      initial: 10,
    },
  ],
  measure: {
    kind: 'category',
    label: 'ホウセンカのようす',
    options: [
      { value: 'cotyledon', label: '子葉(しよう)が出る' },
      { value: 'leaves', label: '葉がふえる' },
      { value: 'tall', label: 'くきがのびる' },
      { value: 'flower', label: '花がさく' },
      { value: 'fruit', label: '実ができて、かれる' },
    ],
  },
  simulate: (c) => plantStage(Number(c.days ?? 10)),
  scene: plantScene,
  duration: 1200,
};

export const insectMissions: Mission[] = [
  {
    id: 'insect-legs',
    exp: 'insect',
    levels: grades(3),
    question: 'こん虫(ちゅう)のあしは何本？',
    choices: ['6本', '8本', '4本', '14本'],
    answer: 0,
    target: 'animal',
    start: { look: 'legs' },
    lock: ['look'],
    need: { key: 'animal', distinct: 3, among: ['butterfly', 'beetle', 'grasshopper', 'dragonfly', 'ant'] },
    finding: 'チョウ・カブトムシ・バッタ・トンボ・アリのあしは、どれも6本で、むねから出ている。',
  },
  {
    id: 'insect-spider',
    exp: 'insect',
    levels: grades(3),
    question: 'クモはこん虫(ちゅう)のなかま？',
    choices: ['こん虫のなかま', 'こん虫ではない'],
    answer: 1,
    target: 'look',
    start: { animal: 'spider' },
    lock: ['animal'],
    need: { key: 'look', distinct: 2, among: ['legs', 'body'] },
    finding: 'クモはあしが8本で、体が2つに分かれている。こん虫は体が頭・むね・はらの3つに分かれ、あしが6本なので、クモはこん虫ではない。ダンゴムシもこん虫ではない。',
  },
  {
    id: 'insect-growth',
    exp: 'insect',
    levels: grades(3),
    question: 'モンシロチョウとショウリョウバッタの育ち方のちがいは？',
    choices: ['チョウはさなぎになるが、バッタはならない', 'どちらもさなぎになる', 'どちらもさなぎにならない'],
    answer: 0,
    target: 'animal',
    start: { look: 'growth' },
    lock: ['look'],
    need: { key: 'animal', distinct: 2, among: ['butterfly', 'grasshopper'] },
    finding: 'チョウは「たまご→よう虫→さなぎ→成虫」、バッタは「たまご→よう虫→成虫」と育ち、さなぎにならない。トンボもさなぎにならない。',
  },
  {
    id: 'plant-order',
    exp: 'plantlife',
    levels: grades(3),
    question: '植物(しょくぶつ)は、どんな順に育つ？',
    choices: ['種→子葉→葉がふえる→花→実', '種→花→葉→実', '種→葉→実→花'],
    answer: 0,
    target: 'days',
    need: { key: 'days', distinct: 5 },
    finding: '種から子葉が出て、葉がふえ、くきがのびて、花がさく。花がさいたあとに実ができ、その中に種ができて、やがてかれる。体は根・くき・葉からできている。',
  },
  {
    id: 'plant-fruit',
    exp: 'plantlife',
    levels: grades(3),
    question: '花がさいたあと、花のあとにできるのは？',
    choices: ['実（中に種がある）', '新しい葉', '根'],
    answer: 0,
    target: 'days',
    start: { days: 50 },
    need: { key: 'days', distinct: 2, among: [70, 90] },
    finding: '花がさいたあとに実ができ、実の中には種がたくさんできる。',
  },
];
