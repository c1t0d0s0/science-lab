import { GRADE, modeOf, type Level, type Mode } from '../core/levels';
import { CHALLENGE_POINTS, FREE_POINTS, HIT_BONUS, MISSION_HIT_BONUS, MISSION_POINTS, MONTH_POINTS, WEEK_LENGTH, WEEK_POINTS } from '../core/rewards';
import type { Label } from '../experiments/types';

/** 1・2 年生には、ひらがなの文があればそちらを出す */
export const say = (level: Level, l: Label) => (GRADE[level] <= 2 && l.kana ? l.kana : l.label);

/** ふりがなの (よみ) をとった文 (読み上げやグラフの文字に使う) */
export const plain = (s: string) => s.replace(/\(([ぁ-ん]+)\)/g, '');

export const LEVEL_LABEL: Record<Level, string> = {
  g1: '1年生',
  g2: '2年生',
  g3: '3年生',
  g4: '4年生',
  g5: '5年生',
  g6: '6年生',
};

export const MODE_LABEL: Record<Mode, string> = {
  discover: 'はっけん モード',
  compare: 'くらべる モード',
  control: '条件(じょうけん)をそろえる モード',
  hypothesis: '仮説(かせつ)・検証(けんしょう) モード',
};

export const MODE_NOTE: Record<Mode, string> = {
  discover: 'さわって、ためして、ちがいを みつけよう',
  compare: '2つの条件(じょうけん)をならべて、くらべよう',
  control: '1つの条件だけを変(か)えて、ほかはそろえて調(しら)べよう',
  hypothesis: '何回もはかったデータをもとに、どこまで言えるか考えよう',
};

export const modeLabel = (level: Level) => MODE_LABEL[modeOf(level)];

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

