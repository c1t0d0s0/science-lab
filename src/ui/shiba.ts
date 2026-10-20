import type { Background, Card, Frame, Item, Look } from '../data/cards';
import { h, rubyHtml } from './dom';

// 柴犬 (このアプリのキャラクター) と、柴犬カードの絵。
// 目や輪郭は、画面の明暗に関係なくこの色にする (文字色に合わせると暗い画面で白目になる)
const LINE = '#1c2a4a';
const RED = '#e8546a';
const YELLOW = '#ffd23f';

/** 色の指定があればその色、なければ CSS のクラス (暗い画面で少し色を落とす) を使う */
const paint = (color: string | undefined, cls: string) => (color ? `fill="${color}"` : `class="${cls}"`);

const sparkle = (cx: number, cy: number, r: number, fill = YELLOW) =>
  `<path fill="${fill}" d="M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z"/>`;

const EYE_Y = 69;
const EYE_X = [42, 78];

function eyes(look: Look): string {
  const open = (x: number) =>
    look.eyeColor
      ? `<ellipse cx="${x}" cy="${EYE_Y}" rx="7.5" ry="8.5" fill="${look.eyeColor}" stroke="${LINE}" stroke-width="1.6"/>` +
        `<ellipse cx="${x}" cy="${EYE_Y}" rx="3.3" ry="6.4" fill="${LINE}"/>` +
        `<circle cx="${x + 2.6}" cy="${EYE_Y - 3.6}" r="2" fill="#fff"/>`
      : `<ellipse cx="${x}" cy="${EYE_Y}" rx="7.5" ry="8.5" fill="${LINE}"/>` +
        `<circle cx="${x + 2.6}" cy="${EYE_Y - 3.6}" r="3.1" fill="#fff"/>` +
        `<circle cx="${x - 2.6}" cy="${EYE_Y + 3.6}" r="1.5" fill="#fff"/>`;
  const arc = (x: number, up: boolean) =>
    `<path fill="none" stroke="${LINE}" stroke-width="2.8" stroke-linecap="round" d="M${x - 7} ${EYE_Y + (up ? 2 : -1)}Q${x} ${EYE_Y + (up ? -8 : 7)} ${x + 7} ${EYE_Y + (up ? 2 : -1)}"/>`;
  const [l, r] = EYE_X;
  switch (look.eyes ?? 'open') {
    case 'wink':
      return open(l) + arc(r, true);
    case 'sleep':
      return arc(l, false) + arc(r, false);
    case 'happy':
      return arc(l, true) + arc(r, true);
    case 'sparkle':
      return open(l) + open(r) + sparkle(l - 11, EYE_Y - 12, 4.5) + sparkle(r + 11, EYE_Y - 12, 4.5);
    case 'brave':
      return (
        open(l) +
        open(r) +
        `<path fill="none" stroke="${LINE}" stroke-width="3" stroke-linecap="round" d="M33 56L50 60.5M87 56L70 60.5"/>`
      );
    default:
      return open(l) + open(r);
  }
}

function mouth(look: Look): string {
  // 柴犬の鼻は、黒くて大きい
  const nose = `<path fill="${LINE}" d="M53.5 78.6Q60 75.4 66.5 78.6Q64.6 85 60 85.6Q55.4 85 53.5 78.6Z"/><ellipse cx="58.2" cy="79.4" rx="1.6" ry="0.9" fill="#fff" opacity="0.7"/>`;
  const lines = `<path fill="none" stroke="${LINE}" stroke-width="2" stroke-linecap="round" d="M60 85.6V88M60 88C58 92.5 52.5 92.5 51 89M60 88C62 92.5 67.5 92.5 69 89"/>`;
  switch (look.mouth ?? 'tongue') {
    case 'smile':
      return nose + lines;
    case 'open':
      return (
        `<path fill="#8a3b3b" stroke="${LINE}" stroke-width="2" stroke-linejoin="round" d="M51.5 89Q60 102.5 68.5 89Z"/>` +
        `<ellipse class="shiba-tongue" cx="60" cy="95.2" rx="4" ry="2.6"/>` +
        nose +
        `<path fill="none" stroke="${LINE}" stroke-width="2" stroke-linecap="round" d="M60 85.6V89"/>`
      );
    default:
      return `<path class="shiba-tongue" d="M56.2 90.5Q60 99 63.8 90.5Z"/>` + nose + lines;
  }
}

