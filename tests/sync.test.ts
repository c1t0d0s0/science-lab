import { beforeEach, describe, expect, it } from 'vitest';
import { Sync, type AuthPort, type Remote, type SyncHooks } from '../src/cloud/sync';
import { addDays, jstDate } from '../src/core/date';
import { mergeNotes, mergeProgress, mergeSnapshots } from '../src/core/merge';
import { NOTE_LIMIT, emptySnapshot, fromAppDoc, fromProgressDoc, toAppDoc, toProgressDoc, type Progress, type Snapshot } from '../src/core/snapshot';
import { CARDS } from '../src/data/cards';
import {
  balance,
  buyCard,
  clearedMark,
  currentStreak,
  currentUid,
  doneMark,
  exportSnapshot,
  finishMission,
  getCards,
  getNotes,
  getStamps,
  importSnapshot,
  loadProgress,
  onStorageChange,
  progressId,
  rememberedUid,
  saveProgress,
  useStore,
} from '../src/core/storage';
import { installStorage, memory, note } from './helpers';

installStorage();

/** メモリ上の Firestore。fail を true にすると、通信できない状態になる */
class FakeCloud implements Remote {
  data = new Map<string, Snapshot>();
  fail = false;
  writes = 0;
  private check() {
    if (this.fail) throw new Error('offline');
  }
  // Firestore に入れて出したのと同じように、形を確かめながらもどす
  private copy(s: Snapshot): Snapshot {
    const back = fromAppDoc(JSON.parse(JSON.stringify(toAppDoc(s, 0))));
    back.progress = JSON.parse(JSON.stringify(s.progress));
    return back;
  }
  async loadAll(uid: string) {
    this.check();
    const s = this.data.get(uid);
    return s ? this.copy(s) : null;
  }
  async loadSummary(uid: string) {
    this.check();
    const s = this.data.get(uid);
    return s ? { ...this.copy(s), progress: {} } : null;
  }
  async saveSummary(uid: string, snapshot: Snapshot) {
    this.check();
    this.writes++;
    const old = this.data.get(uid);
    this.data.set(uid, { ...this.copy(snapshot), progress: old?.progress ?? {} });
  }
  async saveProgress(uid: string, id: string, progress: Progress) {
    this.check();
    this.writes++;
    const s = this.data.get(uid) ?? emptySnapshot();
    s.progress[id] = JSON.parse(JSON.stringify(progress));
    this.data.set(uid, s);
  }
  async deleteProgress(uid: string, id: string) {
    this.check();
    this.writes++;
    delete this.data.get(uid)?.progress[id];
  }
}

class FakeAuth implements AuthPort {
  private cb: (uid: string | null) => void = () => {};
  nextUid = 'alice';
  onUser(cb: (uid: string | null) => void) {
    this.cb = cb;
  }
  resolve(uid: string | null) {
    this.cb(uid);
  }
  async signIn() {
    this.cb(this.nextUid);
  }
  async signOut() {
    this.cb(null);
  }
}

interface Device {
  storage: Map<string, string>;
  auth: FakeAuth;
  sync: Sync;
  asked: number;
  dataChanged: number;
  answer: boolean;
}

function makeDevice(cloud: FakeCloud): Device {
  const d = { storage: new Map<string, string>(), auth: new FakeAuth(), asked: 0, dataChanged: 0, answer: true } as Device;
  const hooks: SyncHooks = {
    onStatus: () => {},
    onData: () => void d.dataChanged++,
    askMigrate: () => {
      d.asked++;
      return d.answer;
    },
  };
  d.sync = new Sync(cloud, d.auth, hooks, { debounceMs: 60_000, retryMs: 60_000 });
  return d;
}

function use(d: Device): void {
  memory.current = d.storage;
  useStore(d.sync.uid);
  d.sync.attach();
}

const today = jstDate();
const MISSION = 'pendulum-length';
const id = progressId(today, MISSION);

/** 今日のチャレンジをやりとげる */
const complete = (level: 'g5' | 'g6' = 'g5', date = today) =>
  finishMission({ date, level, mission: `${MISSION}-${level}`, daily: true, hit: true, note: note({ level }) });

async function signIn(d: Device): Promise<void> {
  use(d);
  d.sync.start();
  await d.sync.signIn();
  await d.sync.flush();
  use(d);
}

beforeEach(() => {
  memory.current = new Map();
  useStore(null);
  onStorageChange(null);
});

