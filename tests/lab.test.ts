import { describe, expect, it } from 'vitest';
import { adviceAfter, changedKeys, fairGroup, means, readiness, trend } from '../src/core/lab';
import type { Trial } from '../src/core/snapshot';

const keys = ['length', 'mass', 'amp'];
const t = (length: number, mass: number, amp: number, v: number): Trial => ({ c: { length, mass, amp }, v });
const label = (k: string) => ({ length: '長さ', mass: '重さ', amp: 'ふれはば' })[k] ?? k;

describe('条件をそろえる', () => {
  it('ちがっている条件を見つける', () => {
    expect(changedKeys({ a: 1, b: 2 }, { a: 1, b: 3 }, ['a', 'b'])).toEqual(['b']);
  });

  it('調べる条件だけを変えた実験のかたまりを取り出す', () => {
    const trials = [t(20, 10, 10, 0.9), t(40, 10, 10, 1.27), t(60, 10, 10, 1.55), t(40, 50, 30, 1.27)];
    expect(fairGroup(trials, 'length', keys)).toHaveLength(3);
  });

  it('5年生は、条件をそろえていない実験を数えない', () => {
    const need = { key: 'length', distinct: 3 };
    const messy = [t(20, 10, 10, 0.9), t(40, 20, 10, 1.27), t(60, 30, 20, 1.55)];
    expect(readiness(need, messy, 'control', keys).ready).toBe(false);
    expect(readiness(need, messy, 'compare', keys).ready).toBe(true);
    const fair = [t(20, 10, 10, 0.9), t(40, 10, 10, 1.27), t(60, 10, 10, 1.55)];
    expect(readiness(need, fair, 'control', keys).ready).toBe(true);
  });

  it('6年生のばらつきがあるミッションは、同じ条件で何回ずつかはかる', () => {
    const need = { key: 'mass', distinct: 2, repeat: 3 };
    const once = [t(50, 10, 10, 1.41), t(50, 50, 10, 1.43)];
    const r = readiness(need, once, 'hypothesis', keys);
    expect(r.ready).toBe(false);
    expect(r.moreRepeat).toBe(3);
    const thrice = [...once, ...once, ...once];
    expect(readiness(need, thrice, 'hypothesis', keys).ready).toBe(true);
  });

  it('2つ以上の条件をいっしょに変えたら、注意する', () => {
    const a = adviceAfter({ mode: 'control', trials: [t(20, 10, 10, 0.9), t(40, 20, 10, 1.2)], keys, target: 'length', targetLabel: '長さ', labelOf: label });
    expect(a?.warn).toBe(true);
    expect(a?.text).toContain('長さと重さ');
  });

  it('調べる条件ではないものを変えたら、もどすように言う', () => {
    const a = adviceAfter({ mode: 'control', trials: [t(20, 10, 10, 0.9), t(20, 30, 10, 0.9)], keys, target: 'length', targetLabel: '長さ', labelOf: label });
    expect(a?.warn).toBe(true);
    expect(a?.text).toContain('重さ');
  });

  it('3・4年生には、条件のそろえ方の注意はしない', () => {
    const a = adviceAfter({ mode: 'compare', trials: [t(20, 10, 10, 0.9), t(40, 20, 10, 1.2)], keys, target: 'length', labelOf: label });
    expect(a?.warn).toBeFalsy();
  });
});

describe('結果の傾向', () => {
  it('平均と、大きくなる・小さくなる・変わらない', () => {
    const up = [t(20, 10, 10, 0.9), t(40, 10, 10, 1.27), t(40, 10, 10, 1.29)];
    expect(means(up, 'length').map((m) => m.mean)).toEqual([0.9, 1.28]);
    expect(trend(up, 'length')).toBe('up');
    expect(trend([t(20, 10, 10, 2), t(40, 10, 10, 1)], 'length')).toBe('down');
    // はかるたびの小さなずれは「変わらない」とみなす
    expect(trend([t(50, 10, 10, 1.41), t(50, 50, 10, 1.43)], 'mass')).toBe('flat');
  });
});
