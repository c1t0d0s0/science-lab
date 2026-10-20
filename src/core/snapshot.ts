// ---- 手元の記録の形 ----

/** 実験の条件。値は数 (長さ・重さなど) か、えらんだものの名前 */
export type Conditions = Record<string, number | string>;

/** 実験 1 回分の記録。v は結果 (数か、「つく」「つかない」などの名前) */
export interface Trial {
  c: Conditions;
  v: number | string;
}

/**
 * 今やっているミッションの途中経過。answers は順に
 * [えらんだ予想, 予想の理由, 実験のあとの考え, 考えを変えた理由] の位置 (えらんだところまで)
 */
export interface Progress {
  /** どのミッションのものか (ミッションの中身が変わったら、はじめからにする) */
  sig: string;
  answers: number[];
  /** さいごに保存した時刻 (ミリ秒)。2 か所の記録を合わせるときに使う */
  at?: number;
}

/** 持っている柴犬カード */
export interface OwnedCard {
  id: string;
  /** 交換したときに使ったポイント。あとで値段を変えても残高がずれないように残す */
  paid: number;
}

/** 実験ノートの 1 ページ。あとでミッションの文を直しても読めるよう、文はそのまま写しておく */
export interface Note {
  id: string;
  at: number;
  kind: 'mission' | 'daily' | 'free';
  level: string;
  exp: string;
  mission?: string;
  /** 調べたこと */
  question: string;
  prediction?: string;
  reason?: string;
  /** 予想が当たったか */
  correct?: boolean;
  /** わかったこと (自由研究では、自分でえらんだ結論) */
  finding: string;
  /** 実験のあとの考え */
  revised?: string;
  /** 考えを変えた (変えなかった) 理由 */
  reflection?: string;
  trials: Trial[];
}

/** ノートに残すページ数と、1 ページに残す実験の回数 (Firestore の 1 つの記録に入りきるように) */
export const NOTE_LIMIT = 60;
export const TRIAL_LIMIT = 24;

/** 1 人分の記録の全部。ログインなしの記録も、ログイン中の人の記録も、この形であつかう */
export interface Snapshot {
  /**
   * 今日のチャレンジと自由研究の記録。キーは「レベル:日付」(g3:2026-10-12 など)、
   * 自由研究は「free:日付」。値は 1 (やりとげた) か 2 (予想も当たった)
   */
  done: Record<string, number>;
  /** はじめてクリアしたミッション。値は 1 (クリア) か 2 (予想も当たった) */
  cleared: Record<string, number>;
  /** ポイントと交換した柴犬カード */
  cards: OwnedCard[];
  /** 途中経過。キーは「日付:ミッション」(2026-10-12:pendulum-length など) */
  progress: Record<string, Progress>;
  /** 実験ノート (新しい順) */
  notes: Note[];
}

export function emptySnapshot(): Snapshot {
  return { done: {}, cleared: {}, cards: [], progress: {}, notes: [] };
}

/** 記録が 1 つでもあるか */
export function hasRecords(s: Snapshot): boolean {
  return (
    Object.keys(s.done).length > 0 ||
    Object.keys(s.cleared).length > 0 ||
    s.cards.length > 0 ||
    s.notes.length > 0 ||
    Object.values(s.progress).some((p) => p.answers.length > 0)
  );
}

// ---- Firestore に保存する形 (小学生向けの学習アプリで共通。まいにち理科ノートと同じ) ----
//
//   users/{uid}                                その人の情報 (全アプリ共通)。名前やメールアドレスは入れない
//   users/{uid}/apps/{appId}                   アプリごとの記録のまとめ (AppDoc)。スタンプは activeDays、柴犬カードは inventory
//   users/{uid}/apps/{appId}/progress/{itemId} 教材 1 つごとの途中経過 (ProgressDoc)
//
// このアプリの appId は "science-lab"。まいにち理科ノート ("science-quiz") とは別の場所に入るので、記録はまざらない。

export const SCHEMA = 1;
export const APP_ID = 'science-lab';

export interface AppDoc {
  schema: number;
  updatedAt: number;
  /** その日の目標を達成した日 (YYYY-MM-DD)。このアプリでは、どれかの学年の今日のチャレンジをやりとげた日 */
  activeDays: string[];
  /** やりとげた教材の id。このアプリでは「レベル:日付」と「free:日付」 */
  completed: string[];
  /** 手に入れたごほうび。このアプリでは柴犬カード */
  inventory: Record<string, { paid: number }>;
  /** 使ったポイント (このアプリでは使わない) */
  spent: Record<string, number>;
  /** アプリごとの設定。scores に done、cleared にクリアしたミッション、notes に実験ノート */
  settings: Record<string, unknown>;
}

export interface ProgressDoc {
  schema: number;
  updatedAt: number;
  status: 'playing' | 'done';
  /** 途中経過の中身。このアプリでは、ミッションの印と、えらんだもの */
  data: Record<string, unknown>;
}