const ITEMS: Record<Item, string> = {
  ribbon:
    `<g transform="translate(87 31) rotate(18)" stroke="${LINE}" stroke-width="2" stroke-linejoin="round" fill="${RED}">` +
    `<path d="M0 0L-14 -8.5V8.5Z"/><path d="M0 0L14 -8.5V8.5Z"/><circle r="4"/></g>`,
  glasses:
    `<g fill="rgba(255,255,255,0.3)" stroke="${LINE}" stroke-width="2.6">` +
    `<circle cx="42" cy="69" r="11.5"/><circle cx="78" cy="69" r="11.5"/>` +
    `<path fill="none" stroke-linecap="round" d="M53.5 67.5Q60 63.5 66.5 67.5M30.5 67L21 63M89.5 67L99 63"/></g>`,
  pencil:
    `<g transform="rotate(30 97 34)" stroke="${LINE}" stroke-width="2" stroke-linejoin="round">` +
    `<rect x="93" y="12" width="8" height="6" fill="#f7a3b0"/><rect x="93" y="18" width="8" height="26" fill="${YELLOW}"/>` +
    `<path fill="#f6e0b5" d="M93 44H101L97 54Z"/><path fill="${LINE}" stroke="none" d="M95.4 50H98.6L97 54Z"/></g>`,
  hat:
    `<g stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round">` +
    `<ellipse cx="60" cy="31" rx="43" ry="7.5" fill="#f0d27a"/>` +
    `<path fill="#f5dc8e" d="M37 30C37 6 83 6 83 30Q60 36 37 30Z"/>` +
    `<path fill="${RED}" d="M37.2 24Q60 19 82.8 24L83 30Q60 36 37 30Z"/></g>`,
  scarf:
    `<g fill="${RED}" stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round">` +
    `<path d="M73 110L79 129L90 125L85 107Z"/><path d="M25 97Q60 113 95 97L97 107Q60 125 23 107Z"/></g>` +
    `<path fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8" d="M38 107Q60 115 82 107"/>`,
  flower:
    `<g transform="translate(88 31)" stroke="${LINE}" stroke-width="1.6">` +
    [0, 72, 144, 216, 288].map((a) => `<circle r="5.4" cx="0" cy="-6.6" fill="#ff9fb5" transform="rotate(${a})"/>`).join('') +
    `<circle r="4" fill="${YELLOW}"/></g>`,
  flask:
    `<g transform="translate(88 96) rotate(-10)" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round">` +
    `<path fill="#eaf6ff" d="M-5 -22H5V-8L15 12Q16 16 12 16H-12Q-16 16 -15 12L-5 -8Z"/>` +
    `<path fill="#6cc0e8" stroke="none" d="M-9.5 1H9.5L14 11.5Q14.6 14.4 11.6 14.4H-11.6Q-14.6 14.4 -14 11.5Z"/>` +
    `<path fill="none" d="M-7.5 -22H7.5"/></g>` +
    `<g fill="#fff" stroke="${LINE}" stroke-width="1.2"><circle cx="91" cy="71" r="2.6"/><circle cx="97" cy="63" r="1.9"/></g>`,
  headband:
    `<g stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round" fill="#fff">` +
    `<path d="M97 52L112 44L110 53L114 60L98 58Z"/><path d="M21 50Q60 33 99 50L99.5 59Q60 42 20.5 59Z"/></g>` +
    `<circle cx="60" cy="44.5" r="4.4" fill="#d63c2c"/>`,
  magnifier:
    `<g transform="translate(93 96)" stroke="${LINE}" stroke-linejoin="round" stroke-linecap="round">` +
    `<path stroke-width="7" d="M7.5 7.5L19 19"/><path stroke="#b9793c" stroke-width="3.6" d="M7.5 7.5L19 19"/>` +
    `<circle r="11" fill="rgba(215,238,250,0.85)" stroke-width="3"/>` +
    `<path fill="none" stroke="#fff" stroke-width="2" d="M-6 -3Q-4 -7 0 -7.5"/></g>`,
  cap:
    `<g stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round">` +
    `<path fill="#2f55a8" d="M38 33C24 33 11 37 6 44C24 45 46 41 62 35Z"/>` +
    `<path fill="#3f6fd1" d="M35 34C35 8 85 8 85 34Q60 28 35 34Z"/></g>` +
    `<circle cx="60" cy="13.5" r="2.6" fill="#fff" stroke="${LINE}" stroke-width="1.5"/>` +
    `<path fill="none" stroke="#fff" stroke-width="1.6" opacity="0.7" d="M60 16V30"/>`,
  bulb:
    `<g transform="translate(60 9)" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">` +
    `<path fill="${YELLOW}" d="M0 -14C-9 -14 -13 -7 -13 -1C-13 4 -9 7 -7 11H7C9 7 13 4 13 -1C13 -7 9 -14 0 -14Z"/>` +
    `<rect x="-6" y="11" width="12" height="7" rx="2" fill="#c9d2dc"/>` +
    `<path fill="none" stroke-width="1.6" d="M-4 2L0 6L4 2"/></g>` +
    `<path fill="none" stroke="${YELLOW}" stroke-width="2.6" stroke-linecap="round" d="M34 4L28 -1M86 4L92 -1M60 -9V-13M40 -6L37 -11M80 -6L83 -11"/>`,
  sprout:
    `<g transform="translate(60 27)" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">` +
    `<path fill="none" d="M0 2V-10"/>` +
    `<path fill="#7fca6a" d="M0 -10C-4 -20 -15 -21 -19 -17C-15 -10 -6 -8 0 -10Z"/>` +
    `<path fill="#9bd97f" d="M0 -10C4 -22 16 -23 20 -19C16 -11 6 -8 0 -10Z"/></g>`,
  doctor:
    `<g stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">` +
    `<path fill="#2f3a66" d="M37 31C37 22 83 22 83 31Q60 37 37 31Z"/>` +
    `<path fill="#3d4b85" d="M60 4L106 18L60 32L14 18Z"/>` +
    `<path fill="none" stroke="${YELLOW}" d="M60 18L96 23V38"/></g>` +
    `<path fill="${YELLOW}" stroke="${LINE}" stroke-width="1.6" stroke-linejoin="round" d="M92.5 38H99.5L98.5 48H93.5Z"/>`,
  crown:
    `<path fill="${YELLOW}" stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round" d="M38 32L35 8L49 20L60 2L71 20L85 8L82 32Q60 26 38 32Z"/>` +
    `<circle cx="60" cy="21" r="3.6" fill="#d63c2c" stroke="${LINE}" stroke-width="1.4"/>` +
    `<circle cx="45.5" cy="24" r="2.6" fill="#4a90e2" stroke="${LINE}" stroke-width="1.2"/>` +
    `<circle cx="74.5" cy="24" r="2.6" fill="#3fb37f" stroke="${LINE}" stroke-width="1.2"/>`,
  goggles:
    `<g stroke="${LINE}" stroke-width="2.4" stroke-linejoin="round">` +
    `<path fill="none" stroke-width="4" d="M18 62Q60 50 102 62"/>` +
    `<rect x="27" y="57" width="30" height="22" rx="10" fill="rgba(170,225,240,0.55)"/>` +
    `<rect x="63" y="57" width="30" height="22" rx="10" fill="rgba(170,225,240,0.55)"/>` +
    `<path fill="none" d="M57 67H63"/></g>` +
    `<path fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" d="M32 63Q35 60 39 60M68 63Q71 60 75 60"/>`,
  coat:
    `<g stroke="${LINE}" stroke-width="2.4" stroke-linejoin="round">` +
    `<path fill="#ffffff" d="M24 100Q60 116 96 100L104 124H16Z"/>` +
    `<path fill="#e6edf2" d="M44 106L60 124L76 106L68 104L60 114L52 104Z"/></g>` +
    `<circle cx="60" cy="119" r="1.8" fill="${LINE}"/>`,
  magnet:
    `<g transform="translate(96 98) rotate(-20)" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round">` +
    `<path fill="${RED}" d="M-14 -16H-4V4A4 4 0 0 0 4 4V-16H14V4A14 14 0 0 1 -14 4Z"/>` +
    `<path fill="#d7dde3" d="M-14 -16H-4V-8H-14ZM4 -16H14V-8H4Z"/></g>`,
  moon:
    `<path fill="${YELLOW}" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round" d="M98 4A16 16 0 1 0 112 28A12 12 0 1 1 98 4Z"/>`,
  stopwatch:
    `<g transform="translate(97 100)" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">` +
    `<rect x="-3" y="-17" width="6" height="5" fill="#c9d2dc"/>` +
    `<circle r="12" fill="#ffffff"/><circle r="12" fill="none" stroke="${RED}" stroke-width="2.6"/>` +
    `<path fill="none" d="M0 0V-7M0 0L5 3"/></g>`,
  testtube:
    `<g transform="translate(96 98) rotate(14)" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round">` +
    `<path fill="#eaf6ff" d="M-6 -20H6V12A6 6 0 0 1 -6 12Z"/>` +
    `<path fill="#f08a8a" stroke="none" d="M-4.6 0H4.6V12A4.6 4.6 0 0 1 -4.6 12Z"/>` +
    `<path fill="none" d="M-8 -20H8"/></g>`,
  zzz:
    `<g fill="#fff" font-family="sans-serif" font-weight="700">` +
    `<text x="90" y="34" font-size="13">z</text><text x="99" y="22" font-size="16">z</text><text x="110" y="8" font-size="19">z</text></g>`,
};

