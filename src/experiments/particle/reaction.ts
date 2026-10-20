import { grades } from '../../core/levels';
import { circle, fig, group, line, path, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission, Option } from '../types';

// 水よう液の反応 (6 年生・中学受験)。
// - neutralize: うすい塩酸 10mL に、うすい水酸化ナトリウム水よう液を加える。ちょうど 10mL で中性になる
// - gasmake: 発生させた気体を調べる (酸素・二酸化炭素・水素)
// - gasamount: うすい塩酸 20mL にアルミニウムを入れたときの水素の量。0.4g で塩酸がなくなる

// ---- 中和 ----

export const NEUTRAL_ML = 10;

export function btb(naohMl: number): 'yellow' | 'green' | 'blue' {
  return naohMl < NEUTRAL_ML ? 'yellow' : naohMl === NEUTRAL_ML ? 'green' : 'blue';
}

export function residue(naohMl: number): 'none' | 'salt' | 'salt-naoh' {
  if (naohMl === 0) return 'none';
  return naohMl <= NEUTRAL_ML ? 'salt' : 'salt-naoh';
}

function neutralizeScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const ml = Number(c.naoh ?? 0);
  const evap = c.test === 'evap';
  const k = result === null ? 0 : Math.min(1, p * 1.4);
  const color = result === null ? 'btb-yellow' : `btb-${btb(Math.round(ml * k))}`;
  const level = 40 + (10 + ml * k) * 2.4;
  if (evap) {
    const grains = result === 'none' || result === null || k < 0.8 ? '' : Array.from({ length: result === 'salt' ? 6 : 10 }, (_, i) => circle(140 + i * 4.4, 120 - (i % 2) * 2, 2.4, i < 6 ? 'salt' : 'crystal')).join('');
    return fig(
      320,
      200,
      `塩酸10mLに水酸化ナトリウム水よう液${ml}mLを加えた液を蒸発させる`,
      path('M110 116Q160 146 210 116Z', 'box'),
      k < 1 ? path(`M118 118Q160 ${118 + 20 * (1 - k)} 202 118Z`, 'water') : '',
      grains,
      line(104, 116, 216, 116, 'ln thick'),
      result !== null ? path('M152 190Q156 166 160 156Q164 166 168 190Z', 'flame') : '',
      result !== null && p >= 1 ? text(160, 40, { none: '何も残らない', salt: '白い固体（食塩）が残る', 'salt-naoh': '食塩と水酸化ナトリウムが残る' }[String(result)] ?? '', { cls: 'result-yes small' }) : '',
    );
  }
  return fig(
    320,
    200,
    `BTB液を入れた塩酸10mLに、水酸化ナトリウム水よう液を${ml}mL加える`,
    rect(122, 180 - level, 76, level, color),
    path('M120 60V180H200V60', 'ln'),
    // こまごめピペット
    group(230, 40, rect(-6, 0, 12, 60, 'glass-tube', 5), path('M-6 0Q0 -16 6 0', 'rubber'), line(0, 60, 0, 72, 'ln thin')),
    text(240, 130, `${ml}mL`, { anchor: 'start', cls: 'small' }),
    result !== null && p >= 1 ? text(160, 30, { yellow: '黄色（酸性）', green: '緑色（中性）', blue: '青色（アルカリ性）' }[String(result)] ?? '', { cls: 'result-yes' }) : '',
  );
}

export const neutralize: Experiment = {
  id: 'neutralize',
  field: 'particle',
  label: '中和(ちゅうわ)',
  summary: '塩酸に水酸化ナトリウム水よう液を加えていき、BTB液の色と、蒸発させて残るものを調べよう',
  setup: 'うすい塩酸10mLにBTB液を入れ、うすい水酸化ナトリウム水よう液を少しずつ加えてかきまぜます。BTB液は、酸性で黄色、中性で緑色、アルカリ性で青色になります。できた液を蒸発させて、残るものも調べます。',
  variables: [
    { key: 'naoh', kind: 'range', label: '加える水酸化ナトリウム水よう液', min: 0, max: 20, step: 2, unit: 'mL', initial: 0 },
    {
      key: 'test',
      kind: 'choice',
      label: '調べ方',
      options: [
        { value: 'btb', label: 'BTB液の色を見る' },
        { value: 'evap', label: '蒸発(じょうはつ)させる' },
      ],
      initial: 'btb',
    },
  ],
  measure: {
    kind: 'category',
    label: '結果',
    options: [
      { value: 'yellow', label: '黄色（酸性）' },
      { value: 'green', label: '緑色（中性）' },
      { value: 'blue', label: '青色（アルカリ性）' },
      { value: 'none', label: '何も残らない' },
      { value: 'salt', label: '食塩が残る' },
      { value: 'salt-naoh', label: '食塩と水酸化ナトリウムが残る' },
    ],
  },
  simulate: (c) => (c.test === 'evap' ? residue(Number(c.naoh ?? 0)) : btb(Number(c.naoh ?? 0))),
  scene: neutralizeScene,
  duration: 1400,
};

