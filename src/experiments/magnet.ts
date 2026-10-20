import { grades } from '../core/levels';
import { circle, fig, group, line, path, rect, text } from '../diagrams/svg';
import type { Experiment, Mission, Option } from './types';

// 磁石(じしゃく)につくもの・つかないもの。鉄(てつ)だけが引きつけられる。
// 3・4 年生むけは、はなれていても引きつけること、間(あいだ)に物があっても引きつけることも調べる。

type Material = 'iron' | 'alu' | 'copper' | 'rubber' | 'paper' | 'glass' | 'wood';

interface Thing extends Option {
  material: Material;
  shape: 'clip' | 'nail' | 'can' | 'coin' | 'block' | 'sheet' | 'ball' | 'spoon';
}

const THINGS: Thing[] = [
  { value: 'clip', label: '鉄(てつ)のクリップ', kana: 'クリップ', material: 'iron', shape: 'clip' },
  { value: 'nail', label: '鉄(てつ)くぎ', kana: 'くぎ', material: 'iron', shape: 'nail' },
  { value: 'steelcan', label: 'スチールかん', kana: 'スチールかん', material: 'iron', shape: 'can' },
  { value: 'alcan', label: 'アルミかん', kana: 'アルミかん', material: 'alu', shape: 'can' },
  { value: 'coin10', label: '10円玉(えんだま)', kana: '10えんだま', material: 'copper', shape: 'coin' },
  { value: 'coin1', label: '1円玉(えんだま)', kana: '1えんだま', material: 'alu', shape: 'coin' },
  { value: 'eraser', label: '消(け)しゴム', kana: 'けしゴム', material: 'rubber', shape: 'block' },
  { value: 'paper', label: '紙(かみ)', kana: 'かみ', material: 'paper', shape: 'sheet' },
  { value: 'glass', label: 'ガラス玉(だま)', kana: 'ビーだま', material: 'glass', shape: 'ball' },
  { value: 'spoon', label: '木(き)のスプーン', kana: 'きの スプーン', material: 'wood', shape: 'spoon' },
];

const thing = (v: unknown) => THINGS.find((t) => t.value === v) ?? THINGS[0];

/** 磁石が鉄を引きつけられる、いちばん遠いきょり (cm) */
const REACH = 2;

function attracts(object: unknown, distance: number): boolean {
  return thing(object).material === 'iron' && distance <= REACH;
}

/** 物の絵。(0, 0) を物の上のはしのまん中にする */
function drawThing(t: Thing): string {
  const cls = t.material;
  switch (t.shape) {
    case 'clip':
      return path('M-14 4H12A5 5 0 0 1 12 18H-10A4 4 0 0 1 -10 9H8', `ln thick-wire ${cls}-line`);
    case 'nail':
      return rect(-22, 2, 6, 14, cls, 1) + path('M-16 7H18L24 9L18 11H-16Z', cls);
    case 'can':
      return rect(-14, 0, 28, 40, cls, 4) + line(-14, 8, 14, 8, 'ln thin') + line(-14, 32, 14, 32, 'ln thin');
    case 'coin':
      return circle(0, 13, 13, cls) + circle(0, 13, 8, `ln thin`);
    case 'block':
      return rect(-18, 0, 36, 16, cls, 3) + rect(-18, 0, 12, 16, 'fill-soft', 3);
    case 'sheet':
      return path('M-24 2L22 0L24 6L-22 8Z', cls);
    case 'ball':
      return circle(0, 12, 12, cls) + circle(-4, 8, 3, 'shine');
    default:
      return path('M-26 6Q-12 2 4 6Q14 0 22 6Q14 14 4 8Q-12 12 -26 8Z', cls);
  }
}

/** 棒磁石 (N は赤、S は青) */
function barMagnet(x: number, y: number): string {
  return rect(x - 50, y, 50, 22, 'pole-n', 3) + rect(x, y, 50, 22, 'pole-s', 3) + text(x - 25, y + 17, 'N', { cls: 'pole-text' }) + text(x + 25, y + 17, 'S', { cls: 'pole-text' });
}

const SCALE = 18; // 1cm を何 px でかくか

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const t = thing(c.object);
  const distance = Number(c.distance ?? 0);
  const sheet = c.between ?? 'none';
  const magnetBottom = 62;
  const rest = magnetBottom + 8 + distance * SCALE;
  const pulled = result === 'yes';
  // 引きつけられる物は、磁石のほうへ動く (はさんだ物があれば、その下で止まる)
  const stopAt = magnetBottom + (sheet === 'none' ? 0 : 5);
  const ease = Math.min(1, p * 1.6);
  const y = pulled ? rest - (rest - stopAt) * ease * ease : rest + (result === 'no' ? Math.sin(p * Math.PI * 4) * 1.5 * (1 - p) : 0);
  const sheetSvg =
    sheet === 'none'
      ? ''
      : rect(110, magnetBottom, 100, 5, sheet === 'paper' ? 'paperfill' : sheet === 'plastic' ? 'plastic' : 'wood', 1);
  const lines = pulled && p > 0.3 ? [-30, -10, 10, 30].map((dx) => path(`M${160 + dx} ${magnetBottom + 2}q${dx / 6} 10 0 20`, 'ln thin field')).join('') : '';
  return fig(
    320,
    200,
    `${t.label.replace(/\(.+?\)/g, '')}を磁石に近づける実験`,
    rect(20, 180, 280, 6, 'ground'),
    barMagnet(160, magnetBottom - 22),
    path('M160 18V40', 'ln thin'),
    rect(150, 6, 20, 12, 'box', 2),
    sheetSvg,
    lines,
    group(160, y, drawThing(t)),
    distance > 0 && !pulled ? text(282, magnetBottom + 8 + (distance * SCALE) / 2, `${distance}cm`, { anchor: 'end', cls: 'small' }) : '',
    distance > 0 && !pulled ? line(250, magnetBottom + 2, 250, rest + 2, 'ln thin dash') : '',
    result === null ? '' : text(160, 172, result === 'yes' ? 'ついた！' : 'つかない', { cls: result === 'yes' ? 'result-yes' : 'result-no' }),
  );
}

