import type { Experiment, Mission, Need, Variable } from '../experiments/types';
import type { Mode } from './levels';
import type { Conditions, Trial } from './snapshot';

// 実験の記録から、「まとめてよいか」「条件をそろえているか」「どんな傾向があるか」を調べる。
// 画面にはよらないので、テストで確かめられる。

/** 2 つの条件で、ちがっている条件の名前 */
export function changedKeys(a: Conditions, b: Conditions, keys: readonly string[]): string[] {
  return keys.filter((k) => a[k] !== b[k]);
}

/** その条件にあてはまる実験か */
const matches = (t: Trial, where: Partial<Conditions> | undefined) =>
  !where || Object.entries(where).every(([k, v]) => t.c[k] === v);

/**
 * 「調べる条件だけを変えて、ほかはそろえた」実験のかたまりのうち、いちばん大きいもの。
 * 条件制御 (5 年生) と仮説・検証 (6 年生) では、このかたまりの中だけで結果をくらべる。
 */
export function fairGroup(trials: readonly Trial[], target: string, keys: readonly string[]): Trial[] {
  const others = keys.filter((k) => k !== target);
  const groups = new Map<string, Trial[]>();
  for (const t of trials) {
    const sig = JSON.stringify(others.map((k) => t.c[k]));
    groups.set(sig, [...(groups.get(sig) ?? []), t]);
  }
  let best: Trial[] = [];
  for (const g of groups.values()) {
    const n = distinct(g, target);
    if (n > distinct(best, target) || (n === distinct(best, target) && g.length > best.length)) best = g;
  }
  return best;
}

export function distinct(trials: readonly Trial[], key: string): number {
  return new Set(trials.map((t) => t.c[key])).size;
}

/** 調べる条件の値ごとに、何回はかったか */
export function counts(trials: readonly Trial[], key: string): Map<number | string, number> {
  const m = new Map<number | string, number>();
  for (const t of trials) m.set(t.c[key], (m.get(t.c[key]) ?? 0) + 1);
  return m;
}

export interface Readiness {
  ready: boolean;
  /** あと何通りためすか */
  moreValues: number;
  /** 何回ずつはかるか (足りないときだけ) */
  moreRepeat: number;
}

/** まとめに進めるだけの実験をしたか */
export function readiness(need: Need, trials: readonly Trial[], mode: Mode, keys: readonly string[]): Readiness {
  let pool = trials.filter(
    (t) => matches(t, need.where) && (!need.among || need.among.includes(t.c[need.key])) && (need.result === undefined || t.v === need.result),
  );
  // 条件をそろえて調べる学年は、そろえた実験だけを数える
  if ((mode === 'control' || mode === 'hypothesis') && need.fair !== false) pool = fairGroup(pool, need.key, keys.filter((k) => !(k in (need.where ?? {}))));
  let values = [...counts(pool, need.key)];
  if (need.repeat) values = values.filter(([, n]) => n >= need.repeat!);
  const moreValues = Math.max(0, need.distinct - values.length);
  const enoughRepeat = need.repeat ? [...counts(pool, need.key).values()].filter((n) => n >= need.repeat!).length : Infinity;
  const moreRepeat = need.repeat && enoughRepeat < need.distinct ? need.repeat : 0;
  return { ready: moreValues === 0, moreValues, moreRepeat };
}

/** 数で答える実験の、調べる条件の値ごとの平均 (値の小さい順) */
export function means(trials: readonly Trial[], key: string): { x: number | string; mean: number; values: number[] }[] {
  const by = new Map<number | string, number[]>();
  for (const t of trials) if (typeof t.v === 'number') by.set(t.c[key], [...(by.get(t.c[key]) ?? []), t.v]);
  return [...by]
    .map(([x, values]) => ({ x, values, mean: values.reduce((s, v) => s + v, 0) / values.length }))
    .sort((a, b) => (typeof a.x === 'number' && typeof b.x === 'number' ? a.x - b.x : 0));
}

export type Trend = 'up' | 'down' | 'flat' | 'mixed';

/**
 * 調べる条件を大きくしたときの、結果の変わり方。
 * ばらつきに負けないよう、平均の差が全体の 8% より小さければ「変わらない」とみなす。
 */