describe('記録を合わせる', () => {
  const a: Snapshot = {
    done: { 'g3:2026-10-10': 1, 'g4:2026-10-11': 2 },
    cleared: { 'magnet-sort': 1 },
    cards: [{ id: 'l01', paid: 40 }, { id: 'l03', paid: 300 }],
    progress: { x: { sig: 's', answers: [0, 1], at: 5 } },
    notes: [note({ id: 'n-a', at: 10 }), note({ id: 'n-same', at: 20, finding: 'old' })],
  };
  const b: Snapshot = {
    done: { 'g3:2026-10-10': 2, 'free:2026-10-12': 1 },
    cleared: { 'magnet-sort': 2, 'float-heavy': 1 },
    cards: [{ id: 'l02', paid: 80 }, { id: 'l03', paid: 250 }],
    progress: { x: { sig: 's', answers: [0, 1, 2], at: 3 }, y: { sig: 't', answers: [], at: 1 } },
    notes: [note({ id: 'n-b', at: 30 }), note({ id: 'n-same', at: 25, finding: 'new' })],
  };

  it('入れかえても、くり返しても、同じ結果になる', () => {
    const ab = mergeSnapshots(a, b);
    expect(mergeSnapshots(b, a)).toEqual(ab);
    expect(mergeSnapshots(ab, a)).toEqual(ab);
    expect(mergeSnapshots(ab, ab)).toEqual(ab);
  });

  it('やりとげた記録・クリア・カード・ノートは両方を合わせる', () => {
    const ab = mergeSnapshots(a, b);
    expect(ab.done).toEqual({ 'free:2026-10-12': 1, 'g3:2026-10-10': 2, 'g4:2026-10-11': 2 });
    expect(ab.cleared).toEqual({ 'float-heavy': 1, 'magnet-sort': 2 });
    expect(ab.progress.x.answers).toEqual([0, 1, 2]);
    expect(ab.cards).toEqual([{ id: 'l01', paid: 40 }, { id: 'l02', paid: 80 }, { id: 'l03', paid: 250 }]);
    // ノートは新しい順。同じページは、あとから書いたほう
    expect(ab.notes.map((n) => n.id)).toEqual(['n-b', 'n-same', 'n-a']);
    expect(ab.notes[1].finding).toBe('new');
  });

  it(`ノートは新しいほうから ${NOTE_LIMIT} ページまで`, () => {
    const many = Array.from({ length: NOTE_LIMIT + 5 }, (_, i) => note({ id: `m${i}`, at: i }));
    const merged = mergeNotes(many, []);
    expect(merged).toHaveLength(NOTE_LIMIT);
    expect(merged[0].id).toBe(`m${NOTE_LIMIT + 4}`);
  });

  it('ミッションが作り直されていたら、あとから保存した途中経過を使う', () => {
    const older: Progress = { sig: 'old', answers: [0, 1, 2, 3], at: 1 };
    const newer: Progress = { sig: 'new', answers: [1], at: 2 };
    expect(mergeProgress(older, newer)).toEqual(newer);
  });

  it('Firestore の形にして、もどしても変わらない。形のくずれたものは受けつけない', () => {
    const doc = toAppDoc(a, 123);
    // スタンプ (activeDays) になるのは、今日のチャレンジだけ
    expect(toAppDoc(b, 0).activeDays).toEqual(['2026-10-10']);
    expect(doc.inventory).toEqual({ l01: { paid: 40 }, l03: { paid: 300 } });
    const back = fromAppDoc(JSON.parse(JSON.stringify(doc)));
    expect(back).toEqual({ ...a, progress: {} });
    expect(fromProgressDoc(toProgressDoc(a.progress.x, 0))).toEqual(a.progress.x);
    expect(fromAppDoc({ settings: { scores: { bad: 1, 'g3:2026-10-10': 'x', 'g4:2026-10-11': 2 }, notes: [{ id: 1 }, 'x'] } })).toEqual({
      ...emptySnapshot(),
      done: { 'g4:2026-10-11': 2 },
    });
    expect(fromProgressDoc({ data: { sig: 1 } })).toBeNull();
  });
});

describe('手元の記録の出し入れ', () => {
  it('取り出して入れ直しても、同じ記録になる', () => {
    complete();
    saveProgress(today, MISSION, 'sig', [1, 0]);
    const s = exportSnapshot();
    expect(Object.keys(s.done)).toEqual([`g5:${today}`]);
    expect(s.notes).toHaveLength(1);
    memory.current = new Map();
    importSnapshot(s);
    expect(exportSnapshot()).toEqual(s);
    expect(doneMark(today, 'g5')).toBe(2);
    expect(loadProgress(today, MISSION, 'sig')).toEqual([1, 0]);
    expect(loadProgress(today, MISSION, 'other')).toEqual([]);
  });
});