/**
 * 柴犬の顔 (たて 110 × よこ 120 の中にかく)。ぴんと立った三角の耳、白いほおと口もと、
 * まゆの丸いもようが目じるし。
 */
export function shibaFace(look: Look = {}): string {
  const items = look.items ?? [];
  return (
    `<g stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">` +
    // 耳
    `<path ${paint(look.fur, 'shiba-fur')} d="M25 52C19 38 20 22 27 9C39 14 49 24 54 37ZM95 52C101 38 100 22 93 9C81 14 71 24 66 37Z"/>` +
    // 頭 (ほおがふっくらしている)
    `<path ${paint(look.fur, 'shiba-fur')} d="M60 28C35 28 17 43 16 64C15 74 11 78 9 84C16 86 22 91 29 97C38 104 49 107 60 107C71 107 82 104 91 97C98 91 104 86 111 84C109 78 105 74 104 64C103 43 85 28 60 28Z"/></g>` +
    `<path ${paint(look.pink, 'shiba-pink')} d="M29 42C27 33 28 25 31 18C38 22 43 28 46 35ZM91 42C93 33 92 25 89 18C82 22 77 28 74 35Z"/>` +
    // 白いほおと口もと
    `<path ${paint(look.light, 'shiba-light')} d="M17 79C22 68 33 64 44 70C48 73 51 71 52 66C54 58 66 58 68 66C69 71 72 73 76 70C87 64 98 68 103 79C105 82 107 83 109 84C103 87 98 91 91 96.5C82 103 71 105.5 60 105.5C49 105.5 38 103 29 96.5C22 91 17 87 11 84C13 83 15 82 17 79Z"/>` +
    // まゆの丸いもよう
    `<ellipse ${paint(look.brow ?? look.light, 'shiba-light')} cx="42" cy="54.5" rx="5.2" ry="3.4" transform="rotate(-12 42 54.5)"/>` +
    `<ellipse ${paint(look.brow ?? look.light, 'shiba-light')} cx="78" cy="54.5" rx="5.2" ry="3.4" transform="rotate(12 78 54.5)"/>` +
    `<ellipse ${paint(look.pink, 'shiba-pink')} cx="27" cy="83" rx="6.5" ry="4" opacity="0.7"/>` +
    `<ellipse ${paint(look.pink, 'shiba-pink')} cx="93" cy="83" rx="6.5" ry="4" opacity="0.7"/>` +
    eyes(look) +
    mouth(look) +
    items.map((item) => ITEMS[item]).join('')
  );
}

