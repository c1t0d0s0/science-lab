import { grades } from '../../core/levels';
import { circle, fig, line, path, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// 金ぞく・水・空気と温度 (4 年生)。
// - expansion: 温めると体積が大きくなり、冷やすと小さくなる。変わり方は 空気 ＞ 水 ＞ 金ぞく
// - conduction: 金ぞくは熱したところから順に温まる。水と空気は、温まったものが上に動いて全体が温まる
// - states: 水は 100℃近くでふっとうし、0℃でこおる。ふっとう・こおっている間は温度が変わらない

// ---- 温度と体積 ----

/** 1℃あたりの体積の変わり方 (%) */
const RATE: Record<string, number> = { air: 0.34, water: 0.02, metal: 0.0036 };
const TEMP: Record<string, number> = { cold: 0, room: 20, hot: 60 };

/** 20℃のときとくらべた、体積の変わり方 (%) */
export function volumeChange(material: string, temp: string): number {
  return Math.round((RATE[material] ?? 0.34) * ((TEMP[temp] ?? 20) - 20) * 100) / 100;
}

function expansionScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const m = String(c.material ?? 'air');
  const t = String(c.temp ?? 'room');
  const change = typeof result === 'number' ? result * Math.min(1, p * 1.4) : 0;
  const bath = t === 'hot' ? 'hot-bath' : t === 'cold' ? 'cold-bath' : 'water';
  let body = '';
  if (m === 'metal') {
    // 金ぞくの玉と輪: 温めると玉が大きくなり、輪を通らなくなる
    const r = 20 * (1 + change / 10);
    body = rect(110, 30, 100, 6, 'iron', 2) + circle(160, 60, 22, 'ln thick') + circle(160, 120, r, 'iron') + line(160, 30, 160, 98, 'ln thin');
  } else {
    // 試験管の口に、空気ならせっけん水のまく、水ならガラス管
    const level = m === 'water' ? 70 - change * 30 : 0;
    body =
      path('M140 40V150A20 20 0 0 0 180 150V40', 'ln') +
      (m === 'water' ? rect(142, 60, 36, 112, 'water') + rect(156, level, 8, 70 - level, 'water') + rect(156, 10, 8, 54, 'ln thin') : '') +
      (m === 'air' ? path(`M140 40Q160 ${40 - change * 3} 180 40`, 'soap') : '');
  }
  return fig(
    320,
    210,
    `${{ air: '空気', water: '水', metal: '金ぞくの玉' }[m]}を${{ cold: '氷水で冷やす', room: 'そのまま', hot: '湯で温める' }[t]}`,
    rect(100, 130, 120, 70, bath, 6),
    body,
    text(240, 190, { cold: '氷水 0℃', room: '20℃', hot: '湯 60℃' }[t] ?? '', { anchor: 'start', cls: 'small' }),
    m === 'metal' && result !== null && p >= 1 ? text(250, 70, t === 'hot' ? '輪を通らない' : '輪を通る', { cls: 'small' }) : '',
    typeof result === 'number' && p >= 1 ? text(20, 30, `体積 ${result > 0 ? '+' : ''}${result}%`, { anchor: 'start', cls: 'result-yes' }) : '',
  );
}

export const expansion: Experiment = {
  id: 'expansion',
  field: 'particle',
  label: '温度(おんど)と体積(たいせき)',
  summary: '空気・水・金ぞくを温めたり冷やしたりして、体積の変わり方を調べよう',
  setup: '20℃の空気（口にせっけん水のまくをはった試験管）、水（ガラス管をさしたゴムせんでふたをした試験管）、金ぞくの玉（輪をちょうど通る大きさ）を、湯（60℃）で温めたり、氷水（0℃）で冷やしたりします。20℃のときとくらべて、体積が何％変わったかを調べます。',
  variables: [
    {
      key: 'material',
      kind: 'choice',
      label: '調(しら)べるもの',
      options: [
        { value: 'air', label: '空気(くうき)' },
        { value: 'water', label: '水(みず)' },
        { value: 'metal', label: '金(きん)ぞく（鉄の玉）' },
      ],
      initial: 'air',
    },
    {
      key: 'temp',
      kind: 'choice',
      label: '温度(おんど)',
      options: [
        { value: 'cold', label: '氷水で冷やす（0℃）' },
        { value: 'room', label: 'そのまま（20℃）' },
        { value: 'hot', label: '湯で温める（60℃）' },
      ],
      initial: 'room',
    },
  ],
  measure: { kind: 'number', label: '体積の変わり方（20℃のときとくらべて）', unit: '%', digits: 2 },
  simulate: (c) => volumeChange(String(c.material ?? 'air'), String(c.temp ?? 'room')),
  scene: expansionScene,
  duration: 1200,
};

