/** 日本時間での今日の日付 (YYYY-MM-DD) */
export function jstDate(now: Date = new Date()): string {
  return new Date(now.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 1970-01-01 から数えた日数。日ごとに出題カテゴリーを順に送るのに使う */
export function dayNumber(date: string): number {
  return Math.round(new Date(`${date}T00:00:00Z`).getTime() / 86400000);
}
