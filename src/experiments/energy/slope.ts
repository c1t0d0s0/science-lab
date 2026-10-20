import { grades } from '../../core/levels';
import { circle, fig, group, line, polygon, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission, Option } from '../types';

// さかと ころがる もの (2 年生)。さかが たかいほど とおくまで ころがる。まるい ものは よく ころがる。

const HEIGHT: Record<string, number> = { low: 1, mid: 2, high: 3 };

interface Thing extends Option {
  /** どれだけ ころがりやすいか */
  roll: number;
  draw: () => string;
}

const THINGS: Thing[] = [
  { value: 'ball', label: 'ボール', roll: 1.2, draw: () => circle(0, -10, 10, 'apple') },
  { value: 'can', label: 'あきかん（よこに おく）', kana: 'あきかん', roll: 1, draw: () => circle(0, -10, 10, 'alu') + circle(0, -10, 4, 'ln thin') },
  { value: 'block', label: 'しかくい つみき', roll: 0.12, draw: () => rect(-10, -20, 20, 20, 'wood', 2) },
];

const thing = (v: unknown) => THINGS.find((t) => t.value === v) ?? THINGS[0];

export function rollDistance(height: string, object: string): number {
  return Math.round((HEIGHT[height] ?? 2) * 1.2 * thing(object).roll * 10) / 10;
}

const FLOOR = 160;
const SLOPE_END = 110;
const PX = 40;

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const h = (HEIGHT[String(c.height)] ?? 2) * 30;
  const t = thing(c.object);
  const d = typeof result === 'number' ? result : 0;
  // さかを ころがり おりてから、ゆかを すすむ
  let x = 20;
  let y = FLOOR - h;
  if (result !== null) {
    const k = Math.min(1, p);
    if (k < 0.3) {
      const s = k / 0.3;
      x = 20 + (SLOPE_END - 20) * s;
      y = FLOOR - h * (1 - s);
    } else {
      const s = (k - 0.3) / 0.7;
      x = SLOPE_END + d * PX * (1 - (1 - s) ** 2);
      y = FLOOR;
    }
  }
  const marks = [0, 1, 2, 3, 4, 5].map((m) => line(SLOPE_END + m * PX, FLOOR + 4, SLOPE_END + m * PX, FLOOR + 10, 'ln thin') + text(SLOPE_END + m * PX, FLOOR + 24, `${m}m`, { cls: 'tiny' })).join('');
  return fig(
    320,
    200,
    `たかさ${{ low: 'ひくい', mid: 'まんなか', high: 'たかい' }[String(c.height)]}の さかで ${t.kana ?? t.label}を ころがす`,
    polygon([[10, FLOOR - h], [SLOPE_END, FLOOR], [10, FLOOR]], 'wood'),
    rect(0, FLOOR, 320, 6, 'ground'),
    marks,
    group(x, y, t.draw()),
    result !== null && p >= 1 ? text(300, 40, `${d}m`, { anchor: 'end', cls: 'result-yes' }) : '',
  );
}

export const slope: Experiment = {
  id: 'slope',
  field: 'energy',
  label: 'さかと ころがる もの',
  summary: 'さかの たかさや、ころがす ものを かえて、ころがる きょりを しらべよう',
  setup: 'いたで さかを つくり、うえから ものを そっと はなします。さかの たかさや ものを かえて、ゆかを どこまで ころがったかを はかります。',
  kanaSetup: 'いたで さかを つくって、うえから ものを そっと はなすよ。どこまで ころがるか みてみよう。',
  variables: [
    {
      key: 'height',
      kind: 'choice',
      label: 'さかの たかさ',
      options: [
        { value: 'low', label: 'ひくい' },
        { value: 'mid', label: 'まんなか' },
        { value: 'high', label: 'たかい' },
      ],
      initial: 'low',
    },
    { key: 'object', kind: 'choice', label: 'ころがす もの', options: THINGS, initial: 'ball' },
  ],
  measure: { kind: 'number', label: 'ころがった きょり', unit: 'm', digits: 1 },
  simulate: (c) => rollDistance(String(c.height), String(c.object)),
  scene,
  duration: 1800,
};

export const slopeMissions: Mission[] = [
  {
    id: 'slope-height',
    exp: 'slope',
    levels: grades(2),
    question: 'さかを たかく すると、ボールが ころがる きょりは？',
    choices: ['ながく なる', 'みじかく なる', 'かわらない'],
    answer: 0,
    target: 'height',
    start: { object: 'ball' },
    lock: ['object'],
    need: { key: 'height', distinct: 3 },
    finding: 'さかが たかいほど、ボールは とおくまで ころがった。',
  },
  {
    id: 'slope-shape',
    exp: 'slope',
    levels: grades(2),
    question: 'まるい ものと しかくい もの、よく ころがるのは どっち？',
    choices: ['まるい もの', 'しかくい もの', 'おなじ'],
    answer: 0,
    target: 'object',
    start: { height: 'mid' },
    lock: ['height'],
    need: { key: 'object', distinct: 2, among: ['ball', 'block'] },
    finding: 'ボールや あきかんの ように まるい ものは よく ころがる。しかくい つみきは すこし すべって とまった。',
    hint: 'ボールと しかくい つみきを くらべよう',
  },
];
