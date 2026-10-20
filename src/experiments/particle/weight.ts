import { grades } from '../../core/levels';
import { circle, ellipse, fig, group, line, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission, Option } from '../types';

// 物と重さ (3 年生)。物は形を変えても重さは変わらない。同じ体積でも、物の種類によって重さがちがう。
// どの物も体積は 50cm³。

interface Material extends Option {
  grams: number;
  cls: string;
}

const MATERIALS: Material[] = [
  { value: 'clay', label: 'ねん土(ど)', grams: 100, cls: 'clay' },
  { value: 'wood', label: '木(き)', grams: 30, cls: 'wood' },
  { value: 'plastic', label: 'プラスチック', grams: 50, cls: 'plastic' },
  { value: 'alu', label: 'アルミニウム', grams: 135, cls: 'alu' },
  { value: 'iron', label: '鉄(てつ)', grams: 395, cls: 'iron' },
];

const material = (v: unknown) => MATERIALS.find((m) => m.value === v) ?? MATERIALS[0];

export const massOf = (m: string) => material(m).grams;

function shapeOf(shape: string, cls: string): string {
  switch (shape) {
    case 'flat':
      return ellipse(0, -6, 40, 6, cls);
    case 'long':
      return rect(-46, -10, 92, 10, cls, 5);
    case 'pieces':
      return [-30, -10, 10, 30].map((x, i) => circle(x, -8 - (i % 2) * 6, 8, cls)).join('');
    default:
      return circle(0, -20, 20, cls);
  }
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const m = material(c.material);
  const shape = String(c.shape ?? 'ball');
  const g = typeof result === 'number' ? Math.round(result * Math.min(1, p * 1.4)) : 0;
  return fig(
    320,
    200,
    `${m.label.replace(/\(.+?\)/g, '')}を${{ ball: 'まるめて', flat: '平たくして', long: '細長くして', pieces: '細かく分けて' }[shape] ?? ''}はかりにのせる`,
    // はかり
    rect(90, 120, 140, 50, 'box', 8),
    rect(80, 112, 160, 10, 'alu', 3),
    rect(130, 136, 60, 22, 'battery', 4),
    text(160, 152, result === null ? '0g' : `${g}g`, { cls: 'small on-dark' }),
    group(160, 112, shapeOf(shape, m.cls)),
    line(60, 170, 260, 170, 'ln thin'),
    typeof result === 'number' && p >= 1 ? text(160, 40, `${result}g`, { cls: 'result-yes' }) : '',
  );
}

export const weight: Experiment = {
  id: 'weight',
  field: 'particle',
  label: '物(もの)と重(おも)さ',
  summary: '形を変えたり、物の種類を変えたりして、重さをはかってくらべよう',
  setup: '体積（かさ）がどれも50cm³の、ねん土・木・プラスチック・アルミニウム・鉄を用意します。形を変えたり（まるめる・平たくする・細長くする・細かく分ける）、物の種類を変えたりして、はかりで重さをはかります。細かく分けたときは、全部をいっしょにのせます。',
  variables: [
    { key: 'material', kind: 'choice', label: '物(もの)の種類(しゅるい)', options: MATERIALS, initial: 'clay' },
    {
      key: 'shape',
      kind: 'choice',
      label: '形(かたち)',
      options: [
        { value: 'ball', label: 'まるめる' },
        { value: 'flat', label: '平(ひら)たくする' },
        { value: 'long', label: '細長(ほそなが)くする' },
        { value: 'pieces', label: '細かく分ける' },
      ],
      initial: 'ball',
    },
  ],
  measure: { kind: 'number', label: '重(おも)さ', unit: 'g', digits: 0 },
  simulate: (c) => massOf(String(c.material ?? 'clay')),
  scene,
  duration: 900,
};

export const weightMissions: Mission[] = [
  {
    id: 'weight-shape',
    exp: 'weight',
    levels: grades(3),
    question: 'ねん土(ど)の形(かたち)を変えると、重さはどうなる？',
    choices: ['変わらない', '平たくすると軽くなる', '細かく分けると重くなる'],
    answer: 0,
    target: 'shape',
    start: { material: 'clay' },
    lock: ['material'],
    need: { key: 'shape', distinct: 4 },
    finding: 'まるめても、平たくしても、細長くしても、細かく分けても、ねん土の重さは100gのまま。物は形を変えても重さは変わらない。',
  },
  {
    id: 'weight-material',
    exp: 'weight',
    levels: grades(3),
    question: '同じ体積(たいせき)の木・アルミニウム・鉄(てつ)で、いちばん重いのはどれ？',
    choices: ['木', 'アルミニウム', '鉄', 'どれも同じ'],
    answer: 2,
    target: 'material',
    start: { shape: 'ball' },
    lock: ['shape'],
    need: { key: 'material', distinct: 3, among: ['wood', 'alu', 'iron'] },
    finding: '同じ体積でも、木は30g、アルミニウムは135g、鉄は395g。物の種類によって重さがちがう。',
  },
];
