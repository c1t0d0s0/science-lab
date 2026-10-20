import { grades } from '../../core/levels';
import { fig, group, line, path, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// ばね (6 年生・中学受験)。ばねののびは、つるしたおもりの重さに比例する。
// このばねは 20g で 2cm のびる。2 本を直列につなぐと のびは 2 倍、へい列につなぐと半分 (ばねの重さは考えない)。

const PER_G = 0.1; // 1g あたりののび (cm)

export function stretch(weightG: number, link: string): number {
  const k = link === 'series' ? 2 : link === 'parallel' ? 0.5 : 1;
  return Math.round(weightG * PER_G * k * 10) / 10;
}

const NATURAL = 50; // ばねの自然の長さ (図の px)
const PX_PER_CM = 6;

function coil(x: number, top: number, len: number): string {
  const turns = 8;
  let d = `M${x} ${top}`;
  for (let i = 0; i < turns; i++) {
    const y0 = top + (len * i) / turns;
    const y1 = top + (len * (i + 0.5)) / turns;
    const y2 = top + (len * (i + 1)) / turns;
    d += `L${x + 9} ${((y0 + y1) / 2).toFixed(1)}L${x - 9} ${((y1 + y2) / 2).toFixed(1)}L${x} ${y2.toFixed(1)}`;
  }
  return path(d, 'ln');
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const w = Number(c.weight ?? 40);
  const link = String(c.link ?? 'single');
  const s = typeof result === 'number' ? result * Math.min(1, p * 1.5) : 0;
  const ext = s * PX_PER_CM;
  const top = 20;
  let springs = '';
  let bottom = 0;
  if (link === 'series') {
    const each = NATURAL + ext / 2;
    springs = coil(160, top, each) + rect(152, top + each, 16, 4, 'iron', 1) + coil(160, top + each + 4, each);
    bottom = top + each * 2 + 4;
  } else if (link === 'parallel') {
    const len = NATURAL + ext;
    springs = coil(140, top, len) + coil(180, top, len) + rect(130, top + len, 60, 5, 'iron', 2);
    bottom = top + len + 5;
  } else {
    springs = coil(160, top, NATURAL + ext);
    bottom = top + NATURAL + ext;
  }
  const ruler = Array.from({ length: 11 }, (_, i) => line(250, top + NATURAL + i * PX_PER_CM * 2, i % 5 === 0 ? 262 : 257, top + NATURAL + i * PX_PER_CM * 2, 'ln thin') + (i % 5 === 0 ? text(268, top + NATURAL + i * PX_PER_CM * 2 + 4, `${i * 2}`, { anchor: 'start', cls: 'tiny' }) : '')).join('');
  return fig(
    320,
    220,
    `${{ single: 'ばね1本', series: 'ばね2本を直列', parallel: 'ばね2本をへい列' }[link] ?? ''}に${w}gをつるす`,
    rect(100, 10, 120, 10, 'wood', 2),
    springs,
    w > 0 ? group(160, bottom, line(0, 0, 0, 6, 'ln'), rect(-16, 6, 32, 18 + w / 10, 'iron', 3), text(0, 22, `${w}g`, { cls: 'tiny on-dark' })) : '',
    line(250, top + NATURAL, 250, top + NATURAL + 120, 'ln thin'),
    ruler,
    text(268, top + NATURAL - 6, 'のび(cm)', { anchor: 'start', cls: 'tiny' }),
    line(200, bottom, 250, bottom, 'ln thin dash'),
    typeof result === 'number' && p >= 1 ? text(20, 200, `のび ${result}cm`, { anchor: 'start', cls: 'result-yes' }) : '',
  );
}

export const spring: Experiment = {
  id: 'spring',
  field: 'energy',
  label: 'ばねののび',
  summary: 'おもりの重さや、ばねのつなぎ方を変えて、ばねののびを調べよう',
  setup: '同じばねを天井(てんじょう)からつるし、下におもりをつるします。おもりをつるしていないときからののび（cm）を、ものさしではかります。2本を直列（たてにつなぐ）やへい列（ならべてつなぐ）にすることもできます。ばねの重さは考えません。',
  variables: [
    { key: 'weight', kind: 'range', label: 'おもりの重さ', min: 0, max: 100, step: 20, unit: 'g', initial: 20 },
    {
      key: 'link',
      kind: 'choice',
      label: 'ばねのつなぎ方',
      options: [
        { value: 'single', label: '1本' },
        { value: 'series', label: '2本を直列' },
        { value: 'parallel', label: '2本をへい列' },
      ],
      initial: 'single',
    },
  ],
  measure: { kind: 'number', label: 'ばねののび', unit: 'cm', digits: 1 },
  simulate: (c) => stretch(Number(c.weight ?? 20), String(c.link ?? 'single')),
  scene,
  duration: 1000,
};

export const springMissions: Mission[] = [
  {
    id: 'spring-weight',
    exp: 'spring',
    levels: grades(6),
    exam: true,
    question: 'おもりの重さを2倍にすると、ばねののびは？',
    choices: ['2倍になる', '4倍になる', '変わらない', '半分になる'],
    answer: 0,
    target: 'weight',
    start: { link: 'single' },
    lock: ['link'],
    need: { key: 'weight', distinct: 4 },
    finding: 'ばねののびは、おもりの重さに比例する。重さが2倍、3倍になると、のびも2倍、3倍になる（このばねは20gで2cm）。',
    conclusions: [
      { text: '調べた範囲（0〜100g）では、のびは重さに比例していた', ok: true, why: 'グラフが0を通るまっすぐな線になっている。調べた範囲で言えることを言っている。' },
      { text: 'どんなに重いおもりをつるしても、のびは重さに比例する', ok: false, why: '重すぎるとばねがのびきってこわれる。調べた範囲より先は分からない。' },
      { text: 'ばねの長さは、おもりの重さに比例する', ok: false, why: '比例するのは「のび」。もとの長さを足した「ばねの長さ」は比例しない。' },
    ],
  },
  {
    id: 'spring-series',
    exp: 'spring',
    levels: grades(6),
    exam: true,
    question: '同じばね2本を直列(ちょくれつ)につなぐと、同じおもりでののびは、1本のときの何倍？',
    choices: ['2倍', '半分', '同じ'],
    answer: 0,
    target: 'link',
    start: { weight: 40 },
    lock: ['weight'],
    need: { key: 'link', distinct: 2, among: ['single', 'series'] },
    finding: '直列では、2本のばねのどちらにもおもりの重さ全部がかかるので、それぞれが1本のときと同じだけのび、全体ののびは2倍になる。',
  },
  {
    id: 'spring-parallel',
    exp: 'spring',
    levels: grades(6),
    exam: true,
    question: '同じばね2本をへい列(れつ)につなぐと、同じおもりでののびは、1本のときの何倍？',
    choices: ['2倍', '半分', '同じ'],
    answer: 1,
    target: 'link',
    start: { weight: 40 },
    lock: ['weight'],
    need: { key: 'link', distinct: 2, among: ['single', 'parallel'] },
    finding: 'へい列では、おもりの重さを2本で半分ずつ支えるので、のびは半分になる。',
  },
];
