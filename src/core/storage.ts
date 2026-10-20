import { addDays } from './date';
import { isLevel, type Level } from './levels';
import { FREE_POINTS, challengePoints, earnedPoints, missionPoints, normalizeStamps, rewardFor, type StampReward } from './rewards';
import { mergeNotes } from './merge';
import { emptySnapshot, validNote, type Note, type OwnedCard, type Progress, type Snapshot } from './snapshot';

export type { Note, OwnedCard, Progress } from './snapshot';

// 記録を置く場所。ログインしていない人の記録は GUEST_PREFIX の下。
// ログイン中の人の記録 (Firestore の写し) は、人ごとに別の場所に置き、ログアウトしたら消す。
const GUEST_PREFIX = 'science-lab:v1:';
const USER_PREFIX = 'science-lab:u:';
const userPrefix = (uid: string) => `${USER_PREFIX}${uid}:`;
const ACTIVE_UID_KEY = 'science-lab:auth-uid';

let prefix = GUEST_PREFIX;
let listener: ((key: string) => void) | null = null;
let muted = false;

/** 読み書きする記録を切りかえる。uid が null ならログインなしの記録 */
export function useStore(uid: string | null): void {
  prefix = uid ? userPrefix(uid) : GUEST_PREFIX;
}

/** 今、読み書きしているのがだれの記録か。ログインなしの記録なら null */
export function currentUid(): string | null {
  return prefix === GUEST_PREFIX ? null : prefix.slice(USER_PREFIX.length, -1);
}

/** この端末で、さいごにログインしていた人。次に開いたとき、通信を待たずにその人の写しを出すために使う */
export function rememberedUid(): string | null {
  try {
    return localStorage.getItem(ACTIVE_UID_KEY);
  } catch {
    return null;
  }
}

export function rememberUid(uid: string | null): void {
  try {
    if (uid) localStorage.setItem(ACTIVE_UID_KEY, uid);
    else localStorage.removeItem(ACTIVE_UID_KEY);
  } catch {
    /* 無視 */
  }
}

/** 記録が書きかわったら知らせてもらう (Firestore に送るため)。key は「done:g3」「progress:2026-10-12:magnet-iron」など */
export function onStorageChange(cb: ((key: string) => void) | null): void {
  listener = cb;
}

// localStorage が使えない環境 (プライベートブラウズなど) でも遊べるよう、失敗は無視する
function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(prefix + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(prefix + key, JSON.stringify(value));
  } catch {
    /* 保存できなくても続行 */
  }
  if (!muted) listener?.(key);
}

/** 今の場所にあるキーの一覧 (prefix をのぞいた形) */
function keys(at: string = prefix): string[] {
  const out: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(at)) out.push(key.slice(at.length));
    }
  } catch {
    /* 無視 */
  }
  return out;
}

function removeKey(fullKey: string): void {
  try {
    localStorage.removeItem(fullKey);
  } catch {
    /* 無視 */
  }
}

// ---- ミッションの途中経過 ----

/** 途中経過の id (Firestore でも同じ id を使う) */
export const progressId = (date: string, mission: string) => `${date}:${mission}`;

/** 今日のそのミッションの途中経過。ミッションの中身が変わっていたら (アプリの更新など)、はじめからにする */
export function loadProgress(date: string, mission: string, sig: string): number[] {
  const saved = read<Progress>(`progress:${progressId(date, mission)}`);
  if (!saved || saved.sig !== sig || !Array.isArray(saved.answers)) return [];
  return saved.answers.filter((a) => Number.isInteger(a) && a >= 0).slice(0, 4);
}

export function saveProgress(date: string, mission: string, sig: string, answers: number[]): void {
  write(`progress:${progressId(date, mission)}`, { sig, answers, at: Date.now() } satisfies Progress);
}

/** 途中経過のうち、前の日までのものかどうか (もう使わないので消してよい) */
export function isStale(id: string, today: string): boolean {
  return !id.startsWith(`${today}:`);
}