/** 「10月12日（月）」 */
export function dateLabel(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日（${WEEKDAYS[d.getUTCDay()]}）`;
}

/** 予想の理由 (3 年生から) */
export const REASONS = [
  '前に見たり、やったりしたことがあるから',
  '習(なら)ったことから考えたから',
  'ほかの実験(じっけん)とにているから',
  'なんとなく、そう思ったから',
];

/** 実験のあとで、考えを変えた (変えなかった) 理由 */
export const REFLECT_REASONS: Record<Mode, string[]> = {
  discover: ['じっけんの けっかを みたから', 'ほかの ものと くらべたから', 'はじめから そう おもっていたから', 'まだ よく わからない'],
  compare: ['実験(じっけん)の結果(けっか)を見たから', 'AとBをくらべたから', '予想(よそう)どおりだったから', 'まだよく分(わ)からない'],
  control: ['実験(じっけん)の結果(けっか)を見たから', 'ほかの条件(じょうけん)をそろえてくらべたら分かったから', '予想(よそう)どおりだったから', 'まだよく分(わ)からない'],
  hypothesis: ['何回(なんかい)かはかった平均(へいきん)を見たから', 'ほかの条件(じょうけん)をそろえてくらべたら分かったから', '予想どおりだったから', 'もっとデータがほしい'],
};

/** 画面の文 (学年によって、ひらがなにする) */
export function ui(level: Level) {
  const low = GRADE[level] <= 2;
  return {
    question: low ? 'しらべる こと' : '調(しら)べること',
    predict: low ? 'よそう しよう' : '予想(よそう)しよう',
    predictNote: low ? 'どうなると おもう？' : '実験(じっけん)の前に、結果(けっか)を予想しよう',
    reason: '予想(よそう)の理由(りゆう)は？',
    decide: low ? 'これに きめた！' : '予想を決(き)める',
    yourPrediction: low ? 'きみの よそう' : 'きみの予想(よそう)',
    experiment: low ? 'じっけん' : '実験(じっけん)',
    run: low ? 'やってみる！' : '実験する',
    runBoth: 'AとBを 実験(じっけん)する',
    record: low ? 'けっか' : '記録(きろく)',
    noTrials: low ? 'まだ じっけんして いないよ' : 'まだ実験(じっけん)していません',
    summarize: low ? 'まとめる' : '結果(けっか)をまとめる',
    needMore: (n: number) => (low ? `あと ${n}しゅるい ためしてみよう` : `あと${n}通(とお)り ためしてみよう`),
    needRepeat: (n: number) => `同じ条件(じょうけん)で${n}回(かい)ずつ はかろう`,
    result: low ? 'わかった こと' : 'わかったこと',
    hit: low ? 'よそう どおり！' : '予想(よそう)どおり！',
    miss: low ? 'よそうと ちがった！' : '予想(よそう)とちがった！',
    answerWas: (s: string) => (low ? `こたえ: ${s}` : `正解(せいかい): ${s}`),
    conclusion: 'このデータから言(い)えることは？',
    reflect: low ? 'じっけんの あとで、もう いちど こたえよう' : '実験(じっけん)のあとで、もう一度(いちど)答(こた)えよう',
    reflectNote: low ? 'じっけんの けっかを みて、こたえを えらぼう。よそうと ちがっても いいよ' : '実験の結果を見て、答えをえらぼう。予想と変えてもいいよ',
    reflectChanged: (changed: boolean) => (low ? (changed ? '（よそうから かえた）' : '（よそうと おなじ）') : changed ? '（予想から考えを変えた）' : '（予想と同じ）'),
    reflectWhy: low ? 'どうして そう おもった？' : 'そう考えた理由(りゆう)は？',
    finish: low ? 'ノートに かく' : '実験ノートにまとめる',
    again: low ? 'もう いちど' : 'もう一度(いちど)',
    next: low ? 'ほかの じっけん' : 'ほかの実験へ',
    notebook: '実験(じっけん)ノート',
    hint: low ? 'ヒント' : 'ヒント',
  };
}

export const HOWTO = [
  '学年をえらんで、ミッションにちょうせんしよう。「調べること」を読んで、まず結果を予想します。',
  '条件を変えて実験すると、結果が表とグラフに記録されます。たくさん実験して、きまりを見つけよう。',
  '1・2年生は「はっけん」、3・4年生は「くらべる」、5年生は「条件をそろえる」、6年生は「仮説・検証」。学年が上がると、考え方もステップアップします。',
  '実験のあとは、予想と結果をくらべて、考えを変えた理由をふりかえろう。実験ノートに残ります。',
  '「自由研究」では、何を調べるかを自分で決められます。',
  '今日のチャレンジをやりとげるとスタンプがもらえます。ポイントをためて、柴犬（しばいぬ）のカードを集めよう。',
  '記録は、この端末（たんまつ）のブラウザにほぞんされます。Googleでログインすると、ほかの端末でも同じ記録でつづけられます。',
];

const num = (n: number) => n.toLocaleString('ja-JP');

/** スタンプカード・ポイント・柴犬カードの文言 */
export const REWARD = {
  goHome: 'ホームへ',
  stampTitle: 'スタンプカード',
  stampMonth: (month: number) => `${month}月`,
  stampDayLabel: (day: number, stamped: boolean) => `${day}日${stamped ? ' スタンプあり' : ''}`,
  stampRun: (run: number, left: number) =>
    run === 0
      ? `今日のチャレンジをやりとげると、スタンプがもらえます。${WEEK_LENGTH}日つづけると${num(WEEK_POINTS)}pt！`
      : `${run}日つづいています。あと${left}日で${num(WEEK_POINTS)}pt！`,
  stampRule: `今日のチャレンジは${CHALLENGE_POINTS}pt（予想が当たれば、さらに${HIT_BONUS}pt）。ミッションをはじめてクリアすると${MISSION_POINTS}pt（予想が当たれば+${MISSION_HIT_BONUS}pt）、自由研究は1日${FREE_POINTS}pt。スタンプは1日1個で、${WEEK_LENGTH}日つづけるたびに${num(WEEK_POINTS)}pt、1日から月のさいごの日まで全部そろうと、さらに${num(MONTH_POINTS)}pt。`,
  rewardPoints: (points: number) => `+${num(points)}pt`,
  rewardWeek: (run: number) => `${run}日つづいた！ +${num(WEEK_POINTS)}pt`,
  rewardMonth: `今月のスタンプが全部そろった！ +${num(MONTH_POINTS)}pt`,
  stampDone: '今日のスタンプをおしたよ',
  points: (n: number) => `${num(n)}pt`,
  pointsLabel: '持っているポイント',
  rewardLinks: 'スタンプカードと柴犬カード',
  cardsTitle: '柴犬カード',
  cardsLead: 'ポイントをためて、柴犬（しばいぬ）のカードを集めよう。',
  cardsOwned: (n: number, total: number) => `${n} / ${total}まい`,
  cardGet: 'ゲットする',
  cardShort: (n: number) => `あと${num(n)}pt`,
  cardConfirm: (price: number) => `${num(price)}ptを使って、このカードをゲットしますか？`,
  cardBackLabel: (price: number) => `まだ持っていないカード。${num(price)}ptでゲットできる`,
};

/** アカウント欄の文言 */
export const ACCOUNT = {
  title: '記録のほぞん',
  note: 'Googleでログインすると、ほかのブラウザや端末（たんまつ）でも、同じ記録でつづけられます。ログインしなくても使えます。',
  signIn: 'Googleでログイン',
  signedIn: 'ログイン中',
  signOut: 'ログアウト',
  loading: 'たしかめています…',
  saving: 'ほぞん中…',
  saved: 'ほぞんずみ',
  offline: 'まだほぞんできていません。つながったらほぞんします。',
  askMigrate:
    'この端末の記録を、アカウントにうつしますか？\n\n「OK」… うつす（アカウントの記録と合わせます）\n「キャンセル」… うつさない（端末の記録はそのままのこります）',
  signOutUnsynced: 'まだほぞんできていない記録があります。今ログアウトすると、その分はなくなります。ログアウトしますか？',
  signInFailed: 'ログインできませんでした。もういちどためしてください。',
};
