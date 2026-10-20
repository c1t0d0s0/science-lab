import { grades } from '../../core/levels';
import { circle, ellipse, fig, group, line, path, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// 太陽とかげ (3 年生)。時こくによって、太陽の位置とかげの向き・長さが変わる。

// ---- 太陽と かげ ----

/** 時こくごとの、太陽の方位 (北から時計回りの角度) と高さ (10 月ごろ) */
const SUN: Record<string, { az: number; alt: number; dir: string }> = {
  '9': { az: 125, alt: 33, dir: 'west' },
  '12': { az: 180, alt: 50, dir: 'north' },
  '15': { az: 235, alt: 33, dir: 'east' },
};

function sunScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const sun = SUN[String(c.time)] ?? SUN['12'];
  const cx = 160;
  const cy = 110;
  const az = (sun.az * Math.PI) / 180;
  // 上が北、右が東の 地図の向きでかく
  const sx = cx + 88 * Math.sin(az);
  const sy = cy - 88 * Math.cos(az);
  const len = (34 / Math.tan((sun.alt * Math.PI) / 180)) * (result === null ? 0 : Math.min(1, p * 2));
  const tx = cx - len * Math.sin(az);
  const ty = cy + len * Math.cos(az);
  const compass = [
    text(cx, 18, '北', { cls: 'small' }),
    text(cx, 212, '南', { cls: 'small' }),
    text(40, cy + 5, '西', { cls: 'small' }),
    text(280, cy + 5, '東', { cls: 'small' }),
  ].join('');
  return fig(
    320,
    220,
    `${c.time}時の太陽とぼうのかげ`,
    ellipse(cx, cy, 104, 90, 'ground-soft'),
    compass,
    line(cx, 28, cx, 196, 'ln thin dash'),
    line(52, cy, 268, cy, 'ln thin dash'),
    result !== null ? path(`M${cx} ${cy}L${tx} ${ty}`, 'shadow') : '',
    circle(cx, cy, 5, 'wood'),
    group(sx, sy, circle(0, 0, 13, 'sun'), ...[0, 45, 90, 135, 180, 225, 270, 315].map((a) => line(17 * Math.cos((a * Math.PI) / 180), 17 * Math.sin((a * Math.PI) / 180), 22 * Math.cos((a * Math.PI) / 180), 22 * Math.sin((a * Math.PI) / 180), 'ln sun-ray'))),
    text(296, 210, `${c.time}時`, { anchor: 'end', cls: 'small' }),
  );
}

export const sunshadow: Experiment = {
  id: 'sunshadow',
  field: 'earth',
  label: '太陽(たいよう)とかげ',
  summary: '時こくによって、太陽の位置とぼうのかげがどう変わるか調べよう',
  setup: '校庭(こうてい)に立てたぼうと、そのかげを、真上(まうえ)から見た図です。上が北、右が東です。時こくを変えて、太陽の位置と、かげの向き・長さを調べます。',
  variables: [
    {
      key: 'time',
      kind: 'choice',
      label: '時(じ)こく',
      options: [
        { value: '9', label: '午前(ごぜん)9時(じ)' },
        { value: '12', label: '正午(しょうご)（12時(じ)）' },
        { value: '15', label: '午後(ごご)3時(じ)' },
      ],
      initial: '9',
    },
  ],
  measure: {
    kind: 'category',
    label: 'かげ',
    options: [
      { value: 'west-long', label: '西(にし)に長(なが)い' },
      { value: 'north-short', label: '北(きた)に短(みじか)い' },
      { value: 'east-long', label: '東(ひがし)に長(なが)い' },
    ],
  },
  simulate: (c) => {
    const sun = SUN[String(c.time)] ?? SUN['12'];
    return `${sun.dir}-${sun.alt > 40 ? 'short' : 'long'}`;
  },
  scene: sunScene,
  duration: 900,
};


export const sunshadowMissions: Mission[] = [
  {
    id: 'sun-direction',
    exp: 'sunshadow',
    levels: grades(3, 4),
    question: '午前(ごぜん)9時(じ)、太陽(たいよう)が東(ひがし)の空にあるとき、かげはどの方位(ほうい)にできる？',
    choices: ['東(ひがし)', '西(にし)', '南(みなみ)', '北(きた)'],
    answer: 1,
    target: 'time',
    need: { key: 'time', distinct: 3 },
    finding: 'かげは太陽と反対(はんたい)がわにできる。朝(あさ)は西、正午は北、午後(ごご)は東にできる。太陽が東から南、西へと動くので、かげは西から北、東へと動く。',
  },
  {
    id: 'sun-length',
    exp: 'sunshadow',
    levels: grades(3, 4),
    question: 'かげの長さがいちばん短(みじか)いのはいつ？',
    choices: ['午前(ごぜん)9時(じ)', '正午(しょうご)', '午後(ごご)3時(じ)', 'いつも同じ'],
    answer: 1,
    target: 'time',
    need: { key: 'time', distinct: 3 },
    finding: '正午ごろ、太陽が南の空でいちばん高くなるので、かげはいちばん短くなる。',
  },
];
