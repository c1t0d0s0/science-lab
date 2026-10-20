import { describe, expect, it } from 'vitest';
import { dailyMission } from '../src/core/daily';
import { addDays } from '../src/core/date';
import { LEVELS } from '../src/core/levels';
import { missionsFor } from '../src/experiments';

describe('今日のチャレンジ', () => {
  it('同じ日・同じ学年なら、いつも同じミッション。その学年のミッションから出る', () => {
    for (const level of LEVELS) {
      const m = dailyMission('2026-10-20', level);
      expect(dailyMission('2026-10-20', level).id).toBe(m.id);
      expect(m.levels).toContain(level);
    }
  });

  it('400日のあいだ、2日つづけて同じミッションは出ず、1回りで全部のミッションが出る', () => {
    for (const level of LEVELS) {
      const n = missionsFor(level).length;
      let prev = '';
      const seen = new Map<string, number>();
      for (let i = 0; i < 400; i++) {
        const id = dailyMission(addDays('2026-01-01', i), level).id;
        expect(id, `${level} ${i}`).not.toBe(prev);
        prev = id;
        seen.set(id, (seen.get(id) ?? 0) + 1);
      }
      expect(seen.size).toBe(n);
      // どのミッションも、だいたい同じ回数ずつ出る
      expect(Math.max(...seen.values()) - Math.min(...seen.values())).toBeLessThanOrEqual(2);
    }
  });
});
