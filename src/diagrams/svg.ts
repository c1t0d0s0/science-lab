// 図はすべて SVG の文字列で組み立てる。色は styles.css の .fig の中のクラスで決める
// (明るい画面では紙とインク、暗い画面では黒板とチョークになる)

/** 座標を小数第 1 位までにまるめる */
export const r = (n: number) => Math.round(n * 10) / 10;

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** 図の全体。alt は読み上げ用の説明 */
export function fig(width: number, height: number, alt: string, ...body: string[]): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="fig" style="--w:${width}" role="img" aria-label="${escape(alt)}">` +
    body.join('') +
    '</svg>'
  );
}

export const line = (x1: number, y1: number, x2: number, y2: number, cls = 'ln') =>
  `<line class="${cls}" x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}"/>`;

export const path = (d: string, cls = 'ln') => `<path class="${cls}" d="${d}"/>`;

export const circle = (cx: number, cy: number, radius: number, cls = 'ln') =>
  `<circle class="${cls}" cx="${r(cx)}" cy="${r(cy)}" r="${r(radius)}"/>`;

export const ellipse = (cx: number, cy: number, rx: number, ry: number, cls = 'ln') =>
  `<ellipse class="${cls}" cx="${r(cx)}" cy="${r(cy)}" rx="${r(rx)}" ry="${r(ry)}"/>`;

export const rect = (x: number, y: number, w: number, h: number, cls = 'ln', rx = 0) =>
  `<rect class="${cls}" x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}"${rx ? ` rx="${rx}"` : ''}/>`;

export const polygon = (points: [number, number][], cls = 'ln') =>
  `<polygon class="${cls}" points="${points.map(([x, y]) => `${r(x)},${r(y)}`).join(' ')}"/>`;

export const polyline = (points: [number, number][], cls = 'ln') =>
  `<polyline class="${cls}" points="${points.map(([x, y]) => `${r(x)},${r(y)}`).join(' ')}"/>`;

/** 文字。anchor は start / middle / end */
export function text(x: number, y: number, s: string, opts: { anchor?: string; cls?: string } = {}): string {
  const cls = opts.cls ? ` class="${opts.cls}"` : '';
  return `<text x="${r(x)}" y="${r(y)}" text-anchor="${opts.anchor ?? 'middle'}"${cls}>${escape(s)}</text>`;
}

/** 矢印 (x1, y1) → (x2, y2) */
export function arrow(x1: number, y1: number, x2: number, y2: number, cls = 'ln'): string {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const size = 8;
  const wing = (da: number): [number, number] => [x2 - size * Math.cos(a + da), y2 - size * Math.sin(a + da)];
  return line(x1, y1, x2, y2, cls) + polyline([wing(0.45), [x2, y2], wing(-0.45)], cls);
}

/** ア・イ・ウ などの記号を入れた丸 */
export function tag(x: number, y: number, label: string): string {
  return circle(x, y, 11, 'tag') + text(x, y + 5, label, { cls: 'tag-text' });
}

/** 記号の丸と、そこから指している場所までの線 */
export function pointer(x: number, y: number, toX: number, toY: number, label: string): string {
  return line(x, y, toX, toY, 'ln thin') + circle(toX, toY, 2.2, 'ink') + tag(x, y, label);
}

/** おもり (四角) と、その中の文字 */
export function weight(cx: number, top: number, label: string, cls = 'box'): string {
  const w = Math.max(34, label.length * 8 + 14);
  return rect(cx - w / 2, top, w, 24, cls, 3) + text(cx, top + 17, label, { cls: 'small' });
}

/** 長さを示す両矢印と、その下の文字 */
export function dimension(x1: number, x2: number, y: number, label: string): string {
  return (
    line(x1, y - 5, x1, y + 5, 'ln thin') +
    line(x2, y - 5, x2, y + 5, 'ln thin') +
    line(x1, y, x2, y, 'ln thin') +
    text((x1 + x2) / 2, y + 16, label, { cls: 'small' })
  );
}

/** 図を横にずらす・ならべるためのグループ */
export const group = (x: number, y: number, ...body: string[]) => `<g transform="translate(${r(x)} ${r(y)})">${body.join('')}</g>`;

/** 図を大きくする・小さくする */
export const scale = (k: number, ...body: string[]) => `<g transform="scale(${k})">${body.join('')}</g>`;
