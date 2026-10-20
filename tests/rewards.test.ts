import { beforeEach, describe, expect, it } from 'vitest';
import { addDays } from '../src/core/date';
import type { Level } from '../src/core/levels';
import { CHALLENGE_POINTS, FREE_POINTS, HIT_BONUS, MISSION_HIT_BONUS, MISSION_POINTS, MONTH_POINTS, WEEK_POINTS, currentRun, earnedPoints, monthView, rewardFor, runLengths } from '../src/core/rewards';
import { balance, buyCard, clearedMark, currentStreak, doneMark, earnedTotal, finishFree, finishMission, getCards, getNotes, getStamps, onStorageChange, useStore } from '../src/core/storage';
import { CARDS } from '../src/data/cards';
import { cardSvg, shibaFace } from '../src/ui/shiba';
import { assertWellFormed, installStorage, memory, note } from './helpers';

installStorage();

beforeEach(() => {
  memory.current = new Map();
  useStore(null);
  onStorageChange(null);
});

const days = (from: string, n: number) => Array.from({ length: n }, (_, i) => addDays(from, i));
const challenge = (date: string, level: Level = 'g5', hit = true, mission = `m-${date}-${level}`) =>
  finishMission({ date, level, mission, daily: true, hit, note: note() });

describe('ポイントの計算', () => {
  it('7 日連続するたびに 1000pt、とぎれたら数え直す', () => {
    expect(earnedPoints(days('2026-10-01', 14)).weeks).toBe(2);
    expect(runLengths(['2026-10-01', '2026-10-02', '2026-10-05'])).toEqual([2, 1]);
  });

  it('1 か月すべてそろうと +5000pt', () => {
    expect(earnedPoints(days('2026-02-01', 28)).months).toEqual(['2026-02']);
    expect(earnedPoints(days('2026-02-01', 28)).total).toBe(4 * WEEK_POINTS + MONTH_POINTS);
  });

  it('つづいている日数とカレンダー', () => {
    expect(currentRun(['2026-10-18', '2026-10-19'], '2026-10-20')).toBe(2);
    expect(monthView(['2026-10-02'], '2026-10').slice(0, 3)).toEqual([false, true, false]);
    expect(rewardFor(days('2026-10-01', 6), '2026-10-07').weekPoints).toBe(WEEK_POINTS);
  });
});

describe('ミッションと今日のチャレンジの記録', () => {
  it('今日のチャレンジをやりとげると、ポイントとスタンプ。予想が当たればボーナス', () => {
    const r = challenge('2026-10-20', 'g5', true);
    expect(r.stamp?.added).toBe(true);
    expect(r.points).toBe(CHALLENGE_POINTS + HIT_BONUS + MISSION_POINTS + MISSION_HIT_BONUS);
    expect(doneMark('2026-10-20', 'g5')).toBe(2);
    expect(getStamps()).toEqual(['2026-10-20']);
    expect(earnedTotal()).toBe(r.points);
    expect(getNotes()).toHaveLength(1);
  });

  it('同じ日に別の学年でもやりとげると、ポイントはもらえるがスタンプは 1 日 1 個', () => {
    challenge('2026-10-20', 'g5');
    const r = challenge('2026-10-20', 'g6');
    expect(r.stamp?.added).toBe(false);
    expect(r.points).toBeGreaterThan(0);
    expect(getStamps()).toEqual(['2026-10-20']);
  });

  it('同じ日・同じ学年の 2 回目は、チャレンジのポイントはもらえない', () => {
    challenge('2026-10-20', 'g5', true, 'x');
    const r = challenge('2026-10-20', 'g5', true, 'x');
    expect(r.points).toBe(0);
    expect(r.stamp).toBeNull();
  });

  it('ミッションは、はじめてのクリアでポイント。あとで予想が当たれば、その差の分だけ', () => {
    const a = finishMission({ date: '2026-10-20', level: 'g5', mission: 'pendulum-mass', daily: false, hit: false, note: note() });
    expect(a.points).toBe(MISSION_POINTS);
    expect(a.first).toBe(true);
    const b = finishMission({ date: '2026-10-21', level: 'g5', mission: 'pendulum-mass', daily: false, hit: true, note: note() });
    expect(b.points).toBe(MISSION_HIT_BONUS);
    expect(clearedMark('pendulum-mass')).toBe(2);
    const c = finishMission({ date: '2026-10-22', level: 'g5', mission: 'pendulum-mass', daily: false, hit: true, note: note() });
    expect(c.points).toBe(0);
    expect(earnedTotal()).toBe(MISSION_POINTS + MISSION_HIT_BONUS);
    // ミッションだけでは、スタンプはつかない
    expect(getStamps()).toEqual([]);
  });

  it('自由研究は 1 日 1 回ポイントがもらえ、スタンプにはならない', () => {
    expect(finishFree('2026-10-20', note({ kind: 'free' }))).toBe(FREE_POINTS);
    expect(finishFree('2026-10-20', note({ kind: 'free' }))).toBe(0);
    expect(getStamps()).toEqual([]);
    expect(getNotes()).toHaveLength(2);
  });

  it('7 日目のスタンプで 1000pt たまる', () => {
    for (const d of days('2026-10-01', 6)) challenge(d);
    const r = challenge('2026-10-07');
    expect(r.stamp?.weekPoints).toBe(WEEK_POINTS);
    expect(currentStreak('2026-10-07')).toBe(7);
  });

  it('カードと交換するとポイントがへる。足りないときや、もう持っているときは交換できない', () => {
    expect(buyCard(CARDS[0])).toBe(false);
    challenge('2026-10-20');
    challenge('2026-10-20', 'g6');
    expect(buyCard(CARDS[0])).toBe(true);
    expect(buyCard(CARDS[0])).toBe(false);
    expect(getCards()).toEqual([{ id: CARDS[0].id, paid: CARDS[0].price }]);
    expect(balance()).toBe(earnedTotal() - CARDS[0].price);
  });
});

describe('柴犬カード', () => {
  it('20 種類で、id と名前が重複せず、値段は安い順で合計 28,420pt', () => {
    expect(CARDS).toHaveLength(20);
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(20);
    expect(new Set(CARDS.map((c) => c.name)).size).toBe(20);
    for (let i = 1; i < CARDS.length; i++) expect(CARDS[i].price).toBeGreaterThan(CARDS[i - 1].price);
    expect(CARDS.reduce((s, c) => s + c.price, 0)).toBe(28420);
  });

  it('見た目がすべてちがい、絵が正しくかける', () => {
    expect(new Set(CARDS.map((c) => JSON.stringify([c.look, c.bg]))).size).toBe(20);
    for (const c of CARDS) assertWellFormed(cardSvg(c));
    assertWellFormed(`<svg viewBox="0 0 120 120">${shibaFace({ items: ['coat', 'goggles', 'magnet', 'moon'] })}</svg>`);
  });
});
