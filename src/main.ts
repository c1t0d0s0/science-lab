import './styles.css';
import { restoreStore, startCloud } from './cloud';
import { dailyMission } from './core/daily';
import { jstDate } from './core/date';
import { isLevel } from './core/levels';
import { experimentById, missionById } from './experiments';
import { renderCards } from './ui/cards';
import { renderFree } from './ui/free';
import { renderGrade, renderHome } from './ui/home';
import { renderLab } from './ui/lab';
import { renderNotebook } from './ui/notebook';
import { renderStamps } from './ui/stamps';
import { ACCOUNT } from './ui/text';

// 前にログインしていた人がいれば、通信を待たずに、この端末に残っているその人の写しで画面を出す
restoreStore();

const app = document.getElementById('app')!;
let cleanup: (() => void) | null = null;
let shownDate = jstDate();

/** 実験をしている画面か (日付が変わっても、かき直さない) */
const inLab = () => /^#\/(lab|daily|free)\//.test(location.hash);

function route(): void {
  cleanup?.();
  cleanup = null;
  shownDate = jstDate();
  const hash = location.hash;
  let m: RegExpMatchArray | null;

  // #/g3 学年のページ / #/lab/g3/<ミッション> / #/daily/g3 今日のチャレンジ / #/free/g3/<実験> 自由研究
  if ((m = hash.match(/^#\/(g[1-6])$/)) && isLevel(m[1])) renderGrade(app, m[1]);
  else if ((m = hash.match(/^#\/lab\/(g[1-6])\/([a-z0-9-]+)$/)) && isLevel(m[1]) && missionById(m[2])?.levels.includes(m[1]))
    cleanup = renderLab(app, m[1], missionById(m[2])!);
  else if ((m = hash.match(/^#\/daily\/(g[1-6])$/)) && isLevel(m[1])) cleanup = renderLab(app, m[1], dailyMission(shownDate, m[1]), { daily: true });
  else if ((m = hash.match(/^#\/free\/(g[1-6])\/([a-z0-9-]+)$/)) && isLevel(m[1]) && experimentById(m[2])) cleanup = renderFree(app, m[1], experimentById(m[2])!);
  else if (hash === '#/notebook') renderNotebook(app);
  else if (hash === '#/cards') renderCards(app);
  else if (hash === '#/stamps') renderStamps(app);
  else renderHome(app);
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
// 画面を開いたまま日付が変わっていたら、もどってきたときに新しい日の画面にする
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && shownDate !== jstDate() && !inLab()) route();
});
route();

// 最初の画面を出してから、ログインと Firestore の準備をする (Firebase の設定がないビルドでは何もしない)
void startCloud({
  // ログインやほぞんの状態が変わった。状態を出しているのはホームだけ
  onStatus: () => {
    if (app.querySelector('.home')) renderHome(app);
  },
  // Firestore から取りこんで、手元の記録が変わった。実験中でなければ、今の画面をかき直す
  onData: () => {
    if (!inLab()) route();
  },
  askMigrate: () => confirm(ACCOUNT.askMigrate),
});
