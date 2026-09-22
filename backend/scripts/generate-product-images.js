/* Generates stylised pack-shot SVGs for every catalogue product (3 images each).
 * Run:  npm run images     (the generated files are already included in backend/public/products)
 * These are illustrations in brand-inspired colours - upload real product photos from
 * Admin > Products > Edit > Media whenever you have them. */
const fs = require('fs');
const path = require('path');
const { PRODUCTS } = require('../src/seed/catalog');
const BRANDS = require('../src/seed/brandColors');
const GLYPHS = require('../src/seed/glyphs');
const { slugify } = require('../src/utils/text');

const OUT = path.join(__dirname, '../public/products');
fs.mkdirSync(OUT, { recursive: true });

const NAVY = '#1b1d4b';
const FONT = "Poppins, 'Segoe UI', Arial, Helvetica, sans-serif";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function lum(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const readable = (bg) => (lum(bg) > 0.62 ? NAVY : '#ffffff');

const fit = (text, width, max) => Math.max(9, Math.min(max, width / (String(text).length * 0.64)));
const text = (t, x, y, width, max, fill, weight = 700, anchor = 'middle', extra = '') =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${fit(t, width, max).toFixed(1)}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" ${extra}>${esc(t)}</text>`;

function glyph(name, x, y, size, color, navy = NAVY) {
  const s = size / 64;
  const g = (GLYPHS[name] || GLYPHS.paw).replace(/\{c\}/g, color).replace(/\{n\}/g, navy);
  return `<g transform="translate(${x - size / 2} ${y - size / 2}) scale(${s.toFixed(3)})">${g}</g>`;
}

function wrap(str, maxChars) {
  const words = String(str).split(/\s+/);
  const lines = [];
  let line = '';
  words.forEach((w) => {
    if ((line + ' ' + w).trim().length > maxChars) { lines.push(line.trim()); line = w; } else line = `${line} ${w}`;
  });
  if (line.trim()) lines.push(line.trim());
  return lines;
}

const animalGlyph = (p) => ({ dogs: 'dog', cats: 'cat', birds: 'bird', rabbits: 'rabbit', fish: 'fish', 'small-pets': 'hamster' }[p.animals[0]]);

const svgWrap = (inner, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img">
<defs>
<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
<linearGradient id="steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e7ebf3"/><stop offset=".45" stop-color="#ffffff"/><stop offset="1" stop-color="#b9c0d0"/></linearGradient>
${defs}
</defs>
<ellipse cx="200" cy="356" rx="118" ry="13" fill="#1b1d4b" opacity=".13"/>
${inner}
</svg>`;

// ---------------------------------------------------------------- shapes
function bag(p, c, o = {}) {
  const s = o.scale || 1;
  const t = `translate(${200 - 200 * s} ${350 - 350 * s}) scale(${s})`;
  const kraft = o.kraft;
  const body = kraft ? '#c9a06a' : c.main;
  const band = kraft ? '#a47a46' : c.dark;
  const bandText = kraft ? '#ffffff' : c.text;
  const pill = kraft ? '#f6e7c8' : c.accent;
  const straw = kraft ? Array.from({ length: 9 }, (_, i) => `<path d="M${140 + i * 13} 64 q${(i % 2 ? 6 : -6)} -${22 + (i % 3) * 8} ${(i % 2 ? 14 : -10)} -${40 + (i % 4) * 6}" stroke="${i % 2 ? '#e8c14d' : '#d9a92a'}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('') : '';
  return `<g transform="${t}">
${straw}
<path d="M108 66 Q200 50 292 66 L302 342 Q200 358 98 342 Z" fill="${body}"/>
<path d="M108 66 Q200 50 292 66 L293 92 Q200 76 107 92 Z" fill="${band}"/>
${Array.from({ length: 13 }, (_, i) => `<path d="M${120 + i * 13.5} ${66 - (i % 2 ? 0 : 1)} v22" stroke="#000" stroke-opacity=".12" stroke-width="2"/>`).join('')}
${text(o.brandText || p.brand.toUpperCase(), 200, 128, 160, 27, bandText, 800)}
<circle cx="200" cy="196" r="50" fill="#fff" opacity=".96"/>
${glyph(o.glyph || animalGlyph(p), 200, 197, 68, body === '#ffc72c' ? '#e6a800' : body)}
${text(p.tag || p.name, 200, 282, 168, 23, bandText === '#ffffff' ? '#ffffff' : bandText, 800)}
<rect x="150" y="298" width="100" height="28" rx="14" fill="${pill}"/>
${text(p.weight, 200, 317, 84, 15, readable(pill), 700)}
<path d="M108 66 Q200 50 292 66 L302 342 Q200 358 98 342 Z" fill="url(#sheen)"/>
</g>`;
}

function box(p, c, o = {}) {
  const pouches = o.pouches ? `
<g transform="rotate(-10 150 120)"><rect x="112" y="52" width="62" height="96" rx="8" fill="${c.accent}" stroke="${c.dark}" stroke-width="2"/><rect x="112" y="52" width="62" height="14" rx="6" fill="${c.dark}" opacity=".7"/></g>
<g transform="rotate(9 250 120)"><rect x="228" y="46" width="62" height="100" rx="8" fill="#ffffff" stroke="${c.dark}" stroke-width="2"/><rect x="228" y="46" width="62" height="14" rx="6" fill="${c.main}"/></g>` : '';
  return `${pouches}
<rect x="96" y="112" width="208" height="232" rx="16" fill="${c.main}"/>
<path d="M96 128 q0 -16 16 -16 h176 q16 0 16 16 v28 H96 Z" fill="${c.dark}"/>
${text(p.brand.toUpperCase(), 200, 145, 170, 24, c.text, 800)}
<circle cx="200" cy="216" r="42" fill="#fff" opacity=".96"/>
${glyph(animalGlyph(p), 200, 217, 58, c.main === '#ffc72c' ? '#e6a800' : c.main)}
${text(p.tag || p.name, 200, 292, 178, 22, c.text, 800)}
<rect x="140" y="306" width="120" height="28" rx="14" fill="${c.accent}"/>
${text(p.weight, 200, 325, 104, 15, readable(c.accent), 700)}
<rect x="96" y="112" width="208" height="232" rx="16" fill="url(#sheen)"/>`;
}

function bottle(p, c, o = {}) {
  const water = o.water;
  return `<rect x="176" y="70" width="48" height="46" rx="8" fill="${c.accent === '#ffffff' ? c.dark : c.accent}"/>
<rect x="188" y="112" width="24" height="22" fill="${c.dark}"/>
${water ? '' : '<path d="M200 70 v-16 h34 v10" stroke="' + c.dark + '" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'}
<rect x="138" y="132" width="124" height="212" rx="30" fill="${c.main}"/>
<rect x="150" y="176" width="100" height="138" rx="14" fill="#fff" opacity=".96"/>
${text(p.brand.toUpperCase(), 200, 200, 88, 17, c.main === '#ffc72c' ? '#c98f00' : c.main, 800)}
${glyph(animalGlyph(p), 200, 238, 44, c.main === '#ffc72c' ? '#e6a800' : c.main)}
${text(p.tag || p.name, 200, 278, 88, 14, NAVY, 800)}
${text(p.weight, 200, 300, 80, 13, '#6b6f8f', 600)}
<rect x="138" y="132" width="124" height="212" rx="30" fill="url(#sheen)"/>`;
}

function tub(p, c) {
  return `<ellipse cx="200" cy="146" rx="84" ry="14" fill="${c.dark}"/>
<rect x="116" y="146" width="168" height="196" rx="8" fill="${c.main}"/>
<ellipse cx="200" cy="342" rx="84" ry="14" fill="${c.main}"/>
<rect x="110" y="98" width="180" height="52" rx="10" fill="${c.accent === '#ffffff' ? c.dark : c.accent}"/>
<ellipse cx="200" cy="98" rx="90" ry="12" fill="${c.accent === '#ffffff' ? '#ffffff' : c.accent}"/>
${text(p.brand.toUpperCase(), 200, 132, 150, 24, readable(c.accent === '#ffffff' ? c.dark : c.accent), 800)}
<circle cx="200" cy="222" r="38" fill="#fff" opacity=".96"/>
${glyph('fish', 200, 223, 54, c.main)}
${text(p.tag || p.name, 200, 292, 152, 20, c.text, 800)}
${text(p.weight, 200, 318, 120, 15, c.text, 600, 'middle', 'opacity=".9"')}
<rect x="116" y="146" width="168" height="196" rx="8" fill="url(#sheen)"/>`;
}

const collar = (p, c) => `<ellipse cx="200" cy="205" rx="118" ry="96" fill="none" stroke="${c.main}" stroke-width="34"/>
<ellipse cx="200" cy="205" rx="118" ry="96" fill="none" stroke="${c.accent}" stroke-width="3" stroke-dasharray="10 9"/>
<ellipse cx="200" cy="205" rx="130" ry="108" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="3"/>
<rect x="176" y="286" width="48" height="36" rx="8" fill="${NAVY}"/><rect x="186" y="294" width="28" height="20" rx="4" fill="#c9cde6"/>
<circle cx="200" cy="104" r="17" fill="none" stroke="${NAVY}" stroke-width="7"/>
<path d="M200 121 v14" stroke="${NAVY}" stroke-width="7" stroke-linecap="round"/>
<circle cx="258" cy="308" r="24" fill="#fff" stroke="${c.main}" stroke-width="4"/>${glyph('paw', 258, 309, 26, c.main)}`;

const leash = (p, c) => `<path d="M112 306 C58 230 108 138 190 148 C286 160 344 244 268 314" fill="none" stroke="${c.main}" stroke-width="22" stroke-linecap="round"/>
<path d="M112 306 C58 230 108 138 190 148 C286 160 344 244 268 314" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="4" stroke-dasharray="3 12" stroke-linecap="round"/>
<path d="M112 306 C96 322 70 320 70 298 C70 276 100 270 112 290" fill="none" stroke="${c.dark}" stroke-width="20" stroke-linecap="round"/>
<rect x="262" y="302" width="34" height="26" rx="6" fill="${NAVY}"/><circle cx="312" cy="326" r="14" fill="none" stroke="${NAVY}" stroke-width="6"/>`;

const bowl = (p, c) => `<ellipse cx="200" cy="322" rx="98" ry="20" fill="${NAVY}" opacity=".85"/>
<path d="M84 190 Q200 236 316 190 L284 316 Q200 340 116 316 Z" fill="url(#steel)"/>
<ellipse cx="200" cy="190" rx="116" ry="30" fill="#f3f5fa" stroke="#c6cbdb" stroke-width="3"/>
<ellipse cx="200" cy="194" rx="98" ry="22" fill="#cfd4e4"/>
<path d="M98 252 Q200 286 302 252 L296 292 Q200 326 104 292 Z" fill="${c.main}"/>
${text(p.brand.toUpperCase(), 200, 288, 130, 22, '#ffffff', 800)}`;

const kong = (p, c) => `<path d="M150 336 Q106 336 116 272 Q126 232 158 206 Q140 172 168 142 Q200 116 232 142 Q260 172 242 206 Q274 232 284 272 Q294 336 250 336 Z" fill="${c.main}"/>
<circle cx="200" cy="120" r="22" fill="${c.main}"/><circle cx="200" cy="120" r="9" fill="${c.dark}"/>
<ellipse cx="200" cy="336" rx="52" ry="12" fill="${c.dark}"/>
<path d="M150 236 q50 20 100 0" stroke="${c.dark}" stroke-width="6" fill="none" opacity=".6"/>
<path d="M156 292 q44 20 88 0" stroke="${c.dark}" stroke-width="6" fill="none" opacity=".6"/>
${text('KONG', 200, 268, 90, 26, '#ffffff', 900)}
<path d="M150 336 Q106 336 116 272 Q126 232 158 206 Q140 172 168 142 Q200 116 232 142 Q260 172 242 206 Q274 232 284 272 Q294 336 250 336 Z" fill="url(#sheen)"/>`;

const rope = (p, c) => `<path d="M88 300 C150 230 250 300 312 190" fill="none" stroke="#e9d6a6" stroke-width="30" stroke-linecap="round"/>
<path d="M88 300 C150 230 250 300 312 190" fill="none" stroke="${c.main}" stroke-width="30" stroke-linecap="round" stroke-dasharray="14 22"/>
<circle cx="86" cy="304" r="30" fill="#e9d6a6"/><circle cx="314" cy="186" r="30" fill="#e9d6a6"/>
<circle cx="86" cy="304" r="30" fill="none" stroke="${c.main}" stroke-width="7" stroke-dasharray="10 12"/><circle cx="314" cy="186" r="30" fill="none" stroke="${c.main}" stroke-width="7" stroke-dasharray="10 12"/>`;

const post = (p, c) => `<rect x="96" y="316" width="208" height="30" rx="8" fill="#b88b58"/>
<rect x="172" y="132" width="56" height="190" fill="#d8b98a"/>
${Array.from({ length: 14 }, (_, i) => `<path d="M172 ${140 + i * 13} h56" stroke="#a9834f" stroke-width="3"/>`).join('')}
<rect x="112" y="98" width="176" height="42" rx="14" fill="${c.main}"/>
<rect x="112" y="98" width="176" height="14" rx="7" fill="#fff" opacity=".25"/>
<path d="M290 130 q30 40 6 80" stroke="${c.accent === '#ffffff' ? c.dark : c.accent}" stroke-width="4" fill="none"/><circle cx="296" cy="214" r="14" fill="${c.dark}"/>
${glyph('cat', 200, 316, 0.01, c.main)}`;

function cage(p, c) {
  const bars = [];
  for (let x = 138; x <= 262; x += 14) {
    const dx = (x - 200) / 82;
    const top = 130 - Math.sqrt(Math.max(0, 1 - dx * dx)) * 84;
    bars.push(`<path d="M${x} ${top.toFixed(1)} V300" stroke="${c.dark}" stroke-width="3.5"/>`);
  }
  return `<circle cx="200" cy="34" r="12" fill="none" stroke="${c.dark}" stroke-width="5"/><path d="M200 46 v14" stroke="${c.dark}" stroke-width="5"/>
<path d="M118 130 Q118 46 200 46 Q282 46 282 130" fill="${c.accent}" fill-opacity=".14" stroke="${c.dark}" stroke-width="5"/>
<rect x="118" y="130" width="164" height="172" fill="${c.accent}" fill-opacity=".08"/>
${bars.join('')}
<path d="M118 130 H282" stroke="${c.dark}" stroke-width="5"/>
<rect x="104" y="298" width="192" height="46" rx="10" fill="${c.main}"/>
<rect x="104" y="298" width="192" height="12" rx="6" fill="#fff" opacity=".25"/>
<path d="M132 250 H268" stroke="#a47a46" stroke-width="9" stroke-linecap="round"/>
${glyph('bird', 190, 218, 62, '#38bdf8')}
<rect x="248" y="272" width="30" height="20" rx="6" fill="${c.accent}" stroke="${c.dark}" stroke-width="3"/>`;
}

const wheel = (p, c) => `<path d="M150 344 L200 240 L250 344" fill="none" stroke="${c.dark}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="200" cy="200" r="112" fill="none" stroke="${c.main}" stroke-width="20"/>
<circle cx="200" cy="200" r="112" fill="#fff" fill-opacity=".35"/>
${Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `<path d="M200 200 L${(200 + Math.cos(a) * 104).toFixed(1)} ${(200 + Math.sin(a) * 104).toFixed(1)}" stroke="${c.dark}" stroke-width="5" opacity=".6"/>`; }).join('')}
<circle cx="200" cy="200" r="16" fill="${c.dark}"/>${glyph('hamster', 200, 200, 0.01, c.main)}`;

const wand = (p, c) => `<path d="M104 330 L252 156" stroke="#b88b58" stroke-width="14" stroke-linecap="round"/>
<path d="M104 330 L162 262" stroke="${c.main}" stroke-width="18" stroke-linecap="round"/>
<path d="M252 156 C290 150 300 120 288 96" fill="none" stroke="#6b6f8f" stroke-width="3"/>
<circle cx="289" cy="98" r="8" fill="#ffc20e" stroke="#c98f00" stroke-width="2"/>
${[[-42, c.main], [-18, c.accent === '#ffffff' ? '#ffb6d3' : c.accent], [8, c.dark], [32, '#8b5cf6'], [56, c.main]].map(([rot, col]) => `<ellipse cx="292" cy="62" rx="12" ry="42" transform="rotate(${rot} 289 100)" fill="${col}" opacity=".92"/>`).join('')}`;

const swing = (p, c) => `<path d="M150 60 V220 M250 60 V220" stroke="#8a6b3f" stroke-width="5"/>
<path d="M120 60 H280" stroke="${c.dark}" stroke-width="10" stroke-linecap="round"/>
<rect x="118" y="214" width="164" height="22" rx="11" fill="#c9a06a"/><rect x="118" y="214" width="164" height="8" rx="4" fill="#fff" opacity=".3"/>
<circle cx="150" cy="150" r="12" fill="${c.main}"/><circle cx="250" cy="150" r="12" fill="${c.accent === '#ffffff' ? '#ffb6d3' : c.accent}"/>
${glyph('bird', 200, 176, 56, '#38bdf8')}`;

function build(p) {
  const c = BRANDS[p.brand] || BRANDS.PawNest;
  const shapes = {
    bag: () => bag(p, c),
    'bag-small': () => bag(p, c, { scale: 0.86 }),
    hay: () => bag(p, c, { kraft: true, glyph: animalGlyph(p) }),
    pouch: () => box(p, c, { pouches: true }),
    box: () => box(p, c),
    bottle: () => bottle(p, c),
    waterbottle: () => bottle(p, c, { water: true }),
    tub: () => tub(p, c), collar: () => collar(p, c), leash: () => leash(p, c), bowl: () => bowl(p, c), kong: () => kong(p, c),
    rope: () => rope(p, c), post: () => post(p, c), cage: () => cage(p, c), wheel: () => wheel(p, c), wand: () => wand(p, c), swing: () => swing(p, c),
  };
  return svgWrap((shapes[p.shape] || shapes.bag)());
}

function benefitsCard(p) {
  const c = BRANDS[p.brand] || BRANDS.PawNest;
  const tc = c.text;
  const rows = p.ben.slice(0, 3).map((b, i) => {
    const lines = wrap(b, 27).slice(0, 2);
    const y = 168 + i * 64;
    return `<circle cx="64" cy="${y - 5}" r="14" fill="${tc}" opacity=".95"/><path d="M57 ${y - 5} l5 5 l9 -10" stroke="${c.main}" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
${lines.map((l, j) => `<text x="92" y="${y + j * 22 - (lines.length > 1 ? 4 : 0)}" font-family="${FONT}" font-size="17" font-weight="600" fill="${tc}">${esc(l)}</text>`).join('')}`;
  }).join('');
  return svgWrap(`<rect x="24" y="24" width="352" height="340" rx="28" fill="${c.main}"/>
<rect x="24" y="24" width="352" height="340" rx="28" fill="${c.dark}" opacity=".35"/>
<g opacity=".1">${glyph(animalGlyph(p), 322, 322, 130, tc)}</g>
${text(p.brand.toUpperCase(), 52, 72, 250, 15, tc, 700, 'start', 'opacity=".85"')}
${text(p.tag || p.name, 52, 112, 296, 30, tc, 800, 'start')}
<path d="M52 132 h60" stroke="${c.accent}" stroke-width="5" stroke-linecap="round"/>
${rows}`).replace('<ellipse cx="200" cy="356" rx="118" ry="13" fill="#1b1d4b" opacity=".13"/>', '');
}

function detailsCard(p) {
  const c = BRANDS[p.brand] || BRANDS.PawNest;
  const animalNames = { dogs: 'Dogs', cats: 'Cats', birds: 'Birds', rabbits: 'Rabbits', fish: 'Fish', 'small-pets': 'Small pets' };
  const rows = [
    ['Brand', p.brand],
    ['For', p.animals.map((a) => animalNames[a]).join(', ')],
    ['Age', p.age],
    [p.category === 'accessories' || p.category === 'toys' ? 'Size' : 'Pack size', p.weight],
    ['Suits', p.breed],
  ].map(([k, v], i) => {
    const y = 150 + i * 44;
    return `<text x="52" y="${y}" font-family="${FONT}" font-size="14" font-weight="600" fill="#8a8fb0">${esc(k)}</text>
${text(v, 348, y, 190, 16, NAVY, 700, 'end')}
<path d="M52 ${y + 14} H348" stroke="#ece5f5" stroke-width="2"/>`;
  }).join('');
  return svgWrap(`<rect x="24" y="24" width="352" height="340" rx="28" fill="#ffffff" stroke="#f3d4e3" stroke-width="3"/>
<rect x="24" y="24" width="352" height="70" rx="28" fill="#fde6ee"/><rect x="24" y="70" width="352" height="24" fill="#fde6ee"/>
${glyph(animalGlyph(p), 66, 60, 44, c.main)}
${text('Product details', 96, 66, 200, 20, NAVY, 800, 'start')}
${rows}`).replace('<ellipse cx="200" cy="356" rx="118" ry="13" fill="#1b1d4b" opacity=".13"/>', '');
}

let count = 0;
PRODUCTS.forEach((p) => {
  const slug = slugify(p.name);
  fs.writeFileSync(path.join(OUT, `${slug}.svg`), build(p));
  fs.writeFileSync(path.join(OUT, `${slug}-2.svg`), benefitsCard(p));
  fs.writeFileSync(path.join(OUT, `${slug}-3.svg`), detailsCard(p));
  count += 3;
});
console.log(`Generated ${count} product images in ${OUT}`);