export const magnet: Experiment = {
  id: 'magnet',
  label: '磁石(じしゃく)につくもの',
  kana: 'じしゃくに つくもの',
  summary: 'いろいろな物を磁石に近づけて、つくもの・つかないものを調べよう',
  kanaSummary: 'いろいろな ものを じしゃくに ちかづけてみよう',
  variables: [
    { key: 'object', kind: 'choice', label: '近(ちか)づける物(もの)', kana: 'ちかづける もの', options: THINGS, initial: 'clip' },
    { key: 'distance', kind: 'range', label: '磁石(じしゃく)とのきょり', min: 0, max: 5, step: 1, unit: 'cm', initial: 0 },
    {
      key: 'between',
      kind: 'choice',
      label: '間(あいだ)にはさむ物(もの)',
      options: [
        { value: 'none', label: 'なし' },
        { value: 'paper', label: '紙(かみ)' },
        { value: 'plastic', label: '下(した)じき' },
        { value: 'wood', label: 'うすい板(いた)' },
      ],
      initial: 'none',
    },
  ],
  measure: {
    kind: 'category',
    label: '磁石(じしゃく)に',
    kana: 'じしゃくに',
    options: [
      { value: 'yes', label: 'つく（引(ひ)きつけられる）', kana: 'つく' },
      { value: 'no', label: 'つかない', kana: 'つかない' },
    ],
  },
  // 紙や下じきなど、磁石の力をさえぎらないものをはさんでも、うすければ引きつける
  simulate: (c) => (attracts(c.object, Number(c.distance ?? 0) + (c.between && c.between !== 'none' ? 0.1 : 0)) ? 'yes' : 'no'),
  scene,
  duration: 1100,
};

export const magnetMissions: Mission[] = [
  {
    id: 'magnet-sort',
    exp: 'magnet',
    levels: grades(1, 2),
    question: 'じしゃくに つくのは、どんな もの？',
    choices: ['ぴかぴかの ものは ぜんぶ つく', 'てつで できた ものが つく', 'かたい ものは ぜんぶ つく'],
    answer: 1,
    target: 'object',
    show: ['object'],
    need: { key: 'object', distinct: 5 },
    finding: 'じしゃくに つくのは、てつで できた もの。アルミかんや 10えんだまは、ぴかぴかでも つかないね。',
    hint: 'アルミかんや 10えんだまも ためしてみよう',
  },
  {
    id: 'magnet-coin',
    exp: 'magnet',
    levels: grades(1, 2),
    question: '10えんだまは じしゃくに つくかな？',
    choices: ['つく', 'つかない'],
    answer: 1,
    target: 'object',
    start: { object: 'coin10' },
    show: ['object'],
    need: { key: 'object', distinct: 3 },
    finding: '10えんだまは つかない。クリップや くぎは ついたね。おなじ きんぞくでも、つくものと つかないものが あるよ。',
  },
  {
    id: 'magnet-cans',
    exp: 'magnet',
    levels: grades(3, 4),
    question: 'アルミかんとスチールかん、磁石(じしゃく)につくのはどれ？',
    choices: ['アルミかん', 'スチールかん', '両方(りょうほう)とも', 'どちらもつかない'],
    answer: 1,
    target: 'object',
    start: { object: 'alcan' },
    show: ['object'],
    need: { key: 'object', distinct: 4 },
    finding: '磁石につくのはスチールかん（鉄(てつ)でできている）だけ。アルミや銅(どう)は金(きん)ぞくでも磁石につかない。',
    hint: '10円玉や1円玉ともくらべてみよう',
  },
  {
    id: 'magnet-distance',
    exp: 'magnet',
    levels: grades(3, 4),
    question: '磁石(じしゃく)と鉄(てつ)が、はなれていても引(ひ)きつけられる？',
    choices: ['少しでもはなれると引きつけない', '少しはなれていても引きつける', 'はなれるほど強く引きつける'],
    answer: 1,
    target: 'distance',
    start: { object: 'clip', distance: 3 },
    show: ['object', 'distance'],
    lock: ['object'],
    need: { key: 'distance', distinct: 4 },
    finding: '鉄は、磁石から少しはなれていても引きつけられる（この磁石では2cmまで）。はなれすぎると引きつけない。',
  },
  {
    id: 'magnet-between',
    exp: 'magnet',
    levels: grades(3, 4),
    question: '磁石(じしゃく)とクリップの間(あいだ)に紙(かみ)などをはさむと、どうなる？',
    choices: ['引(ひ)きつけなくなる', 'はさんでも引きつける', '紙(かみ)が磁石につく'],
    answer: 1,
    target: 'between',
    start: { object: 'clip' },
    show: ['object', 'between'],
    lock: ['object'],
    need: { key: 'between', distinct: 3 },
    finding: '紙や下じき、うすい板をはさんでも、磁石は鉄を引きつける。磁石の力は、間にある物を通りぬけてはたらく。',
  },
];
