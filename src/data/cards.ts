/** 柴犬の絵柄の指定。指定しない項目は、ホームの柴犬 (赤しば) と同じになる */
export interface Look {
  fur?: string;
  light?: string;
  pink?: string;
  /** まゆの丸いもようの色 (黒しばなど) */
  brow?: string;
  /** 目に色をつける (毛の色が暗いときなど) */
  eyeColor?: string;
  eyes?: 'open' | 'wink' | 'sleep' | 'happy' | 'sparkle' | 'brave';
  mouth?: 'tongue' | 'smile' | 'open';
  items?: Item[];
}

export type Item =
  | 'ribbon'
  | 'glasses'
  | 'pencil'
  | 'hat'
  | 'scarf'
  | 'flower'
  | 'flask'
  | 'headband'
  | 'magnifier'
  | 'cap'
  | 'bulb'
  | 'sprout'
  | 'doctor'
  | 'crown'
  | 'zzz'
  | 'goggles'
  | 'coat'
  | 'magnet'
  | 'moon'
  | 'stopwatch'
  | 'testtube';

/** カードの「観察まど」の中の背景。どれも実験にちなんだもよう */
export type Background =
  | 'graph'
  | 'beakers'
  | 'magnetic'
  | 'circuit'
  | 'pendulum'
  | 'sprouts'
  | 'bubbles'
  | 'sunrays'
  | 'litmus'
  | 'moonphase'
  | 'prism'
  | 'galaxy'
  | 'atoms';

/** カードのランク。まどのふちと、カードの地の色が変わる */
export type Frame = 'bronze' | 'silver' | 'gold';

export interface Card {
  id: string;
  /** 3 年生でも読めるよう、漢字は 3 年生までに習うものだけ */
  name: string;
  /** カードの上のタブに書く、実験の分野 */
  field: string;
  price: number;
  look: Look;
  bg: Background;
  frame: Frame;
}

/**
 * 値段の安い順。合計は 28,420pt。
 * - 毎日 1 つの学年の今日のチャレンジをやりとげる人が、はじめの 5 枚を 2 週間ほどで手に入れられる
 *   (1 日 20〜30pt と、7 日つづくたびの 1000pt。ミッションのクリアでも少しずつたまる)
 * - そのあとは、1 枚ごとに少しずつ時間がかかる
 * - 全部集めるには、「1 か月そろった」(5000pt) が何回かいる
 */
export const CARDS: Card[] = [
  { id: 'l01', name: 'けんきゅうせい しばいぬ', field: 'きろく', price: 40, look: { items: ['pencil'] }, bg: 'graph', frame: 'bronze' },
  { id: 'l02', name: 'ゴーグル しばいぬ', field: 'あんぜん', price: 80, look: { items: ['goggles'], mouth: 'smile' }, bg: 'beakers', frame: 'bronze' },
  { id: 'l03', name: 'じしゃく しばいぬ', field: 'じしゃく', price: 300, look: { items: ['magnet'], eyes: 'happy', mouth: 'open' }, bg: 'magnetic', frame: 'bronze' },
  { id: 'l04', name: 'まめ電球 しばいぬ', field: 'でんき', price: 500, look: { items: ['bulb'], eyes: 'sparkle', mouth: 'smile' }, bg: 'circuit', frame: 'bronze' },
  { id: 'l05', name: 'ふりこ しばいぬ', field: 'ふりこ', price: 800, look: { items: ['stopwatch'], eyes: 'brave', mouth: 'smile' }, bg: 'pendulum', frame: 'bronze' },
  { id: 'l06', name: 'たねまき しばいぬ', field: 'しょくぶつ', price: 1000, look: { items: ['sprout'], eyes: 'wink', mouth: 'open', fur: '#e8b06c' }, bg: 'sprouts', frame: 'bronze' },
  { id: 'l07', name: 'あわあわ しばいぬ', field: 'すいようえき', price: 1100, look: { items: ['flask'], eyes: 'happy', mouth: 'tongue' }, bg: 'bubbles', frame: 'bronze' },
  { id: 'l08', name: 'かんさつ しばいぬ', field: 'ひかり', price: 1200, look: { items: ['cap', 'magnifier'], mouth: 'smile', fur: '#d99a55' }, bg: 'sunrays', frame: 'bronze' },
  { id: 'l09', name: 'リトマス しばいぬ', field: 'すいようえき', price: 1300, look: { items: ['testtube', 'glasses'], mouth: 'smile' }, bg: 'litmus', frame: 'bronze' },
  { id: 'l10', name: 'お月見 しばいぬ', field: 'てんたい', price: 1400, look: { items: ['moon'], eyes: 'sleep', mouth: 'smile', fur: '#cf8f4a' }, bg: 'moonphase', frame: 'bronze' },
  { id: 'l11', name: 'プリズム しばいぬ', field: 'ひかり', price: 1500, look: { items: ['goggles'], eyes: 'sparkle', mouth: 'open', fur: '#f2c787' }, bg: 'prism', frame: 'silver' },
  { id: 'l12', name: 'ひらめき 研究いん', field: 'でんき', price: 1600, look: { items: ['coat', 'bulb'], eyes: 'sparkle', mouth: 'open' }, bg: 'circuit', frame: 'silver' },
  { id: 'l13', name: '白い 研究いん', field: 'かがく', price: 1700, look: { fur: '#f6f1e6', light: '#ffffff', pink: '#f9c9c0', brow: '#ffffff', items: ['coat', 'testtube'], mouth: 'smile' }, bg: 'beakers', frame: 'silver' },
  { id: 'l14', name: '黒い 天体はかせ', field: 'てんたい', price: 1800, look: { fur: '#3b3d4c', light: '#f6ead2', pink: '#b98d7c', brow: '#d9a55b', eyeColor: '#f6ead2', mouth: 'smile', items: ['moon', 'coat'] }, bg: 'galaxy', frame: 'silver' },
  { id: 'l15', name: 'じっけん リーダー', field: 'すいようえき', price: 1900, look: { items: ['coat', 'goggles', 'flask'], eyes: 'brave', mouth: 'open' }, bg: 'bubbles', frame: 'silver' },
  { id: 'l16', name: 'そくてい 名人', field: 'きろく', price: 2000, look: { items: ['headband', 'stopwatch'], eyes: 'brave', mouth: 'smile', fur: '#d99a55' }, bg: 'graph', frame: 'silver' },
  { id: 'l17', name: '電じしゃく はかせ', field: 'でんき', price: 2200, look: { items: ['coat', 'goggles', 'magnet'], eyes: 'sparkle', mouth: 'smile' }, bg: 'atoms', frame: 'gold' },
  { id: 'l18', name: '大はかせ しばいぬ', field: 'りか', price: 2400, look: { items: ['coat', 'doctor', 'glasses'], eyes: 'sparkle', mouth: 'smile', fur: '#e6c59a', light: '#fffaf0' }, bg: 'galaxy', frame: 'gold' },
  { id: 'l19', name: 'にじいろ しばいぬ', field: 'ひかり', price: 2600, look: { items: ['flower', 'magnifier'], eyes: 'happy', mouth: 'open', fur: '#f2c787' }, bg: 'sunrays', frame: 'gold' },
  { id: 'l20', name: 'でんせつの はかせ', field: 'りか', price: 3000, look: { items: ['crown', 'coat', 'flask'], eyes: 'sparkle', mouth: 'smile', fur: '#eab65c' }, bg: 'atoms', frame: 'gold' },
];
