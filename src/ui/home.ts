import { dailyMission } from '../core/daily';
import { jstDate } from '../core/date';
import { GRADE, LEVELS, modeOf, type Level } from '../core/levels';
import { balance, clearedMark, currentStreak, doneMark, getNotes, pruneOld } from '../core/storage';
import { EXPERIMENTS, FIELDS, MISSIONS, experimentById, experimentsFor, missionsFor } from '../experiments';
import { accountBox } from './account';
import { h, hanamaru, homeButton, mark, withRuby } from './dom';
import { thumbnail } from './lab';
import { guide, shiba } from './shiba';
import { EXAM_BADGE, FIELD_LABEL, HOWTO, LEVEL_LABEL, MODE_LABEL, MODE_NOTE, REWARD, dateLabel, say } from './text';

/** 方眼ノートのマスに「理」「科」と書いた、タイトルのかざり */
function crest(): HTMLElement {
  const cells = ['', '理', '', '実', '科', '験', '', '室', ''];
  return h(
    'div',
    { class: 'crest', 'aria-hidden': 'true' },
    ...cells.map((ch, i) => (ch ? h('span', { class: i === 4 ? 'crest-cell crest-cross' : 'crest-cell' }, ch) : h('span'))),
  );
}

function gradeCard(level: Level, today: string): HTMLElement {
  const mission = dailyMission(today, level);
  const exp = experimentById(mission.exp)!;
  const done = doneMark(today, level);
  const mode = modeOf(level);
  return h(
    'section',
    { class: `grade-card mode-${mode}`, 'aria-labelledby': `grade-${level}` },
    h(
      'div',
      { class: 'grade-text' },
      h('h2', { id: `grade-${level}`, class: 'grade-name' }, LEVEL_LABEL[level]),
      withRuby('p', 'grade-mode', MODE_LABEL[mode]),
      h(
        'p',
        { class: done ? 'daily-status daily-status-done' : 'daily-status' },
        done ? mark(true, 'mark mark-small') : null,
        withRuby('span', '', `${GRADE[level] <= 2 ? 'きょう' : '今日(きょう)'}: ${say(level, exp)}`),
      ),
    ),
    done === 2 ? hanamaru('hanamaru hanamaru-daily') : null,
    h(
      'div',
      { class: 'grade-actions' },
      h('a', { class: 'btn btn-primary', href: `#/daily/${level}` }, done ? '見直す' : 'チャレンジ'),
      h('a', { class: 'btn', href: `#/${level}` }, '実験をえらぶ'),
    ),
  );
}

export function renderHome(root: HTMLElement): void {
  const today = jstDate();
  pruneOld(today);
  const streak = currentStreak(today);
  root.replaceChildren(
    h(
      'main',
      { class: 'home' },
      h(
        'div',
        { class: 'home-main' },
        h(
          'header',
          { class: 'hero' },
          crest(),
          h('div', { class: 'hero-text' }, h('h1', { class: 'brand' }, '理科ラボ'), h('p', { class: 'lead' }, '予想して、実験して、たしかめよう。小学生のための理科の実験室。')),
          shiba(),
        ),
        h(
          'section',
          { class: 'today', 'aria-labelledby': 'today-title' },
          h('h2', { id: 'today-title' }, '今日のチャレンジ'),
          h('p', { class: 'daily-date' }, dateLabel(today)),
          h('p', { class: 'section-note' }, streak > 1 ? `${streak}日つづけて、チャレンジしています。その調子！` : '自分の学年をえらぼう。ほかの学年にちょうせんしてもOK。'),
        ),
        h('div', { class: 'grades' }, ...LEVELS.map((level) => gradeCard(level, today))),
        h(
          'nav',
          { class: 'reward-links', 'aria-label': REWARD.rewardLinks },
          h('p', { class: 'points' }, h('span', { class: 'points-label' }, REWARD.pointsLabel), h('b', { class: 'points-num' }, REWARD.points(balance()))),
          h(
            'div',
            { class: 'reward-buttons' },
            h('a', { class: 'btn', href: '#/notebook' }, `実験ノート（${getNotes().length}）`),
            h('a', { class: 'btn', href: '#/stamps' }, REWARD.stampTitle),
            h('a', { class: 'btn', href: '#/cards' }, REWARD.cardsTitle),
          ),
        ),
      ),
      h(
        'aside',
        { class: 'home-side' },
        accountBox(),
        h(
          'section',
          { class: 'fields', 'aria-labelledby': 'fields-title' },
          h('h2', { id: 'fields-title' }, '今日のチャレンジの実験'),
          h('p', { class: 'fields-note' }, `ぜんぶで${EXPERIMENTS.length}の実験・${MISSIONS.length}のミッション。ほかの実験は、学年のページからえらべます。`),
          ...LEVELS.map((level) => {
            const exp = experimentById(dailyMission(today, level).exp)!;
            const done = doneMark(today, level) > 0;
            return h(
              'div',
              { class: 'field-group' },
              h('h3', { class: 'field-title' }, h('a', { href: `#/${level}` }, LEVEL_LABEL[level])),
              h(
                'a',
                { class: `chip today-exp field-${exp.field}`, href: `#/daily/${level}` },
                done ? mark(true, 'mark mark-small') : null,
                withRuby('span', '', say(level, exp)),
                done ? h('span', { class: 'sr-only' }, '（やりとげた）') : null,
              ),
            );
          }),
        ),
        h(
          'details',
          { class: 'howto' },
          h('summary', {}, 'あそびかた'),
          h('ul', {}, ...HOWTO.map((item) => h('li', {}, item))),
        ),
      ),
    ),
  );
}

