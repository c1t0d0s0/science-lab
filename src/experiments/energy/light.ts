import { grades } from '../../core/levels';
import { arrow, circle, fig, group, line, path, polygon, rect, text } from '../../diagrams/svg';
import type { Experiment, Mission } from '../types';

// 光と かげ。
// - shadow (1・2 年生): ライトの ばしょと たかさを かえて、かげの むきと ながさを みる
// - mirror (3・4 年生): かがみではね返した日光は まっすぐ進み、重ねるほど明るく・あたたかくなる

// ---- ライトと かげ ----

const HEIGHT_DEG: Record<string, number> = { low: 22, mid: 40, high: 65 };
const LENGTH_WORD = (len: number) => (len > 2 ? 'long' : len > 1 ? 'mid' : 'short');

function shadowOf(c: Record<string, number | string>): { dir: 'left' | 'right'; len: number } {
  const deg = HEIGHT_DEG[String(c.height)] ?? 40;
  return { dir: c.side === 'left' ? 'right' : 'left', len: 1 / Math.tan((deg * Math.PI) / 180) };
}

function shadowScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const { dir, len } = shadowOf(c);
  const deg = HEIGHT_DEG[String(c.height)] ?? 40;
  const rad = (deg * Math.PI) / 180;
  const groundY = 170;
  const cx = 160;
  const pole = 60; // ぼうの たかさ
  const sx = c.side === 'left' ? -1 : 1;
  // ライトは ぼうから ななめ上に おく
  const lx = cx + sx * 120 * Math.cos(rad);
  const ly = groundY - 120 * Math.sin(rad) - 10;
  const on = result !== null;
  const shown = on ? Math.min(1, p * 2) : 0;
  const tip = cx + (dir === 'right' ? 1 : -1) * pole * len * shown;
  return fig(
    320,
    200,
    `ライトを ${c.side === 'left' ? 'ひだり' : 'みぎ'}から あてる`,
    rect(10, groundY, 300, 8, 'ground'),
    on ? polygon([[lx, ly], [cx - 6, groundY - pole], [cx + 6, groundY - pole]], 'beam') : '',
    on ? path(`M${cx} ${groundY}L${tip} ${groundY}`, 'shadow') : '',
    rect(cx - 4, groundY - pole, 8, pole, 'wood', 2),
    circle(cx, groundY - pole - 8, 9, 'fill-mark'),
    group(lx, ly, circle(0, 0, 12, on ? 'lamp-on' : 'box'), line(0, 12, 0, groundY - ly, 'ln thin')),
    on ? text(160, 30, `かげは ${dir === 'right' ? 'みぎ' : 'ひだり'}に ${{ long: 'ながい', mid: 'ふつう', short: 'みじかい' }[LENGTH_WORD(len)]}`, { cls: 'result-yes' }) : '',
  );
}

export const shadow: Experiment = {
  id: 'shadow',
  field: 'energy',
  label: 'ライトと かげ',
  kana: 'ライトと かげ',
  summary: 'ライトのばしょをかえて、かげのでき方を見よう',
  kanaSummary: 'ライトの ばしょを かえると、かげは どう なるかな',
  setup: 'ゆかに立てたぼうに、ライトの光を当てます。ライトの ばしょ（ひだり・みぎ）と たかさを変えて、ゆかにできる かげを見ます。',
  kanaSetup: 'ゆかに たてた ぼうに、ライトを あてるよ。ライトの ばしょと たかさを かえて、かげを みよう。',
  variables: [
    {
      key: 'side',
      kind: 'choice',
      label: 'ライトの ばしょ',
      options: [
        { value: 'left', label: 'ひだり' },
        { value: 'right', label: 'みぎ' },
      ],
      initial: 'left',
    },
    {
      key: 'height',
      kind: 'choice',
      label: 'ライトの たかさ',
      options: [
        { value: 'low', label: 'ひくい' },
        { value: 'mid', label: 'まんなか' },
        { value: 'high', label: 'たかい' },
      ],
      initial: 'mid',
    },
  ],
  measure: {
    kind: 'category',
    label: 'かげ',
    options: [
      { value: 'left-long', label: 'ひだりに ながい' },
      { value: 'left-mid', label: 'ひだりに ふつう' },
      { value: 'left-short', label: 'ひだりに みじかい' },
      { value: 'right-long', label: 'みぎに ながい' },
      { value: 'right-mid', label: 'みぎに ふつう' },
      { value: 'right-short', label: 'みぎに みじかい' },
    ],
  },
  simulate: (c) => {
    const s = shadowOf(c);
    return `${s.dir}-${LENGTH_WORD(s.len)}`;
  },
  scene: shadowScene,
  duration: 900,
};

// ---- かがみと日光 ----

/** かがみの数ごとの、日光を当てたところの 3 分後の温度 (℃) */
export function mirrorTemp(mirrors: number): number {
  return 16 + 6 * mirrors;
}