/** ハカセ (このアプリの柴犬)。白衣とゴーグルをつけている */
const HAKASE: Look = { items: ['coat', 'goggles'], mouth: 'smile' };

/** ホームなどに出す柴犬 */
export function shiba(look: Look = HAKASE): HTMLElement {
  const el = h('div', { class: 'shiba' });
  el.innerHTML = `<svg viewBox="0 -6 120 132" role="img" aria-label="しばいぬのハカセ">${shibaFace(look)}</svg>`;
  return el;
}

/** 柴犬のハカセが、ふきだしで話す。text はふりがな付きの文 (rubyHtml) */
export function guide(text: string, opts: { warn?: boolean; happy?: boolean; cls?: string } = {}): HTMLElement {
  const look: Look = opts.warn
    ? { ...HAKASE, eyes: 'brave', mouth: 'open' }
    : opts.happy
      ? { ...HAKASE, eyes: 'happy', mouth: 'open' }
      : HAKASE;
  const bubble = h('p', { class: 'bubble-text' });
  bubble.innerHTML = rubyHtml(text);
  return h(
    'div',
    { class: `guide${opts.warn ? ' is-warn' : ''}${opts.cls ? ` ${opts.cls}` : ''}`, role: opts.warn ? 'alert' : 'status' },
    shiba(look),
    h('div', { class: 'bubble' }, bubble),
  );
}

