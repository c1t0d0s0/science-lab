import { grades } from '../../core/levels';
import { circle, ellipse, fig, group, line, path, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission, Option } from '../types';

// 水よう液のなかま分け。A〜E の 5 つの水よう液を、4 つの調べ方で見分ける。
//   A 食塩水 / B 炭酸水 / C うすい塩酸 / D 石灰水 / E アンモニア水

type Test = 'litmus' | 'evap' | 'smell' | 'alum';

const PROPS: Record<string, Record<Test, string>> = {
  A: { litmus: 'neutral', evap: 'residue', smell: 'nosmell', alum: 'nochange' },
  B: { litmus: 'acid', evap: 'nothing', smell: 'nosmell', alum: 'nochange' },
  C: { litmus: 'acid', evap: 'nothing', smell: 'smell', alum: 'bubble' },
  D: { litmus: 'alkali', evap: 'residue', smell: 'nosmell', alum: 'nochange' },
  E: { litmus: 'alkali', evap: 'nothing', smell: 'smell', alum: 'nochange' },
};

export const SOLUTION_NAMES: Record<string, string> = { A: '食塩水', B: '炭酸水', C: 'うすい塩酸', D: '石灰水', E: 'アンモニア水' };

const RESULTS: Option[] = [
  { value: 'acid', label: '青色リトマス紙(し)が赤くなる（酸性(さんせい)）' },
  { value: 'neutral', label: 'どちらのリトマス紙も変わらない（中性(ちゅうせい)）' },
  { value: 'alkali', label: '赤色リトマス紙が青くなる（アルカリ性(せい)）' },
  { value: 'residue', label: '白い固体(こたい)が残(のこ)る' },
  { value: 'nothing', label: '何も残らない' },
  { value: 'smell', label: 'つんとしたにおいがする' },
  { value: 'nosmell', label: 'においはない' },
  { value: 'bubble', label: 'あわを出してとける' },
  { value: 'nochange', label: '変化(へんか)しない' },
];

function testView(test: string, result: string | null, p: number): string {
  const k = result === null ? 0 : Math.min(1, p * 1.5);
  switch (test) {
    case 'litmus': {
      // 青色と赤色のリトマス紙に、ガラスぼうで 1 てきずつつける
      const blue = result === 'acid' && k > 0.5 ? 'litmus-red' : 'litmus-blue';
      const red = result === 'alkali' && k > 0.5 ? 'litmus-blue' : 'litmus-red';
      return rect(186, 70, 26, 90, blue, 2) + rect(226, 70, 26, 90, red, 2) + text(199, 178, '青', { cls: 'tiny' }) + text(239, 178, '赤', { cls: 'tiny' }) + circle(199, 110, 4 * k, 'drop') + circle(239, 110, 4 * k, 'drop');
    }
    case 'evap': {
      const left = result === 'residue' && k > 0.7 ? [0, 1, 2, 3, 4, 5].map((i) => circle(206 + i * 6, 112 - (i % 2) * 2, 2.4, 'salt')).join('') : '';
      const water = 1 - k;
      return (
        path('M180 108Q222 140 264 108Z', 'box') +
        (water > 0 ? path(`M${186 + 6 * k} ${110 + 4 * k}Q222 ${110 + 22 * water} ${258 - 6 * k} ${110 + 4 * k}Z`, 'water') : '') +
        left +
        line(178, 108, 266, 108, 'ln thick') +
        (result !== null ? path('M212 176Q216 150 222 136Q228 150 232 176Z', 'flame') : '') +
        (k > 0 && k < 1 ? path(`M206 ${98 - 10 * k}q4 -8 0 -16M222 ${96 - 10 * k}q4 -8 0 -16M238 ${98 - 10 * k}q4 -8 0 -16`, 'ln thin steam') : '')
      );
    }
    case 'smell': {
      // においは、手であおいでかぐ
      const waves = result === 'smell' && k > 0.3 ? [0, 1, 2].map((i) => path(`M${150 + i * 10} ${54 - i * 8}q8 -6 16 0t16 0`, 'ln thin smell')).join('') : '';
      return waves + path(`M${170 + Math.sin(k * 12) * 6} 60l26 -14l4 10l-26 14Z`, 'hand') + (result === 'smell' && k > 0.5 ? text(250, 50, 'つーん', { cls: 'small' }) : '');
    }
    default: {
      const bubbles = result === 'bubble' && k > 0.2 ? [0, 1, 2, 3, 4, 5].map((i) => circle(114 + (i % 3) * 12, 160 - ((k * 140 + i * 17) % 60), 2.4, 'bubble')).join('') : '';
      const size = result === 'bubble' ? 1 - 0.7 * k : 1;
      return rect(116, 166 - 10 * size, 22 * size, 10 * size, 'alu', 1) + bubbles;
    }
  }
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const sol = String(c.sol ?? 'A');
  const test = String(c.test ?? 'litmus');
  const tubeX = 100;
  return fig(
    320,
    210,
    `水よう液${sol}を${{ litmus: 'リトマス紙', evap: 'じょう発', smell: 'におい', alum: 'アルミニウム' }[test]}で調べる`,
    group(tubeX, 40, path('M0 0V130A16 16 0 0 0 32 130V0', 'ln'), rect(2, 60, 28, 86, 'water'), ellipse(16, 146, 14, 8, 'water')),
    text(tubeX + 16, 30, sol, { cls: 'big-label' }),
    testView(test, result === null ? null : String(result), p),
    result !== null && p >= 1 ? text(160, 204, RESULTS.find((r) => r.value === result)!.label.replace(/\(.+?\)/g, ''), { cls: 'result-yes small' }) : '',
  );
}