function mirrorScene(c: Record<string, number | string>, result: number | string | null, p: number): string {
  const n = Number(c.mirrors ?? 1);
  const aim = String(c.aim ?? 'middle');
  const wallX = 270;
  const targetY = { up: 50, middle: 100, down: 150 }[aim] ?? 100;
  const on = result !== null;
  const reach = on ? Math.min(1, p * 2.2) : 0;
  const mirrors = Array.from({ length: n }, (_, i) => {
    const y = 80 + (i - (n - 1) / 2) * 34;
    const mx = 70;
    const ex = mx + (wallX - mx) * reach;
    const ey = y + 10 + (targetY - y - 10) * reach;
    return (
      rect(mx - 22, y, 10, 22, 'mirror', 2) +
      line(mx - 14, y + 10, mx - 30, y + 10, 'ln thin') +
      (on ? line(mx - 10, y + 10, ex, ey, 'ln sunbeam') : '')
    );
  }).join('');
  const glow = on && reach >= 1 ? circle(wallX - 4, targetY, 10 + n * 5, `spot spot-${Math.min(n, 3)}`) : '';
  return fig(
    320,
    200,
    `かがみ${n}まいで日光をかべに当てる`,
    circle(26, 22, 12, 'sun'),
    arrow(40, 30, 54, 50, 'ln sunbeam'),
    rect(wallX, 20, 22, 170, 'wall'),
    glow,
    mirrors,
    on && reach >= 1 ? text(wallX - 12, 196, `${result}℃`, { anchor: 'end', cls: 'result-yes' }) : '',
    n === 0 ? text(150, 110, 'かがみなし', { cls: 'small' }) : '',
  );
}

export const mirror: Experiment = {
  id: 'mirror',
  field: 'energy',
  label: 'かがみと日光(にっこう)',
  summary: 'かがみではね返した日光の進み方と、重ねたときの明るさ・あたたかさを調べよう',
  setup: '日なたで、かがみに日光を当て、はね返(かえ)した光を、日かげのかべの同じところに当てます。3分後に、光を当てたところの温度をはかります。',
  variables: [
    { key: 'mirrors', kind: 'range', label: 'かがみの数(かず)', min: 0, max: 3, step: 1, unit: 'まい', initial: 1 },
    {
      key: 'aim',
      kind: 'choice',
      label: 'かがみの向(む)き',
      options: [
        { value: 'up', label: '上(うえ)向き' },
        { value: 'middle', label: 'まっすぐ' },
        { value: 'down', label: '下(した)向き' },
      ],
      initial: 'middle',
    },
  ],
  measure: { kind: 'number', label: '当(あ)てたところの温度(おんど)（3分後(ぷんご)）', unit: '℃', digits: 0 },
  simulate: (c) => mirrorTemp(Number(c.mirrors ?? 1)),
  scene: mirrorScene,
  duration: 1000,
};

export const lightMissions: Mission[] = [
  {
    id: 'shadow-side',
    exp: 'shadow',
    levels: grades(1),
    question: 'ライトを ひだりから あてると、かげは どっちに できる？',
    choices: ['ひだり', 'みぎ', 'かげは できない'],
    answer: 1,
    target: 'side',
    need: { key: 'side', distinct: 2 },
    finding: 'かげは ライトと はんたいの ほうに できる。ひだりから あてると みぎに、みぎから あてると ひだりに できたね。',
  },
  {
    id: 'shadow-height',
    exp: 'shadow',
    levels: grades(2),
    question: 'ライトを たかく すると、かげの ながさは？',
    choices: ['ながく なる', 'みじかく なる', 'かわらない'],
    answer: 1,
    target: 'height',
    need: { key: 'height', distinct: 3 },
    finding: 'ライトが たかいほど かげは みじかく、ひくいほど ながく なる。おひるの かげが みじかいのと おなじだよ。',
    hint: 'ひくい・まんなか・たかい を ぜんぶ ためそう',
  },
  {
    id: 'mirror-straight',
    exp: 'mirror',
    levels: grades(3),
    question: 'かがみではね返(かえ)した日光(にっこう)は、どのように進(すす)む？',
    choices: ['まっすぐ進む', '曲(ま)がりながら進む', 'ちらばって見えなくなる'],
    answer: 0,
    target: 'aim',
    show: ['aim'],
    start: { mirrors: 1 },
    need: { key: 'aim', distinct: 3 },
    finding: 'はね返した日光はまっすぐ進む。かがみの向きを変えると、光の進む向きが変わり、当たる場所が動く。',
  },
  {
    id: 'mirror-count',
    exp: 'mirror',
    levels: grades(3),
    question: 'はね返(かえ)した日光(にっこう)を重(かさ)ねると、当(あ)てたところの温度(おんど)は？',
    choices: ['かがみが多(おお)いほど高くなる', 'かがみが多いほど低(ひく)くなる', '変(か)わらない'],
    answer: 0,
    target: 'mirrors',
    show: ['mirrors'],
    need: { key: 'mirrors', distinct: 3 },
    finding: 'かがみの数を多くして日光を重ねるほど、当てたところは明るく、温度は高くなる。',
  },
];