// ---- 気体の発生 ----

interface Combo extends Option {
  gas: 'oxygen' | 'co2' | 'hydrogen';
}

const COMBOS: Combo[] = [
  { value: 'mno2', label: '二酸化マンガン＋オキシドール', gas: 'oxygen' },
  { value: 'limestone', label: '石灰石＋うすい塩酸', gas: 'co2' },
  { value: 'alhcl', label: 'アルミニウム＋うすい塩酸', gas: 'hydrogen' },
];

const RESULT: Record<string, Record<string, string>> = {
  oxygen: { incense: 'burn', limewater: 'clear', match: 'none' },
  co2: { incense: 'out', limewater: 'cloudy', match: 'none' },
  hydrogen: { incense: 'out', limewater: 'clear', match: 'pop' },
};

export function gasTest(combo: string, test: string): string {
  const gas = COMBOS.find((x) => x.value === combo)?.gas ?? 'oxygen';
  return RESULT[gas][test] ?? 'none';
}

function gasmakeScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const combo = String(c.combo ?? 'mno2');
  const test = String(c.test ?? 'incense');
  const k = result === null ? 0 : Math.min(1, p * 1.3);
  const bubbles = result !== null ? [0, 1, 2, 3, 4].map((i) => circle(70 + (i % 3) * 10, 170 - ((p * 100 + i * 17) % 50), 2.6, 'bubble')).join('') : '';
  const jar = path('M200 180V90Q200 80 210 80H250Q260 80 260 90V180Z', 'glass-jar');
  let probe = '';
  if (test === 'incense') {
    const flame = result === 'burn' ? 18 : result === 'out' ? 0 : 6;
    probe = line(230, 30, 230, 120, 'ln thick wood-line') + (flame > 0 ? path(`M226 120Q230 ${120 + flame} 234 120Z`, 'flame') : path('M230 120q-4 -8 0 -16', 'ln thin steam'));
  } else if (test === 'match') {
    probe = line(230, 40, 230, 96, 'ln thick wood-line') + path('M226 96Q230 106 234 96Z', 'flame') + (result === 'pop' && k > 0.6 ? text(270, 92, 'ポン！', { anchor: 'start', cls: 'small' }) : '');
  } else {
    probe = rect(204, 140, 52, 40, result === 'cloudy' && k > 0.5 ? 'limewater-cloudy' : 'water');
  }
  return fig(
    320,
    210,
    `${COMBOS.find((x) => x.value === combo)?.label}で発生させた気体を調べる`,
    path('M50 100V180H110V100', 'ln'),
    rect(52, 140, 56, 40, 'water'),
    combo === 'limestone' ? [0, 1, 2].map((i) => rect(60 + i * 14, 166, 10, 8, 'stone', 2)).join('') : combo === 'alhcl' ? rect(62, 168, 30, 6, 'alu', 1) : rect(60, 170, 36, 6, 'battery', 2),
    bubbles,
    path('M110 110H180V170H200', 'ln'),
    jar,
    probe,
    result !== null && p >= 1 ? text(160, 30, { burn: '線香がはげしく燃えた', out: '線香の火が消えた', cloudy: '石灰水が白くにごった', clear: '石灰水は変わらない', pop: 'ポンと音を立てて燃えた', none: '変化なし' }[String(result)] ?? '', { cls: 'result-yes small' }) : '',
  );
}

