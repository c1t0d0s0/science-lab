// 学年と、学年ごとの「考え方」のモード。
// 学習指導要領解説の問題解決の力 (3 年 比較 / 4 年 関係付け / 5 年 条件制御 / 6 年 多面的に考える) をもとに、
// 1・2 年生は「発見」、3・4 年生は「比較」、5 年生は「条件制御」、6 年生は「仮説・検証」で遊ぶ。

export type Level = 'g1' | 'g2' | 'g3' | 'g4' | 'g5' | 'g6';
export const LEVELS: readonly Level[] = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];
export const GRADE: Record<Level, number> = { g1: 1, g2: 2, g3: 3, g4: 4, g5: 5, g6: 6 };

export type Mode = 'discover' | 'compare' | 'control' | 'hypothesis';

export function modeOf(level: Level): Mode {
  const g = GRADE[level];
  if (g <= 2) return 'discover';
  if (g <= 4) return 'compare';
  if (g === 5) return 'control';
  return 'hypothesis';
}

export const isLevel = (s: string): s is Level => (LEVELS as readonly string[]).includes(s);

/** 学年をならべた表記から、その学年の一覧を作る (forGrades(3, 4) なら 3・4 年生) */
export const grades = (...gs: number[]): Level[] => gs.map((g) => `g${g}` as Level);
