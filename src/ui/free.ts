import { jstDate } from '../core/date';
import { adviceAfter, changedKeys, distinct, fairGroup, initialConditions, trend } from '../core/lab';
import { GRADE, modeOf, type Level } from '../core/levels';
import type { Conditions, Note, Trial } from '../core/snapshot';
import { TRIAL_LIMIT } from '../core/snapshot';
import { balance, finishFree, newNoteId } from '../core/storage';
import type { Experiment, Variable } from '../experiments/types';
import { conditionPanel } from './controls';
import { dataView } from './data';
import { figure, h, homeButton, mark, withRuby } from './dom';
import { guide } from './shiba';
import { LEVEL_LABEL, REWARD, plain, say } from './text';

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 自由研究で、えらべる「わかったこと」。正しいかは、実験の記録から決める */
function statements(exp: Experiment, v: Variable, level: Level): { text: string; kind: 'up' | 'down' | 'flat' | 'change' }[] {
  const x = plain(say(level, v));
  const y = plain(say(level, exp.measure));
  if (exp.measure.kind === 'number' && v.kind === 'range') {
    return [
      { text: `${x}を大きくすると、${y}は大きくなる`, kind: 'up' },
      { text: `${x}を大きくすると、${y}は小さくなる`, kind: 'down' },
      { text: `${x}を変えても、${y}は変わらない`, kind: 'flat' },
    ];
  }
  return [
    { text: `${x}によって、${y}は変わる`, kind: 'change' },
    { text: `${x}を変えても、${y}は変わらない`, kind: 'flat' },
  ];
}

/** 記録から、ほんとうはどうだったか */
function truth(exp: Experiment, v: Variable, trials: Trial[]): 'up' | 'down' | 'flat' | 'change' {
  if (exp.measure.kind === 'number' && v.kind === 'range') {
    const tr = trend(trials, v.key);
    return tr === 'mixed' ? 'change' : tr;
  }
  if (exp.measure.kind === 'number') return trend(trials, v.key) === 'flat' ? 'flat' : 'change';
  const results = new Set(trials.map((t) => t.v));
  return results.size > 1 ? 'change' : 'flat';
}