export const solution: Experiment = {
  id: 'solution',
  field: 'particle',
  label: '水(すい)よう液(えき)のなかま分(わ)け',
  summary: '5つの水よう液A〜Eを、リトマス紙・じょう発・におい・アルミニウムで調べて見分けよう',
  setup: 'A〜Eの5本の試験管(しけんかん)に、食塩水・炭酸水・うすい塩酸・石灰水・アンモニア水のどれかが入っています（どれがどれかは分かりません）。4つの調べ方を使って見分けます。',
  variables: [
    {
      key: 'sol',
      kind: 'choice',
      label: '水(すい)よう液(えき)',
      options: ['A', 'B', 'C', 'D', 'E'].map((v) => ({ value: v, label: v })),
      initial: 'A',
    },
    {
      key: 'test',
      kind: 'choice',
      label: '調(しら)べ方(かた)',
      options: [
        { value: 'litmus', label: 'リトマス紙(し)につける' },
        { value: 'evap', label: '熱(ねっ)して水をじょう発させる' },
        { value: 'smell', label: '手であおいで においをかぐ' },
        { value: 'alum', label: 'アルミニウムを入れる' },
      ],
      initial: 'litmus',
    },
  ],
  measure: { kind: 'category', label: '結果(けっか)', options: RESULTS },
  simulate: (c) => PROPS[String(c.sol)]?.[c.test as Test] ?? 'nochange',
  scene,
  duration: 1600,
};

export const solutionMissions: Mission[] = [
  {
    id: 'solution-acid',
    exp: 'solution',
    levels: grades(6),
    question: '酸性(さんせい)の水よう液はどれとどれ？',
    choices: ['AとD', 'BとC', 'DとE', 'AとE'],
    answer: 1,
    target: 'sol',
    start: { test: 'litmus' },
    lock: ['test'],
    need: { key: 'sol', distinct: 5 },
    finding: '青色リトマス紙を赤く変えたのはBとC。BとCが酸性。DとEはアルカリ性、Aは中性だった。',
  },
  {
    id: 'solution-a',
    exp: 'solution',
    levels: grades(6),
    question: '水よう液Aは何だろう？',
    choices: ['食塩水', '炭酸水', '石灰水', 'アンモニア水'],
    answer: 0,
    target: 'test',
    start: { sol: 'A' },
    lock: ['sol'],
    need: { key: 'test', distinct: 3 },
    finding: 'Aは中性で、においがなく、じょう発させると白い固体が残った。この3つがあてはまるのは食塩水。',
    hint: '1つの調べ方だけでは決められないこともある。いくつかの調べ方を組み合わせよう',
    conclusions: [
      { text: '中性・においなし・白い固体が残る、の3つから食塩水と考えられる', ok: true, why: 'いくつかの結果を組み合わせて、ほかの候補をのぞいている。' },
      { text: '白い固体が残ったので、食塩水にまちがいない', ok: false, why: '石灰水も白い固体が残る。1つの結果だけでは決められない。' },
      { text: 'においがしないので、食塩水だ', ok: false, why: '炭酸水や石灰水もにおいがしない。ほかの結果もあわせて考えよう。' },
    ],
  },
  {
    id: 'solution-e',
    exp: 'solution',
    levels: grades(6),
    question: '水よう液Eは何だろう？',
    choices: ['アンモニア水', '石灰水', 'うすい塩酸', '食塩水'],
    answer: 0,
    target: 'test',
    start: { sol: 'E' },
    lock: ['sol'],
    need: { key: 'test', distinct: 3 },
    finding: 'Eはアルカリ性で、つんとしたにおいがあり、じょう発させても何も残らなかった。気体がとけたアルカリ性の水よう液なので、アンモニア水。',
  },
  {
    id: 'solution-gas',
    exp: 'solution',
    levels: grades(6),
    question: '水を じょう発させても何も残らない水よう液には、何がとけている？',
    choices: ['固体', '気体', '何もとけていない'],
    answer: 1,
    target: 'sol',
    start: { test: 'evap' },
    lock: ['test'],
    need: { key: 'sol', distinct: 5 },
    finding: 'B（炭酸水）・C（うすい塩酸）・E（アンモニア水）は何も残らなかった。これらには気体（二酸化炭素・塩化水素・アンモニア）がとけている。AとDには固体（食塩・石灰）がとけている。',
  },
];
