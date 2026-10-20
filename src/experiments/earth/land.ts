import { grades } from '../../core/levels';
import { circle, ellipse, fig, group, line, path, polygon, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission, Option } from '../types';

// 大地のつくりと変化。
// - river (5 年生): 流れる水は、地面をけずり (しん食)、土を運び (運ぱん)、積もらせる (たい積)。
//   水の量が多いほど、かたむきが急なほど、はたらきが大きい。曲がったところの外側はけずられ、内側には積もる
// - strata (6 年生): 川が運んだれき・砂・どろは、つぶの大きいものほど河口の近くに積もる
// - grains (6 年生): 流れる水に運ばれたつぶは角がとれて丸く、火山灰のつぶは角ばっている
// - earthquake (6 年生・中学受験): P 波は秒速 6km、S 波は秒速 3km。初期微動継続時間は震源からのきょりに比例する

// ---- 流れる水のはたらき ----

const WATER: Record<string, number> = { little: 1, much: 2 };
const SLOPE: Record<string, number> = { gentle: 1, steep: 2 };
const SPOT: Record<string, number> = { outer: 3, straight: 1.5, inner: -1 };

/** 10 分間に地面がけずられた深さ (mm)。マイナスは積もった高さ */
export function erosion(water: string, slope: string, spot: string): number {
  const s = SPOT[spot] ?? 1.5;
  return s < 0 ? s * (WATER[water] ?? 1) : s * (WATER[water] ?? 1) * (SLOPE[slope] ?? 1);
}

function riverScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const spot = String(c.spot ?? 'outer');
  const much = c.water === 'much';
  const steep = c.slope === 'steep';
  const k = result === null ? 0 : Math.min(1, p);
  const w = much ? 26 : 16;
  // 上から見た、土の山にほった曲がった水路
  const channel = 'M40 30C140 30 120 110 200 110S260 180 300 180';
  const marker = { outer: [196, 136], inner: [176, 92], straight: [80, 30] }[spot] ?? [196, 136];
  const v = typeof result === 'number' ? result : 0;
  return fig(
    320,
    210,
    `水の量${much ? '多い' : '少ない'}、かたむき${steep ? '急' : 'ゆるやか'}の流れの${{ outer: '曲がったところの外側', inner: '曲がったところの内側', straight: 'まっすぐなところ' }[spot]}`,
    rect(0, 0, 320, 210, 'sand'),
    path(channel, `river-bank`),
    `<path d="${channel}" class="river" stroke-width="${w}"/>`,
    k > 0 ? `<path d="${channel}" class="river-flow" stroke-dasharray="6 10" stroke-dashoffset="${(-p * 120).toFixed(0)}"/>` : '',
    // 調べる場所の旗
    group(marker[0], marker[1], line(0, 0, 0, -22, 'ln'), path('M0 -22L14 -17L0 -12Z', 'fill-mark')),
    k >= 1 && v < 0 ? ellipse(marker[0] - 6, marker[1] + 4, 16, 8, 'deposit') : '',
    text(20, 200, steep ? 'かたむき 急' : 'かたむき ゆるやか', { anchor: 'start', cls: 'tiny' }),
    typeof result === 'number' && p >= 1 ? text(300, 24, v >= 0 ? `${v}mm けずられた` : `${-v}mm 積もった`, { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const river: Experiment = {
  id: 'river',
  field: 'earth',
  label: '流(なが)れる水(みず)のはたらき',
  summary: '水の量・かたむき・場所を変えて、流れる水が地面をけずるはたらきを調べよう',
  setup: '土の山にみぞをほって曲がった水路を作り、上から水を流します。旗を立てたところが10分間に何mmけずられたか（マイナスは積もった高さ）をはかります。流す水の量と、山のかたむきを変えてくらべます。',
  variables: [
    { key: 'water', kind: 'choice', label: '流す水の量', options: [{ value: 'little', label: '少ない' }, { value: 'much', label: '多い' }], initial: 'little' },
    { key: 'slope', kind: 'choice', label: 'かたむき', options: [{ value: 'gentle', label: 'ゆるやか' }, { value: 'steep', label: '急' }], initial: 'gentle' },
    { key: 'spot', kind: 'choice', label: '調べる場所', options: [{ value: 'outer', label: '曲がったところの外側' }, { value: 'inner', label: '曲がったところの内側' }, { value: 'straight', label: 'まっすぐなところ' }], initial: 'outer' },
  ],
  measure: { kind: 'number', label: 'けずられた深さ（マイナスは積もった）', unit: 'mm', digits: 1 },
  simulate: (c) => erosion(String(c.water ?? 'little'), String(c.slope ?? 'gentle'), String(c.spot ?? 'outer')),
  scene: riverScene,
  duration: 1600,
};

// ---- 地層のでき方 ----

interface Grain extends Option {
  km: number;
  size: number;
}

const GRAINS: Grain[] = [
  { value: 'gravel', label: 'れき（2mm以上）', km: 1, size: 6 },
  { value: 'sand', label: '砂（0.06〜2mm）', km: 4, size: 3 },
  { value: 'mud', label: 'どろ（0.06mm以下）', km: 10, size: 1.4 },
];

export function depositKm(grain: string): number {
  return (GRAINS.find((g) => g.value === grain) ?? GRAINS[0]).km;
}

function strataScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const g = GRAINS.find((x) => x.value === c.grain) ?? GRAINS[0];
  const k = result === null ? 0 : Math.min(1, p);
  const x = 60 + g.km * 22 * k;
  const y = 70 + 80 * k;
  return fig(
    320,
    210,
    `川が運んだ${g.label.replace(/（.*/, '')}が、海のどこに積もるか`,
    polygon([[0, 60], [60, 70], [60, 210], [0, 210]], 'land'),
    rect(60, 70, 260, 140, 'sea'),
    polygon([[60, 190], [320, 200], [320, 210], [60, 210]], 'sand'),
    ...[0, 2, 4, 6, 8, 10].map((km) => line(60 + km * 22, 194, 60 + km * 22, 200, 'ln thin') + text(60 + km * 22, 186, `${km}`, { cls: 'tiny' })),
    text(300, 180, '河口からのきょり(km)', { anchor: 'end', cls: 'tiny' }),
    path('M0 64Q30 60 60 72', 'ln river-line'),
    result !== null ? circle(x, y, g.size, g.value === 'gravel' ? 'stone' : g.value === 'sand' ? 'sand-grain' : 'soil-grain') : '',
    result !== null && p >= 1 ? text(300, 30, `河口から約${result}km`, { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const strata: Experiment = {
  id: 'strata',
  field: 'earth',
  label: '地層(ちそう)のでき方',
  summary: '川が運んだれき・砂・どろが、海のどこに積もるかを調べよう',
  setup: '川の水に運ばれたれき・砂・どろが、海に流れこんだあと、河口から何kmぐらいのところに積もるかを調べます。（水を入れたつつに土を入れてふり、しずむ順を見る実験と同じしくみです）',
  variables: [{ key: 'grain', kind: 'choice', label: 'つぶ', options: GRAINS, initial: 'gravel' }],
  measure: { kind: 'number', label: '積もる場所（河口からのきょり）', unit: 'km', digits: 0 },
  simulate: (c) => depositKm(String(c.grain ?? 'gravel')),
  scene: strataScene,
  duration: 1400,
};

// ---- 火山灰のつぶ ----

export function grainShape(source: string): 'round' | 'angular' {
  return source === 'ash' ? 'angular' : 'round';
}

function grainsScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const ash = c.source === 'ash';
  const show = result !== null && p > 0.3;
  const shapes = Array.from({ length: 9 }, (_, i) => {
    const x = 110 + (i % 3) * 50;
    const y = 60 + Math.floor(i / 3) * 44;
    return ash
      ? polygon([[x - 14, y + 6], [x - 4, y - 14], [x + 14, y - 8], [x + 8, y + 12]], i % 3 === 0 ? 'glass' : 'stone')
      : ellipse(x, y, 14, 10, 'sand-grain');
  });
  return fig(
    320,
    210,
    `${ash ? '火山灰' : '川原の砂'}のつぶを、けんび鏡で見る`,
    circle(160, 104, 90, 'box'),
    show ? shapes.join('') : '',
    result !== null && p >= 1 ? text(160, 205, result === 'angular' ? 'つぶが角ばっている' : 'つぶが丸い', { cls: 'result-yes small' }) : '',
  );
}

export const grains: Experiment = {
  id: 'grains',
  field: 'earth',
  label: '火山灰(かざんばい)のつぶ',
  summary: '地層にふくまれる火山灰と、川原の砂のつぶの形をくらべよう',
  setup: '地層から取った火山灰と、川原の砂を、それぞれ水でよく洗って、そう眼実体けんび鏡でつぶの形を観察します。',
  variables: [{ key: 'source', kind: 'choice', label: '観察するもの', options: [{ value: 'ash', label: '火山灰' }, { value: 'river', label: '川原の砂' }], initial: 'ash' }],
  measure: {
    kind: 'category',
    label: 'つぶの形',
    options: [
      { value: 'angular', label: '角ばっている' },
      { value: 'round', label: '丸みがある' },
    ],
  },
  simulate: (c) => grainShape(String(c.source ?? 'ash')),
  scene: grainsScene,
  duration: 900,
};

// ---- 地震のゆれ ----

const VP = 6;
const VS = 3;

/** 初期微動継続時間 (秒) */
export function pDuration(distanceKm: number): number {
  return Math.round(distanceKm / VS - distanceKm / VP);
}

function quakeScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const d = Number(c.distance ?? 120);
  const tS = d / VS;
  const t = result === null ? 0 : tS * Math.min(1, p * 1.2);
  // 地震計の記録 (横じくは時間)。P 波が来るとゆれ始め (初期微動)、S 波が来ると大きくゆれる (主要動)
  const sx = (s: number) => 40 + (s / 90) * 260;
  let d1 = `M${sx(0)} 120`;
  for (let s = 0; s <= Math.min(t, 90); s += 0.5) {
    const amp = s < d / VP ? 0 : s < tS ? 4 : 18;
    d1 += `L${sx(s).toFixed(1)} ${(120 + amp * Math.sin(s * 9)).toFixed(1)}`;
  }
  return fig(
    320,
    210,
    `震源から${d}kmの地点の地震計の記録`,
    line(40, 120, 300, 120, 'ln thin faint'),
    path(d1, 'ln'),
    ...[0, 30, 60, 90].map((s) => line(sx(s), 160, sx(s), 166, 'ln thin') + text(sx(s), 180, `${s}秒`, { cls: 'tiny' })),
    t >= d / VP ? line(sx(d / VP), 80, sx(d / VP), 160, 'ln thin dash') + text(sx(d / VP), 74, 'P波', { cls: 'tiny' }) : '',
    t >= tS ? line(sx(tS), 80, sx(tS), 160, 'ln thin dash') + text(sx(tS), 74, 'S波', { cls: 'tiny' }) : '',
    text(20, 30, `震源から ${d}km`, { anchor: 'start', cls: 'small' }),
    typeof result === 'number' && p >= 1 ? text(300, 30, `初期微動 ${result}秒`, { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const earthquake: Experiment = {
  id: 'earthquake',
  field: 'earth',
  label: '地震(じしん)のゆれ',
  summary: '震源からのきょりを変えて、初期微動が続く時間を調べよう',
  setup: '地震が起きると、速いP波（秒速6km）とおそいS波（秒速3km）が同時に出て伝わります。P波が着くと小さなゆれ（初期微動）が始まり、S波が着くと大きなゆれ（主要動）になります。震源からのきょりがちがう地点の地震計の記録から、初期微動が続いた時間を調べます。',
  variables: [{ key: 'distance', kind: 'range', label: '震源からのきょり', min: 30, max: 240, step: 30, unit: 'km', initial: 60 }],
  measure: { kind: 'number', label: '初期微動継続時間', unit: '秒', digits: 0 },
  simulate: (c) => pDuration(Number(c.distance ?? 60)),
  scene: quakeScene,
  duration: 2400,
};

export const landMissions: Mission[] = [
  {
    id: 'river-water',
    exp: 'river',
    levels: grades(5),
    question: '流れる水の量がふえると、地面をけずるはたらきは？',
    choices: ['大きくなる', '小さくなる', '変わらない'],
    answer: 0,
    target: 'water',
    start: { spot: 'outer', slope: 'gentle' },
    need: { key: 'water', distinct: 2 },
    finding: '水の量が多いほど、流れが速くなり、地面をけずるはたらきや、土を運ぶはたらきが大きくなる。大雨のあとに川の水がにごるのはこのため。',
  },
  {
    id: 'river-bend',
    exp: 'river',
    levels: grades(5),
    question: '川の曲がったところで、けずられるのは外側と内側のどちら？',
    choices: ['外側', '内側', '両方同じ'],
    answer: 0,
    target: 'spot',
    start: { water: 'much', slope: 'gentle' },
    need: { key: 'spot', distinct: 2, among: ['outer', 'inner'] },
    finding: '曲がったところの外側は流れが速く、地面が深くけずられてがけになる。内側は流れがおそく、土が積もって川原になる。',
  },
  {
    id: 'river-slope',
    exp: 'river',
    levels: grades(5),
    question: 'かたむきが急なところ（山の中の川）では、けずるはたらきは？',
    choices: ['大きい', '小さい', '変わらない'],
    answer: 0,
    target: 'slope',
    start: { spot: 'straight', water: 'little' },
    need: { key: 'slope', distinct: 2 },
    finding: 'かたむきが急なほど流れが速く、けずるはたらきが大きい。山の中の川は、深い谷をつくる。平地の川は流れがゆるやかで、積もらせるはたらきが大きい。',
  },
  {
    id: 'strata-order',
    exp: 'strata',
    levels: grades(6),
    question: '川が運んだつぶのうち、河口のいちばん近くに積もるのは？',
    choices: ['れき', '砂', 'どろ', 'どれも同じところ'],
    answer: 0,
    target: 'grain',
    need: { key: 'grain', distinct: 3 },
    finding: 'つぶの大きいれきは早くしずむので河口の近くに、砂はその先に、つぶの小さいどろは遠くまで運ばれてから積もる。こうして、つぶの大きさごとに分かれた層が重なって地層ができる。',
    conclusions: [
      { text: 'つぶが大きいものほど、河口の近くに積もった', ok: true, why: 'れき・砂・どろの3つをくらべた結果どおり。' },
      { text: '地層の中の層は、どれも同じ場所・同じときにできる', ok: false, why: '層はつぶごとに場所がちがい、長い年月をかけて重なっていく。' },
      { text: 'どろは軽いので、海には積もらない', ok: false, why: 'どろも、河口から遠いところに積もっていた。' },
    ],
  },
  {
    id: 'grains-ash',
    exp: 'grains',
    levels: grades(6),
    question: '火山灰のつぶの形は、川原の砂とくらべてどうなっている？',
    choices: ['角ばっている', '丸みがある', '同じ'],
    answer: 0,
    target: 'source',
    need: { key: 'source', distinct: 2 },
    finding: '川原の砂は、流れる水に運ばれる間に角がとれて丸くなっている。火山灰のつぶは、流れる水に運ばれていないので角ばっていて、ガラスのようにすき通ったつぶもある。地層に火山灰の層があると、近くで火山のふん火があったことが分かる。',
  },
  {
    id: 'quake-double',
    exp: 'earthquake',
    levels: grades(6),
    exam: true,
    question: '震源からのきょりが2倍になると、初期微動継続時間は？',
    choices: ['2倍になる', '変わらない', '半分になる', '4倍になる'],
    answer: 0,
    target: 'distance',
    need: { key: 'distance', distinct: 4 },
    finding: '初期微動継続時間は、震源からのきょりに比例する。このモデルでは、震源から60kmで10秒、120kmで20秒。',
    conclusions: [
      { text: '調べたきょりでは、初期微動継続時間はきょりに比例した', ok: true, why: 'グラフが0を通るまっすぐな線になっている。' },
      { text: 'きょりが遠いほど、大きなゆれ（主要動）も小さくなるので安全', ok: false, why: '調べたのは初期微動の時間だけ。ゆれの大きさは調べていない。' },
      { text: 'P波とS波は、同じ速さで伝わる', ok: false, why: '同じ速さなら初期微動はおきない。P波のほうが速い。' },
    ],
  },
  {
    id: 'quake-calc',
    exp: 'earthquake',
    levels: grades(6),
    exam: true,
    question: '初期微動継続時間が30秒だった地点は、震源から何km？（P波 秒速6km、S波 秒速3km）',
    choices: ['180km', '90km', '60km', '360km'],
    answer: 0,
    target: 'distance',
    need: { key: 'distance', distinct: 3, among: [60, 120, 180, 240] },
    finding: '1kmあたり、S波は1/3秒、P波は1/6秒かかるので、その差は1/6秒。30秒の差になるのは 30×6＝180km。',
  },
];
