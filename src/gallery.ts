import './styles.css';
import { initialConditions } from './core/lab';
import { CARDS } from './data/cards';
import { EXPERIMENTS } from './experiments';
import { figure, h } from './ui/dom';
import { cardSvg } from './ui/shiba';

// 開発用: 全部の実験について、条件ごとの図 (実験前・実験後) をならべる。?exp=pendulum で 1 つだけ
const only = new URLSearchParams(location.search).get('exp');
const app = document.getElementById('app')!;
const sections = EXPERIMENTS.filter((e) => !only || e.id === only).map((exp) => {
  const base = initialConditions(exp);
  const cells: HTMLElement[] = [h('div', { class: 'gallery-cell' }, figure(exp.scene(base, null, 0)), h('p', {}, '実験前'))];
  for (const v of exp.variables) {
    const values = v.kind === 'range' ? [v.min, v.max] : v.options.map((o) => o.value);
    for (const value of values) {
      const c = { ...base, [v.key]: value };
      const r = exp.simulate(c);
      cells.push(h('div', { class: 'gallery-cell' }, figure(exp.scene(c, r, 1)), h('p', {}, `${v.key}=${value} → ${r}`)));
    }
  }
  return h('section', { class: 'gallery-exp' }, h('h2', {}, `${exp.id} ${exp.label}`), h('div', { class: 'gallery-grid' }, ...cells));
});
const cards = h('section', { class: 'gallery-exp' }, h('h2', {}, '柴犬カード'), h('div', { class: 'card-grid' }, ...CARDS.map((c) => {
  const el = h('div', { class: 'card-face' });
  el.innerHTML = cardSvg(c);
  return h('div', { class: 'shiba-card' }, el, h('p', { class: 'card-name' }, `${c.name} ${c.price}pt`));
})));
app.append(h('main', { class: 'gallery' }, ...sections, only ? '' : cards));
