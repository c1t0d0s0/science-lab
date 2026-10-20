import { grades } from '../../core/levels';
import { circle, ellipse, fig, group, line, path, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// 天気のようす。
// - daytemp (4 年生): 晴れの日は気温が大きく変わり、午後 2 時ごろにいちばん高い。雨の日はあまり変わらない
// - evaporation (4 年生): 水は、ふっとうしなくても水面から水じょう気になって出ていく (じょう発)
// - dew (4 年生): 空気中の水じょう気は、冷やされると水になる (結ろ)
// - clouds (5 年生): 日本の上空では、雲はおよそ西から東へ動き、天気も西から東へ変わる

// ---- 天気と気温 ----

export function airTemp(weather: string, hour: number): number {
  const s = Math.sin((Math.PI * (hour - 6)) / 16);
  return Math.round(weather === 'sunny' ? 14 + 11 * s : 15 + 2 * s);
}

function dayTempScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const sunny = c.weather === 'sunny';
  const hour = Number(c.time ?? 10);
  const angle = (Math.PI * (hour - 6)) / 12;
  const sx = 160 - 130 * Math.cos(angle);
  const sy = 150 - 110 * Math.sin(angle);
  const t = typeof result === 'number' ? result : 0;
  return fig(
    320,
    200,
    `${sunny ? '晴れ' : '雨'}の日の${hour}時の気温をはかる`,
    sunny ? circle(sx, sy, 13, 'sun') : group(160, 50, ellipse(-30, 0, 40, 18, 'cloud'), ellipse(20, -6, 40, 22, 'cloud')) + [0, 1, 2, 3, 4].map((i) => line(110 + i * 25, 80 + ((p * 100 + i * 13) % 40), 106 + i * 25, 90 + ((p * 100 + i * 13) % 40), 'ln thin wind')).join(''),
    rect(0, 160, 320, 40, 'ground'),
    // 百葉箱
    group(250, 110, rect(-20, -24, 40, 30, 'paperfill', 2), path('M-24 -24H24L0 -34Z', 'paperfill'), line(-14, 6, -14, 50, 'ln'), line(14, 6, 14, 50, 'ln')),
    text(20, 30, `${hour}時`, { anchor: 'start', cls: 'small' }),
    typeof result === 'number' && p >= 1 ? text(300, 30, `気温 ${t}℃`, { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const daytemp: Experiment = {
  id: 'daytemp',
  field: 'earth',
  label: '天気(てんき)と気温(きおん)',
  summary: '晴れの日と雨の日で、1日の気温の変わり方をくらべよう',
  setup: '百葉箱(ひゃくようばこ)の中の温度計で、地面から1.2〜1.5mの高さの気温を、時こくごとにはかります。晴れの日と雨の日で、1日の気温の変わり方をくらべます。',
  variables: [
    { key: 'weather', kind: 'choice', label: '天気', options: [{ value: 'sunny', label: '晴れ' }, { value: 'rainy', label: '雨' }], initial: 'sunny' },
    { key: 'time', kind: 'range', label: 'はかる時こく', min: 6, max: 18, step: 2, unit: '時', initial: 8 },
  ],
  measure: { kind: 'number', label: '気温', unit: '℃', digits: 0 },
  simulate: (c) => airTemp(String(c.weather ?? 'sunny'), Number(c.time ?? 8)),
  scene: dayTempScene,
  duration: 1000,
};

// ---- じょう発 ----

export function waterLeft(lid: string, days: number): number {
  return lid === 'yes' ? 100 : Math.max(0, 100 - 6 * days);
}

function evapScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const lid = c.lid === 'yes';
  const days = Number(c.days ?? 2);
  const v = typeof result === 'number' ? 100 - (100 - result) * Math.min(1, p) : 100;
  const h = v * 0.9;
  const drops = lid && result !== null && p > 0.3 ? [0, 1, 2, 3, 4, 5].map((i) => circle(132 + i * 11, 64 + (i % 2) * 3, 2.4, 'bubble')).join('') : '';
  return fig(
    320,
    200,
    `ふた${lid ? 'をした' : 'をしない'}入れ物の水を${days}日おく`,
    rect(122, 170 - h, 76, h, 'water'),
    path('M120 60V170H200V60', 'ln'),
    lid ? rect(116, 56, 88, 6, 'glass-tube', 2) : '',
    line(118, 170 - 90, 124, 170 - 90, 'ln red'),
    text(110, 84, 'はじめ', { anchor: 'end', cls: 'tiny' }),
    drops,
    !lid && result !== null && p < 1 ? path(`M150 ${150 - h}q-4 -10 0 -20t0 -20M170 ${150 - h}q-4 -10 0 -20`, 'ln thin steam') : '',
    text(296, 190, `${Math.round(days * Math.min(1, result === null ? 0 : p))}日目`, { anchor: 'end', cls: 'small' }),
    typeof result === 'number' && p >= 1 ? text(20, 30, `水 ${result}mL${lid ? '（ふたの内側に水てき）' : ''}`, { anchor: 'start', cls: 'result-yes small' }) : '',
  );
}

export const evaporation: Experiment = {
  id: 'evaporation',
  field: 'earth',
  label: '水(みず)のじょう発(はつ)',
  summary: 'ふたをした入れ物とふたをしない入れ物に水を入れて、水の量の変わり方をくらべよう',
  setup: '同じ入れ物2つに100mLずつ水を入れ、一方にはラップでふたをし、もう一方はふたをしません。日の当たる場所に置き、日ごとに水の量と、ふたの内側のようすを調べます。',
  variables: [
    { key: 'lid', kind: 'choice', label: 'ふた', options: [{ value: 'no', label: 'しない' }, { value: 'yes', label: 'する（ラップ）' }], initial: 'no' },
    { key: 'days', kind: 'range', label: 'おいた日数', min: 0, max: 8, step: 2, unit: '日', initial: 2 },
  ],
  measure: { kind: 'number', label: '残った水の量', unit: 'mL', digits: 0 },
  simulate: (c) => waterLeft(String(c.lid ?? 'no'), Number(c.days ?? 2)),
  scene: evapScene,
  duration: 1600,
};

// ---- 結ろ ----

export function dewOn(cup: string): 'drops' | 'none' {
  return cup === 'ice' ? 'drops' : 'none';
}

function dewScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const ice = c.cup === 'ice';
  const k = result === null ? 0 : Math.min(1, p * 1.3);
  const drops = result === 'drops' ? Array.from({ length: Math.round(12 * k) }, (_, i) => circle(124 + (i % 2 ? 76 : 0) + ((i * 7) % 6), 70 + i * 8, 2.6, 'bubble')).join('') : '';
  return fig(
    320,
    200,
    `${ice ? '氷水' : '水道の水（気温と同じくらい）'}を入れたコップをおく`,
    rect(122, 70, 76, 100, ice ? 'cold-bath' : 'water'),
    ice ? [0, 1, 2].map((i) => rect(136 + i * 16, 80 + (i % 2) * 14, 14, 14, 'ice', 2)).join('') : '',
    path('M118 50L124 170H196L202 50', 'ln'),
    drops,
    text(250, 100, ice ? '氷水' : '水道の水', { anchor: 'start', cls: 'small' }),
    result !== null && p >= 1 ? text(160, 194, result === 'drops' ? 'コップの外側に水てきがついた' : '変化なし', { cls: result === 'drops' ? 'result-yes small' : 'result-no small' }) : '',
  );
}

export const dew: Experiment = {
  id: 'dew',
  field: 'earth',
  label: '空気(くうき)の中の水じょう気(き)',
  summary: '冷たい水を入れたコップの外側にできる水てきを調べよう',
  setup: 'かわいたコップに、氷水か、水道の水（気温と同じくらいの温度）を入れて、しばらく置きます。コップの外側のようすをくらべます。',
  variables: [{ key: 'cup', kind: 'choice', label: 'コップに入れるもの', options: [{ value: 'ice', label: '氷水' }, { value: 'tap', label: '水道の水' }], initial: 'ice' }],
  measure: {
    kind: 'category',
    label: 'コップの外側',
    options: [
      { value: 'drops', label: '水てきがつく' },
      { value: 'none', label: '変化なし' },
    ],
  },
  simulate: (c) => dewOn(String(c.cup ?? 'ice')),
  scene: dewScene,
  duration: 1400,
};

// ---- 天気の変わり方 ----

const CITIES = ['fukuoka', 'osaka', 'tokyo'];
const CITY_X: Record<string, number> = { fukuoka: 70, osaka: 160, tokyo: 240 };

/** 雨雲が 1 日目に福岡の上にあり、1 日に 1 都市ずつ東へ動く */
export function cityWeather(city: string, day: number): 'rain' | 'sunny' {
  return CITIES.indexOf(city) === day - 1 ? 'rain' : 'sunny';
}

function cloudsScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const day = Number(c.day ?? 1);
  const city = String(c.city ?? 'tokyo');
  const k = result === null ? 1 : Math.min(1, p);
  const cloudX = 70 + 90 * (day - 1 - (1 - k));
  return fig(
    320,
    200,
    `${day}日目の雲の写真と、${{ fukuoka: '福岡', osaka: '大阪', tokyo: '東京' }[city]}の天気`,
    rect(0, 0, 320, 200, 'sky-summer'),
    path('M40 150Q70 130 100 140Q150 120 200 126Q240 110 280 90L290 110Q250 130 210 146Q150 150 100 160Q70 170 40 166Z', 'land'),
    ...CITIES.map((x) => group(CITY_X[x], 140, circle(0, 0, 4, x === city ? 'heart' : 'ink'), text(0, 20, { fukuoka: '福岡', osaka: '大阪', tokyo: '東京' }[x] ?? '', { cls: 'tiny' }))),
    group(cloudX, 110, ellipse(-20, 0, 30, 16, 'cloud'), ellipse(16, -6, 30, 18, 'cloud')),
    text(160, 30, '西 ← → 東', { cls: 'tiny' }),
    text(20, 30, `${day}日目`, { anchor: 'start', cls: 'small' }),
    result !== null && p >= 1 ? text(300, 60, result === 'rain' ? '雨' : '晴れ', { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const clouds: Experiment = {
  id: 'clouds',
  field: 'earth',
  label: '天気(てんき)の変(か)わり方(かた)',
  summary: '3日間の雲の写真を見て、雲の動きと、各地の天気の変わり方を調べよう',
  setup: '気象衛星の雲の写真を、3日分ならべて見ます。雨をふらせる雲がどう動いたかと、福岡・大阪・東京の天気がどう変わったかを調べます。',
  variables: [
    { key: 'day', kind: 'range', label: '日にち', min: 1, max: 3, step: 1, unit: '日目', initial: 1 },
    { key: 'city', kind: 'choice', label: '調べる都市', options: [{ value: 'fukuoka', label: '福岡（西）' }, { value: 'osaka', label: '大阪' }, { value: 'tokyo', label: '東京（東）' }], initial: 'tokyo' },
  ],
  measure: {
    kind: 'category',
    label: 'その日の天気',
    options: [
      { value: 'rain', label: '雨' },
      { value: 'sunny', label: '晴れ' },
    ],
  },
  simulate: (c) => cityWeather(String(c.city ?? 'tokyo'), Number(c.day ?? 1)),
  scene: cloudsScene,
  duration: 1400,
};

export const weatherMissions: Mission[] = [
  {
    id: 'daytemp-peak',
    exp: 'daytemp',
    levels: grades(4),
    question: '晴れの日の気温(きおん)がいちばん高くなるのは、いつごろ？',
    choices: ['朝', '午後2時ごろ', '夕方'],
    answer: 1,
    target: 'time',
    start: { weather: 'sunny' },
    lock: ['weather'],
    need: { key: 'time', distinct: 5 },
    finding: '晴れの日は、朝から気温が上がり、午後2時ごろにいちばん高くなって、夕方にかけて下がる。太陽が地面をあたため、地面が空気をあたためるので、気温が高くなるのは正午より少しおそい。',
  },
  {
    id: 'daytemp-rain',
    exp: 'daytemp',
    levels: grades(4),
    question: '晴れの日と雨の日、1日の気温(きおん)の変わり方が大きいのは？',
    choices: ['晴れの日', '雨の日', '同じ'],
    answer: 0,
    target: 'weather',
    need: { key: 'weather', distinct: 2, fair: false },
    finding: '晴れの日は、1日の気温の変わり方が大きい。雨やくもりの日は、雲が日光をさえぎるので、気温の変わり方が小さい。',
    hint: '晴れの日と雨の日で、それぞれ朝と昼すぎの気温をはかってくらべよう',
  },
  {
    id: 'evap-open',
    exp: 'evaporation',
    levels: grades(4),
    question: 'ふたをしない入れ物の水は、日がたつとどうなる？',
    choices: ['へる', 'ふえる', '変わらない'],
    answer: 0,
    target: 'days',
    start: { lid: 'no' },
    lock: ['lid'],
    need: { key: 'days', distinct: 3 },
    finding: 'ふたをしない入れ物の水はへっていった。水は、ふっとうしなくても、水面から水じょう気になって空気中に出ていく（じょう発）。',
  },
  {
    id: 'evap-lid',
    exp: 'evaporation',
    levels: grades(4),
    question: 'ふたをした入れ物の水の量は？',
    choices: ['ほとんどへらず、ふたの内側に水てきがつく', 'ふたをしないときと同じようにへる', 'ふえる'],
    answer: 0,
    target: 'lid',
    start: { days: 6 },
    lock: ['days'],
    need: { key: 'lid', distinct: 2 },
    finding: 'ふたをすると、じょう発した水じょう気がふたで冷やされて水てきになり、また入れ物にもどるので、水はほとんどへらない。',
  },
  {
    id: 'dew-cold',
    exp: 'dew',
    levels: grades(4),
    question: '氷水を入れたコップの外側に水てきがつくのは、なぜ？',
    choices: ['空気中の水じょう気が冷やされて水になったから', 'コップの中の水がしみ出たから', '氷から水が飛んできたから'],
    answer: 0,
    target: 'cup',
    need: { key: 'cup', distinct: 2 },
    finding: '空気中には、目に見えない水じょう気がふくまれている。冷たいコップにふれた空気が冷やされると、水じょう気が水てきになる（結ろ）。水道の水を入れたコップには、水てきはつかなかった。',
  },
  {
    id: 'clouds-east',
    exp: 'clouds',
    levels: grades(5),
    question: '雨をふらせる雲は、およそどの向きに動いている？',
    choices: ['西から東', '東から西', '北から南', '動かない'],
    answer: 0,
    target: 'day',
    need: { key: 'day', distinct: 3, fair: false },
    finding: '日本の上空では、雲はおよそ西から東へ動く。そのため、天気もおよそ西から東へ変わっていく。',
    hint: '日にちと都市の両方を変えて、雨の場所がどう動くか調べよう',
  },
  {
    id: 'clouds-forecast',
    exp: 'clouds',
    levels: grades(5),
    question: '1日目に福岡が雨だった。東京が雨になるのはいつごろ？',
    choices: ['2日後（3日目）', '同じ日（1日目）', '前の日'],
    answer: 0,
    target: 'day',
    start: { city: 'tokyo' },
    lock: ['city'],
    need: { key: 'day', distinct: 3 },
    finding: '雲が1日に大阪くらいまで動くので、福岡の雨は、次の日に大阪、その次の日に東京にやってきた。西の天気を見ると、明日の天気が予想できる。',
  },
];
