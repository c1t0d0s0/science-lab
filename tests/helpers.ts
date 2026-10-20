import type { Note } from '../src/core/snapshot';

/** SVG のタグが正しく開いて閉じているかを確かめる (属性の中身までは見ない) */
export function assertWellFormed(svg: string): void {
  const fail = (why: string): never => {
    throw new Error(`SVG が正しくありません (${why}): ${svg.slice(0, 200)}`);
  };
  if (!svg.startsWith('<svg ')) fail('svg で始まっていない');
  // タグの外に < や > が残っていないこと (文字はエスケープされているはず)
  if (/[<>]/.test(svg.replace(/<[^<>]+>/g, ''))) fail('タグの外に < >');
  if (/NaN|undefined|Infinity/.test(svg)) fail('数になっていない値');
  const stack: string[] = [];
  for (const tag of svg.match(/<[^>]+>/g) ?? []) {
    const name = tag.match(/^<\/?([a-zA-Z]+)/)?.[1];
    if (!name) fail(tag);
    // 属性は 名前="値" の形だけ
    if (!/^<\/?[a-zA-Z]+( [a-zA-Z0-9:-]+="")*\s*\/?>$/.test(tag.replace(/"[^"]*"/g, '""'))) fail(tag);
    if (tag.startsWith('</')) {
      if (stack.pop() !== name) fail(tag);
    } else if (!tag.endsWith('/>')) stack.push(name!);
  }
  if (stack.length > 0) fail(`閉じていない ${stack.join(',')}`);
}

/** テスト用の localStorage / sessionStorage。current を入れかえると、別の端末になる */
export const memory = { current: new Map<string, string>() };

function fakeStorage(get: () => Map<string, string>) {
  return {
    getItem: (k: string) => get().get(k) ?? null,
    setItem: (k: string, v: string) => void get().set(k, v),
    removeItem: (k: string) => void get().delete(k),
    key: (i: number) => [...get().keys()][i] ?? null,
    get length() {
      return get().size;
    },
  };
}

export function installStorage(): void {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: fakeStorage(() => memory.current) });
}

let seq = 0;
export function note(over: Partial<Note> = {}): Note {
  seq++;
  return { id: `n${seq}`, at: 1000 + seq, kind: 'mission', level: 'g5', exp: 'pendulum', question: 'q', finding: 'f', trials: [], ...over };
}
