import { grades } from '../../core/levels';
import { circle, fig, group, path, text } from '../../diagrams/svg';
import type { Experiment, Mission, Option } from '../types';

// 4 年生の生命。
// - arm: うでは関節で曲がる。曲げると内側の筋肉がちぢみ外側がゆるむ。のばすとその反対
// - seasons: 季節によって気温が変わり、生き物のようすも変わる

// ---- うでの曲がり方 ----

export function muscle(pose: string, side: string): 'contract' | 'relax' {
  const bend = pose === 'bend';
  return (side === 'inner') === bend ? 'contract' : 'relax';
}

function armScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const bend = c.pose === 'bend';
  const k = result === null ? 0 : Math.min(1, p * 1.4);
  const angle = bend ? 90 * k : 0; // ひじの曲がる角度
  const sx = 70;
  const sy = 70;
  const ex = 170;
  const ey = 90;
  const rad = (angle * Math.PI) / 180;
  const hx = ex + 100 * Math.cos(-rad);
  const hy = ey + 100 * Math.sin(-rad) + 0;
  const inner = muscle(c.pose as string, 'inner') === 'contract';
  const thick = (on: boolean) => (on && k > 0 ? 16 : 8);
  const sideHl = String(c.side ?? 'inner');
  return fig(
    320,
    210,
    `うでを${bend ? '曲げる' : 'のばす'}ときの${sideHl === 'inner' ? '内側' : '外側'}の筋肉`,
    // 骨
    path(`M${sx} ${sy}L${ex} ${ey}`, 'ln bone'),
    path(`M${ex} ${ey}L${hx.toFixed(1)} ${hy.toFixed(1)}`, 'ln bone'),
    circle(ex, ey, 7, 'joint'),
    circle(sx, sy, 9, 'joint'),
    // 筋肉 (上は内側の筋肉、下は外側の筋肉)
    path(`M${sx + 10} ${sy - 10}Q${(sx + ex) / 2} ${sy - 10 - thick(inner)} ${ex + 14 * Math.cos(-rad - 0.6)} ${ey + 14 * Math.sin(-rad - 0.6)}`, `muscle${sideHl === 'inner' ? ' muscle-hl' : ''}`),
    path(`M${sx + 6} ${sy + 12}Q${(sx + ex) / 2} ${sy + 22 + thick(!inner)} ${ex - 6} ${ey + 14}`, `muscle${sideHl === 'outer' ? ' muscle-hl' : ''}`),
    text(120, 40, '内側の筋肉', { cls: 'tiny' }),
    text(120, 150, '外側の筋肉', { cls: 'tiny' }),
    text(ex, ey + 30, '関節(ひじ)', { cls: 'tiny' }),
    group(hx, hy, circle(0, 0, 10, 'hand')),
    result !== null && p >= 1 ? text(300, 200, result === 'contract' ? 'ちぢんでかたくなる' : 'ゆるんでやわらかい', { anchor: 'end', cls: 'result-yes small' }) : '',
  );
}

export const arm: Experiment = {
  id: 'arm',
  field: 'life',
  label: 'うでの曲(ま)がり方(かた)',
  summary: 'うでを曲げたりのばしたりして、関節と筋肉のようすを調べよう',
  setup: 'もう一方の手で、うでの内側（力こぶのところ）と外側の筋肉をさわりながら、うでを曲げたりのばしたりします。筋肉がちぢんでかたくなるか、ゆるんでやわらかくなるかを調べます。',
  variables: [
    {
      key: 'pose',
      kind: 'choice',
      label: 'うでを',
      options: [
        { value: 'bend', label: '曲げる' },
        { value: 'extend', label: 'のばす' },
      ],
      initial: 'bend',
    },
    {
      key: 'side',
      kind: 'choice',
      label: 'さわる筋肉(きんにく)',
      options: [
        { value: 'inner', label: '内側（力こぶ）' },
        { value: 'outer', label: '外側' },
      ],
      initial: 'inner',
    },
  ],
  measure: {
    kind: 'category',
    label: '筋肉のようす',
    options: [
      { value: 'contract', label: 'ちぢんで、かたくなる' },
      { value: 'relax', label: 'ゆるんで、やわらかい' },
    ],
  },
  simulate: (c) => muscle(String(c.pose ?? 'bend'), String(c.side ?? 'inner')),
  scene: armScene,
  duration: 1200,
};

// ---- 季節と生き物 ----

