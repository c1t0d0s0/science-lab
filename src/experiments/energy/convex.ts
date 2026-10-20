import { grades } from '../../core/levels';
import { arrow, ellipse, fig, line, path, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// 凸レンズの像 (6 年生・中学受験)。しょう点きょり 10cm のレンズ。
// - しょう点の 2 倍より遠い: 小さい さかさの像 / 2 倍: 同じ大きさ / しょう点と 2 倍の間: 大きい さかさの像
// - しょう点: 像ができない / しょう点より近い: スクリーンにうつらない (レンズをのぞくと大きく見える)

export const FOCAL = 10;

export type Image = 'small' | 'same' | 'big' | 'none' | 'virtual';

export function imageOf(distance: number): Image {
  if (distance > 2 * FOCAL) return 'small';
  if (distance === 2 * FOCAL) return 'same';
  if (distance > FOCAL) return 'big';
  if (distance === FOCAL) return 'none';
  return 'virtual';
}

/** スクリーンにうつる像のきょり (cm)。うつらなければ null */
export function imageDistance(distance: number): number | null {
  if (distance <= FOCAL) return null;
  return Math.round(((distance * FOCAL) / (distance - FOCAL)) * 10) / 10;
}

const PX = 3.4; // 1cm を何 px でかくか
const LX = 150; // レンズの位置
const AXIS = 100;

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const a = Number(c.distance ?? 30);
  const b = imageDistance(a);
  const objX = LX - a * PX;
  const h = 26;
  const k = result === null ? 0 : Math.min(1, p * 1.5);
  const parts: string[] = [
    line(10, AXIS, 314, AXIS, 'ln thin dash'),
    ellipse(LX, AXIS, 8, 50, 'glass'),
    line(LX - FOCAL * PX, AXIS - 4, LX - FOCAL * PX, AXIS + 4, 'ln'),
    line(LX + FOCAL * PX, AXIS - 4, LX + FOCAL * PX, AXIS + 4, 'ln'),
    text(LX - FOCAL * PX, AXIS + 18, 'F', { cls: 'tiny' }),
    text(LX + FOCAL * PX, AXIS + 18, 'F', { cls: 'tiny' }),
    // 物 (ろうそく)
    arrow(objX, AXIS, objX, AXIS - h, 'ln red'),
    text(objX, AXIS + 32, `${a}cm`, { cls: 'tiny' }),
  ];
  if (k > 0 && b !== null) {
    const imgX = LX + b * PX;
    const ih = (h * b) / a;
    const show = imgX < 314;
    // 光の道すじ: 光じくに平行な光はしょう点を通り、レンズの中心を通る光はまっすぐ進む
    parts.push(
      path(`M${objX} ${AXIS - h}H${LX}L${Math.min(imgX, 314)} ${AXIS + ih * Math.min(1, (314 - LX) / (imgX - LX))}`, 'ln thin sunbeam'),
      path(`M${objX} ${AXIS - h}L${Math.min(imgX, 314)} ${AXIS + ih * Math.min(1, (314 - LX) / (imgX - LX))}`, 'ln thin sunbeam'),
    );
    if (show && k >= 1) parts.push(line(imgX, AXIS - 40, imgX, AXIS + 46, 'ln thick screen-line'), arrow(imgX, AXIS, imgX, AXIS + ih, 'ln red'), text(imgX, AXIS - 46, `${b}cm`, { cls: 'tiny' }));
  }
  if (k >= 1 && b === null) parts.push(text(240, 60, a === FOCAL ? '像ができない' : 'うつらない', { cls: 'result-no' }));
  return fig(320, 160, `しょう点きょり10cmの凸レンズから${a}cmの位置に物を置く`, ...parts);
}

const LABEL: Record<Image, string> = {
  small: '実物より小さい、さかさの像',
  same: '実物と同じ大きさの、さかさの像',
  big: '実物より大きい、さかさの像',
  none: '像はできない',
  virtual: 'スクリーンにはうつらない（のぞくと大きく見える）',
};

export const convex: Experiment = {
  id: 'convex',
  field: 'energy',
  label: '凸(とつ)レンズの像(ぞう)',
  summary: '凸レンズと物のきょりを変えて、スクリーンにうつる像の位置・大きさ・向きを調べよう',
  setup: 'しょう点きょりが10cmの凸レンズの左に、火のついたろうそく（物）を置きます。右側でスクリーンを動かして、はっきりした像がうつる位置をさがし、像の大きさと向きを調べます。Fはしょう点です。',
  variables: [{ key: 'distance', kind: 'range', label: 'レンズから物までのきょり', min: 5, max: 40, step: 5, unit: 'cm', initial: 30 }],
  measure: { kind: 'category', label: 'スクリーンにうつる像', options: (Object.keys(LABEL) as Image[]).map((v) => ({ value: v, label: LABEL[v] })) },
  simulate: (c) => imageOf(Number(c.distance ?? 30)),
  scene,
  duration: 1200,
};

export const convexMissions: Mission[] = [
  {
    id: 'convex-double',
    exp: 'convex',
    levels: grades(6),
    exam: true,
    question: '物をしょう点きょりの2倍（20cm）の位置に置くと、スクリーンにうつる像は？',
    choices: ['実物と同じ大きさで、さかさ', '実物より大きく、正立', '実物より小さく、さかさ', 'うつらない'],
    answer: 0,
    target: 'distance',
    need: { key: 'distance', distinct: 3, among: [15, 20, 25, 30, 35, 40] },
    finding: '20cm（しょう点きょりの2倍）に置くと、反対側の20cmに、同じ大きさのさかさの像ができた。それより遠いと小さく、近いと大きくなる。',
  },
  {
    id: 'convex-far',
    exp: 'convex',
    levels: grades(6),
    exam: true,
    question: '物をレンズから遠ざけていくと、うつる像の大きさと位置はどうなる？',
    choices: ['小さくなり、レンズに近づく', '大きくなり、レンズから遠ざかる', '変わらない'],
    answer: 0,
    target: 'distance',
    need: { key: 'distance', distinct: 4, among: [15, 20, 25, 30, 35, 40] },
    finding: '物を遠ざけるほど、像は小さくなり、しょう点に近いところにできる。',
    conclusions: [
      { text: '調べたきょり（15〜40cm）では、遠ざけるほど像は小さく、レンズに近くなった', ok: true, why: '調べた範囲での変わり方をまとめている。' },
      { text: '物をどこに置いても、さかさの像がうつる', ok: false, why: 'しょう点より近いと、スクリーンにはうつらない。' },
      { text: '像の大きさは、物までのきょりに比例する', ok: false, why: 'きょりが大きいほど像は小さくなった。比例ではない。' },
    ],
  },
  {
    id: 'convex-inside',
    exp: 'convex',
    levels: grades(6),
    exam: true,
    question: '物をしょう点より内側（5cm）に置くと、どうなる？',
    choices: ['スクリーンにはうつらないが、レンズをのぞくと大きく見える', '小さいさかさの像がうつる', '大きいさかさの像がうつる'],
    answer: 0,
    target: 'distance',
    need: { key: 'distance', distinct: 2, among: [5, 10, 15] },
    finding: 'しょう点より内側に置くと、光が1点に集まらず、スクリーンに像はうつらない。レンズをのぞくと、実物より大きい正立の像が見える（虫めがねと同じ）。',
  },
];
