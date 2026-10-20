import { circle, fig, line, path, rect, text } from './svg';

// 実験の結果のグラフ。横じくは調べた条件、たてじくは結果。
// 1 回 1 回の結果を点で、同じ条件の平均を線 (数の条件) か棒 (えらぶ条件) でかく。

export interface Series {
  /** 横じくの値。数なら折れ線、名前なら棒グラフ */
  x: number | string;
  /** 横じくに出す文字 */
  label: string;
  values: number[];
  mean: number;
}

const W = 320;
const H = 210;
const L = 48;
const R = 14;
const T = 18;
const B = 44;

/** 0 から始まる、きりのよい目もり */
function niceTicks(max: number): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 1000) / 1000);
  if (ticks[ticks.length - 1] < max) ticks.push(Math.round((ticks[ticks.length - 1] + step) * 1000) / 1000);
  return ticks;
}

const fmt = (v: number, digits: number) => (Number.isInteger(v) && digits === 0 ? String(v) : v.toFixed(digits));

export function resultChart(opts: {
  series: Series[];
  xLabel: string;
  /** 横じくの単位 (数の条件のとき) */
  xUnit?: string;
  yLabel: string;
  unit: string;
  digits: number;
  /** 6 年生むけ: 平均の線と、1 回ずつの点を分けて見せる */
  showMean: boolean;
}): string {
  const { series, digits } = opts;
  const numeric = series.every((s) => typeof s.x === 'number');
  const all = series.flatMap((s) => s.values);
  const ticks = niceTicks(Math.max(...all, 0));
  const top = ticks[ticks.length - 1] || 1;
  const y = (v: number) => H - B - (v / top) * (H - B - T);
  const xs = numeric ? (series.map((s) => s.x) as number[]) : [];
  const minX = numeric ? Math.min(...xs) : 0;
  const maxX = numeric ? Math.max(...xs) : 0;
  const span = maxX - minX || 1;
  const band = (W - L - R) / Math.max(series.length, 1);
  const x = (s: Series, i: number) => (numeric ? L + 12 + ((Number(s.x) - minX) / span) * (W - L - R - 24) : L + band * (i + 0.5));

  const grid = ticks
    .map((t) => line(L, y(t), W - R, y(t), 'grid-line') + text(L - 6, y(t) + 4, fmt(t, Number.isInteger(t) ? 0 : 1), { anchor: 'end', cls: 'tiny axis-text' }))
    .join('');
  const axes = line(L, T - 4, L, H - B, 'axis') + line(L, H - B, W - R, H - B, 'axis');
  // 横じくの文字は、重ならないよう間引く (数の条件は単位をとって、じくの名前のほうに単位を書く)
  const every = Math.ceil(series.length / Math.max(1, Math.floor((W - L - R) / 46)));
  const xTicks = series
    .map((s, i) => (i % every === 0 || i === series.length - 1 ? text(x(s, i), H - B + 16, numeric ? String(s.x) : s.label, { cls: 'tiny axis-text' }) : ''))
    .join('');

  let marks = '';
  if (numeric) {
    if (series.length >= 2) marks += path(`M${series.map((s, i) => `${x(s, i).toFixed(1)} ${y(s.mean).toFixed(1)}`).join('L')}`, 'series-line');
  } else {
    // 棒は、点とかさならないよう細めにして、上のはしだけ丸める
    marks += series
      .map((s, i) => {
        const bw = Math.min(36, band * 0.5);
        const h = H - B - y(s.mean);
        return h > 0 ? rect(x(s, i) - bw / 2, y(s.mean), bw, h, 'series-bar', 4) : '';
      })
      .join('');
  }
  // 1 回ずつの結果 (同じ値が重なるときは、少し横にずらす)
  marks += series
    .map((s, i) =>
      s.values
        .map((v, j) => {
          const dx = s.values.length > 1 ? (j - (s.values.length - 1) / 2) * 5 : 0;
          return `<g class="pt">${circle(x(s, i) + dx, y(v), opts.showMean ? 3.5 : 4.5, opts.showMean ? 'series-dot is-raw' : 'series-dot')}<title>${s.label}: ${fmt(v, digits)}${opts.unit}</title></g>`;
        })
        .join(''),
    )
    .join('');
  if (opts.showMean) {
    marks += series
      .filter((s) => s.values.length > 1)
      .map((s, i) => {
        const cx = x(s, series.indexOf(s));
        return line(cx - 10, y(s.mean), cx + 10, y(s.mean), 'mean-mark') + (i === 0 ? text(cx + 13, y(s.mean) + 4, '平均', { anchor: 'start', cls: 'tiny axis-text' }) : '');
      })
      .join('');
  }

  return fig(
    W,
    H,
    `${opts.xLabel}と${opts.yLabel}のグラフ。` + series.map((s) => `${s.label}のとき${fmt(s.mean, digits)}${opts.unit}`).join('、'),
    grid,
    axes,
    marks,
    xTicks,
    text(L - 6, T - 6, `(${opts.unit})`, { anchor: 'end', cls: 'tiny axis-text' }),
    text((L + W - R) / 2, H - 8, numeric && opts.xUnit ? `${opts.xLabel}(${opts.xUnit})` : opts.xLabel, { cls: 'small axis-text' }),
  ).replace('class="fig"', 'class="fig chart"');
}