interface Creature extends Option {
  states: Record<string, string>;
}

const CREATURES: Creature[] = [
  { value: 'sakura', label: 'サクラ', states: { spring: 'sakura-flower', summer: 'sakura-leaves', autumn: 'sakura-fall', winter: 'sakura-bud' } },
  { value: 'swallow', label: 'ツバメ', states: { spring: 'swallow-come', summer: 'swallow-chicks', autumn: 'swallow-leave', winter: 'swallow-none' } },
  { value: 'frog', label: 'カエル', states: { spring: 'frog-eggs', summer: 'frog-active', autumn: 'frog-slow', winter: 'frog-sleep' } },
];

export const SEASON_TEMP: Record<string, number> = { spring: 15, summer: 28, autumn: 18, winter: 5 };

export function seasonState(creature: string, season: string): string {
  return (CREATURES.find((x) => x.value === creature) ?? CREATURES[0]).states[season] ?? '';
}

const STATE_LABEL: Record<string, string> = {
  'sakura-flower': '花がさく',
  'sakura-leaves': '葉がしげる',
  'sakura-fall': '葉の色が変わって落ちる',
  'sakura-bud': '葉が落ち、えだに芽をつけている',
  'swallow-come': '南の国からやってきて、すを作る',
  'swallow-chicks': 'ひなを育てる',
  'swallow-leave': '南の国へわたっていく',
  'swallow-none': '見られない（南の国にいる）',
  'frog-eggs': 'たまごからおたまじゃくしがかえる',
  'frog-active': 'カエルになって、活発に動く',
  'frog-slow': '動きがにぶくなる',
  'frog-sleep': '土の中でじっとしている（冬みん）',
};

function seasonScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const season = String(c.season ?? 'spring');
  const temp = SEASON_TEMP[season];
  const r = result === null ? '' : String(result);
  const sky = { spring: 'sky-spring', summer: 'sky-summer', autumn: 'sky-autumn', winter: 'sky-winter' }[season] ?? 'sky-spring';
  let art = '';
  const creature = String(c.creature ?? 'sakura');
  if (creature === 'sakura') {
    const crown = r === 'sakura-flower' ? 'blossom' : r === 'sakura-leaves' ? 'leaf' : r === 'sakura-fall' ? 'autumn-leaf' : '';
    art = path('M160 190V110M160 130L130 100M160 120L190 90', 'ln bone') + (crown ? circle(160, 90, 46, crown) : '') + (r === 'sakura-fall' ? [0, 1, 2].map((i) => circle(110 + i * 40, 150 + (p * 30 + i * 10) % 30, 4, 'autumn-leaf')).join('') : '');
  } else if (creature === 'swallow') {
    const fly = r === 'swallow-none' ? '' : group(r === 'swallow-leave' ? 160 + p * 120 : r === 'swallow-come' ? 280 - p * 120 : 160, 80, path('M-18 0L0 -6L18 0L0 4Z', 'battery'), path('M0 4L-10 16M0 4L10 16', 'ln'));
    art = fly + (r === 'swallow-chicks' ? group(220, 130, path('M-20 0Q0 20 20 0Z', 'wood'), circle(-6, -2, 5, 'fill-mark'), circle(6, -2, 5, 'fill-mark')) : '') + (r === 'swallow-none' ? text(160, 100, '（日本では見られない）', { cls: 'small' }) : '');
  } else {
    const underground = r === 'frog-sleep';
    art =
      (r === 'frog-eggs' ? [0, 1, 2, 3].map((i) => circle(130 + i * 14, 168, 5, 'bubble')).join('') : '') +
      group(160, underground ? 186 : 150, circle(0, 0, 14, 'leaf'), circle(-7, -10, 4, 'box'), circle(7, -10, 4, 'box')) +
      (r === 'frog-active' && p > 0 ? path('M140 140q20 -30 40 0', 'ln thin dash') : '');
  }
  return fig(
    320,
    210,
    `${{ spring: '春', summer: '夏', autumn: '秋', winter: '冬' }[season]}の${CREATURES.find((x) => x.value === creature)?.label}`,
    `<rect x="0" y="0" width="320" height="170" class="${sky}"/>`,
    `<rect x="0" y="170" width="320" height="40" class="${creature === 'frog' ? 'pond' : 'ground'}"/>`,
    art,
    text(20, 30, `気温 ${temp}℃`, { anchor: 'start', cls: 'small' }),
    result !== null && p >= 1 ? text(300, 30, STATE_LABEL[r] ?? '', { anchor: 'end', cls: 'result-yes small' }) : '',
  );
}

