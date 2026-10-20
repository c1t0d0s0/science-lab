import { grades } from '../core/levels';
import { circle, fig, group, line, path, rect, text } from '../diagrams/svg';
import type { Experiment, Mission } from './types';

// 風(かぜ)とゴムの力で動く車。力が大きいほど、車は遠くまで進む。

const TRACK_X = 40;
const PX_PER_M = 44;
const TRACK_MAX = 6;

function car(x: number, y: number, sail: boolean): string {
  return group(
    x,
    y,
    rect(-22, -16, 44, 14, 'car', 3),
    circle(-13, 0, 6, 'wheel'),
    circle(13, 0, 6, 'wheel'),
    sail ? line(-8, -16, -8, -50, 'ln') + path('M-8 -50Q14 -36 -8 -20Z', 'sail') : '',
  );
}

function track(): string {
  const marks = Array.from({ length: TRACK_MAX + 1 }, (_, m) =>
    line(TRACK_X + m * PX_PER_M, 168, TRACK_X + m * PX_PER_M, 176, 'ln thin') + text(TRACK_X + m * PX_PER_M, 192, `${m}m`, { cls: 'tiny' }),
  ).join('');
  return rect(10, 160, 300, 8, 'ground') + marks;
}

/** 進んだきょりまで、だんだんおそくなりながら進む */
const travel = (d: number, p: number) => d * (1 - (1 - Math.min(1, p)) ** 2.4);

// ---- 風 ----

const WIND: Record<string, number> = { weak: 1.2, mid: 2.6, strong: 4.4 };

export function windDistance(strength: string, sail: string): number {
  return Math.round((WIND[strength] ?? WIND.mid) * (sail === 'none' ? 0.25 : 1) * 10) / 10;
}

function windScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const d = typeof result === 'number' ? result : 0;
  const x = TRACK_X + travel(d, p) * PX_PER_M;
  const strong = { weak: 1, mid: 2, strong: 3 }[String(c.strength)] ?? 2;
  const gust =
    result !== null && p < 0.8
      ? Array.from({ length: strong + 1 }, (_, i) => path(`M${4 + ((p * 120 + i * 18) % 40)} ${110 + i * 14}q10 -6 20 0t20 0`, 'ln thin wind')).join('')
      : '';
  return fig(
    320,
    200,
    `送風機で風を当てて車を動かす`,
    track(),
    group(14, 116, rect(-10, -24, 18, 48, 'box', 4), circle(-1, 0, 14, 'fan')),
    gust,
    car(Math.max(TRACK_X, x), 154, c.sail !== 'none'),
    result !== null && p >= 1 ? text(296, 30, `${d}m`, { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const wind: Experiment = {
  id: 'wind',
  label: '風(かぜ)で動(うご)く車(くるま)',
  kana: 'かぜで うごく くるま',
  summary: '風の強さや ほのあるなしを変えて、車の進むきょりを調べよう',
  kanaSummary: 'かぜを あてて、くるまを うごかそう',
  setup: '紙の ほをつけた車に、後(うし)ろから送風機(そうふうき)で風を当てます。風の強さや、ほの あるなしを変えて、車が進んだきょりをはかります。',
  kanaSetup: 'かみの ほを つけた くるまに、うしろから せんぷうきで かぜを あてるよ。くるまが どこまで すすむか みよう。',
  variables: [
    {
      key: 'strength',
      kind: 'choice',
      label: '風(かぜ)の強(つよ)さ',
      kana: 'かぜの つよさ',
      options: [
        { value: 'weak', label: '弱(よわ)い', kana: 'よわい' },
        { value: 'mid', label: '中(ちゅう)くらい', kana: 'ちゅうくらい' },
        { value: 'strong', label: '強(つよ)い', kana: 'つよい' },
      ],
      initial: 'weak',
    },
    {
      key: 'sail',
      kind: 'choice',
      label: 'ほ',
      options: [
        { value: 'sail', label: 'あり' },
        { value: 'none', label: 'なし' },
      ],
      initial: 'sail',
    },
  ],
  measure: { kind: 'number', label: '進(すす)んだきょり', kana: 'すすんだ きょり', unit: 'm', digits: 1 },
  simulate: (c) => windDistance(String(c.strength), String(c.sail)),
  scene: windScene,
  duration: 1800,
};

// ---- ゴム ----

export function rubberDistance(stretch: number, bands: number): number {
  return Math.round(Math.max(0, 0.3 * stretch - 0.6) * (bands >= 2 ? 1.6 : 1) * 10) / 10;
}

/** 真上から見た車 (前のはしのまん中にフックがある)。fx は前のはしの位置 */
function carTop(fx: number, cy: number): string {
  return group(
    fx,
    cy,
    rect(-46, -16, 42, 32, 'car', 5),
    rect(-42, -21, 10, 5, 'wheel', 1),
    rect(-18, -21, 10, 5, 'wheel', 1),
    rect(-42, 16, 10, 5, 'wheel', 1),
    rect(-18, 16, 10, 5, 'wheel', 1),
    // 前のフック
    path('M-4 0H2Q6 0 6 -4', 'ln'),
  );
}

const LANE = 96; // 車が走る線 (真上から見た図のたての位置)
const NAIL_X = 100; // 発しゃ台のくぎ (ここが 0m)
const TOP_PX = 34; // 1m を何 px でかくか

function rubberScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const d = typeof result === 'number' ? result : 0;
  const stretch = Number(c.stretch ?? 10);
  const bands = Number(c.bands ?? 1);
  const pulled = NAIL_X - stretch * 2.4; // ゴムをのばしたときの、車の前のはし
  // 手をはなすと、ゴムがもどって車をおし出し、そのあとは だんだんおそくなりながら進む
  const fx = result === null ? pulled : pulled + (NAIL_X + d * TOP_PX - pulled) * (1 - (1 - Math.min(1, p)) ** 2.4);
  const hook = Math.min(fx + 6, NAIL_X); // ゴムは、車がくぎをこえたら まっすぐにもどる
  const nails: [number, number][] = [[NAIL_X, LANE - 34], [NAIL_X, LANE + 34]];
  const band = Array.from({ length: bands }, (_, i) => {
    const o = (i - (bands - 1) / 2) * 4;
    return path(`M${nails[0][0]} ${nails[0][1] + o}L${hook} ${LANE + o}L${nails[1][0]} ${nails[1][1] + o}`, 'ln band');
  }).join('');
  const marks = Array.from({ length: 7 }, (_, m) =>
    line(NAIL_X + m * TOP_PX, 146, NAIL_X + m * TOP_PX, 154, 'ln thin') + text(NAIL_X + m * TOP_PX, 168, `${m}m`, { cls: 'tiny' }),
  ).join('');
  return fig(
    320,
    200,
    `真上から見た図。発しゃ台の2本のくぎに輪ゴムを${bands}本かけ、車の前のフックにひっかけて${stretch}cmのばす`,
    rect(4, LANE - 44, 312, 88, 'ground-soft', 6),
    line(NAIL_X, 150, 316, 150, 'ln thin'),
    marks,
    // 発しゃ台とくぎ
    ...nails.map(([x, y]) => rect(x - 9, y - 9, 18, 18, 'wood', 3)),
    ...nails.map(([x, y]) => circle(x, y, 4, 'iron')),
    carTop(fx, LANE),
    band,
    result === null
      ? line(pulled, LANE + 39, NAIL_X - 10, LANE + 39, 'ln thin') +
        line(pulled, LANE + 35, pulled, LANE + 43, 'ln thin') +
        text(pulled - 4, LANE + 43, `${stretch}cmのばす`, { anchor: 'end', cls: 'tiny' })
      : '',
    text(10, 192, '真上から見た図', { anchor: 'start', cls: 'tiny' }),
    text(NAIL_X + 14, LANE - 30, '発しゃ台のくぎ', { anchor: 'start', cls: 'tiny' }),
    result !== null && p >= 1 ? text(310, 30, `${d}m`, { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const rubber: Experiment = {
  id: 'rubber',
  label: 'ゴムで動(うご)く車(くるま)',
  summary: 'ゴムをのばす長さや本数を変えて、車の進むきょりを調べよう',
  setup: '発(はっ)しゃ台(だい)の2本のくぎの間に、輪(わ)ゴムをかけます。車の前のフックをゴムにひっかけ、車を後ろに引いてゴムをのばします。手をはなすと、ゴムがもとにもどろうとする力で、車が前に進みます。図は、真上(まうえ)から見たところです。',
  variables: [
    { key: 'stretch', kind: 'range', label: 'ゴムをのばす長(なが)さ', min: 5, max: 15, step: 5, unit: 'cm', initial: 5 },
    { key: 'bands', kind: 'range', label: 'ゴムの本数(ほんすう)', min: 1, max: 2, step: 1, unit: '本', initial: 1 },
  ],
  measure: { kind: 'number', label: '進(すす)んだきょり', unit: 'm', digits: 1 },
  simulate: (c) => rubberDistance(Number(c.stretch ?? 10), Number(c.bands ?? 1)),
  scene: rubberScene,
  duration: 1800,
};

export const motionMissions: Mission[] = [
  {
    id: 'wind-strength-low',
    exp: 'wind',
    levels: grades(1, 2),
    question: 'かぜを つよく すると、くるまは？',
    choices: ['とおくまで すすむ', 'ちかくで とまる', 'かわらない'],
    answer: 0,
    target: 'strength',
    show: ['strength'],
    need: { key: 'strength', distinct: 3 },
    finding: 'かぜが つよいほど、くるまは とおくまで すすむ。',
  },
  {
    id: 'wind-sail',
    exp: 'wind',
    levels: grades(1, 2),
    question: 'ほが ある くるまと ない くるま、よく すすむのは どっち？',
    choices: ['ほが ある くるま', 'ほが ない くるま', 'おなじ'],
    answer: 0,
    target: 'sail',
    need: { key: 'sail', distinct: 2 },
    finding: 'ほが あると、かぜを たくさん うけて よく すすむ。',
    hint: 'かぜの つよさは おなじに して、ほだけを かえてみよう',
  },
  {
    id: 'wind-strength',
    exp: 'wind',
    levels: grades(3, 4),
    question: '風(かぜ)が弱(よわ)いときと強(つよ)いときでくらべると、車(くるま)の進(すす)むきょりは？',
    choices: ['強いほうが遠くまで進む', '弱いほうが遠くまで進む', '変(か)わらない'],
    answer: 0,
    target: 'strength',
    start: { sail: 'sail' },
    need: { key: 'strength', distinct: 2 },
    finding: '風が強いほど、物を動かすはたらきは大きく、車は遠くまで進む。',
  },
  {
    id: 'rubber-stretch',
    exp: 'rubber',
    levels: grades(3, 4),
    question: 'ゴムを長(なが)くのばすほど、車(くるま)の進(すす)むきょりは？',
    choices: ['長くなる', '短(みじか)くなる', '変(か)わらない'],
    answer: 0,
    target: 'stretch',
    start: { bands: 1 },
    need: { key: 'stretch', distinct: 3 },
    finding: 'ゴムを長くのばすほど、ゴムがもとにもどろうとする力が大きくなり、車は遠くまで進む。',
  },
  {
    id: 'rubber-bands',
    exp: 'rubber',
    levels: grades(3, 4),
    question: 'ゴムをのばす長(なが)さは同じにして、ゴムを1本から2本にふやすと、車(くるま)の進(すす)むきょりは？',
    choices: ['長くなる', '短(みじか)くなる', '変(か)わらない'],
    answer: 0,
    target: 'bands',
    start: { stretch: 10 },
    need: { key: 'bands', distinct: 2 },
    finding: 'ゴムの本数をふやすと、もとにもどろうとする力が大きくなり、車は遠くまで進む。',
    hint: 'のばす長さは同じにして、本数だけを変えてくらべよう',
  },
];