// ---- カードの絵柄 (たて 156 × よこ 120) ----
// 理科ラボのカードは「観察まど」の形。上のタブに分野と番号、まん中の丸いまどの中に柴犬と実験のもよう、
// まどのふちに目もりがある。ランク (bronze / silver / gold) で、まどのふちとカードの地の色が変わる。

const W = 120;
const H = 156;
const CX = 60;
const CY = 78;
const R = 46;

const rect = (fill: string) => `<rect x="${CX - R}" y="${CY - R}" width="${R * 2}" height="${R * 2}" fill="${fill}"/>`;
const dots = (points: number[][], fill: string) => points.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
const stroke = (d: string, color: string, width = 1.6, extra = '') =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;

/** まどの中の背景 (まどの中心 CX, CY のまわり、半径 R の中に見える) */
function background(bg: Background): string {
  const L = CX - R;
  const T = CY - R;
  switch (bg) {
    case 'graph': {
      let d = '';
      for (let x = L; x <= L + 2 * R; x += 8) d += `M${x} ${T}V${T + 2 * R}`;
      for (let y = T; y <= T + 2 * R; y += 8) d += `M${L} ${y}H${L + 2 * R}`;
      return rect('#f7fbf8') + stroke(d, '#cfe4da', 0.8) + stroke(`M${L + 6} ${T + 78}L${L + 26} ${T + 64}L${L + 46} ${T + 52}L${L + 66} ${T + 34}L${L + 88} ${T + 18}`, '#2f6fd1', 2) + dots([[L + 26, T + 64, 2.4], [L + 46, T + 52, 2.4], [L + 66, T + 34, 2.4]], '#2f6fd1');
    }
    case 'beakers': {
      const beaker = (x: number, y: number, c: string) =>
        `<path d="M${x - 6} ${y - 9}V${y + 6}Q${x - 6} ${y + 9} ${x - 3} ${y + 9}H${x + 3}Q${x + 6} ${y + 9} ${x + 6} ${y + 6}V${y - 9}" fill="#ffffff" stroke="#9cc9e8" stroke-width="1.2"/>` +
        `<rect x="${x - 5.4}" y="${y}" width="10.8" height="8.4" rx="2" fill="${c}"/>`;
      const cols = ['#ffd23f', '#9cd98a', '#f7a3b0', '#9cc9e8'];
      let out = rect('#eef6fb');
      let k = 0;
      for (let y = T + 8; y < T + 2 * R + 10; y += 24) for (let x = L + 8 + ((y / 24) % 2) * 12; x < L + 2 * R + 10; x += 24) out += beaker(x, y, cols[k++ % 4]);
      return out;
    }
    case 'magnetic': {
      let out = rect('#fdf3f1');
      for (let i = 1; i <= 5; i++) out += stroke(`M${CX - 14} ${CY + 30}C${CX - 14 - i * 12} ${CY + 30 - i * 18} ${CX + 14 + i * 12} ${CY + 30 - i * 18} ${CX + 14} ${CY + 30}`, '#e6a59b', 1.2);
      return out + `<rect x="${CX - 26}" y="${CY + 26}" width="26" height="12" fill="#e0574a"/><rect x="${CX}" y="${CY + 26}" width="26" height="12" fill="#4a7fd6"/>`;
    }
    case 'circuit': {
      const d = `M${L} ${T + 20}H${L + 30}V${T + 46}H${L + 70}V${T + 14}M${L + 50} ${T + 46}V${T + 80}H${L + 92}M${L + 14} ${T + 62}H${L + 36}V${T + 92}M${L + 70} ${T + 64}H${L + 92}`;
      return rect('#1f3d35') + stroke(d, '#6fcf97', 1.8) + dots([[L + 30, T + 20, 2.6], [L + 70, T + 46, 2.6], [L + 50, T + 80, 2.6], [L + 36, T + 62, 2.6], [L + 70, T + 64, 2.6]], '#ffd23f');
    }
    case 'pendulum': {
      let out = rect('#f4f0e6');
      for (const r of [30, 52, 74]) out += stroke(`M${CX - r * 0.6} ${T + 6 + r * 0.8}A${r} ${r} 0 0 0 ${CX + r * 0.6} ${T + 6 + r * 0.8}`, '#d6c7a5', 1.4, ' stroke-dasharray="3 3"');
      return out + stroke(`M${CX} ${T + 2}L${CX + 28} ${T + 70}`, '#b9a283', 1.2) + `<circle cx="${CX + 28}" cy="${T + 72}" r="5" fill="#b9a283"/>`;
    }
    case 'sprouts': {
      let out = rect('#eaf6e4') + `<rect x="${L}" y="${CY + 30}" width="${2 * R}" height="20" fill="#b58b62"/>`;
      for (const x of [L + 10, L + 30, L + 62, L + 82]) out += stroke(`M${x} ${CY + 31}V${CY + 18}`, '#4f9a3f', 1.6) + `<ellipse cx="${x - 4}" cy="${CY + 18}" rx="4.6" ry="2.4" fill="#7fca6a"/><ellipse cx="${x + 4}" cy="${CY + 17}" rx="4.6" ry="2.4" fill="#9bd97f"/>`;
      return out;
    }
    case 'bubbles':
      return (
        rect('#d9eef9') +
        dots([[L + 12, T + 80, 4], [L + 20, T + 60, 2.6], [L + 14, T + 34, 3.4], [L + 84, T + 70, 4.4], [L + 78, T + 44, 2.6], [L + 86, T + 22, 3.2], [L + 46, T + 12, 2.4], [L + 30, T + 90, 3]], '#ffffff') +
        dots([[L + 12, T + 80, 2], [L + 84, T + 70, 2.2]], '#d9eef9')
      );
    case 'sunrays': {
      let out = rect('#fff6d8');
      for (let a = 0; a < 360; a += 20) out += `<path d="M${CX} ${T}L${CX + 120 * Math.cos((a * Math.PI) / 180)} ${T + 120 * Math.sin((a * Math.PI) / 180)}" stroke="#ffe7a0" stroke-width="7"/>`;
      return out + `<circle cx="${CX}" cy="${T}" r="16" fill="#ffc53d"/>`;
    }
    case 'litmus':
      return ['#f6b6b6', '#fbe2e2', '#b9d0f3', '#e3ecfb', '#f6b6b6', '#fbe2e2', '#b9d0f3', '#e3ecfb'].map((c, i) => `<rect x="${L + i * 11.5}" y="${T}" width="11.6" height="${2 * R}" fill="${c}"/>`).join('');
    case 'moonphase': {
      let out = rect('#22305a') + dots([[L + 12, T + 14, 1.2], [L + 80, T + 30, 1.4], [L + 20, T + 86, 1.1], [L + 76, T + 84, 1.3]], '#ffffff');
      [0, 1, 2, 3, 4].forEach((i) => {
        const x = L + 12 + i * 17;
        const y = T + 18;
        const k = [0.25, 0.5, 1, 0.5, 0.25][i];
        out += `<circle cx="${x}" cy="${y}" r="6" fill="#4a5578"/>` + `<ellipse cx="${x + (i < 2 ? 6 * (1 - k) : i > 2 ? -6 * (1 - k) : 0)}" cy="${y}" rx="${6 * k}" ry="6" fill="#ffe58a"/>`;
      });
      return out;
    }
    case 'prism':
      return (
        rect('#f3f1fa') +
        stroke(`M${L} ${CY - 4}L${CX - 10} ${CY - 14}`, '#ffffff', 4) +
        ['#f2666c', '#f7a23b', '#ffd93b', '#69c56e', '#4aa3e8', '#8b6fd6'].map((c, i) => `<path d="M${CX + 6} ${CY - 12}L${L + 2 * R} ${CY - 34 + i * 9}L${L + 2 * R} ${CY - 26 + i * 9}Z" fill="${c}" opacity="0.8"/>`).join('') +
        `<path d="M${CX - 4} ${CY - 34}L${CX + 16} ${CY + 4}H${CX - 24}Z" fill="rgba(255,255,255,0.75)" stroke="#9aa6b2" stroke-width="1.2"/>`
      );
    case 'galaxy':
      return (
        rect('#2a2350') +
        `<ellipse cx="${CX}" cy="${CY}" rx="${R}" ry="16" fill="#4b3f86" opacity="0.7" transform="rotate(-24 ${CX} ${CY})"/>` +
        dots([[L + 10, T + 20, 1.4], [L + 30, T + 8, 1], [L + 82, T + 16, 1.6], [L + 88, T + 60, 1.2], [L + 8, T + 70, 1.2], [L + 60, T + 88, 1.4], [L + 20, T + 46, 0.9]], '#ffffff') +
        `<circle cx="${L + 80}" cy="${T + 22}" r="7" fill="#f7a23b"/><ellipse cx="${L + 80}" cy="${T + 22}" rx="12" ry="3" fill="none" stroke="#ffe58a" stroke-width="1.4"/>` +
        sparkle(L + 16, T + 30, 4, '#ffe58a')
      );
    default: {
      // atoms: 原子のような軌道
      let out = rect('#fdf7e4');
      for (const a of [0, 60, 120]) out += `<ellipse cx="${CX}" cy="${CY}" rx="${R - 4}" ry="14" fill="none" stroke="#e8cf7a" stroke-width="1.6" transform="rotate(${a} ${CX} ${CY})"/>`;
      return out + dots([[CX + R - 4, CY, 3], [CX - 20, CY - 37, 3], [CX - 20, CY + 37, 3]], '#d9a520');
    }
  }
}