// ---- 物の温まり方 ----

export type Warm = 'from-heat' | 'whole' | 'top-only';

export function warming(material: string, where: string): Warm {
  if (material === 'metal') return 'from-heat';
  return where === 'bottom' ? 'whole' : 'top-only';
}

function conductionScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const m = String(c.material ?? 'metal');
  const where = String(c.where ?? 'bottom');
  const k = result === null ? 0 : Math.min(1, p);
  const flame = (x: number, y: number) => path(`M${x - 8} ${y}Q${x - 6} ${y - 14} ${x} ${y - 26}Q${x + 6} ${y - 14} ${x + 8} ${y}Z`, 'flame');
  if (m === 'metal') {
    // 金ぞくのぼうに示温(しおん)インクをぬり、はしか、まん中を熱する
    const heatAt = where === 'bottom' ? 40 : 160;
    const segs = Array.from({ length: 14 }, (_, i) => {
      const x = 40 + i * 18;
      const warm = result !== null && Math.abs(x - heatAt) <= k * 260;
      return rect(x - 9, 90, 18, 14, warm ? 'warm-ink' : 'cold-ink');
    }).join('');
    return fig(320, 200, `金ぞくのぼうの${where === 'bottom' ? 'はし' : 'まん中'}を熱する`, segs, rect(31, 90, 252, 14, 'ln'), result !== null ? flame(heatAt, 140) : '', line(heatAt, 108, heatAt, 112, 'ln'), text(heatAt, 160, '熱する', { cls: 'tiny' }));
  }
  // 水 (示温インクを入れた試験管) か 空気 (線香のけむりを入れたビーカー) の、下か上を熱する
  const top = 40;
  const bottom = 170;
  const levels = 8;
  const cells = Array.from({ length: levels }, (_, i) => {
    const y = top + (i * (bottom - top)) / levels;
    // 下を熱すると、上から順に温まって、やがて全体が温まる。上を熱すると、上だけ温まる
    const fromTop = i / levels;
    const warm = result !== null && (where === 'bottom' ? fromTop <= k * 1.05 : fromTop <= Math.min(k, 0.35));
    return rect(130, y, 60, (bottom - top) / levels + 0.5, warm ? 'warm-ink' : m === 'air' ? 'air-fill' : 'cold-ink');
  }).join('');
  const flow =
    m !== 'metal' && where === 'bottom' && result !== null && k > 0.1
      ? path('M160 160V60M160 60Q150 50 140 70M160 60Q170 50 180 70', 'ln thin smoke')
      : '';
  return fig(
    320,
    200,
    `${m === 'water' ? '試験管の水' : 'ビーカーの空気'}の${where === 'bottom' ? '下' : '上'}の方を熱する`,
    cells,
    path(`M130 ${top}V${bottom}H190V${top}`, 'ln'),
    flow,
    result !== null ? flame(where === 'bottom' ? 160 : 210, where === 'bottom' ? 196 : 76) : '',
    text(240, where === 'bottom' ? 180 : 60, '熱する', { anchor: 'start', cls: 'tiny' }),
  );
}

export const conduction: Experiment = {
  id: 'conduction',
  field: 'particle',
  label: '物(もの)の温(あたた)まり方(かた)',
  summary: '金ぞく・水・空気の温まり方のちがいを、示温インクやけむりで調べよう',
  setup: '温まると色が変わる示温(しおん)インクを、金ぞくのぼうにぬったり、試験管の水にまぜたりします。空気は、線香のけむりを入れたビーカーで、けむりの動きを見ます。下の方（金ぞくはぼうのはし）か、上の方（金ぞくはまん中）を熱して、どこから温まるかを調べます。',
  variables: [
    {
      key: 'material',
      kind: 'choice',
      label: '温めるもの',
      options: [
        { value: 'metal', label: '金(きん)ぞくのぼう' },
        { value: 'water', label: '水(みず)' },
        { value: 'air', label: '空気(くうき)' },
      ],
      initial: 'metal',
    },
    {
      key: 'where',
      kind: 'choice',
      label: '熱(ねっ)するところ',
      options: [
        { value: 'bottom', label: '下の方（ぼうのはし）' },
        { value: 'top', label: '上の方（ぼうのまん中）' },
      ],
      initial: 'bottom',
    },
  ],
  measure: {
    kind: 'category',
    label: '温まり方',
    options: [
      { value: 'from-heat', label: '熱したところから近い順に温まる' },
      { value: 'whole', label: '上の方から温まり、やがて全体が温まる' },
      { value: 'top-only', label: '上の方だけ温まり、下は冷たいまま' },
    ],
  },
  simulate: (c) => warming(String(c.material ?? 'metal'), String(c.where ?? 'bottom')),
  scene: conductionScene,
  duration: 2200,
};

