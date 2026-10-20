import { missionsFor } from '../experiments';
import type { Mission } from '../experiments/types';
import { dayNumber } from './date';
import type { Level } from './levels';
import { rngFromString, shuffle } from './rng';

/**
 * 今日のチャレンジ。その学年のミッションを、日本時間の日付と学年から決める (いつ・どの端末で開いても同じ)。
 * ミッションを 1 回りぶん、まぜた順に出していくので、全部出し終わるまで同じミッションは出ない。
 * 回りのつなぎ目で同じミッションが 2 日つづかないよう、次の回りの先頭が前の回りの最後と同じなら入れかえる。
 */
export function dailyMission(date: string, level: Level): Mission {
  const all = missionsFor(level);
  const n = all.length;
  const day = dayNumber(date);
  const round = Math.floor(day / n);
  const order = roundOrder(all, level, round);
  return order[day - round * n];
}

function roundOrder(all: Mission[], level: Level, round: number): Mission[] {
  const order = shuffle(all, rngFromString(`daily:${level}:${round}`));
  const prev = shuffle(all, rngFromString(`daily:${level}:${round - 1}`));
  if (order.length > 1 && order[0].id === prev[prev.length - 1].id) [order[0], order[1]] = [order[1], order[0]];
  return order;
}