const TONE: Record<Frame, { body: string; ring: string; tab: string; tabText: string; label: string }> = {
  bronze: { body: '#f3ece0', ring: '#c58b5a', tab: '#7a4d2b', tabText: '#fff3e2', label: 'ブロンズ' },
  silver: { body: '#e9eef3', ring: '#98a5b3', tab: '#46566a', tabText: '#ffffff', label: 'シルバー' },
  gold: { body: '#f8ecbe', ring: '#d9a520', tab: '#8a6510', tabText: '#fff8dc', label: 'ゴールド' },
};

/** まどのふちの目もり (メーターや、けんび鏡のレンズのように) */
function ticks(color: string): string {
  let d = '';
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const r1 = R + 3;
    const r2 = R + (i % 6 === 0 ? 8 : 5.5);
    d += `M${(CX + r1 * Math.cos(a)).toFixed(1)} ${(CY + r1 * Math.sin(a)).toFixed(1)}L${(CX + r2 * Math.cos(a)).toFixed(1)} ${(CY + r2 * Math.sin(a)).toFixed(1)}`;
  }
  return stroke(d, color, 1.4);
}

/** ランクの印 (フラスコの数) */
function rank(frame: Frame, color: string): string {
  const n = { bronze: 1, silver: 2, gold: 3 }[frame];
  return Array.from({ length: n }, (_, i) => {
    const x = CX + (i - (n - 1) / 2) * 13;
    return `<path d="M${x - 2} 138V142L${x - 5} 148H${x + 5}L${x + 2} 142V138Z" fill="${color}" stroke="${LINE}" stroke-width="1"/>`;
  }).join('');
}

