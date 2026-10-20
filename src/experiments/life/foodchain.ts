import { grades } from '../../core/levels';
import { fig, line, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// 食べ物のつながり (6 年生・中学受験)。草 → ウサギ → キツネ の食べる・食べられる関係 (食物連鎖)。
// ある年にウサギが急にふえると、草はへり、キツネはふえる。すると今度はウサギがへり…と、
// ふえたりへったりをくり返しながら、もとのつり合いにもどっていく。

const BASE: Record<string, number> = { grass: 1000, rabbit: 100, fox: 10 };
const SIZE: Record<string, number> = { rabbit: 1, fox: 0.8, grass: 0.4 };

/** ウサギが急に 2 倍になった年から years 年後の数 */
export function population(creature: string, years: number): number {
  const w = (2 * Math.PI) / 8;
  const damp = Math.exp(-years / 5);
  // ウサギが先にふえ、キツネはおくれてふえ、草はウサギがふえたぶんだけへる
  const wave = creature === 'grass' ? -Math.sin(w * years) : creature === 'fox' ? Math.sin(w * years) : Math.cos(w * years);
  return Math.round(BASE[creature] * (1 + SIZE[creature] * wave * damp));
}

export function trendOf(creature: string, years: number): 'more' | 'less' | 'same' {
  const r = population(creature, years) / BASE[creature];
  return r > 1.08 ? 'more' : r < 0.92 ? 'less' : 'same';
}

function scene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const years = Number(c.years ?? 0);
  const look = String(c.look ?? 'rabbit');
  const k = result === null ? 0 : Math.min(1, p * 1.2);
  const bars = (['grass', 'rabbit', 'fox'] as const).map((name, i) => {
    const ratio = result === null ? 1 : 1 + (population(name, years) / BASE[name] - 1) * k;
    const h = 60 * ratio;
    const x = 70 + i * 70;
    return (
      rect(x, 170 - h, 40, h, `pop-${name}${name === look ? ' pop-hl' : ''}`, 4) +
      text(x + 20, 188, { grass: '草', rabbit: 'ウサギ', fox: 'キツネ' }[name], { cls: 'tiny' }) +
      text(x + 20, 164 - h, String(result === null ? BASE[name] : population(name, years)), { cls: 'tiny' })
    );
  });
  return fig(
    320,
    210,
    `ウサギが急にふえてから${years}年後の、草・ウサギ・キツネの数`,
    line(60, 110, 290, 110, 'ln thin dash'),
    text(292, 106, 'もとの数', { anchor: 'end', cls: 'tiny' }),
    ...bars,
    text(70, 30, `${years}年後`, { anchor: 'start', cls: 'small' }),
    text(70, 46, '草 → ウサギ → キツネ（左が右に食べられる）', { anchor: 'start', cls: 'tiny' }),
    result !== null && p >= 1 ? text(300, 56, { more: 'もとよりふえた', less: 'もとよりへった', same: 'もとと同じくらい' }[String(result)] ?? '', { anchor: 'end', cls: 'result-yes small' }) : '',
  );
}

export const foodchain: Experiment = {
  id: 'foodchain',
  field: 'life',
  label: '食(た)べ物(もの)のつながり',
  summary: 'ウサギが急にふえたあと、草・ウサギ・キツネの数がどう変わるか調べよう',
  setup: 'ある草原では、ウサギが草を食べ、キツネがウサギを食べています。ふだんは草1000・ウサギ100・キツネ10ぐらいでつり合っています。ある年、ウサギが急に2倍になりました。それから何年後に、それぞれの数が、もとの数とくらべてどうなっているかを調べます。（数は、しくみが分かるように単純にしたモデルです）',
  variables: [
    { key: 'years', kind: 'range', label: 'ウサギがふえてからの年数', min: 0, max: 16, step: 2, unit: '年', initial: 0 },
    { key: 'look', kind: 'choice', label: '調べる生き物', options: [{ value: 'grass', label: '草' }, { value: 'rabbit', label: 'ウサギ' }, { value: 'fox', label: 'キツネ' }], initial: 'rabbit' },
  ],
  measure: {
    kind: 'category',
    label: 'もとの数とくらべて',
    options: [
      { value: 'more', label: 'ふえている' },
      { value: 'less', label: 'へっている' },
      { value: 'same', label: 'もとと同じくらい' },
    ],
  },
  simulate: (c) => trendOf(String(c.look ?? 'rabbit'), Number(c.years ?? 0)),
  scene,
  duration: 1200,
};

export const foodchainMissions: Mission[] = [
  {
    id: 'food-after',
    exp: 'foodchain',
    levels: grades(6),
    exam: true,
    question: 'ウサギが急にふえると、2年後の草とキツネの数は？',
    choices: ['草はへり、キツネはふえる', '草もキツネもへる', '草はふえ、キツネはへる', 'どちらも変わらない'],
    answer: 0,
    target: 'look',
    start: { years: 2 },
    lock: ['years'],
    need: { key: 'look', distinct: 3 },
    finding: 'ウサギがふえると、ウサギに食べられる草はへり、ウサギを食べるキツネはえさがふえるのでふえる。',
  },
  {
    id: 'food-balance',
    exp: 'foodchain',
    levels: grades(6),
    exam: true,
    question: 'それから長い年月がたつと、ウサギの数はどうなる？',
    choices: ['ふえたりへったりしながら、もとのつり合いにもどる', 'ずっとふえ続ける', 'いなくなる'],
    answer: 0,
    target: 'years',
    start: { look: 'rabbit' },
    lock: ['look'],
    need: { key: 'years', distinct: 5 },
    finding: 'ウサギがふえすぎると、えさの草がへり、天てきのキツネがふえるので、ウサギはへる。するとキツネはへり、草はふえて…と、ふえたりへったりしながら、もとのつり合いにもどっていく。',
    conclusions: [
      { text: 'このモデルでは、数はふえたりへったりをくり返しながら、もとの数に近づいた', ok: true, why: '年数を変えて調べた結果どおり。' },
      { text: 'ウサギは一度ふえると、もうへらない', ok: false, why: '4年後にはもとよりへっていた。' },
      { text: '実際の自然でも、どんな場合でもかならずもとにもどる', ok: false, why: '調べたのは単純なモデル。人の開発や外来種などで、もどらないこともある。' },
    ],
  },
];
