import { jstDate } from '../core/date';
import { MODE_HINTS, adviceAfter, initialConditions, readiness, shownVariables } from '../core/lab';
import { GRADE, modeOf, type Level } from '../core/levels';
import type { Conditions, Note, Trial } from '../core/snapshot';
import { TRIAL_LIMIT } from '../core/snapshot';
import { balance, clearedMark, doneMark, finishMission, loadProgress, newNoteId, saveProgress, type FinishReward } from '../core/storage';
import { experimentById, missionSig } from '../experiments';
import type { Experiment, Mission } from '../experiments/types';
import { conditionPanel } from './controls';
import { dataView } from './data';
import { figure, h, hanamaru, homeButton, mark, withRuby } from './dom';
import { guide } from './shiba';
import { LEVEL_LABEL, REASONS, REFLECT_REASONS, REWARD, modeLabel, plain, say, ui } from './text';

/** 予想の理由をえらばない学年 (1・2 年生) で、途中経過の「理由」の場所に入れる値 */
const NONE = 9;

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// その日の実験の記録は、ページを読みこみ直しても残るよう sessionStorage に置く (ほかの端末には送らない)
const trialKey = (date: string, mission: string) => `science-lab:trials:${date}:${mission}`;
function loadTrials(date: string, mission: string): Trial[] {
  try {
    const raw = sessionStorage.getItem(trialKey(date, mission));
    const v = raw ? (JSON.parse(raw) as Trial[]) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function saveTrials(date: string, mission: string, trials: Trial[]): void {
  try {
    sessionStorage.setItem(trialKey(date, mission), JSON.stringify(trials));
  } catch {
    /* 無視 */
  }
}

/** アニメーションを動かす。とちゅうで画面を出ていったら止める */
function animate(duration: number, frame: (p: number) => void, alive: () => boolean): Promise<void> {
  if (reduceMotion() || duration <= 0) {
    frame(1);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now: number) => {
      if (!alive()) return resolve();
      const p = Math.min(1, (now - start) / duration);
      frame(p);
      if (p < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

/** ミッションの画面。予想 → 実験 → まとめ → ふりかえり の順に進む */
export function renderLab(root: HTMLElement, level: Level, mission: Mission, opts: { daily?: boolean } = {}): () => void {
  const exp = experimentById(mission.exp)!;
  const date = jstDate();
  const mode = modeOf(level);
  const t = ui(level);
  const low = GRADE[level] <= 2;
  const sig = missionSig(mission);
  const variables = shownVariables(exp, mission);
  const keys = variables.map((v) => v.key);
  const paired = mode === 'compare';
  let alive = true;
  let running = false;

  let answers = loadProgress(date, mission.id, sig);
  let trials = loadTrials(date, mission.id);
  const condA: Conditions = initialConditions(exp, mission.start);
  const condB: Conditions = { ...condA };
  // くらべるモードでは、はじめから調べる条件だけをちがう値にしておく
  if (paired && mission.target) {
    const tv = exp.variables.find((v) => v.key === mission.target);
    if (tv?.kind === 'range') condB[tv.key] = Math.min(tv.max, Number(condA[tv.key]) + tv.step);
    if (tv?.kind === 'choice') condB[tv.key] = tv.options[(tv.options.findIndex((o) => o.value === condA[tv.key]) + 1) % tv.options.length].value;
  }
  // 前に実験していれば、さいごの条件から始める
  if (paired && trials.length >= 2) {
    Object.assign(condA, trials[trials.length - 2].c);
    Object.assign(condB, trials[trials.length - 1].c);
  } else if (!paired && trials.length > 0) Object.assign(condA, trials[trials.length - 1].c);
  let summarizing = answers.length >= 4;
  let conclusion: number | null = null;
  /** 6 年生の結論をえらんだとき、まとめのボタンを使えるか見直す */
  let onConclusion = () => {};
  let reward: FinishReward | null = null;
  let hintIndex = 0;
  const hints = [mission.hint, ...MODE_HINTS[mode]].filter((x): x is string => !!x);

  const page = h('div', { class: `lab-page mode-${mode}` });
  root.replaceChildren(page);

  const labelOf = (key: string) => plain(say(level, exp.variables.find((v) => v.key === key)!));
  const predicted = () => answers.length >= 2;
  const reflected = () => answers.length >= 4;

  function header(): HTMLElement {
    return h(
      'header',
      { class: 'bar' },
      homeButton(),
      withRuby('h1', '', opts.daily ? (low ? 'きょうの チャレンジ' : '今日(きょう)のチャレンジ') : say(level, exp)),
      h('span', { class: 'bar-meta' }, LEVEL_LABEL[level]),
    );
  }

  function steps(): HTMLElement {
    const names = low ? ['よそう', 'じっけん', 'まとめ', 'ふりかえり'] : ['予想', '実験', 'まとめ', 'ふりかえり'];
    const at = !predicted() ? 0 : reflected() ? 4 : summarizing ? 2 : 1;
    return h(
      'ol',
      { class: 'steps', 'aria-label': '進み方' },
      ...names.map((n, i) => h('li', { class: i < at ? 'is-done' : i === at ? 'is-now' : '', 'aria-current': i === at ? 'step' : false }, h('span', { class: 'step-no' }, String(i + 1)), n)),
    );
  }

  function questionCard(): HTMLElement {
    return h(
      'section',
      { class: 'mission-q card' },
      h('p', { class: 'card-kicker' }, withRuby('span', '', `${t.question}`), h('span', { class: 'chip chip-small' }, ...[withRuby('span', '', modeLabel(level))])),
      withRuby('h2', 'mission-text', mission.question),
    );
  }

  function predictCard(): HTMLElement {
    const card = h('section', { class: 'predict card', 'aria-labelledby': 'predict-title' });
    card.append(withRuby('h2', 'card-title', t.predict));
    card.firstElementChild!.id = 'predict-title';
    if (predicted()) {
      card.append(
        h('p', { class: 'my-prediction' }, withRuby('span', 'label', t.yourPrediction), withRuby('b', '', mission.choices[answers[0]])),
        answers[1] !== NONE ? withRuby('p', 'my-reason', `理由(りゆう): ${REASONS[answers[1]] ?? ''}`) : '',
      );
      return card;
    }
    card.append(withRuby('p', 'section-note', t.predictNote));
    let pick = -1;
    let reason = low ? NONE : -1;
    const decide = h('button', { type: 'button', class: 'btn btn-primary', disabled: true }, ...[withRuby('span', '', t.decide)]);
    const update = () => {
      decide.disabled = pick < 0 || reason < 0;
    };
    const choiceList = h('div', { class: 'answer-choices', role: 'radiogroup' });
    mission.choices.forEach((c, i) => {
      const b = withRuby('button', 'answer-btn', c);
      b.setAttribute('type', 'button');
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.addEventListener('click', () => {
        pick = i;
        for (const x of choiceList.children) x.setAttribute('aria-checked', String(x === b));
        update();
      });
      choiceList.append(b);
    });
    card.append(choiceList);
    if (!low) {
      const reasons = h('div', { class: 'reason-choices', role: 'radiogroup' });
      REASONS.forEach((r, i) => {
        const b = withRuby('button', 'reason-btn', r);
        b.setAttribute('type', 'button');
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', 'false');
        b.addEventListener('click', () => {
          reason = i;
          for (const x of reasons.children) x.setAttribute('aria-checked', String(x === b));
          update();
        });
        reasons.append(b);
      });
      card.append(withRuby('h3', 'sub-title', t.reason), reasons);
    }
    decide.addEventListener('click', () => {
      answers = [pick, reason];
      saveProgress(date, mission.id, sig, answers);
      render();
      page.querySelector('.bench')?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    });
    card.append(h('p', { class: 'card-actions' }, decide));
    return card;
  }

  // ---- 実験台 ----
  const stageA = figure(exp.scene(condA, null, 0));
  const stageB = figure(exp.scene(condB, null, 0));
  const lastResult: { a: number | string | null; b: number | string | null } = { a: null, b: null };
  let advice = guide(hints[0] ?? '', { cls: 'advice' });
  const dataSlot = h('div', { class: 'data-slot' });
  const readySlot = h('div', { class: 'ready-slot' });

  function redrawStage(): void {
    stageA.innerHTML = exp.scene(condA, lastResult.a, lastResult.a === null ? 0 : 1);
    if (paired) stageB.innerHTML = exp.scene(condB, lastResult.b, lastResult.b === null ? 0 : 1);
  }

  function setAdvice(text: string, o: { warn?: boolean; happy?: boolean } = {}): void {
    const next = guide(text, { ...o, cls: 'advice' });
    advice.replaceWith(next);
    advice = next;
  }

  function panelFor(c: Conditions, which: 'a' | 'b'): HTMLElement {
    return conditionPanel({
      level,
      variables,
      values: c,
      locked: mission.lock,
      target: mission.target,
      disabled: summarizing,
      onChange: (key, value) => {
        c[key] = value;
        lastResult[which] = null;
        redrawStage();
      },
    });
  }

  async function run(button: HTMLButtonElement): Promise<void> {
    if (running) return;
    running = true;
    button.disabled = true;
    const rng = mission.noise ? Math.random : undefined;
    const ra = exp.simulate(condA, rng);
    const rb = paired ? exp.simulate(condB, rng) : null;
    lastResult.a = ra;
    lastResult.b = rb;
    await animate(
      exp.duration,
      (p) => {
        stageA.innerHTML = exp.scene(condA, ra, p);
        if (paired) stageB.innerHTML = exp.scene(condB, rb, p);
      },
      () => alive,
    );
    if (!alive) return;
    running = false;
    button.disabled = false;
    trials = [...trials, { c: { ...condA }, v: ra }];
    if (paired) trials = [...trials, { c: { ...condB }, v: rb! }];
    saveTrials(date, mission.id, trials);
    const a = adviceAfter({
      mode,
      trials,
      keys,
      target: mission.target,
      targetLabel: mission.target ? labelOf(mission.target) : undefined,
      labelOf,
      noise: mission.noise,
    });
    if (a) setAdvice(a.text, { warn: a.warn });
    refreshData();
  }

  function refreshData(): void {
    dataSlot.replaceChildren(
      trials.length === 0
        ? withRuby('p', 'section-note', t.noTrials)
        : dataView({ exp, level, trials, variables, target: mission.target, showMean: mode === 'hypothesis', paired }),
    );
    const r = readiness(mission.need, trials, mode, keys);
    if (summarizing) {
      readySlot.replaceChildren();
      return;
    }
    const btn = h('button', { type: 'button', class: 'btn btn-primary', disabled: !r.ready }, ...[withRuby('span', '', t.summarize)]);
    btn.addEventListener('click', () => {
      summarizing = true;
      render();
      page.querySelector('.summary')?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    });
    const note = r.ready ? null : withRuby('p', 'ready-note', r.moreRepeat ? t.needRepeat(r.moreRepeat) : t.needMore(Math.max(1, r.moreValues)));
    readySlot.replaceChildren(h('div', { class: 'ready' }, note, btn));
  }

  function bench(): HTMLElement {
    const runBtn = h('button', { type: 'button', class: 'btn btn-run', disabled: summarizing }, ...[withRuby('span', '', paired ? t.runBoth : t.run)]);
    runBtn.addEventListener('click', () => void run(runBtn));
    const hintBtn = h('button', { type: 'button', class: 'btn btn-hint' }, ...[withRuby('span', '', t.hint)]);
    hintBtn.addEventListener('click', () => {
      hintIndex = (hintIndex + 1) % hints.length;
      setAdvice(hints[hintIndex]);
    });
    redrawStage();
    const stages = paired
      ? h('div', { class: 'stage stage-pair' }, h('div', { class: 'stage-cell' }, h('span', { class: 'ab-tag' }, 'A'), stageA), h('div', { class: 'stage-cell' }, h('span', { class: 'ab-tag ab-b' }, 'B'), stageB))
      : h('div', { class: 'stage' }, stageA);
    const panels = paired
      ? h('div', { class: 'panel-pair' }, h('div', { class: 'panel-ab' }, h('span', { class: 'ab-tag' }, 'A'), panelFor(condA, 'a')), h('div', { class: 'panel-ab' }, h('span', { class: 'ab-tag ab-b' }, 'B'), panelFor(condB, 'b')))
      : panelFor(condA, 'a');
    refreshData();
    return h(
      'section',
      { class: 'bench', 'aria-labelledby': 'bench-title' },
      h('div', { class: 'bench-stage' }, stages, advice),
      h(
        'div',
        { class: 'bench-panel card' },
        withRuby('h2', 'card-title', t.experiment),
        panels,
        h('div', { class: 'run-row' }, runBtn, hintBtn),
      ),
      h('div', { class: 'bench-data card' }, withRuby('h2', 'card-title', t.record), dataSlot, readySlot),
    );
  }

  // ---- まとめとふりかえり ----

  function summary(): HTMLElement {
    const hit = answers[0] === mission.answer;
    const card = h('section', { class: 'summary card' });
    card.append(
      withRuby('h2', 'card-title', t.result),
      h(
        'div',
        { class: `verdict ${hit ? 'is-hit' : 'is-miss'}` },
        mark(hit),
        h('div', {}, withRuby('p', 'verdict-title', hit ? t.hit : t.miss), withRuby('p', 'verdict-answer', t.answerWas(mission.choices[mission.answer]))),
      ),
      withRuby('p', 'finding', mission.finding),
    );
    if (mission.conclusions && mode === 'hypothesis') card.append(conclusionBox());
    if (!reflected()) card.append(reflectBox());
    else card.append(reflectedView());
    return card;
  }

  function conclusionBox(): HTMLElement {
    const box = h('div', { class: 'conclusions' }, withRuby('h3', 'sub-title', t.conclusion));
    const why = h('p', { class: 'why', role: 'status' });
    const list = h('div', { class: 'reason-choices', role: 'radiogroup' });
    mission.conclusions!.forEach((c, i) => {
      const b = withRuby('button', `reason-btn${conclusion === i ? (c.ok ? ' is-ok' : ' is-ng') : ''}`, c.text);
      b.setAttribute('type', 'button');
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(conclusion === i));
      b.addEventListener('click', () => {
        conclusion = i;
        for (const x of list.children) {
          x.classList.remove('is-ok', 'is-ng');
          x.setAttribute('aria-checked', String(x === b));
        }
        b.classList.add(c.ok ? 'is-ok' : 'is-ng');
        why.innerHTML = '';
        why.append(c.ok ? '◎ ' : '△ ', c.why);
        onConclusion();
      });
      list.append(b);
    });
    if (conclusion !== null) why.append(mission.conclusions![conclusion].why);
    box.append(list, why);
    return box;
  }

  function reflectBox(): HTMLElement {
    const box = h('div', { class: 'reflect' }, withRuby('h3', 'sub-title', t.reflect));
    let revised = -1;
    let reason = -1;
    const finish = h('button', { type: 'button', class: 'btn btn-primary', disabled: true }, ...[withRuby('span', '', t.finish)]);
    const update = () => {
      finish.disabled = revised < 0 || reason < 0 || (mode === 'hypothesis' && !!mission.conclusions && conclusion === null);
    };
    const choices = h('div', { class: 'answer-choices', role: 'radiogroup' });
    mission.choices.forEach((c, i) => {
      const b = withRuby('button', 'answer-btn', c);
      b.setAttribute('type', 'button');
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.addEventListener('click', () => {
        revised = i;
        for (const x of choices.children) x.setAttribute('aria-checked', String(x === b));
        update();
      });
      choices.append(b);
    });
    const reasons = h('div', { class: 'reason-choices', role: 'radiogroup' });
    REFLECT_REASONS[mode].forEach((r, i) => {
      const b = withRuby('button', 'reason-btn', r);
      b.setAttribute('type', 'button');
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.addEventListener('click', () => {
        reason = i;
        for (const x of reasons.children) x.setAttribute('aria-checked', String(x === b));
        update();
      });
      reasons.append(b);
    });
    onConclusion = update;
    finish.addEventListener('click', () => {
      answers = [answers[0], answers[1], revised, reason];
      saveProgress(date, mission.id, sig, answers);
      const hit = answers[0] === mission.answer;
      const note: Note = {
        id: newNoteId(),
        at: Date.now(),
        kind: opts.daily ? 'daily' : 'mission',
        level,
        exp: exp.id,
        mission: mission.id,
        question: plain(mission.question),
        prediction: plain(mission.choices[answers[0]]),
        correct: hit,
        finding: plain(mission.finding),
        revised: plain(mission.choices[revised]),
        reflection: plain(REFLECT_REASONS[mode][reason]),
        trials: trials.slice(-TRIAL_LIMIT),
      };
      if (answers[1] !== NONE && REASONS[answers[1]]) note.reason = plain(REASONS[answers[1]]);
      if (conclusion !== null && mission.conclusions) note.finding = `${plain(mission.finding)}\n結論: ${mission.conclusions[conclusion].text}`;
      reward = finishMission({ date, level, mission: mission.id, daily: !!opts.daily, hit, note });
      render();
      page.querySelector('.reward-box')?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' });
    });
    box.append(
      withRuby('p', 'reflect-q', mission.question),
      withRuby('p', 'section-note', t.reflectNote),
      choices,
      withRuby('h3', 'sub-title', t.reflectWhy),
      reasons,
      h('p', { class: 'card-actions' }, finish),
    );
    return box;
  }

  function reflectedView(): HTMLElement {
    const changed = answers[2] !== answers[0];
    return h(
      'div',
      { class: 'reflect is-done' },
      withRuby('h3', 'sub-title', t.reflect),
      withRuby('p', 'reflect-q', mission.question),
      withRuby('p', '', `${mission.choices[answers[2]] ?? ''}${t.reflectChanged(changed)}`),
      withRuby('p', 'my-reason', `理由(りゆう): ${REFLECT_REASONS[mode][answers[3]] ?? ''}`),
    );
  }

  function rewardBox(): HTMLElement | null {
    const already = opts.daily ? doneMark(date, level) > 0 : clearedMark(mission.id) > 0;
    if (!reflected()) return null;
    const lines: (HTMLElement | null)[] = [];
    if (reward) {
      if (reward.points > 0) lines.push(h('p', { class: 'result-reward' }, REWARD.rewardPoints(reward.points)));
      if (reward.stamp?.added) lines.push(h('p', { class: 'result-stamp-title' }, REWARD.stampDone));
      if (reward.stamp?.weekPoints) lines.push(h('p', { class: 'result-reward' }, REWARD.rewardWeek(reward.stamp.run)));
      if (reward.stamp?.monthPoints) lines.push(h('p', { class: 'result-reward' }, REWARD.rewardMonth));
    }
    const again = h('button', { type: 'button', class: 'btn' }, ...[withRuby('span', '', t.again)]);
    again.addEventListener('click', () => {
      answers = [];
      trials = [];
      summarizing = false;
      conclusion = null;
      reward = null;
      lastResult.a = lastResult.b = null;
      saveProgress(date, mission.id, sig, []);
      saveTrials(date, mission.id, []);
      render();
      window.scrollTo(0, 0);
    });
    return h(
      'section',
      { class: 'reward-box result-stamp' },
      reward?.stamp?.added || (reward && reward.hit) ? hanamaru('hanamaru reward-mark') : null,
      ...(lines.length ? lines : [h('p', { class: 'result-stamp-title' }, already ? 'このミッションはクリアずみ' : 'おつかれさま！')]),
      h('p', { class: 'result-balance' }, `${REWARD.pointsLabel}: ${REWARD.points(balance())}`),
      h(
        'div',
        { class: 'reward-buttons' },
        h('a', { class: 'btn', href: '#/notebook' }, ...[withRuby('span', '', t.notebook)]),
        h('a', { class: 'btn', href: '#/stamps' }, REWARD.stampTitle),
        h('a', { class: 'btn btn-primary', href: `#/${level}` }, ...[withRuby('span', '', t.next)]),
        again,
      ),
    );
  }

  function render(): void {
    page.replaceChildren(
      header(),
      h(
        'main',
        { class: 'lab' },
        steps(),
        questionCard(),
        predictCard(),
        predicted() ? bench() : null,
        summarizing || reflected() ? summary() : null,
        rewardBox(),
      ),
    );
  }

  render();
  return () => {
    alive = false;
  };
}

/** 実験の一覧などに出す、実験の小さな絵 */
export function thumbnail(exp: Experiment): HTMLElement {
  const c = initialConditions(exp);
  return figure(exp.scene(c, exp.simulate(c), 1));
}