let clipSeq = 0;

/** 表向きのカードの絵 */
export function cardSvg(card: Card): string {
  const clip = `card-clip-${clipSeq++}`;
  const tone = TONE[card.frame];
  const no = `No.${card.id.replace(/\D/g, '').padStart(2, '0')}`;
  return (
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${card.name}">` +
    `<clipPath id="${clip}"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>` +
    // カードの地 (角を大きく丸めた、実験ラベルのような形)
    `<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="14" fill="${tone.body}" stroke="${tone.ring}" stroke-width="3"/>` +
    `<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="10" fill="none" stroke="${tone.ring}" stroke-width="0.8" stroke-dasharray="2 3"/>` +
    // 上のタブ: 分野と番号
    `<rect x="12" y="11" width="${W - 24}" height="17" rx="8.5" fill="${tone.tab}"/>` +
    `<text x="20" y="23.5" font-size="9" font-weight="700" font-family="sans-serif" fill="${tone.tabText}">${card.field}</text>` +
    `<text x="${W - 20}" y="23.5" font-size="8" font-weight="700" font-family="sans-serif" fill="${tone.tabText}" text-anchor="end">${no}</text>` +
    // 観察まど
    `<g clip-path="url(#${clip})">${background(card.bg)}` +
    `<g transform="translate(${CX - 36} ${CY - 33}) scale(0.6)">${shibaFace({ fur: '#e0a05a', light: '#fff8ea', pink: '#f4b3a2', ...card.look })}</g></g>` +
    `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${tone.ring}" stroke-width="4"/>` +
    `<circle cx="${CX}" cy="${CY}" r="${R - 2.5}" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.7"/>` +
    ticks(tone.ring) +
    rank(card.frame, tone.ring) +
    `</svg>`
  );
}