export function trend(trials: readonly Trial[], key: string): Trend {
  const m = means(trials, key);
  if (m.length < 2) return 'flat';
  const scale = Math.max(...m.map((p) => Math.abs(p.mean)), 1e-9);
  const steps = m.slice(1).map((p, i) => p.mean - m[i].mean);
  const big = steps.filter((d) => Math.abs(d) > scale * 0.08);
  if (big.length === 0) return 'flat';
  if (big.every((d) => d > 0)) return 'up';
  if (big.every((d) => d < 0)) return 'down';
  return 'mixed';
}

/** 実験で使った条件の名前 (ミッションで出すものだけ) */
export function shownVariables(exp: Experiment, mission?: Pick<Mission, 'show'>): Variable[] {
  return mission?.show ? exp.variables.filter((v) => mission.show!.includes(v.key)) : exp.variables;
}

/** 条件のはじめの値 */
export function initialConditions(exp: Experiment, start: Partial<Conditions> = {}): Conditions {
  const c: Conditions = {};
  for (const v of exp.variables) c[v.key] = v.initial;
  for (const [k, v] of Object.entries(start)) if (v !== undefined) c[k] = v;
  return c;
}

// ---- 学年ごとの声かけ ----

export interface Advice {
  text: string;
  /** 注意 (条件がそろっていないなど) */
  warn?: boolean;
}

/** 学年ごとに、実験の前にかける声 */
export const MODE_HINTS: Record<Mode, string[]> = {
  discover: ['どっちが おおきいかな？', 'ほかの ものでも ためしてみよう', 'にている ところは あるかな？'],
  compare: ['AとBを ならべて、くらべてみよう', 'ちがうところは どこかな？ にているところは？', '2つの 結果(けっか)を くらべると、何(なに)が 言(い)えるかな？'],
  control: ['調べる条件(じょうけん)のほかは、そろえた？', '1回に 変(か)える条件は 1つだけにしよう', '結果(けっか)は 表(ひょう)とグラフで くらべよう'],
  hypothesis: ['1回だけで 決(き)めていいかな？ 何回かはかって 平均(へいきん)しよう', 'ほかの条件は そろえた？', 'このデータで 言えるのは、どこまでかな？'],
};

/** 1 回実験したあとの声かけ。前の実験とくらべて、条件のそろえ方を見る */
export function adviceAfter(opts: {
  mode: Mode;
  trials: readonly Trial[];
  keys: readonly string[];
  target?: string;
  targetLabel?: string;
  labelOf: (key: string) => string;
  noise?: boolean;
}): Advice | null {
  const { mode, trials, keys, target } = opts;
  const last = trials[trials.length - 1];
  const prev = trials[trials.length - 2];
  if (!last) return null;
  if ((mode === 'control' || mode === 'hypothesis') && prev) {
    const changed = changedKeys(prev.c, last.c, keys);
    if (changed.length >= 2) {
      return { warn: true, text: `${changed.map(opts.labelOf).join('と')}の、${changed.length}つを いっしょに変えたよ。どれのせいで 結果(けっか)が変わったか、分かるかな？ 変える条件は 1つだけにしよう。` };
    }
    if (target && changed.length === 1 && changed[0] !== target) {
      return { warn: true, text: `今 調べているのは「${opts.targetLabel}」だよ。${opts.labelOf(changed[0])}は もとにもどしておこう。` };
    }
    if (target && changed.length === 1 && changed[0] === target && !opts.noise) {
      return { text: `いいね！「${opts.targetLabel}」だけを変えて、ほかの条件はそろえたね。` };
    }
  }
  if (mode === 'hypothesis' && opts.noise && target) {
    const n = counts([last], target);
    const same = trials.filter((t) => keys.every((k) => t.c[k] === last.c[k])).length;
    if (same === 1 && n.size === 1) return { text: '同じ条件で、もう何回か はかってみよう。はかるたびに 少しずつ ちがうかもしれないよ。' };
  }
  if (mode === 'discover' && trials.length === 1) return { text: 'ほかのものでも ためしてみよう！' };
  if (mode === 'compare' && prev) return { text: 'AとBの 結果(けっか)は どうだった？ くらべてみよう。' };
  return null;
}