/** 前の日までの途中経過は、もう使わないので消す */
export function pruneOld(today: string): void {
  for (const key of keys()) {
    if (key.startsWith('progress:') && isStale(key.slice('progress:'.length), today)) removeKey(prefix + key);
  }
}

// ---- やりとげた記録 ----

function readMarks(key: string): Record<string, number> {
  const saved = read<Record<string, number>>(key);
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(saved ?? {})) if (v === 1 || v === 2) out[k] = v;
  return out;
}

/** そのレベル (または free) の、やりとげた日と記録 */
const readDone = (level: string) => readMarks(`done:${level}`);
const doneLevels = () => keys().filter((k) => k.startsWith('done:')).map((k) => k.slice('done:'.length));
/** 今日のチャレンジの記録 (自由研究をのぞく) */
const challengeDone = () => doneLevels().filter(isLevel).map(readDone);

/** その日の今日のチャレンジをやりとげたか。やりとげていれば 1 か 2 (予想も当たった) */
export function doneMark(date: string, level: Level): number {
  return readDone(level)[date] ?? 0;
}

/** そのミッションをクリアしたことがあるか。あれば 1 か 2 (予想も当たった) */
export function clearedMark(mission: string): number {
  return readMarks('cleared')[mission] ?? 0;
}

export function clearedCount(): number {
  return Object.keys(readMarks('cleared')).length;
}

