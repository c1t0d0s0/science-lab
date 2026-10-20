import { grades } from '../core/levels';
import type { Rng } from '../core/rng';
import { circle, fig, line, path, rect, text } from '../diagrams/svg';
import type { Experiment, Mission } from './types';
import { gauss } from './noise';

// ふりこ。1 往復する時間は、ふりこの長さだけで決まり、おもりの重さやふれはばには関係しない
// (ふれはばが小さいとき。T = 2π√(L/g))。
// 6 年生むけでは、ストップウォッチで 10 往復をはかるときのばらつきを入れる。

const G = 9.8;

/** 1 往復の時間 (秒)。長さは cm */
export function period(lengthCm: number): number {
  return 2 * Math.PI * Math.sqrt(lengthCm / 100 / G);
}

/** 10 往復の時間をはかって 10 でわった値 (小数第 2 位まで) */
export function measurePeriod(lengthCm: number, rng?: Rng): number {
  // ストップウォッチをおすタイミングのずれ (10 往復で ±0.2 秒くらい)
  const ten = period(lengthCm) * 10 + (rng ? gauss(rng) * 0.15 : 0);
  return Math.round(ten * 10) / 100;
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const L = Number(c.length ?? 50);
  const m = Number(c.mass ?? 20);
  const amp = Number(c.amp ?? 20);
  const px = 26 + L * 1.15;
  const ox = 160;
  const oy = 24;
  // アニメーションは 2 往復分。長いふりこほど、ゆっくりふれる (時間は 1.5 秒を 1 往復の目安にする)
  const swings = result === null ? 0 : 2;
  const theta = ((amp * Math.PI) / 180) * Math.cos(2 * Math.PI * swings * p);
  const bx = ox + px * Math.sin(theta);
  const by = oy + px * Math.cos(theta);
  const r = 6 + Math.sqrt(m) * 1.3;
  const a = (amp * Math.PI) / 180;
  const arcR = Math.min(px, 60);
  return fig(
    320,
    210,
    `長さ${L}cm、おもり${m}g、ふれはば${amp}度のふりこ`,
    rect(90, 14, 140, 10, 'wood', 2),
    path(`M${ox} ${oy}L${ox} ${oy + px + 10}`, 'ln thin dash'),
    path(`M${ox - arcR * Math.sin(a)} ${oy + arcR * Math.cos(a)}A${arcR} ${arcR} 0 0 0 ${ox + arcR * Math.sin(a)} ${oy + arcR * Math.cos(a)}`, 'ln thin'),
    line(ox, oy, ox - px * Math.sin(a), oy + px * Math.cos(a), 'ln thin dash faint'),
    line(ox, oy, bx, by, 'ln'),
    circle(bx, by, r, 'iron'),
    text(ox - 8, oy + arcR + 16, `${amp}°`, { anchor: 'end', cls: 'tiny' }),
    text(20, 200, `長さ ${L}cm`, { anchor: 'start', cls: 'small' }),
    text(300, 200, `${m}g`, { anchor: 'end', cls: 'small' }),
    typeof result === 'number' && p >= 1 ? text(300, 44, `1往復 ${result.toFixed(2)}秒`, { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const pendulum: Experiment = {
  id: 'pendulum',
  label: 'ふりこのきまり',
  summary: 'ふりこの長さ・おもりの重さ・ふれはばを変えて、1往復する時間を調べよう',
  variables: [
    { key: 'length', kind: 'range', label: 'ふりこの長(なが)さ', min: 20, max: 140, step: 10, unit: 'cm', initial: 50 },
    { key: 'mass', kind: 'range', label: 'おもりの重(おも)さ', min: 10, max: 50, step: 10, unit: 'g', initial: 20 },
    { key: 'amp', kind: 'range', label: 'ふれはば', min: 10, max: 30, step: 10, unit: '°', initial: 20 },
  ],
  measure: { kind: 'number', label: '1往復(おうふく)する時間(じかん)', unit: '秒', digits: 2 },
  simulate: (c, rng) => measurePeriod(Number(c.length ?? 50), rng),
  scene,
  duration: 2600,
};

export const pendulumMissions: Mission[] = [
  {
    id: 'pendulum-length',
    exp: 'pendulum',
    levels: grades(5),
    question: 'ふりこの長(なが)さを変えると、1往復(おうふく)する時間は？',
    choices: ['長いほど長くなる', '長いほど短くなる', '変わらない'],
    answer: 0,
    target: 'length',
    need: { key: 'length', distinct: 3 },
    finding: 'ふりこの長さが長いほど、1往復する時間は長くなる。おもりの重さやふれはばを同じにしてくらべると、はっきり分かる。',
  },
  {
    id: 'pendulum-mass',
    exp: 'pendulum',
    levels: grades(5),
    question: 'おもりの重(おも)さを変えると、1往復(おうふく)する時間は？',
    choices: ['重いほど長くなる', '重いほど短くなる', '変わらない'],
    answer: 2,
    target: 'mass',
    need: { key: 'mass', distinct: 3 },
    finding: 'おもりの重さを変えても、1往復する時間は変わらない。1往復の時間を決めるのは、ふりこの長さ。',
    hint: '長さとふれはばは そろえたまま、重さだけを変えよう',
  },
  {
    id: 'pendulum-amp',
    exp: 'pendulum',
    levels: grades(5),
    question: 'ふれはばを変えると、1往復(おうふく)する時間は？',
    choices: ['大きいほど長くなる', '大きいほど短くなる', '変わらない'],
    answer: 2,
    target: 'amp',
    need: { key: 'amp', distinct: 3 },
    finding: 'ふれはばを変えても、1往復する時間は変わらない（ふれはばが大きすぎないとき）。',
  },
  {
    id: 'pendulum-four',
    exp: 'pendulum',
    levels: grades(6),
    question: 'ふりこの長(なが)さを4倍(ばい)にすると、1往復(おうふく)する時間は何倍になる？',
    choices: ['2倍', '4倍', '16倍', '変わらない'],
    answer: 0,
    target: 'length',
    start: { length: 20 },
    noise: true,
    need: { key: 'length', distinct: 2, among: [20, 80], repeat: 3 },
    finding: '長さ20cmと80cmをくらべると、1往復の時間はおよそ2倍になる。長さを4倍にすると、時間は2倍になる。',
    hint: '20cmと、その4倍の80cmでくらべよう。それぞれ3回ずつはかって平均しよう',
    conclusions: [
      { text: '調べた長さでは、長さを4倍にすると1往復の時間はおよそ2倍になった', ok: true, why: '平均をくらべると、およそ2倍になっている。はかった範囲で言えることを言っている。' },
      { text: '長さを4倍にすると、時間もぴったり4倍になる', ok: false, why: '平均をくらべると、4倍ではなく、およそ2倍だった。' },
      { text: '1回目と2回目で時間がちがうので、ふりこにはきまりがない', ok: false, why: 'はかるたびの小さなちがいは、ストップウォッチをおすときのずれ。平均をくらべると、きまりが見えてくる。' },
    ],
  },
  {
    id: 'pendulum-repeat',
    exp: 'pendulum',
    levels: grades(6),
    question: '1回だけはかって、10gと50gで時間が少しちがった。「重さで1往復の時間が変わる」と言える？',
    choices: ['言える', '何回かはかって平均をくらべないと、言えない'],
    answer: 1,
    target: 'mass',
    start: { mass: 10 },
    noise: true,
    need: { key: 'mass', distinct: 2, among: [10, 50], repeat: 3 },
    finding: 'はかるたびに、時間は少しずつちがう。3回ずつはかって平均をくらべると、10gと50gで1往復の時間はほとんど同じだった。',
    hint: '10gと50gで、3回ずつはかろう',
    conclusions: [
      { text: '平均をくらべると、重さを変えても1往復の時間はほとんど変わらない', ok: true, why: '何回かはかった平均のちがいは、はかるたびのばらつきと同じくらい小さい。' },
      { text: '1回目の結果がちがったので、重いほうが時間が長い', ok: false, why: '1回だけの結果は、たまたまのずれかもしれない。平均でくらべよう。' },
      { text: 'どんなに重いおもりでも、ぜったいに時間は同じ', ok: false, why: '調べたのは10gと50gだけ。調べていない重さまで「ぜったい」とは言えない。' },
    ],
  },
];
