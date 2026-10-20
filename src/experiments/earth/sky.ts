import { grades } from '../../core/levels';
import { arrow, circle, fig, group, line, path, text } from '../../diagrams/svg';
import type { Experiment, Mission, Option } from '../types';

// 空の観察。
// - moonmove (4 年生): 月は、太陽と同じように東から南の空を通って西へ動く。形がちがっても動き方は同じ
// - stars4 (4 年生): 時間がたつと星座の位置は変わるが、星のならび方は変わらない。星には色や明るさのちがいがある
// - sunpath (6 年生・中学受験): 南中高度 ＝ 90° − 緯度 ＋ (夏至 +23.4° / 春分・秋分 0° / 冬至 −23.4°)
// - starsky (6 年生・中学受験): 北の空の星は、北極星を中心に、1 時間に 15°、1 か月に 30° 反時計回りに動く

// ---- 月の動き ----

/** 方位 (東 = 90°、南 = 180°、西 = 270°)。見えないときは null */
const MOON_AZ: Record<string, Record<string, number | null>> = {
  full: { '18': 90, '21': 135, '24': 180 },
  half: { '18': 180, '21': 225, '24': 270 },
};

const DIR: Record<number, string> = { 90: 'east', 135: 'southeast', 180: 'south', 225: 'southwest', 270: 'west' };
const DIR_LABEL: Record<string, string> = { east: '東', southeast: '南東', south: '南', southwest: '南西', west: '西' };

export function moonDirection(phase: string, time: string): string {
  const az = MOON_AZ[phase]?.[time];
  return az == null ? 'none' : DIR[az];
}

/** 南を向いて見た空 (左が東、右が西) の上での位置 */
function skyPoint(az: number, alt: number): [number, number] {
  const x = 30 + ((az - 90) / 180) * 260;
  const y = 170 - alt * 1.6;
  return [x, y];
}

function horizon(): string {
  return (
    path('M0 170H320V200H0Z', 'ground') +
    text(30, 190, '東', { cls: 'tiny on-dark' }) +
    text(160, 190, '南', { cls: 'tiny on-dark' }) +
    text(290, 190, '西', { cls: 'tiny on-dark' })
  );
}

function moonmoveScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const phase = String(c.phase ?? 'full');
  const time = String(c.time ?? '18');
  const az = MOON_AZ[phase][time] ?? 90;
  const alt = Math.sin(((az - 90) / 180) * Math.PI) * 55 + 4;
  const [x, y] = skyPoint(az, result === null ? 4 : alt);
  const moon = phase === 'full' ? circle(x, y, 12, 'moon-lit') : group(x, y, circle(0, 0, 12, 'moon-dark'), path('M0 -12A12 12 0 0 1 0 12Z', 'moon-lit'));
  const trail = path(`M${skyPoint(90, 4).join(' ')}Q160 0 ${skyPoint(270, 4).join(' ')}`, 'ln thin dash faint');
  return fig(
    320,
    200,
    `${phase === 'full' ? '満月' : '半月'}の${time}時の位置`,
    path('M0 0H320V170H0Z', 'night-sky'),
    trail,
    moon,
    horizon(),
    text(20, 24, `${time}時`, { anchor: 'start', cls: 'small on-dark' }),
    result !== null && p >= 1 ? text(300, 24, `${DIR_LABEL[String(result)] ?? ''}の空`, { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const moonmove: Experiment = {
  id: 'moonmove',
  field: 'earth',
  label: '月(つき)の動(うご)き',
  summary: '時こくを変えて、満月と半月が空のどこに見えるかを調べよう',
  setup: '同じ場所に立ち、建物などを目じるしにして、時こくごとに月の位置（方位と高さ）を記録します。満月の日と、半月（夕方に南の空に見える月）の日でくらべます。方位は方位磁針で調べます。',
  variables: [
    { key: 'phase', kind: 'choice', label: '月の形', options: [{ value: 'full', label: '満月' }, { value: 'half', label: '半月（右半分が光る）' }], initial: 'full' },
    { key: 'time', kind: 'choice', label: '時こく', options: ['18', '21', '24'].map((t) => ({ value: t, label: `${t}時` })), initial: '18' },
  ],
  measure: { kind: 'category', label: '月が見える方位', options: Object.entries(DIR_LABEL).map(([value, label]) => ({ value, label: `${label}の空` })) },
  simulate: (c) => moonDirection(String(c.phase ?? 'full'), String(c.time ?? '18')),
  scene: moonmoveScene,
  duration: 1000,
};

// ---- 星と星座 ----

interface Star extends Option {
  color: 'red' | 'bluewhite' | 'white';
}

const STARS: Star[] = [
  { value: 'betelgeuse', label: 'ベテルギウス（オリオン座）', color: 'red' },
  { value: 'rigel', label: 'リゲル（オリオン座）', color: 'bluewhite' },
  { value: 'sirius', label: 'シリウス（おおいぬ座）', color: 'white' },
];

const ORION_AZ: Record<string, number> = { '19': 100, '21': 135, '23': 175 };

export function starLook(time: string, look: string, star: string): string {
  if (look === 'shape') return 'same-shape';
  if (look === 'color') return `color-${(STARS.find((s) => s.value === star) ?? STARS[0]).color}`;
  return DIR[{ '19': 90, '21': 135, '23': 180 }[time] ?? 90];
}

/** オリオン座の星の形 (中心からの位置) */
const ORION: [number, number, string][] = [
  [-16, -24, 'star-red'],
  [16, -22, 'star-white'],
  [-6, 0, 'star-white'],
  [0, -2, 'star-white'],
  [6, -4, 'star-white'],
  [-14, 22, 'star-white'],
  [16, 24, 'star-blue'],
];

function stars4Scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const time = String(c.time ?? '19');
  const look = String(c.look ?? 'pos');
  const az = ORION_AZ[time];
  const alt = 20 + ((az - 90) / 90) * 30;
  const [x, y] = skyPoint(az, alt);
  // 東の空では星座がかたむいて見え、南に近づくと起き上がる (ならび方は同じ)
  const tilt = (180 - az) * 0.4;
  const stars = ORION.map(([dx, dy, cls]) => circle(dx, dy, cls === 'star-white' ? 2.4 : 3.4, look === 'color' && result !== null ? cls : 'star-white')).join('');
  const lines = path('M-16 -24L-6 0L6 -4L16 -22M-6 0L-14 22M6 -4L16 24', 'ln thin faint-star');
  return fig(
    320,
    200,
    `冬の${time}時のオリオン座`,
    path('M0 0H320V170H0Z', 'night-sky'),
    group(x, y, `<g transform="rotate(${tilt.toFixed(1)})">${lines}${stars}</g>`),
    look === 'color' ? text(x + 40, y - 20, '赤いベテルギウス', { anchor: 'start', cls: 'tiny on-dark' }) + text(x + 40, y + 30, '青白いリゲル', { anchor: 'start', cls: 'tiny on-dark' }) : '',
    horizon(),
    text(20, 24, `${time}時`, { anchor: 'start', cls: 'small on-dark' }),
    result !== null && p >= 1 ? text(300, 24, String(result).startsWith('color') ? { 'color-red': '赤っぽい', 'color-bluewhite': '青白い', 'color-white': '白い' }[String(result)] ?? '' : result === 'same-shape' ? 'ならび方は同じ' : `${DIR_LABEL[String(result)]}の空`, { anchor: 'end', cls: 'result-yes small' }) : '',
  );
}

export const stars4: Experiment = {
  id: 'stars4',
  field: 'earth',
  label: '星(ほし)と星座(せいざ)',
  summary: '時こくを変えてオリオン座を観察し、位置・ならび方・星の色を調べよう',
  setup: '冬の夜、東から南の空に見えるオリオン座を、時こくを変えて観察します。星座早見を使い、星座の位置と、星のならび方、星の色を記録します。',
  variables: [
    { key: 'time', kind: 'choice', label: '時こく', options: ['19', '21', '23'].map((t) => ({ value: t, label: `${t}時` })), initial: '19' },
    { key: 'look', kind: 'choice', label: '調べること', options: [{ value: 'pos', label: '星座の位置' }, { value: 'shape', label: '星のならび方' }, { value: 'color', label: '星の色' }], initial: 'pos' },
    { key: 'star', kind: 'choice', label: '色を調べる星', options: STARS, initial: 'betelgeuse' },
  ],
  measure: {
    kind: 'category',
    label: '観察の結果',
    options: [
      ...Object.entries(DIR_LABEL).map(([value, label]) => ({ value, label: `${label}の空にある` })),
      { value: 'same-shape', label: 'ならび方は変わらない' },
      { value: 'color-red', label: '赤っぽい' },
      { value: 'color-bluewhite', label: '青白い' },
      { value: 'color-white', label: '白い' },
    ],
  },
  simulate: (c) => starLook(String(c.time ?? '19'), String(c.look ?? 'pos'), String(c.star ?? 'betelgeuse')),
  scene: stars4Scene,
  duration: 900,
};

// ---- 季節と太陽の高さ ----

const DECL: Record<string, number> = { summer: 23.4, equinox: 0, winter: -23.4 };

export function noonAltitude(season: string, lat: number): number {
  return Math.round((90 - lat + (DECL[season] ?? 0)) * 10) / 10;
}

function sunpathScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const season = String(c.season ?? 'equinox');
  const lat = Number(c.lat ?? 35);
  const alt = noonAltitude(season, lat) * (result === null ? 0.3 : Math.min(1, p * 1.2));
  const r = 120;
  const rad = (alt * Math.PI) / 180;
  const cx = 160;
  const cy = 170;
  // 南の空を、真横から見た図。太陽は南中して、棒のかげは北にのびる
  const sx = cx + r * Math.cos(rad);
  const sy = cy - r * Math.sin(rad);
  const shadow = alt > 0 ? 40 / Math.tan(rad) : 0;
  return fig(
    320,
    210,
    `北緯${lat}度の${{ summer: '夏至', equinox: '春分・秋分', winter: '冬至' }[season]}の日の南中高度`,
    path(`M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}`, 'ln thin dash faint'),
    line(20, cy, 300, cy, 'ln'),
    line(cx, cy, cx, cy - 40, 'ln thick'),
    shadow > 0 ? line(cx, cy, cx - Math.min(shadow, 140), cy, 'shadow') : '',
    line(cx, cy, sx, sy, 'ln thin sunbeam'),
    circle(sx, sy, 12, 'sun'),
    path(`M${cx + 30} ${cy}A30 30 0 0 0 ${cx + 30 * Math.cos(rad)} ${cy - 30 * Math.sin(rad)}`, 'ln thin'),
    text(300, cy + 18, '南', { anchor: 'end', cls: 'tiny' }),
    text(20, cy + 18, '北', { anchor: 'start', cls: 'tiny' }),
    typeof result === 'number' && p >= 1 ? text(20, 30, `南中高度 ${result}°`, { anchor: 'start', cls: 'result-yes' }) : '',
  );
}

export const sunpath: Experiment = {
  id: 'sunpath',
  field: 'earth',
  label: '季節(きせつ)と太陽(たいよう)の高さ',
  summary: '季節と場所（緯度）を変えて、太陽の南中高度を調べよう',
  setup: '太陽が真南に来たとき（南中）の、地面からの角度を南中高度といいます。地面に立てた棒のかげの長さから求めます。季節（夏至・春分と秋分・冬至）と、観察する場所の緯度を変えてくらべます。',
  variables: [
    { key: 'season', kind: 'choice', label: '季節', options: [{ value: 'summer', label: '夏至（6月）' }, { value: 'equinox', label: '春分・秋分（3月・9月）' }, { value: 'winter', label: '冬至（12月）' }], initial: 'equinox' },
    { key: 'lat', kind: 'choice', label: '場所', options: [{ value: '26', label: '那覇（北緯26°）' }, { value: '35', label: '東京（北緯35°）' }, { value: '43', label: '札幌（北緯43°）' }], initial: '35' },
  ],
  measure: { kind: 'number', label: '南中高度', unit: '°', digits: 1 },
  simulate: (c) => noonAltitude(String(c.season ?? 'equinox'), Number(c.lat ?? 35)),
  scene: sunpathScene,
  duration: 1200,
};

// ---- 星の動き (日周運動・年周運動) ----

export function starAngle(mode: string, amount: number): number {
  return (mode === 'month' ? 30 : 15) * amount;
}

function starskyScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const amount = Number(c.amount ?? 2);
  const month = c.mode === 'month';
  const deg = typeof result === 'number' ? result * Math.min(1, p) : 0;
  const cx = 160;
  const cy = 100;
  const r = 60;
  const start = -150; // カシオペヤ座のはじめの位置 (北極星から見た角度)
  // 北の空を見ているので、反時計回りに動く (図では、角度をへらす向き)
  const a = ((start - deg) * Math.PI) / 180;
  const a0 = (start * Math.PI) / 180;
  const sx = cx + r * Math.cos(a);
  const sy = cy + r * Math.sin(a);
  return fig(
    320,
    210,
    `北の空の星の${month ? `${amount}か月後の同じ時こく` : `${amount}時間後`}の位置`,
    path('M0 0H320V180H0Z', 'night-sky'),
    circle(cx, cy, 4, 'star-white'),
    text(cx, cy + 18, '北極星', { cls: 'tiny on-dark' }),
    circle(cx + r * Math.cos(a0), cy + r * Math.sin(a0), 4, 'star-faint'),
    deg > 0 ? path(`M${(cx + r * Math.cos(a0)).toFixed(1)} ${(cy + r * Math.sin(a0)).toFixed(1)}A${r} ${r} 0 ${deg > 180 ? 1 : 0} 0 ${sx.toFixed(1)} ${sy.toFixed(1)}`, 'ln thin sunbeam') : '',
    circle(sx, sy, 5, 'star-red'),
    deg > 0 ? arrow(sx + 8 * Math.sin(a), sy - 8 * Math.cos(a), sx, sy, 'ln thin sunbeam') : '',
    path('M0 180H320V210H0Z', 'ground'),
    text(160, 200, '北', { cls: 'tiny on-dark' }),
    typeof result === 'number' && p >= 1 ? text(300, 24, `${result}°（反時計回り）`, { anchor: 'end', cls: 'result-yes small' }) : '',
  );
}