/** 学年のページ。今日のチャレンジと、実験・ミッションの一覧 */
export function renderGrade(root: HTMLElement, level: Level): void {
  const today = jstDate();
  const mode = modeOf(level);
  const low = GRADE[level] <= 2;
  const daily = dailyMission(today, level);
  const done = doneMark(today, level);
  const dailyExp = experimentById(daily.exp)!;
  const exps = experimentsFor(level);
  const fields = FIELDS.filter((f) => exps.some((e) => e.field === f));

  const expCard = (expId: string) => {
    const exp = experimentById(expId)!;
    const missions = missionsFor(level, expId);
    return h(
      'li',
      { class: 'exp-card card' },
      h('div', { class: 'exp-thumb', 'aria-hidden': 'true' }, thumbnail(exp)),
      h(
        'div',
        { class: 'exp-body' },
        withRuby('h3', 'exp-title', say(level, exp)),
        withRuby('p', 'exp-summary', low && exp.kanaSummary ? exp.kanaSummary : exp.summary),
        h(
          'ul',
          { class: 'mission-list' },
          ...missions.map((m) => {
            const c = clearedMark(m.id);
            return h(
              'li',
              {},
              h(
                'a',
                { class: `mission-link${c ? ' is-cleared' : ''}`, href: `#/lab/${level}/${m.id}` },
                c ? mark(true, 'mark mark-small') : h('span', { class: 'mission-dot', 'aria-hidden': 'true' }),
                withRuby('span', 'mission-q-text', m.question),
                m.exam ? h('span', { class: 'chip chip-small chip-exam', title: '中学受験に出る発展の内容' }, EXAM_BADGE) : null,
                c ? h('span', { class: 'sr-only' }, '（クリアずみ）') : null,
              ),
            );
          }),
        ),
        h('a', { class: 'btn btn-free', href: `#/free/${level}/${expId}` }, ...[withRuby('span', '', low ? 'じゆうに しらべる' : '自由研究(じゆうけんきゅう)')]),
      ),
    );
  };

  root.replaceChildren(
    h(
      'div',
      { class: 'grade-page' },
      h('header', { class: 'bar' }, homeButton(), h('h1', {}, LEVEL_LABEL[level]), h('span', { class: 'bar-meta' }, '')),
      h(
        'main',
        { class: 'grade-main' },
        guide(`${MODE_LABEL[mode]}：${MODE_NOTE[mode]}`, { cls: 'grade-guide' }),
        h(
          'section',
          { class: 'daily-card card' },
          h('p', { class: 'card-kicker' }, low ? 'きょうの チャレンジ' : '今日のチャレンジ', ' ・ ', dateLabel(today)),
          withRuby('h2', 'mission-text', daily.question),
          withRuby('p', 'section-note', say(level, dailyExp)),
          h('p', { class: 'card-actions' }, done ? mark(true, 'mark mark-small') : null, h('a', { class: 'btn btn-primary', href: `#/daily/${level}` }, done ? '見直す' : 'チャレンジする')),
        ),
        withRuby('h2', 'section-title', low ? 'じっけんを えらぼう' : '実験(じっけん)をえらぼう'),
        fields.length > 1
          ? h(
              'nav',
              { class: 'field-nav', 'aria-label': '分野' },
              ...fields.map((f) => {
                const a = withRuby('a', `chip field-chip field-${f}`, say(level, FIELD_LABEL[f]));
                a.setAttribute('href', `#field-${f}`);
                a.addEventListener('click', (e) => {
                  // ハッシュはページの切りかえに使っているので、ここではスクロールだけする
                  e.preventDefault();
                  document.getElementById(`field-${f}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
                return a;
              }),
            )
          : null,
        ...fields.map((f) =>
          h(
            'section',
            { class: `field-section field-${f}`, id: `field-${f}`, 'aria-labelledby': `field-${f}-title` },
            withRuby('h3', 'field-heading', say(level, FIELD_LABEL[f])),
            h('ul', { class: 'exp-list' }, ...exps.filter((e) => e.field === f).map((e) => expCard(e.id))),
          ),
        ),
      ),
    ),
  );
}
