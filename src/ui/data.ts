import { means } from '../core/lab';
import { GRADE, type Level } from '../core/levels';
import type { Trial } from '../core/snapshot';
import { resultChart } from '../diagrams/chart';
import type { Experiment, Variable } from '../experiments/types';
import { valueLabel } from './controls';
import { figure, h, withRuby } from './dom';
import { plain, say } from './text';

/** 結果を文字にする */
export function resultLabel(exp: Experiment, v: number | string, level: Level): string {
  const m = exp.measure;
  if (m.kind === 'number') return `${typeof v === 'number' ? v.toFixed(m.digits) : v}${m.unit}`;
  const o = m.options.find((x) => x.value === v);
  return o ? plain(say(level, o)) : String(v);
}

/**
 * 実験の記録の表とグラフ。
 * - 数で答える実験は、調べた条件を横じくにしたグラフをつける
 * - えらんで答える実験は、結果ごとになかま分けした表をつける
 * - 5・6 年生むけは、前の実験から変えた条件に印をつける
 */
export function dataView(opts: {
  exp: Experiment;
  level: Level;
  trials: readonly Trial[];
  variables: Variable[];
  target?: string;
  showMean: boolean;
  /** A・B の 2 つずつ実験したとき (3・4 年生むけ) */
  paired?: boolean;
}): HTMLElement {
  const { exp, level, trials, variables, target } = opts;
  const box = h('div', { class: 'data' });
  if (trials.length === 0) return box;
  const low = GRADE[level] <= 2;
  const markChanges = GRADE[level] >= 5;

  // グラフ
  const targetVar = variables.find((v) => v.key === target);
  if (exp.measure.kind === 'number' && targetVar && !low) {
    const pool = trials.filter((t) => typeof t.v === 'number');
    const series = means(pool, targetVar.key).map((m) => ({ ...m, label: valueLabel(targetVar, m.x, level) }));
    // えらぶ条件は、条件のならび順にそろえる
    if (targetVar.kind === 'choice') series.sort((a, b) => targetVar.options.findIndex((o) => o.value === a.x) - targetVar.options.findIndex((o) => o.value === b.x));
    if (series.length > 0) {
      box.append(
        h(
          'div',
          { class: 'chart-wrap' },
          figure(
            resultChart({
              series,
              xLabel: plain(say(level, targetVar)),
              xUnit: targetVar.kind === 'range' ? targetVar.unit : undefined,
              yLabel: plain(say(level, exp.measure)),
              unit: exp.measure.unit,
              digits: exp.measure.digits,
              showMean: opts.showMean,
            }),
          ),
        ),
      );
    }
  }

  // なかま分け (えらんで答える実験)
  if (exp.measure.kind === 'category' && targetVar) {
    const groups = new Map<string, Set<string>>();
    for (const t of trials) {
      const key = String(t.v);
      groups.set(key, (groups.get(key) ?? new Set()).add(valueLabel(targetVar, t.c[targetVar.key], level)));
    }
    box.append(
      h(
        'ul',
        { class: 'sort-groups' },
        ...[...groups].map(([v, items]) =>
          h('li', { class: 'sort-group' }, h('b', { class: 'sort-head' }, resultLabel(exp, v, level)), h('span', { class: 'sort-items' }, [...items].join('、'))),
        ),
      ),
    );
  }

  // 表
  const shown = low ? variables.filter((v) => v.key === target || variables.length === 1) : variables;
  const head = h(
    'tr',
    {},
    h('th', { scope: 'col' }, opts.paired ? '' : '回'),
    ...shown.map((v) => {
      const th = withRuby('th', v.key === target ? 'is-target' : '', say(level, v));
      th.setAttribute('scope', 'col');
      return th;
    }),
    withRuby('th', 'is-result', say(level, exp.measure)),
  );
  const rows = trials.map((t, i) => {
    const prev = trials[i - (opts.paired ? 2 : 1)];
    const cells = shown.map((v) => {
      const changed = markChanges && prev && prev.c[v.key] !== t.c[v.key];
      return h('td', { class: [v.key === target && 'is-target', changed && 'is-changed'].filter(Boolean).join(' ') }, valueLabel(v, t.c[v.key], level));
    });
    const no = opts.paired ? `${i % 2 === 0 ? 'A' : 'B'}${Math.floor(i / 2) + 1}` : String(i + 1);
    return h('tr', {}, h('th', { scope: 'row' }, no), ...cells, h('td', { class: 'is-result' }, resultLabel(exp, t.v, level)));
  });
  box.append(
    h(
      'div',
      { class: 'table-wrap' },
      h('table', { class: 'trials' }, h('thead', {}, head), h('tbody', {}, ...rows.reverse())),
    ),
  );
  if (markChanges && trials.length > 1) box.append(h('p', { class: 'table-note' }, h('span', { class: 'changed-swatch' }), '前の実験から変えた条件'));
  return box;
}
