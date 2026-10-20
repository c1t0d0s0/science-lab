import { grades } from '../../core/levels';
import { circle, fig, group, line, path, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// 人や植物の体のはたらき (6 年生)。
// - saliva: だ液は、体温ぐらいの温度ででんぷんを別のものに変える (ヨウ素液の色が変わらなくなる)
// - breath: はいた息は、吸う空気より酸素が少なく、二酸化炭素が多い
// - starch: 日光が当たった葉ででんぷんができる
// - transpire: 根から吸われた水は、おもに葉から水じょう気として出ていく (蒸散)

// ---- だ液のはたらき ----

export function iodine(saliva: string, temp: number): 'blue' | 'none' {
  return saliva === 'yes' && temp === 40 ? 'none' : 'blue';
}

function salivaScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const temp = Number(c.temp ?? 40);
  const k = result === null ? 0 : Math.min(1, p * 1.4);
  const cls = result === null || k < 0.6 ? 'starch' : result === 'blue' ? 'iodine-blue' : 'iodine-none';
  return fig(
    320,
    200,
    `でんぷんのりに${c.saliva === 'yes' ? 'だ液' : '水'}を入れて、${temp}℃で10分`,
    rect(90, 90, 140, 90, temp >= 80 ? 'hot-bath' : temp <= 5 ? 'cold-bath' : 'water', 6),
    path('M140 40V150A20 20 0 0 0 180 150V40', 'ln'),
    rect(142, 100, 36, 70, cls),
    k > 0.5 ? group(200, 50, rect(-5, 0, 10, 36, 'glass-tube', 4), circle(0, 42, 3, 'iodine-blue')) : '',
    text(250, 170, `${temp}℃`, { anchor: 'start', cls: 'small' }),
    text(20, 30, c.saliva === 'yes' ? 'だ液を入れる' : '水を入れる', { anchor: 'start', cls: 'small' }),
    result !== null && p >= 1 ? text(160, 196, result === 'blue' ? '青むらさき色（でんぷんがある）' : '色が変わらない（でんぷんがない）', { cls: 'result-yes small' }) : '',
  );
}

export const saliva: Experiment = {
  id: 'saliva',
  field: 'life',
  label: 'だ液(えき)のはたらき',
  summary: 'でんぷんにだ液を入れて温め、ヨウ素液ででんぷんが残っているか調べよう',
  setup: '2本の試験管にうすいでんぷんのりを入れ、一方にだ液、もう一方に水を入れます。湯や氷水で温度を決めて10分おいたあと、ヨウ素液を入れます。でんぷんがあると、ヨウ素液は青むらさき色に変わります。',
  variables: [
    {
      key: 'saliva',
      kind: 'choice',
      label: '入れるもの',
      options: [
        { value: 'yes', label: 'だ液' },
        { value: 'no', label: '水' },
      ],
      initial: 'yes',
    },
    { key: 'temp', kind: 'choice', label: '温度', options: [{ value: '5', label: '5℃（氷水）' }, { value: '40', label: '40℃（体温ぐらい）' }, { value: '80', label: '80℃（熱い湯）' }], initial: '40' },
  ],
  measure: {
    kind: 'category',
    label: 'ヨウ素液を入れると',
    options: [
      { value: 'blue', label: '青むらさき色になる（でんぷんがある）' },
      { value: 'none', label: '色が変わらない（でんぷんがない）' },
    ],
  },
  simulate: (c) => iodine(String(c.saliva ?? 'yes'), Number(c.temp ?? 40)),
  scene: salivaScene,
  duration: 1400,
};

// ---- 呼吸 ----

export function breathPercent(gas: string, air: string): number {
  if (gas === 'oxygen') return air === 'out' ? 17 : 21;
  return air === 'out' ? 4 : 0.04;
}

function breathScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const o2 = c.gas === 'oxygen';
  const out = c.air === 'out';
  const v = typeof result === 'number' ? result : 0;
  const max = o2 ? 24 : 4;
  const k = result === null ? 0 : Math.min(1, p * 1.4);
  return fig(
    320,
    200,
    `${out ? 'はいた息' : '吸う空気（まわりの空気）'}の${o2 ? '酸素' : '二酸化炭素'}をはかる`,
    path('M40 80Q60 40 100 50Q120 60 110 100Q100 140 70 140Q40 130 40 80Z', 'fill-soft'),
    out ? group(120, 90, ...[0, 1, 2].map((i) => path(`M${i * 12} ${-10 + i * 6}q8 4 16 0`, 'ln thin smoke'))) : '',
    path('M170 60Q200 50 200 70V170Q200 180 190 180H150Q140 180 140 170V70Q140 50 170 60Z', 'bag'),
    group(220, 100, rect(0, -8, 90, 16, 'glass-tube', 7), rect(3, -5, (v / max) * 84 * k, 10, o2 ? 'tube-o2' : 'tube-co2', 4)),
    line(200, 100, 220, 100, 'ln'),
    typeof result === 'number' && p >= 1 ? text(300, 40, `${o2 ? '酸素' : '二酸化炭素'} ${result}%`, { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const breath: Experiment = {
  id: 'breath',
  field: 'life',
  label: '吸(す)う空気(くうき)とはいた息(いき)',
  summary: '気体検知管で、吸う空気とはいた息の酸素・二酸化炭素の割合をくらべよう',
  setup: 'ポリエチレンのふくろに、まわりの空気（吸う空気）か、はいた息を集めます。気体検知管で、酸素と二酸化炭素の割合（％）をはかってくらべます。',
  variables: [
    { key: 'gas', kind: 'choice', label: 'はかる気体', options: [{ value: 'oxygen', label: '酸素(さんそ)' }, { value: 'co2', label: '二酸化炭素(にさんかたんそ)' }], initial: 'oxygen' },
    { key: 'air', kind: 'choice', label: 'はかる空気', options: [{ value: 'in', label: '吸う空気' }, { value: 'out', label: 'はいた息' }], initial: 'in' },
  ],
  measure: { kind: 'number', label: '気体の割合', unit: '%', digits: 2 },
  simulate: (c) => breathPercent(String(c.gas ?? 'oxygen'), String(c.air ?? 'in')),
  scene: breathScene,
  duration: 1000,
};

// ---- 日光とでんぷん ----

export function leafStarch(light: string): 'blue' | 'none' {
  return light === 'yes' ? 'blue' : 'none';
}

function starchScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const light = c.light === 'yes';
  const k = result === null ? 0 : Math.min(1, p * 1.3);
  const leafCls = result === null || k < 0.6 ? 'leaf' : result === 'blue' ? 'iodine-blue' : 'leaf-pale';
  return fig(
    320,
    200,
    `日光に${light ? '当てた' : '当てない'}ジャガイモの葉をヨウ素液で調べる`,
    light ? circle(40, 34, 14, 'sun') + line(54, 44, 120, 80, 'ln sunbeam') : '',
    path('M160 180V120', 'ln stem'),
    path('M160 120C110 110 110 50 160 40C210 50 210 110 160 120Z', leafCls),
    !light && k < 0.4 ? path('M160 120C110 110 110 50 160 40C210 50 210 110 160 120Z', 'foil') : '',
    path('M160 120V48', 'ln thin'),
    text(250, 180, light ? '日光に当てる' : 'アルミはくでおおう', { anchor: 'start', cls: 'tiny' }),
    result !== null && p >= 1 ? text(20, 196, result === 'blue' ? '青むらさき色（でんぷんがある）' : '色が変わらない（でんぷんがない）', { anchor: 'start', cls: 'result-yes small' }) : '',
  );
}

export const starch: Experiment = {
  id: 'starch',
  field: 'life',
  label: '日光(にっこう)とでんぷん',
  summary: '日光に当てた葉と当てない葉で、でんぷんができているか調べよう',
  setup: '前の日の夕方に、ジャガイモの葉をアルミはくでおおって、葉のでんぷんをなくしておきます。次の朝、一方の葉のアルミはくを外して日光に当て、もう一方はおおったままにします。昼すぎに葉をつみ、湯で温めてやわらかくし、ヨウ素液ででんぷんがあるか調べます。',
  variables: [{ key: 'light', kind: 'choice', label: '日光', options: [{ value: 'yes', label: '当てる' }, { value: 'no', label: '当てない（おおったまま）' }], initial: 'yes' }],
  measure: {
    kind: 'category',
    label: 'ヨウ素液を入れると',
    options: [
      { value: 'blue', label: '青むらさき色になる（でんぷんがある）' },
      { value: 'none', label: '色が変わらない（でんぷんがない）' },
    ],
  },
  simulate: (c) => leafStarch(String(c.light ?? 'yes')),
  scene: starchScene,
  duration: 1400,
};

// ---- 蒸散 ----

/** 6 時間で、根から吸われた水の量 (mL) */
export function waterUptake(leaves: string, sun: string): number {
  const base = leaves === 'yes' ? 8 : 1;
  return sun === 'sun' ? base : Math.max(1, Math.round(base / 2));
}

function transpireScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const leaves = c.leaves === 'yes';
  const v = typeof result === 'number' ? result * Math.min(1, p) : 0;
  const drops = leaves && result !== null ? Array.from({ length: Math.round(v * 2) }, (_, i) => circle(130 + (i * 23) % 60, 50 + (i * 17) % 60, 2.4, 'bubble')).join('') : '';
  return fig(
    320,
    210,
    `葉${leaves ? 'がある' : 'を取った'}ホウセンカにふくろをかけ、${c.sun === 'sun' ? '日なた' : '日かげ'}に6時間おく`,
    c.sun === 'sun' ? circle(40, 34, 14, 'sun') : '',
    path('M120 30Q160 10 200 30V140H120Z', 'bag'),
    path('M160 190V40', 'ln stem'),
    leaves ? [60, 80, 100].map((y, i) => path(`M160 ${y}Q${i % 2 ? 190 : 130} ${y - 14} ${i % 2 ? 196 : 124} ${y - 4}`, 'leaf')).join('') : '',
    drops,
    rect(140, 150, 40, 50, 'water'),
    path('M138 140V200H182V140', 'ln'),
    line(140, 150 + v * 2, 180, 150 + v * 2, 'ln thin dash'),
    typeof result === 'number' && p >= 1 ? text(300, 30, `水が${result}mLへった`, { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const transpire: Experiment = {
  id: 'transpire',
  field: 'life',
  label: '植物(しょくぶつ)と水(みず)',
  summary: '葉のある・ないで、植物が吸う水の量と、ふくろの水てきをくらべよう',
  setup: '同じくらいのホウセンカを、水を入れたフラスコにさし、水面に油をうかべて水がじょう発しないようにします。一方は葉をつけたまま、もう一方は葉を全部取ります。それぞれにポリエチレンのふくろをかけて6時間おき、水のへった量と、ふくろの内側のようすを調べます。',
  variables: [
    { key: 'leaves', kind: 'choice', label: '葉', options: [{ value: 'yes', label: 'つけたまま' }, { value: 'no', label: '全部取る' }], initial: 'yes' },
    { key: 'sun', kind: 'choice', label: '置く場所', options: [{ value: 'sun', label: '日なた' }, { value: 'shade', label: '日かげ' }], initial: 'sun' },
  ],
  measure: { kind: 'number', label: 'へった水の量（6時間）', unit: 'mL', digits: 0 },
  simulate: (c) => waterUptake(String(c.leaves ?? 'yes'), String(c.sun ?? 'sun')),
  scene: transpireScene,
  duration: 1600,
};

export const body6Missions: Mission[] = [
  {
    id: 'saliva-work',
    exp: 'saliva',
    levels: grades(6),
    question: 'だ液には、でんぷんを変化させるはたらきがある？',
    choices: ['ある', 'ない'],
    answer: 0,
    target: 'saliva',
    start: { temp: '40' },
    lock: ['temp'],
    need: { key: 'saliva', distinct: 2 },
    finding: 'だ液を入れたほうはヨウ素液の色が変わらず、水を入れたほうは青むらさき色になった。だ液には、でんぷんを別のものに変えるはたらきがある（消化）。',
    conclusions: [
      { text: '40℃では、だ液を入れたときだけでんぷんがなくなった。だ液がでんぷんを変化させた', ok: true, why: '水を入れたものとくらべていて、ちがいはだ液だけ。' },
      { text: 'でんぷんは、時間がたつと自然になくなる', ok: false, why: '水を入れたほうは、同じ時間がたってもでんぷんが残っていた。' },
      { text: 'だ液は、どんな温度でもでんぷんを変化させる', ok: false, why: '調べたのは40℃だけ。ほかの温度は調べていない。' },
    ],
  },
  {
    id: 'saliva-temp',
    exp: 'saliva',
    levels: grades(6),
    question: 'だ液がでんぷんをよく変化させるのは、どの温度のとき？',
    choices: ['体温ぐらい（40℃）', '冷たい（5℃）', '熱い（80℃）', 'どの温度でも同じ'],
    answer: 0,
    target: 'temp',
    start: { saliva: 'yes' },
    lock: ['saliva'],
    need: { key: 'temp', distinct: 3 },
    finding: 'だ液は、体温ぐらいの40℃でよくはたらき、5℃や80℃ではでんぷんが残った。体の中の温度で、よくはたらくようになっている。',
  },
  {
    id: 'breath-out',
    exp: 'breath',
    levels: grades(6),
    question: 'はいた息は、吸う空気とくらべて、どうなっている？',
    choices: ['酸素がへり、二酸化炭素がふえている', '酸素がふえ、二酸化炭素がへっている', '変わらない'],
    answer: 0,
    target: 'air',
    need: { key: 'air', distinct: 2, fair: false },
    finding: '吸う空気は酸素が約21％、二酸化炭素が約0.04％。はいた息は酸素が約17％、二酸化炭素が約4％だった。人は肺で酸素を取り入れ、二酸化炭素を出している（呼吸）。',
    hint: '酸素と二酸化炭素の両方を、吸う空気とはいた息ではかろう',
  },
  {
    id: 'starch-light',
    exp: 'starch',
    levels: grades(6),
    question: '日光に当てた葉と当てない葉、でんぷんができているのは？',
    choices: ['日光に当てた葉', '日光に当てない葉', '両方', 'どちらもできていない'],
    answer: 0,
    target: 'light',
    need: { key: 'light', distinct: 2 },
    finding: '日光に当てた葉だけ、ヨウ素液で青むらさき色になった。植物の葉に日光が当たると、でんぷんができる。',
  },
  {
    id: 'transpire-leaf',
    exp: 'transpire',
    levels: grades(6),
    question: '葉を全部取ると、根から吸われる水の量は？',
    choices: ['へる', 'ふえる', '変わらない'],
    answer: 0,
    target: 'leaves',
    start: { sun: 'sun' },
    lock: ['sun'],
    need: { key: 'leaves', distinct: 2 },
    finding: '葉があるほうは水が大きくへり、ふくろの内側に水てきがたくさんついた。根から吸われた水は、おもに葉から水じょう気として出ていく（蒸散）。',
    conclusions: [
      { text: '葉があると多くの水が吸われ、ふくろに水てきがついた。水は主に葉から出ていく', ok: true, why: '葉のある・なしだけをちがえてくらべている。' },
      { text: '葉を取ると、植物は水をまったく吸わなくなる', ok: false, why: '葉を取っても、少しは水がへった（くきからも出ていく）。' },
      { text: 'ふくろの水てきは、フラスコの水がじょう発したもの', ok: false, why: '水面に油をうかべているので、フラスコの水はじょう発しない。' },
    ],
  },
];
