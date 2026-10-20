import { grades } from '../../core/levels';
import { circle, fig, group, path, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission, Option } from '../types';

// 水に うく もの・しずむ もの (1・2 年生むけ)。おもさではなく、ものの なかみや かたちで きまる。

interface Thing extends Option {
  floats: boolean;
  /** おもさ (g)。「おもいものは しずむ？」を たしかめるために 絵に かく */
  grams: number;
  draw: () => string;
}

const THINGS: Thing[] = [
  { value: 'block', label: '大(おお)きな木(き)のつみき', kana: 'おおきな つみき', floats: true, grams: 300, draw: () => rect(-34, -22, 68, 44, 'wood', 4) },
  { value: 'stone', label: '小(ちい)さな石(いし)', kana: 'ちいさな いし', floats: false, grams: 30, draw: () => path('M-14 6Q-16 -8 -2 -10Q14 -11 15 2Q14 11 0 11Q-12 12 -14 6Z', 'stone') },
  { value: 'coin', label: '1円玉(えんだま)', kana: '1えんだま', floats: false, grams: 1, draw: () => circle(0, 0, 10, 'alu') },
  { value: 'cap', label: 'ペットボトルのふた', kana: 'ペットボトルの ふた', floats: true, grams: 2, draw: () => rect(-12, -8, 24, 16, 'plastic', 3) },
  { value: 'apple', label: 'りんご', kana: 'りんご', floats: true, grams: 280, draw: () => circle(0, 2, 22, 'apple') + path('M0 -20q2 -8 8 -10', 'ln') },
  { value: 'spoon', label: '鉄(てつ)のスプーン', kana: 'てつの スプーン', floats: false, grams: 25, draw: () => path('M-30 -2H6Q16 -10 26 -4Q30 0 26 4Q16 10 6 2H-30Z', 'iron') },
  { value: 'foilball', label: 'まるめたアルミはく', kana: 'ぎゅっと まるめた アルミはく', floats: false, grams: 3, draw: () => circle(0, 0, 9, 'alu') },
  { value: 'foilboat', label: 'ふねの形(かたち)のアルミはく', kana: 'ふねの かたちの アルミはく', floats: true, grams: 3, draw: () => path('M-30 -10H30L22 8H-22Z', 'alu') },
];

const thing = (v: unknown) => THINGS.find((t) => t.value === v) ?? THINGS[0];

const SURFACE = 92;
const BOTTOM = 176;

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const t = thing(c.object);
  const start = 40;
  let y = start;
  if (result !== null) {
    // 上から水に入れて、うく物は水面で ゆれ、しずむ物は そこまで 下がる
    const end = result === 'float' ? SURFACE : BOTTOM - 14;
    const k = Math.min(1, p * 1.8);
    y = start + (end - start) * k * (2 - k);
    if (result === 'float' && p > 0.55) y += Math.sin((p - 0.55) * 18) * 3 * (1 - p);
  }
  return fig(
    320,
    210,
    `${t.kana}を 水に 入れる`,
    rect(60, 70, 200, 116, 'box', 6),
    rect(62, SURFACE, 196, BOTTOM + 8 - SURFACE, 'water'),
    path(`M62 ${SURFACE}H258`, 'ln thin water-line'),
    group(160, y, t.draw()),
    text(292, 30, t.grams >= 100 ? 'おもい' : 'かるい', { anchor: 'end', cls: t.grams >= 100 ? 'badge-heavy' : 'badge-light' }),
    result === null ? '' : text(160, 204, result === 'float' ? 'ういた！' : 'しずんだ', { cls: result === 'float' ? 'result-yes' : 'result-no' }),
  );
}

export const float: Experiment = {
  id: 'float',
  field: 'particle',
  label: 'うくもの・しずむもの',
  kana: 'うく もの・しずむ もの',
  summary: 'いろいろな物を水に入れて、うくか しずむか 調べよう',
  kanaSummary: 'いろいろな ものを みずに いれてみよう',
  setup: '水を入れた水そうに、物をそっと入れます。水にうくか、しずむかを調べます。',
  kanaSetup: 'みずを いれた すいそうに、ものを そっと いれるよ。うくか しずむか みてみよう。',
  variables: [{ key: 'object', kind: 'choice', label: '水(みず)に入(い)れる物(もの)', kana: 'みずに いれる もの', options: THINGS, initial: 'block' }],
  measure: {
    kind: 'category',
    label: '水(みず)に',
    kana: 'みずに',
    options: [
      { value: 'float', label: 'うく' },
      { value: 'sink', label: 'しずむ' },
    ],
  },
  simulate: (c) => (thing(c.object).floats ? 'float' : 'sink'),
  scene,
  duration: 1400,
};

export const floatMissions: Mission[] = [
  {
    id: 'float-heavy',
    exp: 'float',
    levels: grades(1, 2),
    question: 'おもい ものは、かならず みずに しずむ？',
    choices: ['おもい ものは しずむ', 'おもくても うく ものが ある'],
    answer: 1,
    target: 'object',
    need: { key: 'object', distinct: 4 },
    finding: 'おおきな つみきや りんごは おもいけれど ういた。1えんだまは かるいのに しずんだね。おもさだけでは きまらないよ。',
    hint: 'おもい ものと かるい ものを くらべてみよう',
  },
  {
    id: 'float-foil',
    exp: 'float',
    levels: grades(1, 2),
    question: 'おなじ アルミはく。まるめた ときと ふねの かたちの とき、どうなる？',
    choices: ['どちらも しずむ', 'どちらも うく', 'かたちで ちがう'],
    answer: 2,
    target: 'object',
    start: { object: 'foilball' },
    need: { key: 'object', distinct: 2, among: ['foilball', 'foilboat'] },
    finding: 'ぎゅっと まるめると しずむけど、ふねの かたちに すると うく。おなじ ものでも かたちで かわるんだ。',
    hint: 'まるめた アルミはくと、ふねの かたちの アルミはくを くらべよう',
  },
  {
    id: 'float-wood',
    exp: 'float',
    levels: grades(1, 2),
    question: 'きの つみきは、みずに うく？ しずむ？',
    choices: ['うく', 'しずむ'],
    answer: 0,
    target: 'object',
    need: { key: 'object', distinct: 3 },
    finding: 'きの つみきは うく。きで できた ものは、みずに うきやすいよ。',
  },
];