/** 今日までつづけて、毎日 (どれかの学年の) 今日のチャレンジをやりとげた日数。今日がまだなら、きのうまでを数える */
export function currentStreak(today: string): number {
  const records = challengeDone();
  const played = (d: string) => records.some((r) => r[d] !== undefined);
  let day = played(today) ? today : addDays(today, -1);
  let n = 0;
  while (played(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

// ---- 実験ノート ----

export function getNotes(): Note[] {
  const saved = read<unknown[]>('notes');
  return Array.isArray(saved) ? saved.map(validNote).filter((n): n is Note => n !== null) : [];
}

export function getNote(id: string): Note | undefined {
  return getNotes().find((n) => n.id === id);
}

function addNote(note: Note): void {
  write('notes', mergeNotes(getNotes(), [note]));
}

export function newNoteId(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 36 ** 4).toString(36)}`;
}

// ---- ミッションと自由研究をやりとげたとき ----

/** やりとげたときにもらえたもの */
export interface FinishReward {
  points: number;
  hit: boolean;
  /** はじめてクリアしたミッションか */
  first: boolean;
  /** 今日のチャレンジのスタンプ (今日のチャレンジでなければ null) */
  stamp: StampReward | null;
}

/**
 * ミッションをやりとげた。クリアの記録とノートをつけ、もらえたポイントを返す。
 * daily のときは、今日のチャレンジの記録とスタンプもつける (その日・その学年で、はじめてのときだけ)。
 */
export function finishMission(opts: { date: string; level: Level; mission: string; daily: boolean; hit: boolean; note: Note }): FinishReward {
  const mark = opts.hit ? 2 : 1;
  let points = 0;
  const cleared = readMarks('cleared');
  const first = cleared[opts.mission] === undefined;
  if ((cleared[opts.mission] ?? 0) < mark) {
    points += missionPoints(mark) - (first ? 0 : missionPoints(cleared[opts.mission]));
    write('cleared', { ...cleared, [opts.mission]: mark });
  }
  let stamp: StampReward | null = null;
  if (opts.daily) {
    const done = readDone(opts.level);
    if (done[opts.date] === undefined) {
      const before = getStamps();
      write(`done:${opts.level}`, { ...done, [opts.date]: mark });
      points += challengePoints(mark);
      stamp = rewardFor(before, opts.date);
      points += stamp.weekPoints + stamp.monthPoints;
    }
  }
  addNote(opts.note);
  return { points, hit: opts.hit, first, stamp };
}

/** 自由研究をノートにまとめた。その日はじめてなら FREE_POINTS をもらえる */
export function finishFree(date: string, note: Note): number {
  const done = readDone('free');
  addNote(note);
  if (done[date] !== undefined) return 0;
  write('done:free', { ...done, [date]: 1 });
  return FREE_POINTS;
}

// ---- スタンプ・ポイント・柴犬カード ----

/**
 * スタンプが押された日の一覧。どれかの学年の今日のチャレンジをやりとげた日に、1 日 1 個。
 * やりとげた記録から毎回作るので、スタンプだけがずれることはない。
 */
export function getStamps(): string[] {
  return normalizeStamps(challengeDone().flatMap((done) => Object.keys(done)));
}

export function getCards(): OwnedCard[] {
  const saved = read<OwnedCard[]>('cards');
  return Array.isArray(saved) ? saved.filter((c) => typeof c?.id === 'string' && typeof c.paid === 'number' && c.paid >= 0) : [];
}

/** これまでにもらったポイント = 今日のチャレンジ + ミッション + 自由研究 + スタンプの分 */
export function earnedTotal(): number {
  const sum = (marks: Record<string, number>, f: (m: number) => number) => Object.values(marks).reduce((s, m) => s + f(m), 0);
  const challenges = challengeDone().reduce((s, done) => s + sum(done, challengePoints), 0);
  const missions = sum(readMarks('cleared'), missionPoints);
  const free = Object.keys(readDone('free')).length * FREE_POINTS;
  return challenges + missions + free + earnedPoints(getStamps()).total;
}

/** 今つかえるポイント = もらった分 − カードに使った分 */
export function balance(): number {
  return earnedTotal() - getCards().reduce((sum, c) => sum + c.paid, 0);
}

/** ポイントとカードを交換する。ポイントが足りないときや、もう持っているときは何もしない */
export function buyCard(card: { id: string; price: number }): boolean {
  const owned = getCards();
  if (owned.some((c) => c.id === card.id) || balance() < card.price) return false;
  write('cards', [...owned, { id: card.id, paid: card.price }]);
  return true;
}

// ---- 記録をまるごと出し入れする (ログイン・Firestore との同期で使う) ----

/** 今の場所にある記録を、まるごと取り出す */
export function exportSnapshot(): Snapshot {
  const s = emptySnapshot();
  for (const level of doneLevels().sort()) {
    for (const [date, mark] of Object.entries(readDone(level))) s.done[`${level}:${date}`] = mark;
  }
  s.cleared = readMarks('cleared');
  s.cards = getCards();
  s.notes = getNotes();
  for (const key of keys()) {
    if (!key.startsWith('progress:')) continue;
    const p = read<Progress>(key);
    if (p && typeof p.sig === 'string' && Array.isArray(p.answers)) s.progress[key.slice('progress:'.length)] = p;
  }
  return s;
}

/**
 * 今の場所の記録を、わたされた内容に入れかえる。
 * Firestore から取りこんだ結果を書くためのものなので、「書きかわった」という知らせは出さない。
 * keepProgress が true のときは、途中経過にはさわらない。
 */
export function importSnapshot(s: Snapshot, opts: { keepProgress?: boolean } = {}): void {
  muted = true;
  try {
    const byLevel: Record<string, Record<string, number>> = {};
    for (const [key, mark] of Object.entries(s.done)) {
      const at = key.indexOf(':');
      (byLevel[key.slice(0, at)] ??= {})[key.slice(at + 1)] = mark;
    }
    for (const level of doneLevels()) if (!(level in byLevel)) removeKey(`${prefix}done:${level}`);
    for (const [level, done] of Object.entries(byLevel)) write(`done:${level}`, done);
    write('cleared', s.cleared);
    write('cards', s.cards);
    write('notes', s.notes);
    if (!opts.keepProgress) {
      for (const key of keys()) {
        if (key.startsWith('progress:') && !(key.slice('progress:'.length) in s.progress)) removeKey(prefix + key);
      }
      for (const [id, p] of Object.entries(s.progress)) write(`progress:${id}`, p);
    }
  } finally {
    muted = false;
  }
}

/** その人の記録 (uid が null ならログインなしの記録) を、この端末から消す */
export function clearStore(uid: string | null): void {
  const at = uid ? userPrefix(uid) : GUEST_PREFIX;
  for (const key of keys(at)) removeKey(at + key);
}