/** 自由研究。調べる条件を自分で決めて、実験し、わかったことをノートにまとめる */
export function renderFree(root: HTMLElement, level: Level, exp: Experiment): () => void {
  const mode = modeOf(level);
  const low = GRADE[level] <= 2;
  const date = jstDate();
  let alive = true;
  let target: Variable | null = exp.variables.length === 1 ? exp.variables[0] : null;
  let prediction = -1;
  let trials: Trial[] = [];
  const cond: Conditions = initialConditions(exp);
  let last: number | string | null = null;
  let pick = -1;
  let saved: { points: number } | null = null;
  const keys = exp.variables.map((v) => v.key);
  const page = h('div', { class: 'lab-page free-page' });
  root.replaceChildren(page);
  const stage = figure(exp.scene(cond, null, 0));
  let advice = guide(low ? 'なにを かえて みるか、きめよう' : '何を変えて調べるか、自分で決めよう', { cls: 'advice' });
  const dataSlot = h('div', { class: 'data-slot' });

  const setAdvice = (text: string, warn = false) => {
    const next = guide(text, { warn, cls: 'advice' });
    advice.replaceWith(next);
    advice = next;
  };

  /** 調べる条件のほかをそろえた記録 (5・6 年生むけ。それより下の学年は全部) */
  const fair = () => (target && (mode === 'control' || mode === 'hypothesis') ? fairGroup(trials, target.key, keys) : trials);

  function chooseTarget(): HTMLElement {
    const card = h('section', { class: 'card' }, withRuby('h2', 'card-title', low ? 'なにを かえて みる？' : '1. 調(しら)べる条件(じょうけん)をえらぼう'));
    const list = h('div', { class: 'cond-choices' });
    for (const v of exp.variables) {
      const b = withRuby('button', `choice-btn${target?.key === v.key ? ' is-on' : ''}`, say(level, v));
      b.setAttribute('type', 'button');
      b.setAttribute('aria-pressed', String(target?.key === v.key));
      b.addEventListener('click', () => {
        target = v;
        prediction = -1;
        trials = [];
        pick = -1;
        render();
      });
      list.append(b);
    }
    card.append(list);
    if (target) {
      card.append(withRuby('p', 'mission-text', `${say(level, target)}を変(か)えると、${say(level, exp.measure)}はどうなるか？`));
    }
    return card;
  }

  function predictCard(v: Variable): HTMLElement {
    const card = h('section', { class: 'card' }, withRuby('h2', 'card-title', low ? 'よそう' : '2. 予想(よそう)しよう'));
    const opts = statements(exp, v, level);
    const list = h('div', { class: 'answer-choices', role: 'radiogroup' });
    opts.forEach((o, i) => {
      const b = h('button', { type: 'button', class: 'answer-btn', role: 'radio', 'aria-checked': String(prediction === i) }, o.text);
      b.addEventListener('click', () => {
        prediction = i;
        render();
      });
      list.append(b);
    });
    card.append(list);
    return card;
  }

  async function run(btn: HTMLButtonElement): Promise<void> {
    btn.disabled = true;
    const r = exp.simulate(cond, mode === 'hypothesis' ? Math.random : undefined);
    last = r;
    const start = performance.now();
    await new Promise<void>((resolve) => {
      if (reduceMotion()) {
        stage.innerHTML = exp.scene(cond, r, 1);
        return resolve();
      }
      const tick = (now: number) => {
        if (!alive) return resolve();
        const p = Math.min(1, (now - start) / exp.duration);
        stage.innerHTML = exp.scene(cond, r, p);
        if (p < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    if (!alive) return;
    btn.disabled = false;
    trials = [...trials, { c: { ...cond }, v: r }];
    const a = adviceAfter({ mode, trials, keys, target: target!.key, targetLabel: plain(say(level, target!)), labelOf: (k) => plain(say(level, exp.variables.find((x) => x.key === k)!)), noise: mode === 'hypothesis' });
    if (a) setAdvice(a.text, a.warn);
    refresh();
  }

  function refresh(): void {
    dataSlot.replaceChildren(trials.length ? dataView({ exp, level, trials, variables: exp.variables, target: target!.key, showMean: mode === 'hypothesis' }) : withRuby('p', 'section-note', 'まだ実験(じっけん)していません'));
    page.querySelector('.free-conclude')?.replaceWith(conclude());
  }

  function bench(v: Variable): HTMLElement {
    const btn = h('button', { type: 'button', class: 'btn btn-run' }, ...[withRuby('span', '', low ? 'やってみる！' : '実験(じっけん)する')]);
    btn.addEventListener('click', () => void run(btn));
    stage.innerHTML = exp.scene(cond, last, last === null ? 0 : 1);
    refresh();
    return h(
      'section',
      { class: 'bench' },
      h('div', { class: 'bench-stage' }, h('div', { class: 'stage' }, stage), advice),
      h(
        'div',
        { class: 'bench-panel card' },
        withRuby('h2', 'card-title', low ? 'じっけん' : '3. 実験(じっけん)しよう'),
        conditionPanel({
          level,
          variables: exp.variables,
          values: cond,
          target: v.key,
          onChange: (key, value) => {
            cond[key] = value;
            last = null;
            stage.innerHTML = exp.scene(cond, null, 0);
          },
        }),
        h('div', { class: 'run-row' }, btn),
      ),
      h('div', { class: 'bench-data card' }, withRuby('h2', 'card-title', '記録(きろく)'), dataSlot),
    );
  }

  function conclude(): HTMLElement {
    const box = h('section', { class: 'card free-conclude' });
    if (!target || prediction < 0) return box;
    const pool = fair();
    if (distinct(pool, target.key) < 2) {
      const msg =
        trials.length >= 2 && (mode === 'control' || mode === 'hypothesis') && changedKeys(trials[0].c, trials[trials.length - 1].c, keys).length > 1
          ? `${plain(say(level, target))}のほかの条件をそろえた実験が、まだ2つないよ`
          : `${plain(say(level, target))}を変えて、2回以上 実験しよう`;
      box.append(withRuby('h2', 'card-title', low ? 'まとめ' : '4. まとめよう'), withRuby('p', 'section-note', msg));
      return box;
    }
    const opts = statements(exp, target, level);
    const real = truth(exp, target, pool);
    box.append(withRuby('h2', 'card-title', low ? 'まとめ' : '4. まとめよう'), withRuby('p', 'section-note', low ? 'わかった ことを えらぼう' : '実験の記録から、わかったことをえらぼう'));
    const list = h('div', { class: 'answer-choices', role: 'radiogroup' });
    opts.forEach((o, i) => {
      const b = h('button', { type: 'button', class: 'answer-btn', role: 'radio', 'aria-checked': String(pick === i) }, o.text);
      b.addEventListener('click', () => {
        pick = i;
        page.querySelector('.free-conclude')?.replaceWith(conclude());
      });
      list.append(b);
    });
    box.append(list);
    if (pick >= 0) {
      const ok = opts[pick].kind === real;
      box.append(
        h(
          'div',
          { class: `verdict ${ok ? 'is-hit' : 'is-miss'}` },
          mark(ok),
          withRuby('p', 'verdict-title', ok ? '記録(きろく)と合(あ)っているね！' : 'もう一度(いちど)、表(ひょう)やグラフを見てみよう'),
        ),
      );
      if (ok && !saved) {
        const save = h('button', { type: 'button', class: 'btn btn-primary' }, ...[withRuby('span', '', '実験(じっけん)ノートにまとめる')]);
        save.addEventListener('click', () => {
          const note: Note = {
            id: newNoteId(),
            at: Date.now(),
            kind: 'free',
            level,
            exp: exp.id,
            question: `${plain(say(level, target!))}を変えると、${plain(say(level, exp.measure))}はどうなるか`,
            prediction: opts[prediction].text,
            correct: opts[prediction].kind === real,
            finding: opts[pick].text,
            trials: trials.slice(-TRIAL_LIMIT),
          };
          saved = { points: finishFree(date, note) };
          page.querySelector('.free-conclude')?.replaceWith(conclude());
        });
        box.append(h('p', { class: 'card-actions' }, save));
      }
      if (saved) {
        box.append(
          h(
            'div',
            { class: 'reward-box result-stamp' },
            h('p', { class: 'result-stamp-title' }, 'ノートにまとめたよ'),
            saved.points ? h('p', { class: 'result-reward' }, REWARD.rewardPoints(saved.points)) : null,
            h('p', { class: 'result-balance' }, `${REWARD.pointsLabel}: ${REWARD.points(balance())}`),
            h('div', { class: 'reward-buttons' }, h('a', { class: 'btn', href: '#/notebook' }, '実験ノート'), h('a', { class: 'btn btn-primary', href: `#/${level}` }, 'もどる')),
          ),
        );
      }
    }
    return box;
  }

  function render(): void {
    page.replaceChildren(
      h('header', { class: 'bar' }, homeButton(), withRuby('h1', '', low ? 'じゆう けんきゅう' : '自由研究(じゆうけんきゅう)'), h('span', { class: 'bar-meta' }, LEVEL_LABEL[level])),
      h(
        'main',
        { class: 'lab' },
        h('section', { class: 'mission-q card' }, withRuby('p', 'card-kicker', say(level, exp)), withRuby('p', 'section-note', low && exp.kanaSummary ? exp.kanaSummary : exp.summary)),
        chooseTarget(),
        target ? predictCard(target) : null,
        target && prediction >= 0 ? bench(target) : null,
        target && prediction >= 0 ? conclude() : null,
      ),
    );
  }

  render();
  return () => {
    alive = false;
  };
}