export const starsky: Experiment = {
  id: 'starsky',
  field: 'earth',
  label: '星(ほし)の動(うご)き',
  summary: '北の空の星が、時間や月日がたつとどれだけ動くか調べよう',
  setup: '北の空の星を、北極星を中心に観察します。同じ夜に時間をおって見る（日周運動）か、毎月同じ時こくに見る（年周運動）かを選び、星が北極星のまわりに何度動いたかを調べます。',
  variables: [
    { key: 'mode', kind: 'choice', label: '見方', options: [{ value: 'hour', label: '同じ夜に、時間をおって' }, { value: 'month', label: '毎月、同じ時こくに' }], initial: 'hour' },
    { key: 'amount', kind: 'range', label: 'たった時間（か月）', min: 1, max: 6, step: 1, unit: '', initial: 1 },
  ],
  measure: { kind: 'number', label: '動いた角度', unit: '°', digits: 0 },
  simulate: (c) => starAngle(String(c.mode ?? 'hour'), Number(c.amount ?? 1)),
  scene: starskyScene,
  duration: 1400,
};

export const skyMissions: Mission[] = [
  {
    id: 'moon-move',
    exp: 'moonmove',
    levels: grades(4),
    question: '満月は、時間がたつと、空をどのように動く？',
    choices: ['東から南の空を通って西へ', '西から南の空を通って東へ', '動かない'],
    answer: 0,
    target: 'time',
    start: { phase: 'full' },
    lock: ['phase'],
    need: { key: 'time', distinct: 3 },
    finding: '満月は、夕方に東の空からのぼり、夜中に南の空、明け方に西の空へと動く。太陽と同じように、東から南を通って西へ動く。',
  },
  {
    id: 'moon-half',
    exp: 'moonmove',
    levels: grades(4),
    question: '半月も、満月と同じように動く？',
    choices: ['形がちがっても、同じように東から西へ動く', '半月は西から東へ動く', '半月は動かない'],
    answer: 0,
    target: 'time',
    start: { phase: 'half' },
    lock: ['phase'],
    need: { key: 'time', distinct: 3 },
    finding: '半月も、時間がたつと南から西へ動いた。月は、形がちがっても、東から南を通って西へ動く。',
  },
  {
    id: 'stars-move',
    exp: 'stars4',
    levels: grades(4),
    question: '時間がたつと、星座(せいざ)の位置と、星のならび方は？',
    choices: ['位置は変わるが、ならび方は変わらない', '位置もならび方も変わる', '位置もならび方も変わらない'],
    answer: 0,
    target: 'time',
    start: { look: 'pos' },
    need: { key: 'time', distinct: 3, fair: false },
    finding: 'オリオン座は、時間がたつと東から南の空へ位置が変わったが、星のならび方は変わらなかった。',
    hint: '「星座の位置」と「星のならび方」の両方を、時こくを変えて調べよう',
  },
  {
    id: 'stars-color',
    exp: 'stars4',
    levels: grades(4),
    question: '星の色は、どれも同じ？',
    choices: ['星によって色がちがう', 'どの星も同じ色'],
    answer: 0,
    target: 'star',
    start: { look: 'color' },
    lock: ['look'],
    need: { key: 'star', distinct: 2 },
    finding: 'ベテルギウスは赤っぽく、リゲルは青白い。星には、色や明るさのちがいがある。',
  },
  {
    id: 'sun-summer',
    exp: 'sunpath',
    levels: grades(6),
    exam: true,
    question: '東京で、太陽の南中高度がいちばん高いのは？',
    choices: ['夏至', '春分・秋分', '冬至'],
    answer: 0,
    target: 'season',
    start: { lat: '35' },
    lock: ['lat'],
    need: { key: 'season', distinct: 3 },
    finding: '夏至の日の南中高度がいちばん高く（約78°）、冬至がいちばん低い（約32°）。南中高度が高い夏は、日光が地面に強く当たり、昼の長さも長い。',
  },
  {
    id: 'sun-lat',
    exp: 'sunpath',
    levels: grades(6),
    exam: true,
    question: '北の地方ほど、春分の日の南中高度は？',
    choices: ['低くなる', '高くなる', '同じ'],
    answer: 0,
    target: 'lat',
    start: { season: 'equinox' },
    lock: ['season'],
    need: { key: 'lat', distinct: 3 },
    finding: '春分・秋分の日の南中高度は 90°−緯度。北緯26°の那覇は64°、43°の札幌は47°。北（緯度が大きい）ほど低くなる。',
  },
  {
    id: 'sun-calc',
    exp: 'sunpath',
    levels: grades(6),
    exam: true,
    question: '東京（北緯35°）の夏至の日の南中高度は何度？',
    choices: ['78.4°', '55°', '31.6°', '90°'],
    answer: 0,
    target: 'season',
    start: { lat: '35' },
    lock: ['lat'],
    need: { key: 'season', distinct: 2, among: ['equinox', 'summer'] },
    finding: '夏至の日の南中高度は 90°−緯度＋23.4°。90−35＋23.4＝78.4°。冬至は 90−35−23.4＝31.6°。',
  },
  {
    id: 'star-hour',
    exp: 'starsky',
    levels: grades(6),
    exam: true,
    question: '北の空の星は、1時間に何度、どの向きに動く？',
    choices: ['反時計回りに15°', '時計回りに15°', '反時計回りに30°', '動かない'],
    answer: 0,
    target: 'amount',
    start: { mode: 'hour' },
    lock: ['mode'],
    need: { key: 'amount', distinct: 3 },
    finding: '北の空の星は、北極星を中心に、1時間に15°ずつ反時計回りに動いた（24時間で360°）。地球が1日に1回自転しているから。',
  },
  {
    id: 'star-month',
    exp: 'starsky',
    levels: grades(6),
    exam: true,
    question: '毎月同じ時こくに見ると、北の空の星は1か月に何度動く？',
    choices: ['30°', '15°', '1°', '動かない'],
    answer: 0,
    target: 'amount',
    start: { mode: 'month' },
    lock: ['mode'],
    need: { key: 'amount', distinct: 3 },
    finding: '同じ時こくに見ると、星は1か月に30°ずつ反時計回りに動いた（12か月で360°）。地球が1年に1回、太陽のまわりを公転しているから。',
    conclusions: [
      { text: '調べた範囲では、1か月ごとに30°ずつ同じ向きに動いた', ok: true, why: '月数と角度が比例していて、データと合っている。' },
      { text: '同じ時こくに見れば、星はいつも同じ位置にある', ok: false, why: '月がたつと、同じ時こくでも位置がずれていった。' },
      { text: '1か月に30°なので、1時間でも30°動く', ok: false, why: '1時間の動きは15°。日周運動と年周運動は別のもの。' },
    ],
  },
];
