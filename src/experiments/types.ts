import type { Level } from '../core/levels';
import type { Rng } from '../core/rng';
import type { Conditions } from '../core/snapshot';

export type { Conditions } from '../core/snapshot';

/**
 * 画面に出す文。「漢字(かんじ)」と書くとふりがなが付く (ui/dom.ts の rubyHtml)。
 * kana があれば、1・2 年生にはそちらを出す。
 */
export interface Label {
  label: string;
  kana?: string;
}

export interface RangeVar extends Label {
  key: string;
  kind: 'range';
  min: number;
  max: number;
  step: number;
  unit: string;
  initial: number;
}

export interface Option extends Label {
  value: string;
}

export interface ChoiceVar extends Label {
  key: string;
  kind: 'choice';
  options: Option[];
  initial: string;
}

export type Variable = RangeVar | ChoiceVar;

/** 実験の結果 (はかるもの) */
export type Measure =
  | (Label & { kind: 'number'; unit: string; digits: number })
  | (Label & { kind: 'category'; options: Option[] });

export interface Experiment extends Label {
  id: string;
  /** 一覧に出す、ひとことの説明 */
  summary: string;
  kanaSummary?: string;
  /** 実験のしかた (どんな道具を、どうつないで・置いて、何をはかるか)。問いを読む前提として、ミッションの上に出す */
  setup: string;
  kanaSetup?: string;
  variables: Variable[];
  measure: Measure;
  /**
   * 条件から結果を出す。rng をわたすと、はかるときのばらつき (6 年生むけ) が入る。
   * 同じ条件・rng なしなら、いつも同じ結果になる
   */
  simulate(c: Conditions, rng?: Rng): number | string;
  /**
   * 実験のようすの図 (SVG)。result は結果 (まだ実験していなければ null)、
   * p は実験のアニメーションの進み具合 (0〜1)
   */
  scene(c: Conditions, result: number | string | null, p: number): string;
  /** アニメーションの長さ (ミリ秒) */
  duration: number;
}

/** 「まとめる」ために必要な実験 */
export interface Need {
  /** この条件を何通りためしたか */
  key: string;
  distinct: number;
  /** この条件のときの実験だけを数える */
  where?: Partial<Conditions>;
  /** この値のどれかをためした実験だけを数える */
  among?: (number | string)[];
  /** この結果になった実験だけを数える */
  result?: number | string;
  /** false なら、条件をいくつ変えてもよい (組み合わせからきまりを見つけるとき) */
  fair?: boolean;
  /** 同じ条件で何回ずつはかったか (6 年生むけ。ばらつきがあるとき) */
  repeat?: number;
}

/** データから言えることの選択肢 (6 年生むけ) */
export interface Conclusion {
  text: string;
  ok: boolean;
  /** えらんだあとに出す説明 */
  why: string;
}

export interface Mission {
  id: string;
  exp: string;
  levels: Level[];
  /** 調べること */
  question: string;
  /** 予想の選択肢 */
  choices: string[];
  answer: number;
  /** 調べる条件 (条件をそろえているかのチェックと、グラフの横じくに使う) */
  target?: string;
  /** はじめの条件 */
  start?: Partial<Conditions>;
  /** このミッションで出す条件 (なければ全部) */
  show?: string[];
  /** 変えられない条件 (見せるけれど、動かせない) */
  lock?: string[];
  need: Need;
  /** 実験のあとに出す「わかったこと」 */
  finding: string;
  /** ミッションごとのヒント */
  hint?: string;
  /** 6 年生むけ: データから言えること */
  conclusions?: Conclusion[];
  /** 6 年生むけ: はかるたびに結果がばらつく */
  noise?: boolean;
}
