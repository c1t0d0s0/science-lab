import { distinct } from '../core/lab';
import { isLevel, type Level } from '../core/levels';
import { getNotes } from '../core/storage';
import type { Note } from '../core/snapshot';
import { experimentById, missionById } from '../experiments';
import { dataView } from './data';
import { h, homeButton, mark } from './dom';
import { LEVEL_LABEL, dateLabel, plain, say } from './text';

const KIND_LABEL: Record<Note['kind'], string> = { mission: 'ミッション', daily: '今日のチャレンジ', free: '自由研究' };

/** 実験ノートの 1 ページ */
function page(note: Note): HTMLElement {
  const exp = experimentById(note.exp);
  const level: Level = isLevel(note.level) ? note.level : 'g3';
  const date = new Date(note.at + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const target =
    (note.mission && missionById(note.mission)?.target) ??
    exp?.variables.map((v) => v.key).sort((a, b) => distinct(note.trials, b) - distinct(note.trials, a))[0];
  const row = (label: string, value: string | undefined, extra?: Node | null) =>
    value ? h('div', { class: 'note-row' }, h('dt', {}, label), h('dd', {}, extra ?? null, value)) : null;
  return h(
    'li',
    { class: 'note card' },
    h(
      'header',
      { class: 'note-head' },
      h('span', { class: 'note-date' }, dateLabel(date)),
      h('span', { class: 'chip chip-small' }, KIND_LABEL[note.kind]),
      h('span', { class: 'chip chip-small' }, LEVEL_LABEL[level]),
    ),
    h('h2', { class: 'note-title' }, exp ? plain(say(level, exp)) : note.exp),
    h(
      'dl',
      { class: 'note-body' },
      row('調べたこと', note.question),
      row('予想', note.prediction, note.correct === undefined ? null : mark(note.correct, 'mark mark-small')),
      row('予想の理由', note.reason),
      row('わかったこと', note.finding),
      row('実験のあとの考え', note.revised),
      row('そう考えた理由', note.reflection),
    ),
    exp && note.trials.length > 0
      ? h(
          'details',
          { class: 'note-data' },
          h('summary', {}, `実験の記録（${note.trials.length}回）`),
          dataView({ exp, level, trials: note.trials, variables: exp.variables, target, showMean: level === 'g6' }),
        )
      : null,
  );
}

export function renderNotebook(root: HTMLElement): void {
  const notes = getNotes();
  root.replaceChildren(
    h(
      'div',
      { class: 'notebook-page' },
      h('header', { class: 'bar' }, homeButton(), h('h1', {}, '実験ノート'), h('span', { class: 'bar-meta' }, `${notes.length}ページ`)),
      h(
        'main',
        { class: 'notebook' },
        notes.length === 0
          ? h('p', { class: 'section-note empty' }, 'まだノートはありません。ミッションや自由研究をやりとげると、ここに記録されます。')
          : h('ol', { class: 'notes' }, ...notes.map(page)),
        h('p', { class: 'page-foot' }, h('a', { class: 'btn btn-primary', href: '#/' }, 'ホームへ')),
      ),
    ),
  );
}
