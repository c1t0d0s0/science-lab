import { GRADE, type Level } from '../core/levels';
import type { Conditions, Variable } from '../experiments/types';
import { h, withRuby } from './dom';
import { plain, say } from './text';

let seq = 0;

/** 条件の値を、画面に出す文字にする (「50cm」「鉄のクリップ」など) */
export function valueLabel(v: Variable, value: number | string, level: Level): string {
  if (v.kind === 'range') return `${value}${v.unit}`;
  const o = v.options.find((x) => x.value === value);
  return o ? plain(say(level, o)) : String(value);
}

/**
 * 条件を変えるつまみとボタン。指でも操作しやすいよう、どれも 44px 以上にする。
 * locked の条件は、見せるだけで変えられない。
 */
export function conditionPanel(opts: {
  level: Level;
  variables: Variable[];
  values: Conditions;
  locked?: readonly string[];
  /** 調べる条件 (目立たせる) */
  target?: string;
  disabled?: boolean;
  onChange: (key: string, value: number | string) => void;
}): HTMLElement {
  const { level, values } = opts;
  const panel = h('div', { class: 'conditions' });
  for (const v of opts.variables) {
    const locked = opts.locked?.includes(v.key) || opts.disabled;
    const id = `cond-${seq++}`;
    const row = h('div', { class: `cond${v.key === opts.target ? ' is-target' : ''}${locked ? ' is-locked' : ''}` });
    const head = h('div', { class: 'cond-head' }, withRuby('label', 'cond-label', say(level, v)));
    head.firstElementChild?.setAttribute(v.kind === 'range' ? 'for' : 'id', id);
    if (v.key === opts.target) head.append(h('span', { class: 'chip chip-small chip-target' }, GRADE[level] <= 2 ? 'しらべる' : '調べる'));
    if (opts.locked?.includes(v.key)) head.append(h('span', { class: 'chip chip-small chip-lock' }, 'そろえる'));
    row.append(head);

    if (v.kind === 'range') {
      const value = Number(values[v.key]);
      const out = h('output', { class: 'cond-value', for: id }, `${value}${v.unit}`);
      const input = h('input', {
        type: 'range',
        id,
        min: v.min,
        max: v.max,
        step: v.step,
        value,
        disabled: !!locked,
        'aria-valuetext': `${value}${v.unit}`,
      });
      const set = (n: number) => {
        const next = Math.min(v.max, Math.max(v.min, n));
        input.value = String(next);
        out.textContent = `${next}${v.unit}`;
        input.setAttribute('aria-valuetext', `${next}${v.unit}`);
        opts.onChange(v.key, next);
      };
      input.addEventListener('input', () => set(Number(input.value)));
      const step = (d: number, label: string, sign: string) =>
        h('button', { type: 'button', class: 'step-btn', 'aria-label': label, disabled: !!locked, onclick: () => set(Number(input.value) + d) }, sign);
      row.append(h('div', { class: 'cond-range' }, step(-v.step, '小さくする', '−'), input, step(v.step, '大きくする', '+'), out));
    } else {
      const group = h('div', { class: 'cond-choices', role: 'radiogroup', 'aria-labelledby': id });
      for (const o of v.options) {
        const selected = values[v.key] === o.value;
        const btn = withRuby('button', `choice-btn${selected ? ' is-on' : ''}`, say(level, o));
        btn.setAttribute('type', 'button');
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', String(selected));
        if (locked) btn.setAttribute('disabled', '');
        btn.addEventListener('click', () => {
          for (const other of group.querySelectorAll('.choice-btn')) {
            other.classList.remove('is-on');
            other.setAttribute('aria-checked', 'false');
          }
          btn.classList.add('is-on');
          btn.setAttribute('aria-checked', 'true');
          opts.onChange(v.key, o.value);
        });
        group.append(btn);
      }
      row.append(group);
    }
    panel.append(row);
  }
  return panel;
}