describe('ログインと同期', () => {
  it('ログインしなければ、Firestore には何も送らない', async () => {
    const cloud = new FakeCloud();
    const d = makeDevice(cloud);
    use(d);
    d.sync.start();
    d.auth.resolve(null);
    await d.sync.flush();
    complete();
    await d.sync.flush();
    expect(d.sync.status).toBe('signed-out');
    expect(cloud.writes).toBe(0);
  });

  it('ログインしたとき、端末の記録をアカウントにうつせる', async () => {
    const cloud = new FakeCloud();
    const d = makeDevice(cloud);
    use(d);
    complete();
    saveProgress(today, MISSION, 'sig', [1, 0]);
    await signIn(d);
    expect(d.asked).toBe(1);
    expect(currentUid()).toBe('alice');
    expect(rememberedUid()).toBe('alice');
    expect(d.sync.status).toBe('synced');
    expect(cloud.data.get('alice')?.done).toEqual({ [`g5:${today}`]: 2 });
    expect(cloud.data.get('alice')?.notes).toHaveLength(1);
    expect(cloud.data.get('alice')?.progress[id].answers).toEqual([1, 0]);
    useStore(null);
    expect(exportSnapshot()).toEqual(emptySnapshot());
  });

  it('うつさないとえらんだら、端末の記録はそのままで、アカウントには入らない', async () => {
    const cloud = new FakeCloud();
    const d = makeDevice(cloud);
    d.answer = false;
    use(d);
    complete();
    await signIn(d);
    expect(doneMark(today, 'g5')).toBe(0);
    await d.sync.signOut();
    use(d);
    expect(doneMark(today, 'g5')).toBe(2);
  });

  it('別の端末でログインすると、同じ記録でつづけられる', async () => {
    const cloud = new FakeCloud();
    const a = makeDevice(cloud);
    await signIn(a);
    saveProgress(today, MISSION, 'sig', [2, 1]);
    complete();
    await a.sync.flush();

    const b = makeDevice(cloud);
    await signIn(b);
    expect(b.asked).toBe(0);
    expect(loadProgress(today, MISSION, 'sig')).toEqual([2, 1]);
    expect(getNotes()).toHaveLength(1);
    expect(clearedMark(`${MISSION}-g5`)).toBe(2);
    expect(currentStreak(today)).toBe(1);
  });

  it('2 台で別々にやりとげた記録は、どちらも残る', async () => {
    const cloud = new FakeCloud();
    cloud.data.set('alice', { ...emptySnapshot(), done: { [`g6:${addDays(today, -1)}`]: 1 } });
    const a = makeDevice(cloud);
    await signIn(a);
    complete();
    await a.sync.flush();
    expect(Object.keys(cloud.data.get('alice')!.done).sort()).toEqual([`g5:${today}`, `g6:${addDays(today, -1)}`].sort());
    expect(currentStreak(today)).toBe(2);
  });

  it('送れなかった変更は、つながったときに送る', async () => {
    const cloud = new FakeCloud();
    const d = makeDevice(cloud);
    await signIn(d);
    cloud.fail = true;
    complete();
    await d.sync.flush();
    expect(d.sync.status).toBe('offline');
    expect(await d.sync.signOut()).toBe('unsynced');
    cloud.fail = false;
    await d.sync.flush();
    expect(d.sync.status).toBe('synced');
    expect(cloud.data.get('alice')?.done).toEqual({ [`g5:${today}`]: 2 });
  });

  it('ログアウトすると、その人の写しは端末から消え、ログインなしの記録にもどる', async () => {
    const cloud = new FakeCloud();
    const d = makeDevice(cloud);
    await signIn(d);
    complete();
    expect(await d.sync.signOut()).toBe('ok');
    use(d);
    expect(currentUid()).toBeNull();
    expect(doneMark(today, 'g5')).toBe(0);
    expect([...d.storage.keys()].filter((k) => k.includes(':u:'))).toEqual([]);
    expect(cloud.data.get('alice')?.done).toEqual({ [`g5:${today}`]: 2 });
  });

  it('交換したカードも、別の端末に引きつがれる', async () => {
    const cloud = new FakeCloud();
    const a = makeDevice(cloud);
    await signIn(a);
    complete('g5');
    complete('g6');
    expect(balance()).toBeGreaterThanOrEqual(CARDS[0].price);
    expect(buyCard(CARDS[0])).toBe(true);
    await a.sync.flush();

    const b = makeDevice(cloud);
    await signIn(b);
    expect(getCards()).toEqual([{ id: CARDS[0].id, paid: CARDS[0].price }]);
    expect(getStamps()).toEqual([today]);
  });

  it('前の日までの途中経過は、Firestore からも消す', async () => {
    const cloud = new FakeCloud();
    const old = progressId(addDays(today, -1), MISSION);
    cloud.data.set('alice', { ...emptySnapshot(), progress: { [old]: { sig: 's', answers: [0], at: 1 } } });
    const d = makeDevice(cloud);
    await signIn(d);
    expect(cloud.data.get('alice')?.progress[old]).toBeUndefined();
    expect(exportSnapshot().progress[old]).toBeUndefined();
  });
});