export const seasons: Experiment = {
  id: 'seasons',
  field: 'life',
  label: '季節(きせつ)と生き物(いきもの)',
  summary: '春・夏・秋・冬で、気温と、サクラ・ツバメ・カエルのようすがどう変わるか調べよう',
  setup: '1年を通して、同じ場所で、気温と生き物のようすを観察して記録します。サクラ（植物）、ツバメ・カエル（動物）のようすを、季節ごとにくらべます。',
  variables: [
    {
      key: 'season',
      kind: 'choice',
      label: '季節(きせつ)',
      options: [
        { value: 'spring', label: '春' },
        { value: 'summer', label: '夏' },
        { value: 'autumn', label: '秋' },
        { value: 'winter', label: '冬' },
      ],
      initial: 'spring',
    },
    { key: 'creature', kind: 'choice', label: '観察する生き物', options: CREATURES, initial: 'sakura' },
  ],
  measure: { kind: 'category', label: '生き物のようす', options: Object.entries(STATE_LABEL).map(([value, label]) => ({ value, label })) },
  simulate: (c) => seasonState(String(c.creature ?? 'sakura'), String(c.season ?? 'spring')),
  scene: seasonScene,
  duration: 1400,
};

export const body4Missions: Mission[] = [
  {
    id: 'arm-bend',
    exp: 'arm',
    levels: grades(4),
    question: 'うでを曲げると、内側の筋肉(きんにく)（力こぶ）はどうなる？',
    choices: ['ちぢんでかたくなる', 'ゆるんでやわらかくなる', '変わらない'],
    answer: 0,
    target: 'pose',
    start: { side: 'inner' },
    lock: ['side'],
    need: { key: 'pose', distinct: 2 },
    finding: 'うでを曲げると内側の筋肉がちぢんでかたくなり、のばすとゆるむ。体は、骨と骨のつなぎ目の関節のところで曲がる。',
  },
  {
    id: 'arm-extend',
    exp: 'arm',
    levels: grades(4),
    question: 'うでをのばすとき、ちぢむのはどちらの筋肉(きんにく)？',
    choices: ['内側の筋肉', '外側の筋肉', '両方'],
    answer: 1,
    target: 'side',
    start: { pose: 'extend' },
    lock: ['pose'],
    need: { key: 'side', distinct: 2 },
    finding: 'うでをのばすときは外側の筋肉がちぢみ、内側の筋肉がゆるむ。内側と外側の筋肉が、交代でちぢんだりゆるんだりして、うでを動かしている。',
  },
  {
    id: 'season-frog',
    exp: 'seasons',
    levels: grades(4),
    question: '冬のカエルは、どうしている？',
    choices: ['土の中でじっとしている', '池で元気に泳いでいる', 'たまごをうんでいる'],
    answer: 0,
    target: 'season',
    start: { creature: 'frog' },
    lock: ['creature'],
    need: { key: 'season', distinct: 2, among: ['summer', 'winter'] },
    finding: '夏は活発に動くカエルも、気温が低い冬は、土の中でじっとして冬をこす（冬みん）。',
  },
  {
    id: 'season-swallow',
    exp: 'seasons',
    levels: grades(4),
    question: 'ツバメが日本で見られないのはいつ？',
    choices: ['冬', '夏', '春'],
    answer: 0,
    target: 'season',
    start: { creature: 'swallow' },
    lock: ['creature'],
    need: { key: 'season', distinct: 4 },
    finding: 'ツバメは春に南の国からやってきて、夏にひなを育て、秋に南の国へわたっていく。冬は日本では見られない。',
  },
  {
    id: 'season-temp',
    exp: 'seasons',
    levels: grades(4),
    question: '季節(きせつ)と生き物のようすには、どんな関係がある？',
    choices: ['気温が高い季節ほど、生き物の活動が活発', '気温とは関係がない', '気温が低いほど活発'],
    answer: 0,
    target: 'season',
    need: { key: 'season', distinct: 4 },
    finding: '気温が高い夏は、植物はよくしげり、動物は活発に動く。気温が低い冬は、植物は芽やたねで、動物は冬みんなどで冬をこす。',
    hint: 'サクラ・ツバメ・カエルのうち、いくつかの生き物で、4つの季節をくらべよう',
  },
];