// ---- 水のすがた ----

/** 熱した (冷やした) 時間ごとの、水の温度 (℃)。はじめは 20℃ */
export function waterState(process: string, minutes: number): number {
  if (process === 'heat') return Math.min(100, 20 + 10 * minutes);
  // 氷と食塩をまぜた寒ざいで冷やす。0℃になってから 6 分間は、こおりながら 0℃のまま
  if (minutes <= 4) return 20 - 5 * minutes;
  if (minutes <= 10) return 0;
  return Math.max(-10, -2 * (minutes - 10));
}

function stateLabel(process: string, minutes: number): string {
  const t = waterState(process, minutes);
  if (process === 'heat') return t >= 100 ? 'ふっとうしている' : t >= 60 ? '小さなあわが出る' : '水（液体）';
  if (minutes > 10) return '全部こおった（氷）';
  if (minutes > 4) return 'こおり始めた';
  return '水（液体）';
}

function statesScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const proc = String(c.process ?? 'heat');
  const minutes = Number(c.time ?? 4);
  const now = result === null ? 0 : minutes * Math.min(1, p);
  const t = waterState(proc, now);
  const frozen = proc === 'cool' ? (now <= 4 ? 0 : now >= 10 ? 1 : (now - 4) / 6) : 0;
  const boiling = proc === 'heat' && t >= 100;
  const thermoTop = 24;
  const scaleY = (v: number) => 160 - ((v + 20) / 130) * (160 - thermoTop - 10);
  const bubbles = boiling ? [0, 1, 2, 3].map((i) => circle(150 + i * 10, 150 - ((p * 120 + i * 21) % 60), 3, 'bubble')).join('') : '';
  return fig(
    320,
    210,
    `水を${proc === 'heat' ? '熱して' : '冷やして'}${minutes}分`,
    proc === 'cool' ? rect(110, 70, 100, 110, 'cold-bath', 6) : '',
    path('M140 40V160A20 20 0 0 0 180 160V40', 'ln'),
    rect(142, 90 - frozen * 4, 36, 86 + frozen * 4, frozen > 0 ? 'ice' : 'water'),
    bubbles,
    proc === 'heat' && result !== null ? path('M152 210Q156 186 160 176Q164 186 168 210Z', 'flame') : '',
    rect(236, thermoTop, 12, 140, 'glass-tube', 6),
    rect(239, scaleY(t), 6, 164 - scaleY(t), 'hot'),
    ...[-20, 0, 50, 100].map((v) => line(248, scaleY(v), 254, scaleY(v), 'ln thin') + text(258, scaleY(v) + 4, String(v), { anchor: 'start', cls: 'tiny' })),
    text(20, 30, `${Math.round(now)}分`, { anchor: 'start', cls: 'small' }),
    typeof result === 'number' && p >= 1 ? text(20, 200, `${result}℃ ${stateLabel(proc, minutes)}`, { anchor: 'start', cls: 'result-yes small' }) : '',
  );
}

export const states: Experiment = {
  id: 'states',
  field: 'particle',
  label: '水(みず)のすがた',
  summary: '水を熱したり冷やしたりし続けて、温度とすがたの変わり方を調べよう',
  setup: '試験管に20℃の水を入れ、温度計をさします。熱するときは、ふっとう石を入れて火で熱します。冷やすときは、氷に食塩をまぜた寒ざい（0℃より冷たい）に入れます。時間ごとに、水の温度とすがた（水・あわ・氷）を調べます。',
  variables: [
    {
      key: 'process',
      kind: 'choice',
      label: '熱(ねっ)するか、冷(ひ)やすか',
      options: [
        { value: 'heat', label: '熱する' },
        { value: 'cool', label: '冷やす（寒ざい）' },
      ],
      initial: 'heat',
    },
    { key: 'time', kind: 'range', label: 'たった時間', min: 2, max: 16, step: 2, unit: '分', initial: 2 },
  ],
  measure: { kind: 'number', label: '水の温度', unit: '℃', digits: 0 },
  simulate: (c) => waterState(String(c.process ?? 'heat'), Number(c.time ?? 2)),
  scene: statesScene,
  duration: 1800,
};