/** 「レベル:日付」の日付の部分 */
const dateOf = (key: string) => key.slice(key.indexOf(':') + 1);
/** スタンプになる記録か (自由研究はスタンプにならない) */
export const isChallengeKey = (key: string) => /^g[1-6]:/.test(key);

export function toAppDoc(s: Snapshot, now: number): AppDoc {
  const keys = Object.keys(s.done).sort();
  return {
    schema: SCHEMA,
    updatedAt: now,
    activeDays: [...new Set(keys.filter(isChallengeKey).map(dateOf))].sort(),
    completed: keys,
    inventory: Object.fromEntries(s.cards.map((c) => [c.id, { paid: c.paid }])),
    spent: {},
    settings: {
      scores: Object.fromEntries(keys.map((k) => [k, s.done[k]])),
      cleared: { ...s.cleared },
      notes: s.notes,
    },
  };
}

const validKey = (key: string) => /^[a-z0-9]+:\d{4}-\d{2}-\d{2}$/.test(key);
const validMark = (v: unknown): v is number => v === 1 || v === 2;
const validId = (id: string) => /^[a-z0-9-]{1,64}$/.test(id);
const isText = (v: unknown, max = 400): v is string => typeof v === 'string' && v.length <= max;
const optText = (v: unknown) => (isText(v) ? v : undefined);

function validTrial(t: unknown): Trial | null {
  const x = t as Partial<Trial> | null;
  if (!x || typeof x.c !== 'object' || x.c === null) return null;
  if (typeof x.v !== 'number' && !isText(x.v, 40)) return null;
  if (typeof x.v === 'number' && !Number.isFinite(x.v)) return null;
  const c: Conditions = {};
  for (const [k, v] of Object.entries(x.c)) {
    if (!validId(k)) return null;
    if (typeof v === 'number' ? Number.isFinite(v) : isText(v, 40)) c[k] = v;
    else return null;
  }
  return { c, v: x.v };
}

/** Firestore や localStorage から読んだノートは形がくずれているかもしれないので、確かめてからもどす */
export function validNote(n: unknown): Note | null {
  const x = n as Partial<Note> | null;
  if (!x || !isText(x.id, 64) || typeof x.at !== 'number' || !Number.isFinite(x.at)) return null;
  if (x.kind !== 'mission' && x.kind !== 'daily' && x.kind !== 'free') return null;
  if (!isText(x.level, 8) || !isText(x.exp, 40) || !isText(x.question) || !isText(x.finding)) return null;
  const trials = Array.isArray(x.trials) ? x.trials.map(validTrial).filter((t): t is Trial => t !== null).slice(0, TRIAL_LIMIT) : [];
  const note: Note = { id: x.id, at: x.at, kind: x.kind, level: x.level, exp: x.exp, question: x.question, finding: x.finding, trials };
  const mission = optText(x.mission);
  if (mission) note.mission = mission;
  for (const key of ['prediction', 'reason', 'revised', 'reflection'] as const) {
    const v = optText(x[key]);
    if (v !== undefined) note[key] = v;
  }
  if (typeof x.correct === 'boolean') note.correct = x.correct;
  return note;
}

/** Firestore から読んだものは形がくずれているかもしれないので、1 つずつ確かめながらもどす */
export function fromAppDoc(doc: Partial<AppDoc> | null | undefined): Snapshot {
  const s = emptySnapshot();
  if (!doc) return s;
  const settings = (doc.settings ?? {}) as Record<string, unknown>;
  const scores = settings.scores;
  if (typeof scores === 'object' && scores !== null) {
    for (const [key, value] of Object.entries(scores)) if (validKey(key) && validMark(value)) s.done[key] = value;
  }
  const cleared = settings.cleared;
  if (typeof cleared === 'object' && cleared !== null) {
    for (const [id, value] of Object.entries(cleared)) if (validId(id) && validMark(value)) s.cleared[id] = value;
  }
  if (Array.isArray(settings.notes)) {
    s.notes = settings.notes.map(validNote).filter((n): n is Note => n !== null);
  }
  for (const [id, item] of Object.entries(doc.inventory ?? {})) {
    if (typeof item?.paid === 'number' && item.paid >= 0) s.cards.push({ id, paid: item.paid });
  }
  return s;
}

/** 途中経過が、ふりかえりまで終わっているか */
const finished = (p: Progress) => p.answers.length >= 4;

export function toProgressDoc(p: Progress, now: number): ProgressDoc {
  return {
    schema: SCHEMA,
    updatedAt: p.at ?? now,
    status: finished(p) ? 'done' : 'playing',
    data: { sig: p.sig, answers: p.answers },
  };
}

export function fromProgressDoc(doc: Partial<ProgressDoc> | null | undefined): Progress | null {
  const d = doc?.data;
  if (!d || typeof d.sig !== 'string' || !Array.isArray(d.answers)) return null;
  return {
    sig: d.sig,
    answers: d.answers.filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < 10).slice(0, 4),
    at: typeof doc?.updatedAt === 'number' ? doc.updatedAt : undefined,
  };
}
