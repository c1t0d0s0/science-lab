import type { Rng } from '../core/rng';

/** 平均 0・標準偏差 1 の乱数 (はかるときのばらつきに使う) */
export function gauss(rng: Rng): number {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
