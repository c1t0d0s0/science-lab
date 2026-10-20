type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number | boolean | EventListener> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value === 'function') el.addEventListener(key.replace(/^on/, ''), value);
    else if (value === true) el.setAttribute(key, '');
    else if (value !== false) el.setAttribute(key, String(value));
  }
  for (const child of children) if (child) el.append(child);
  return el;
}

/** 画面の左上に置く、ホームにもどるボタン */
export function homeButton(): HTMLElement {
  return h('a', { class: 'back home-btn', href: '#/', 'aria-label': 'ホームにもどる' }, h('span', { 'aria-hidden': 'true' }, '‹'), 'ホーム');
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** 「漢字(かんじ)」をふりがな付きの HTML にする */
export function rubyHtml(text: string): string {
  return escapeHtml(text).replace(/([一-龠々]+)\(([ぁ-ん]+)\)/g, '<ruby>$1<rt>$2</rt></ruby>');
}

export function withRuby<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text: string) {
  const el = h(tag, { class: cls });
  el.innerHTML = rubyHtml(text);
  return el;
}

/** 改行で分けた文を、段落ごとにふりがな付きでならべる */
export function paragraphs(cls: string, text: string): HTMLElement {
  return h('div', { class: cls }, ...text.split('\n').map((line) => withRuby('p', '', line)));
}

/** 問題の図。SVG はこのアプリの中で組み立てたものだけをわたすこと */
export function figure(svg: string): HTMLElement {
  const el = h('div', { class: 'figure' });
  el.innerHTML = svg;
  return el;
}

/** 先生が赤ペンでかく「はなまる」の線 (100 × 100 の中にかく) */
export function hanamaruPoints(): string {
  const pts: string[] = [];
  const turns = 3;
  const steps = 140;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * turns * Math.PI * 2 - Math.PI / 2;
    const r = 3 + t * 24;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
  }
  for (let i = 1; i <= 120; i++) {
    const t = i / 120;
    const a = t * Math.PI * 2 - Math.PI / 2;
    const r = 27 + 13 * Math.abs(Math.sin(t * Math.PI * 6));
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

const NS = 'http://www.w3.org/2000/svg';

export function hanamaru(cls = 'hanamaru'): SVGSVGElement {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(NS, 'polyline');
  path.setAttribute('points', hanamaruPoints());
  path.setAttribute('pathLength', '1');
  svg.append(path);
  return svg;
}

/** 赤ペンの「まる」と「ばつ」 */
export function mark(correct: boolean, cls = 'mark'): SVGSVGElement {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 40 40');
  svg.setAttribute('class', `${cls} ${correct ? 'mark-ok' : 'mark-ng'}`);
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(NS, 'path');
  // まるは、ペンで一息にかいたように、かき終わりを少し重ねる
  path.setAttribute('d', correct ? 'M22 5C11 3 4 11 5 21C6 31 14 37 23 35C32 33 37 25 35 16C33 8 26 4 17 6' : 'M9 9L31 31M31 9L9 31');
  path.setAttribute('pathLength', '1');
  svg.append(path);
  return svg;
}