export const gasmake: Experiment = {
  id: 'gasmake',
  field: 'particle',
  label: '気体(きたい)の発生(はっせい)',
  summary: '3つの組み合わせで気体を発生させ、線香・石灰水・マッチで正体を調べよう',
  setup: '三角フラスコの中で気体を発生させ、水上置かんでびんに集めます。集めた気体に、火のついた線香を入れる・石灰水を入れてふる・マッチの火を近づける、のどれかで調べます。',
  variables: [
    { key: 'combo', kind: 'choice', label: '発生させる組み合わせ', options: COMBOS, initial: 'mno2' },
    {
      key: 'test',
      kind: 'choice',
      label: '調べ方',
      options: [
        { value: 'incense', label: '火のついた線香を入れる' },
        { value: 'limewater', label: '石灰水を入れてふる' },
        { value: 'match', label: 'マッチの火を近づける' },
      ],
      initial: 'incense',
    },
  ],
  measure: {
    kind: 'category',
    label: '結果',
    options: [
      { value: 'burn', label: '線香がはげしく燃える' },
      { value: 'out', label: '線香の火が消える' },
      { value: 'cloudy', label: '石灰水が白くにごる' },
      { value: 'clear', label: '石灰水は変わらない' },
      { value: 'pop', label: 'ポンと音を立てて燃える' },
      { value: 'none', label: '変化なし' },
    ],
  },
  simulate: (c) => gasTest(String(c.combo ?? 'mno2'), String(c.test ?? 'incense')),
  scene: gasmakeScene,
  duration: 1600,
};

/** うすい塩酸 20mL にアルミニウムを入れたときに発生する水素 (mL)。0.4g より多いと、塩酸がなくなって止まる */
export function hydrogen(alG: number): number {
  return Math.round(Math.min(alG, 0.4) * 1200);
}

function gasamountScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const al = Number(c.al ?? 0.1);
  const v = typeof result === 'number' ? result * Math.min(1, p * 1.2) : 0;
  const leftover = al > 0.4 && result !== null && p >= 1;
  return fig(
    320,
    210,
    `うすい塩酸20mLにアルミニウム${al}gを入れる`,
    path('M50 100V180H110V100', 'ln'),
    rect(52, 140, 56, 40, 'water'),
    rect(62, 168, 10 + al * 60, 6, 'alu', 1),
    path('M110 110H160V190', 'ln'),
    // メスシリンダーに集めた水素の量
    rect(180, 30, 40, 160, 'glass-tube', 4),
    rect(182, 32, 36, 156 - (v / 600) * 150, 'water'),
    ...[0, 200, 400, 600].map((m) => line(220, 188 - (m / 600) * 150, 228, 188 - (m / 600) * 150, 'ln thin') + text(232, 192 - (m / 600) * 150, String(m), { anchor: 'start', cls: 'tiny' })),
    leftover ? text(80, 200, 'アルミニウムがとけ残った', { cls: 'tiny' }) : '',
    typeof result === 'number' && p >= 1 ? text(300, 24, `水素 ${result}mL`, { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const gasamount: Experiment = {
  id: 'gasamount',
  field: 'particle',
  label: '発生する気体(きたい)の量(りょう)',
  summary: '同じ量の塩酸に入れるアルミニウムの量を変えて、発生する水素の量を調べよう',
  setup: 'うすい塩酸20mLに、アルミニウムを入れます。発生した水素を、水を満たしたメスシリンダーに集めて、体積（mL）をはかります。アルミニウムの量を変えてくらべます。',
  variables: [{ key: 'al', kind: 'range', label: 'アルミニウムの量', min: 0.1, max: 0.6, step: 0.1, unit: 'g', initial: 0.1 }],
  measure: { kind: 'number', label: '発生した水素', unit: 'mL', digits: 0 },
  simulate: (c) => hydrogen(Number(c.al ?? 0.1)),
  scene: gasamountScene,
  duration: 1400,
};

export const reactionMissions: Mission[] = [
  {
    id: 'neutral-green',
    exp: 'neutralize',
    levels: grades(6),
    exam: true,
    question: 'うすい塩酸10mLに、水酸化ナトリウム水よう液を何mL加えると中性（緑色）になる？',
    choices: ['5mL', '10mL', '15mL', '20mL'],
    answer: 1,
    target: 'naoh',
    start: { test: 'btb' },
    lock: ['test'],
    need: { key: 'naoh', distinct: 5 },
    finding: '10mL加えたとき、BTB液が緑色（中性）になった。それより少ないと黄色（酸性）、多いと青色（アルカリ性）。酸性とアルカリ性の水よう液がたがいの性質を打ち消し合うことを中和という。',
  },
  {
    id: 'neutral-evap',
    exp: 'neutralize',
    levels: grades(6),
    exam: true,
    question: 'ちょうど中性になった液（10mL加えた液）を蒸発させると、何が残る？',
    choices: ['食塩', '何も残らない', '水酸化ナトリウム', 'アルミニウム'],
    answer: 0,
    target: 'naoh',
    start: { test: 'evap', naoh: 0 },
    lock: ['test'],
    need: { key: 'naoh', distinct: 3, among: [0, 10, 20] },
    finding: '塩酸だけ（0mL）を蒸発させると何も残らない。中和した液からは食塩が残る。加えすぎた液（20mL）からは、食塩と、あまった水酸化ナトリウムが残る。',
    hint: '0mL・10mL・20mLの3つをくらべよう',
    conclusions: [
      { text: '中和すると、塩酸にも水酸化ナトリウム水よう液にもなかった食塩ができる', ok: true, why: '0mLでは何も残らなかったのに、中和した液からは食塩が残った。' },
      { text: '水酸化ナトリウム水よう液を加えるほど、残る食塩はいつまでもふえ続ける', ok: false, why: '塩酸がなくなると、食塩はそれ以上ふえない（あまった水酸化ナトリウムが残る）。' },
      { text: '何も残らなかったので、塩酸には何もとけていない', ok: false, why: '塩酸には気体（塩化水素）がとけているので、蒸発させると出ていってしまう。' },
    ],
  },
  {
    id: 'gas-oxygen',
    exp: 'gasmake',
    levels: grades(6),
    exam: true,
    question: '二酸化マンガンにオキシドールを加えて発生する気体は何？',
    choices: ['酸素', '二酸化炭素', '水素', 'ちっ素'],
    answer: 0,
    target: 'test',
    start: { combo: 'mno2' },
    lock: ['combo'],
    need: { key: 'test', distinct: 2 },
    finding: '火のついた線香を入れると、はげしく燃えた。物を燃やすはたらきがある酸素が発生した。二酸化マンガンは、自分は変化せずに、オキシドールから酸素が出るのを助ける。',
  },
  {
    id: 'gas-co2',
    exp: 'gasmake',
    levels: grades(6),
    exam: true,
    question: '石灰石にうすい塩酸をかけて出る気体を、石灰水に通すと？',
    choices: ['白くにごる', '変わらない', '青くなる'],
    answer: 0,
    target: 'test',
    start: { combo: 'limestone', test: 'limewater' },
    lock: ['combo'],
    need: { key: 'test', distinct: 2 },
    finding: '石灰水が白くにごったので、二酸化炭素。線香の火は消えた。',
  },
  {
    id: 'gas-limit',
    exp: 'gasamount',
    levels: grades(6),
    exam: true,
    question: '同じ量の塩酸に入れるアルミニウムをふやしていくと、発生する水素の量は？',
    choices: ['ずっと比例してふえ続ける', 'ある量から先はふえなくなる', 'へっていく'],
    answer: 1,
    target: 'al',
    need: { key: 'al', distinct: 5 },
    finding: 'アルミニウム0.4gまでは、発生する水素が比例してふえた（0.1gで120mL）。0.4gより多いと塩酸がなくなるので、水素は480mLのまま、アルミニウムがとけ残った。',
    conclusions: [
      { text: '0.4gまでは比例し、それより多いと塩酸がなくなって、水素はふえなくなった', ok: true, why: 'グラフがとちゅうで折れて水平になっている。' },
      { text: 'アルミニウムが多いほど、水素はいくらでも発生する', ok: false, why: '0.4gをこえると、水素の量は変わらなかった。' },
      { text: '0.5gのとき、アルミニウムは全部とけた', ok: false, why: '塩酸が足りないので、0.1gぶんがとけ残った。' },
    ],
  },
  {
    id: 'gas-calc',
    exp: 'gasamount',
    levels: grades(6),
    exam: true,
    question: 'アルミニウム0.1gで水素が120mL発生した。0.3gでは何mL発生する？',
    choices: ['360mL', '120mL', '240mL', '480mL'],
    answer: 0,
    target: 'al',
    need: { key: 'al', distinct: 3, among: [0.1, 0.2, 0.3] },
    finding: '塩酸が足りているあいだは、発生する水素はアルミニウムの量に比例する。0.3gは0.1gの3倍なので、120×3＝360mL。',
  },
];
