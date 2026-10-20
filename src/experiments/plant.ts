import { grades } from '../core/levels';
import { circle, ellipse, fig, group, line, path, rect, text } from '../diagrams/svg';
import type { Experiment, Mission } from './types';

// インゲンマメの発芽と成長。
// 発芽に必要なのは 水・空気・適当な温度。日光や肥料は発芽には必要ない。
// よく成長するには、日光と肥料が必要 (日光がないと、ひょろ長く黄色っぽくなる)。

export type Growth = 'none' | 'pale' | 'small' | 'good';

export function grow(c: Record<string, number | string>): Growth {
  const germinates = c.water === 'yes' && c.air === 'yes' && c.temp === 'warm';
  if (!germinates) return 'none';
  if (c.light === 'no') return 'pale';
  return c.fert === 'yes' ? 'good' : 'small';
}

const yesNo = (key: string, label: string, yes: string, no: string, initial: 'yes' | 'no' = 'yes') => ({
  key,
  kind: 'choice' as const,
  label,
  options: [
    { value: 'yes', label: yes },
    { value: 'no', label: no },
  ],
  initial,
});

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const g = (result ?? 'seed') as Growth | 'seed';
  const k = result === null ? 0 : Math.min(1, p * 1.2);
  const cupTop = 130;
  const submerged = c.air === 'no';
  const height = { seed: 0, none: 0, pale: 92, small: 62, good: 96 }[g] * k;
  const leafCls = g === 'pale' ? 'leaf-pale' : 'leaf';
  const stem = height > 4 ? path(`M160 ${cupTop + 6}C${g === 'pale' ? 168 : 158} ${cupTop - height * 0.5} 162 ${cupTop - height * 0.8} 160 ${cupTop - height}`, `ln stem ${g === 'pale' ? 'stem-pale' : ''}`) : '';
  const leaves =
    height > 20
      ? group(160, cupTop - height, ellipse(-14, -2, 14, 7, leafCls), ellipse(14, -2, 14, 7, leafCls), g === 'good' && k > 0.6 ? ellipse(-18, 30, 16, 8, leafCls) + ellipse(18, 22, 16, 8, leafCls) : '')
      : '';
  const days = Math.round(10 * k);
  const dark = c.light === 'no';
  const cold = c.temp === 'cold';
  return fig(
    320,
    210,
    'インゲンマメの発芽と成長の実験',
    dark ? rect(70, 14, 180, 170, 'darkbox', 6) : circle(44, 34, 16, 'sun'),
    cold ? text(250, 30, '冷ぞう庫 5℃', { anchor: 'end', cls: 'small' }) : text(250, 30, '室内 25℃', { anchor: 'end', cls: 'small' }),
    path(`M110 ${cupTop}L118 ${cupTop + 50}H202L210 ${cupTop}`, 'box'),
    c.water === 'yes' ? rect(116, submerged ? cupTop - 30 : cupTop + 20, 88, submerged ? 76 : 26, 'water') : '',
    rect(116, cupTop + 6, 88, 16, c.fert === 'yes' ? 'soil-rich' : 'cotton', 3),
    stem,
    leaves,
    ellipse(160, submerged ? cupTop - 2 : cupTop + 4, 10, 6, 'seed'),
    g !== 'seed' && g !== 'none' && height > 4 ? line(150, cupTop + 6, 156, cupTop + 14, 'ln thin') : '',
    text(296, 200, `${days}日目`, { anchor: 'end', cls: 'small' }),
    result !== null && p >= 1
      ? text(160, 202, { none: '発芽しなかった', pale: '発芽した（ひょろ長く黄色っぽい）', small: '発芽して育った', good: 'よく育った' }[g as Growth], { cls: g === 'none' ? 'result-no' : 'result-yes' })
      : '',
  );
}

export const plant: Experiment = {
  id: 'plant',
  label: '発芽(はつが)と成長(せいちょう)',
  summary: '水・空気・温度・日光・肥料の条件を変えて、インゲンマメの発芽と成長を調べよう',
  setup: 'インゲンマメの種子を、だっし綿(めん)の上（肥料ありは土の上）に置いて、10日間ようすを見ます。水・空気・温度・日光・肥料の条件を変えて、発芽と成長をくらべます。',
  variables: [
    yesNo('water', '水(みず)', 'あたえる', 'あたえない'),
    yesNo('air', '空気(くうき)', 'ふれる', 'ふれない（水にしずめる）'),
    {
      key: 'temp',
      kind: 'choice',
      label: '温度(おんど)',
      options: [
        { value: 'warm', label: '室内(しつない)（25℃）' },
        { value: 'cold', label: '冷(れい)ぞう庫(こ)（5℃）' },
      ],
      initial: 'warm',
    },
    yesNo('light', '日光(にっこう)', '当てる', '当てない（箱(はこ)をかぶせる）'),
    yesNo('fert', '肥料(ひりょう)', 'あたえる', 'あたえない', 'no'),
  ],
  measure: {
    kind: 'category',
    label: '10日後(ご)のようす',
    options: [
      { value: 'none', label: '発芽(はつが)しない' },
      { value: 'pale', label: '発芽した（ひょろ長く黄色っぽい）' },
      { value: 'small', label: '発芽して育(そだ)った' },
      { value: 'good', label: 'よく育った' },
    ],
  },
  simulate: (c) => grow(c),
  scene,
  duration: 2200,
};

const germ = (id: string, key: string, label: string, needed: boolean, finding: string, extra: Partial<Mission> = {}): Mission => ({
  id,
  exp: 'plant',
  levels: grades(5),
  question: `種子(しゅし)の発芽(はつが)に、${label}は必要(ひつよう)？`,
  choices: ['必要', '必要ではない'],
  answer: needed ? 0 : 1,
  target: key,
  show: ['water', 'air', 'temp', 'light'],
  need: { key, distinct: 2 },
  finding,
  ...extra,
});

export const plantMissions: Mission[] = [
  germ('plant-water', 'water', '水(みず)', true, '水をあたえないと発芽しなかった。発芽には水が必要。', { hint: '水のほかの条件は、同じにしよう' }),
  germ('plant-air', 'air', '空気(くうき)', true, '水にしずめて空気にふれないようにすると発芽しなかった。発芽には空気が必要。'),
  germ('plant-temp', 'temp', '適当(てきとう)な温度(おんど)', true, '冷ぞう庫(5℃)では発芽しなかった。発芽には適当な温度が必要。', {
    hint: '冷ぞう庫の中は暗いので、室内のほうも箱をかぶせて日光を当てないと、条件がそろわないよ',
    start: { light: 'no' },
  }),
  germ('plant-light', 'light', '日光(にっこう)', false, '日光を当てなくても発芽した。発芽に日光は必要ではない（発芽に必要なのは、水・空気・適当な温度）。'),
  {
    id: 'plant-grow',
    exp: 'plant',
    levels: grades(5),
    question: '発芽(はつが)したあと、よく成長(せいちょう)するために必要(ひつよう)なのは？',
    choices: ['日光(にっこう)だけ', '肥料(ひりょう)だけ', '日光と肥料の両方(りょうほう)', 'どちらもいらない'],
    answer: 2,
    target: 'fert',
    show: ['light', 'fert'],
    start: { light: 'yes', fert: 'no' },
    need: { key: 'fert', distinct: 2, where: { light: 'yes' } },
    finding: '日光に当てて肥料をあたえたものが、いちばんよく育った。日光に当てないと、ひょろ長く黄色っぽくなった。よく成長するには、日光と肥料が必要。',
    hint: '日光だけを変える実験と、肥料だけを変える実験の両方をしよう',
  },
];