export const thermalMissions: Mission[] = [
  {
    id: 'expansion-air',
    exp: 'expansion',
    levels: grades(4),
    question: 'とじこめた空気(くうき)を温めると、体積(たいせき)はどうなる？',
    choices: ['大きくなる', '小さくなる', '変わらない'],
    answer: 0,
    target: 'temp',
    start: { material: 'air' },
    lock: ['material'],
    need: { key: 'temp', distinct: 3 },
    finding: '空気は、温めると体積が大きくなり（せっけん水のまくがふくらむ）、冷やすと体積が小さくなる（まくがへこむ）。',
  },
  {
    id: 'expansion-compare',
    exp: 'expansion',
    levels: grades(4),
    question: '同じように温めたとき、体積の変わり方がいちばん大きいのは？',
    choices: ['空気', '水', '金ぞく', 'どれも同じ'],
    answer: 0,
    target: 'material',
    start: { temp: 'hot' },
    lock: ['temp'],
    need: { key: 'material', distinct: 3 },
    finding: '空気・水・金ぞくは、どれも温めると体積が大きくなる。変わり方は、空気がいちばん大きく、次に水、金ぞくはとても小さい。',
  },
  {
    id: 'expansion-metal',
    exp: 'expansion',
    levels: grades(4),
    question: '輪をちょうど通る金ぞくの玉を、湯で温めると？',
    choices: ['少し大きくなって、輪を通らなくなる', '小さくなって、輪を楽に通る', '変わらない'],
    answer: 0,
    target: 'temp',
    start: { material: 'metal' },
    lock: ['material'],
    need: { key: 'temp', distinct: 2, among: ['room', 'hot'] },
    finding: '金ぞくも、温めると体積が少し大きくなる。目に見えにくいほど小さな変化だが、輪を通らなくなる。冷やすと、また通るようになる。',
  },
  {
    id: 'conduction-metal',
    exp: 'conduction',
    levels: grades(4),
    question: '金(きん)ぞくのぼうを熱すると、どのように温まる？',
    choices: ['熱したところから近い順に温まる', '上の方から温まる', '全体が同時に温まる'],
    answer: 0,
    target: 'where',
    start: { material: 'metal' },
    lock: ['material'],
    need: { key: 'where', distinct: 2 },
    finding: '金ぞくは、熱したところから近い順に、熱が伝わって温まっていく。はしを熱しても、まん中を熱しても同じ。',
  },
  {
    id: 'conduction-water',
    exp: 'conduction',
    levels: grades(4),
    question: '試験管の水の下の方を熱すると、どこから温まる？',
    choices: ['上の方から温まり、やがて全体が温まる', '熱したところだけ温まる', '下から順に温まる'],
    answer: 0,
    target: 'where',
    start: { material: 'water' },
    lock: ['material'],
    need: { key: 'where', distinct: 2 },
    finding: '水は、熱せられて温まった部分が上に動き、上の方から温まって、やがて全体が温まる。上の方を熱すると、上だけが温まり、下はなかなか温まらない。',
  },
  {
    id: 'conduction-air',
    exp: 'conduction',
    levels: grades(4),
    question: '空気(くうき)の温まり方は、金ぞくと水のどちらににている？',
    choices: ['水ににている', '金ぞくににている', 'どちらにもにていない'],
    answer: 0,
    target: 'material',
    start: { where: 'bottom' },
    lock: ['where'],
    need: { key: 'material', distinct: 3 },
    finding: '空気も水と同じように、温まった部分が上に動いて、全体が温まる。だんぼうをつけると、部屋の上の方から温かくなる。',
  },
  {
    id: 'states-boil',
    exp: 'states',
    levels: grades(4),
    question: '水を熱し続けると、温度はどうなる？',
    choices: ['いつまでも上がり続ける', '100℃近くで上がらなくなる', 'とちゅうから下がる'],
    answer: 1,
    target: 'time',
    start: { process: 'heat' },
    lock: ['process'],
    need: { key: 'time', distinct: 5 },
    finding: '水は、熱すると温度が上がるが、100℃近くでふっとうし、熱し続けても温度は上がらなくなる。ふっとうしているときに出るあわは、水が気体になった水じょう気。',
    hint: '2分、4分…と時間を長くして、グラフで温度の変わり方を見よう',
  },
  {
    id: 'states-freeze',
    exp: 'states',
    levels: grades(4),
    question: '水を冷やし続けると、こおり始めてから全部こおるまでの間、温度はどうなる？',
    choices: ['0℃のまま変わらない', '下がり続ける', '上がる'],
    answer: 0,
    target: 'time',
    start: { process: 'cool' },
    lock: ['process'],
    need: { key: 'time', distinct: 5 },
    finding: '水は0℃でこおり始め、全部こおるまでは0℃のまま。全部こおると、また温度が下がる。水は、こおると体積が大きくなる。',
  },
];
