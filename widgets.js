// Hands-on challenge widgets for STEM Campus Quest.
// WIDGETS[type](q, el) draws challenge q into el and returns:
//   check()  -> { ok, yours, correct }   short text used in the feedback and the analysis
//   reveal() -> after a wrong answer: keeps the player's answer, marks mistakes red,
//               and shows the correct answer as a see-through green ghost
//   solve()  -> moves the widget to the correct answer (used by the ?test self-check)
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
// shuffled copy that is never already in the answer order
const mix = a => { if (a.length < 2) return a.slice(); let s; do s = shuffle(a); while (s.every((x, i) => x === a[i])); return s; };
let UID = 0;
const uid = p => `${p}${++UID}`;
const num = v => String(+(+v).toFixed(2));
const lbl = it => typeof it === 'string' ? it : it.label;
const chipInner = it => `${it.color ? `<span class="w-sw" style="background:${it.color}"></span>` : ''}<span>${esc(lbl(it))}</span>`;
const GOOD = '#2ecc71', BAD = '#e63946';
const ghostRow = (title, chips) => `<div class="w-ghost-row"><span>${esc(title)}</span>${chips}</div>`;

document.head.insertAdjacentHTML('beforeend', `<style>
.w-svg { direction: ltr; width: 100%; height: auto; max-height: 52vh; display: block; background: var(--bg); border: 1px solid var(--line); border-radius: 12px; touch-action: manipulation; }
.w-sq { max-width: 400px; margin: 0 auto; }
.w-hot { cursor: crosshair; }
.w-mark { pointer-events: none; }
.w-lab { fill: currentColor; font: 700 15px system-ui, sans-serif; }
.w-ctl { direction: ltr; display: flex; align-items: center; gap: 12px; margin-top: 12px; flex-wrap: wrap; color: var(--muted); font-weight: 600; font-size: 14px; }
.w-ctl input[type=range] { flex: 1; min-width: 160px; height: 32px; accent-color: var(--c); }
.w-read { color: var(--ink); font-weight: 700; font-variant-numeric: tabular-nums; margin: 8px 0 0; font-size: 16px; }
.w-hint { color: var(--muted); font-size: 14px; margin: 0; }
.w-chip { border: 2px solid var(--line); background: var(--panel); border-radius: 10px; padding: 8px 12px; font-weight: 600; display: inline-flex; gap: 8px; align-items: center; text-align: start; }
.w-chip:hover { border-color: var(--c); }
.w-chip.sel { border-color: var(--c); box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 35%, transparent); }
.w-sw { width: 18px; height: 18px; border-radius: 50%; border: 1px solid rgba(0,0,0,.2); flex: none; }
.w-pool { display: flex; flex-wrap: wrap; gap: 8px; min-height: 54px; padding: 8px; border: 2px dashed var(--line); border-radius: 12px; margin-top: 10px; align-items: center; }
.w-ends { display: flex; justify-content: space-between; color: var(--muted); font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; margin-top: 10px; }
.w-slots { list-style: none; display: flex; flex-wrap: wrap; gap: 8px; padding: 0; margin: 6px 0 0; counter-reset: wslot; }
.w-slot { min-width: 104px; min-height: 44px; border: 2px solid var(--line); border-radius: 10px; display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: var(--panel); font-weight: 600; }
.w-slot::before { counter-increment: wslot; content: counter(wslot); width: 22px; height: 22px; border-radius: 6px; background: var(--line); display: grid; place-items: center; font-size: 12px; flex: none; }
.w-slot.empty { color: var(--muted); border-style: dashed; font-weight: 500; }
.w-bins { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px; }
.w-bin { border: 2px solid var(--line); border-radius: 12px; padding: 10px; min-height: 120px; background: var(--bg); display: flex; flex-direction: column; gap: 6px; align-items: flex-start; cursor: pointer; }
.w-bin > b { font-size: 13px; text-transform: uppercase; letter-spacing: .5px; color: var(--c); }
.w-match { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; }
.w-match .w-chip { width: 100%; }
.w-badge { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-size: 13px; font-weight: 800; flex: none; background: var(--line); }
.w-ok { border-color: var(--good) !important; background: var(--good-bg) !important; }
.w-bad { border-color: var(--bad) !important; background: var(--bad-bg) !important; }
.w-ghost { opacity: .6; border-style: dashed !important; border-color: ${GOOD} !important; background: color-mix(in srgb, ${GOOD} 16%, transparent) !important; }
.w-ghost-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 12px; }
.w-ghost-row > span:first-child { font-size: 13px; font-weight: 800; color: ${GOOD}; text-transform: uppercase; letter-spacing: .5px; }
.w-ghost-tag { margin-inline-start: auto; color: ${GOOD}; font-size: 13px; font-weight: 700; opacity: .85; }
.w-gfill, .w-gfill * { fill: ${GOOD} !important; fill-opacity: .45 !important; stroke: ${GOOD} !important; stroke-width: 3px; stroke-dasharray: 7 5; pointer-events: none; }
.w-done { pointer-events: none; }
.w-beat { animation: wbeat 1s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes wbeat { 0%, 100% { transform: scale(1); } 12% { transform: scale(1.14); } 26% { transform: scale(.97); } 38% { transform: scale(1.06); } }
.w-beam { transition: transform .5s cubic-bezier(.3, 1.4, .5, 1); }
.w-eq { direction: ltr; display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: center; gap: 14px; }
.w-term { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 110px; }
.w-term b { font-size: 22px; }
.w-op { font-size: 28px; font-weight: 800; align-self: center; }
.w-mols { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; max-width: 150px; min-height: 30px; }
.w-mol { width: 40px; height: 28px; }
.w-step { direction: ltr; display: inline-flex; align-items: center; border: 2px solid var(--line); border-radius: 10px; overflow: hidden; background: var(--panel); }
.w-step button { width: 36px; height: 38px; border: 0; background: var(--bg); font-size: 20px; font-weight: 800; }
.w-step span { min-width: 32px; text-align: center; font-weight: 800; font-size: 20px; }
.w-count { direction: ltr; margin-top: 14px; font-size: 15px; }
.w-count td.eq { color: var(--good); font-weight: 800; }
.w-count td.ne { color: var(--bad); font-weight: 800; }
.w-paint { display: grid; gap: 14px; }
.w-blobs { display: flex; gap: 28px; justify-content: center; text-align: center; }
.w-blob { display: block; width: 110px; height: 110px; border-radius: 46% 54% 50% 50% / 55% 45% 55% 45%; border: 3px solid var(--line); margin-bottom: 6px; }
.w-blob.w-bad { border-width: 4px; }
.w-drops { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.w-drops button { border: 0; border-radius: 10px; padding: 10px 14px; font-weight: 700; color: #fff; }
.w-drops button.w-plain { background: var(--bg); color: var(--ink); border: 2px solid var(--line); }
.w-photos { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; text-align: center; font-weight: 700; }
.w-photos img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 12px; border: 3px solid var(--line); margin-bottom: 6px; }
.w-photos img.w-bad { border-width: 4px; }
.w-knob { position: relative; flex: 1; min-width: 160px; display: flex; }
.w-knob i { position: absolute; top: 50%; width: 18px; height: 18px; margin: -9px 0 0 -9px; border-radius: 50%; background: rgba(46,204,113,.45); border: 2px dashed var(--good); pointer-events: none; }
.w-pun { direction: ltr; display: grid; grid-template-columns: 50px 1fr 1fr; gap: 8px; max-width: 440px; margin: 12px auto 0; }
.w-pun b { display: grid; place-items: center; font-size: 24px; color: var(--c); }
.w-pcell { justify-content: center; min-height: 72px; font-size: 20px; flex-wrap: wrap; }
.w-spin { animation: wspin 8s linear infinite; transform-box: fill-box; transform-origin: center; }
@keyframes wspin { to { transform: rotate(360deg); } }
.w-swing { animation: wswing 1s ease-in-out infinite alternate; }
@keyframes wswing { from { transform: rotate(-20deg); } to { transform: rotate(20deg); } }
.w-flash { animation: wflash 1s infinite; }
@keyframes wflash { 0%, 14% { opacity: 1; } 15%, 100% { opacity: .15; } }
.w-jig { animation: wjig .3s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center; }
@keyframes wjig { from { transform: translate(-1.5px, 1px); } to { transform: translate(1.5px, -1px); } }
/* Arabic: drawings stay left-to-right, but their labels read right-to-left, so text-anchor start/end swap to keep each label where it was */
html[dir=rtl] .w-svg text { direction: rtl; }
html[dir=rtl] .w-svg text:not([text-anchor]), html[dir=rtl] .w-svg text[text-anchor=start] { text-anchor: end; }
html[dir=rtl] .w-svg text[text-anchor=end] { text-anchor: start; }
html[dir=rtl] .w-ctl > span, html[dir=rtl] .w-ctl output { direction: rtl; }
html[lang=ar] * { letter-spacing: 0 !important; }
@media (prefers-reduced-motion: reduce) { .w-beat, .w-spin, .w-swing, .w-flash, .w-jig { animation: none; } .w-beam { transition: none; } }
</style>`);

const WIDGETS = {};

// ---------- scale: resize one body next to another; the view zooms out so both always fit ----------
const ORB = {
  sun: (cx, cy, r, id) => `<defs><radialGradient id="${id}"><stop offset="0" stop-color="#fff6c2"/><stop offset=".5" stop-color="#ffbe2e"/><stop offset="1" stop-color="#f3700f"/></radialGradient></defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"/>`,
  earth: (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#2f80ed"/><ellipse cx="${cx - r * .3}" cy="${cy - r * .25}" rx="${r * .38}" ry="${r * .26}" fill="#3fae5a"/><ellipse cx="${cx + r * .35}" cy="${cy + r * .3}" rx="${r * .3}" ry="${r * .2}" fill="#3fae5a"/>`,
  moon: (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#b9bec7"/><circle cx="${cx - r * .3}" cy="${cy - r * .2}" r="${r * .18}" fill="#9aa0aa"/><circle cx="${cx + r * .35}" cy="${cy + r * .25}" r="${r * .13}" fill="#9aa0aa"/><circle cx="${cx + r * .1}" cy="${cy - r * .45}" r="${r * .09}" fill="#9aa0aa"/>`,
  rbc: (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#c0392b"/><circle cx="${cx}" cy="${cy}" r="${r * .5}" fill="#e57373"/>`,
  hair: (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#4e342e"/><circle cx="${cx}" cy="${cy}" r="${r * .84}" fill="#795548"/><circle cx="${cx}" cy="${cy}" r="${r * .3}" fill="#5d4037"/>`,
};
WIDGETS.scale = (q, el) => {
  const W = 600, H = 270, gid = uid('orb'), tol = q.tol ?? 0.25, L = Math.log(q.max / q.min);
  const toV = s => q.min * Math.exp(L * s / 1000), toS = v => Math.round(Math.log(v / q.min) / L * 1000);
  const fmt = v => (v < 1 ? v.toFixed(2) : v < 10 ? v.toFixed(1) : Math.round(v)) + '×';
  let ghost = null;
  el.innerHTML = `<svg class="w-svg" viewBox="0 0 ${W} ${H}"></svg>
    <div class="w-ctl"><span>${tr('Smaller', 'أصغر')}</span><input type="range" min="0" max="1000" value="${toS(q.start)}" aria-label="${esc(q.b.name)}"><span>${tr('Bigger', 'أكبر')}</span></div>
    <p class="w-read"></p>`;
  const svg = el.querySelector('svg'), inp = el.querySelector('input'), out = el.querySelector('.w-read');
  const draw = () => {
    // world units: A has radius 1, B has radius v; B's right edge sits at x = 0, A sits to its right
    const v = toV(+inp.value), big = Math.max(v, ghost || 0), gap = 0.25 * Math.max(big, 1), span = 2 * big + gap + 2;
    const s = Math.min((W - 40) / span, (H - 70) / (2 * Math.max(big, 1)));
    const x0 = (W - s * span) / 2 + s * 2 * big, cy = (H - 24) / 2;
    const rB = s * v, bx = x0 - rB, rA = s, ax = x0 + s * (gap + 1); // A keeps shrinking; the dashed ring below marks it once tiny
    let g = ORB[q.b.draw](bx, cy, rB, gid);
    if (ghost) {
      const rG = s * ghost;
      g += `<circle cx="${bx}" cy="${cy}" r="${rB}" fill="none" stroke="${BAD}" stroke-width="3"/>
        <circle cx="${x0 - rG}" cy="${cy}" r="${rG}" fill="${GOOD}" fill-opacity=".28" stroke="${GOOD}" stroke-width="3" stroke-dasharray="8 6"/>`;
    }
    g += ORB[q.a.draw](ax, cy, rA, gid + 'a');
    if (rA < 8) g += `<circle cx="${ax}" cy="${cy}" r="13" fill="none" stroke="currentColor" stroke-opacity=".6" stroke-dasharray="3 3"/>`;
    g += rB > 40
      ? `<text x="${bx}" y="${cy + 6}" text-anchor="middle" class="w-lab" style="fill:${q.b.ink || '#3b2300'}">${esc(q.b.name)}</text>`
      : `<text x="${bx}" y="${cy - rB - 10}" text-anchor="middle" class="w-lab">${esc(q.b.name)}</text>`;
    g += `<text x="${ax}" y="${cy + Math.max(rA, 13) + 22}" text-anchor="middle" class="w-lab">${esc(q.a.name)}</text>`;
    svg.innerHTML = g;
    out.innerHTML = ghost
      ? `<span style="color:${BAD}">${tr('Yours', 'إجابتك')}: ${fmt(v)}</span> · <span style="color:${GOOD}">${tr(`Real size (see-through): ${q.ratio}× as wide as ${esc(q.a.name)}`, `الحجم الحقيقي (الشفاف): ${q.ratio}× من عرض ${esc(q.a.name)}`)}</span>`
      : tr(`${esc(q.b.name)}: ${fmt(v)} as wide as ${esc(q.a.name)}`, `عرض ${esc(q.b.name)}: ${fmt(v)} من عرض ${esc(q.a.name)}`);
  };
  inp.oninput = draw; draw();
  return {
    check() { const v = toV(+inp.value); return { ok: v >= q.ratio / (1 + tol) && v <= q.ratio * (1 + tol), yours: tr(`${fmt(v)} as wide`, `${fmt(v)} من العرض`), correct: tr(`about ${q.ratio}× as wide`, `حوالي ${q.ratio}× من العرض`) }; },
    reveal() { ghost = q.ratio; draw(); },
    solve() { ghost = null; inp.value = toS(q.ratio); draw(); },
  };
};

// ---------- gauge: slide a value on a live instrument ----------
// GAUGE[kind](v, q, id, g): g is the correct value to ghost in after a wrong answer (else null)
const PH = ['#d7191c', '#e8412b', '#f46d43', '#fb9a50', '#fdc161', '#fee08b', '#d9ef8b', '#91cf60', '#4caf50', '#1a9850', '#26a69a', '#3288bd', '#4a63b0', '#5e4fa2', '#6a3d9a'];
const heartAt = (cx, bpm, ghost) => `<g transform="translate(${cx} 0)"><g class="w-beat" style="animation-duration:${(60 / bpm).toFixed(3)}s">
  <path d="M0 182C-90 120-74 38 0 76C74 38 90 120 0 182Z" ${ghost ? `fill="${GOOD}" fill-opacity=".3" stroke="${GOOD}" stroke-width="3" stroke-dasharray="8 6"` : 'fill="#c0392b"'}/>
  ${ghost ? '' : '<path d="M-38 82c-12 6-18 18-16 32" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="6" stroke-linecap="round"/>'}</g></g>`;
const GAUGE = {
  ph(v, q, id, g) {
    const x = p => 40 + p / 14 * 520;
    return `<defs><linearGradient id="${id}">${PH.map((c, p) => `<stop offset="${p / 14}" stop-color="${c}"/>`).join('')}</linearGradient></defs>
      <path d="M250 18v84a12 12 0 0 0 12 12h76a12 12 0 0 0 12-12V18" fill="none" stroke="currentColor" stroke-width="3"/>
      <rect x="253" y="48" width="94" height="63" rx="10" fill="${PH[Math.round(v)]}" opacity=".9"/>
      <text x="370" y="70" class="w-lab">${esc(q.item)}</text>
      <rect x="40" y="150" width="520" height="28" rx="6" fill="url(#${id})"/>
      ${PH.map((_, p) => `<text x="${x(p)}" y="200" text-anchor="middle" class="w-lab" style="font-size:12px">${p}</text>`).join('')}
      <text x="40" y="140" class="w-lab" style="font-size:12px">${tr('ACID', 'حمض')}</text><text x="300" y="140" text-anchor="middle" class="w-lab" style="font-size:12px">${tr('NEUTRAL', 'متعادل')}</text><text x="560" y="140" text-anchor="end" class="w-lab" style="font-size:12px">${tr('BASE', 'قاعدة')}</text>
      ${g === null ? '' : `<rect x="${x(q.lo)}" y="146" width="${x(q.hi) - x(q.lo)}" height="36" rx="6" fill="${GOOD}" fill-opacity=".3" stroke="${GOOD}" stroke-width="3" stroke-dasharray="7 5"/><path d="M${x(g)} 182l-9 14h18z" fill="${GOOD}" opacity=".6"/>`}
      <path d="M${x(v)} 182l-9 14h18z" fill="${g === null ? 'currentColor' : BAD}"/>`;
  },
  tilt(v, q, id, g) {
    const a = v * Math.PI / 180;
    return `<line x1="40" y1="110" x2="560" y2="110" stroke="currentColor" stroke-opacity=".35" stroke-width="2" stroke-dasharray="6 6"/>
      <text x="560" y="100" text-anchor="end" class="w-lab" style="font-size:12px">${tr('ORBIT PLANE', 'مستوى المدار')}</text>
      <line x1="300" y1="14" x2="300" y2="206" stroke="currentColor" stroke-opacity=".35" stroke-width="2" stroke-dasharray="4 6"/>
      ${ORB.earth(300, 110, 62)}
      <path d="M300 30A80 80 0 0 1 ${300 + 80 * Math.sin(a)} ${110 - 80 * Math.cos(a)}" fill="none" stroke="#e0a800" stroke-width="3"/>
      ${g === null ? '' : `<line x1="300" y1="16" x2="300" y2="204" transform="rotate(${g} 300 110)" stroke="${GOOD}" stroke-opacity=".5" stroke-width="10" stroke-linecap="round"/>`}
      <g transform="rotate(${v} 300 110)"><line x1="300" y1="16" x2="300" y2="204" stroke="${BAD}" stroke-width="4" stroke-linecap="round"/><text x="300" y="12" text-anchor="middle" class="w-lab">${tr('N', 'ش')}</text></g>`;
  },
  timeline(v, q, id, g) {
    const x = t => 50 + t / 14 * 500; // today on the left, so the slider and Earth move the same way
    let ticks = '';
    for (let t = 0; t <= 14; t++) ticks += `<line x1="${x(t)}" y1="114" x2="${x(t)}" y2="${t % 2 ? 122 : 128}" stroke="currentColor" stroke-width="2"/>${t % 2 ? '' : `<text x="${x(t)}" y="146" text-anchor="middle" class="w-lab" style="font-size:12px">${t}</text>`}`;
    return `<line x1="50" y1="114" x2="550" y2="114" stroke="currentColor" stroke-width="3"/>${ticks}
      <text x="300" y="172" text-anchor="middle" class="w-lab" style="font-size:12px">${tr('BILLION YEARS AGO', 'مليار سنة مضت')}</text>
      <path d="M${x(13.8)} 96l4 10 10 2-10 2-4 10-4-10-10-2 10-2z" fill="#e0a800"/><text x="${x(13.8)}" y="88" text-anchor="middle" class="w-lab" style="font-size:12px">${tr('Big Bang', 'الانفجار العظيم')}</text>
      <text x="${x(0)}" y="92" text-anchor="middle" class="w-lab" style="font-size:12px">${tr('Today', 'اليوم')}</text>
      ${g === null ? '' : `<rect x="${x(q.lo)}" y="104" width="${x(q.hi) - x(q.lo)}" height="20" rx="4" fill="${GOOD}" fill-opacity=".35" stroke="${GOOD}" stroke-width="2" stroke-dasharray="6 4"/><g opacity=".45">${ORB.earth(x(g), 50, 15)}</g><text x="${x(g)}" y="88" text-anchor="middle" class="w-lab" style="font-size:12px;fill:${GOOD}">${tr('Real', 'الحقيقي')}</text>`}
      <line x1="${x(v)}" y1="66" x2="${x(v)}" y2="114" stroke="${g === null ? '#2f80ed' : BAD}" stroke-width="2" stroke-dasharray="3 3"/>
      ${ORB.earth(x(v), 50, 15)}<text x="${x(v)}" y="24" text-anchor="middle" class="w-lab" style="font-size:12px">${tr('Earth forms', 'تكوّن الأرض')}</text>`;
  },
  heart(v, q, id, g) {
    if (g === null) return heartAt(300, v, false);
    return `${heartAt(190, v, false)}${heartAt(410, g, true)}
      <text x="190" y="210" text-anchor="middle" class="w-lab" style="fill:${BAD}">${tr('Yours', 'إجابتك')}: ${v}</text>
      <text x="410" y="210" text-anchor="middle" class="w-lab" style="fill:${GOOD}">${tr('Healthy', 'الطبيعي')}: ${q.lo}–${q.hi}</text>`;
  },
  thermo(v, q, id, g) {
    // thermometer on the left; water particles on the right pack, slide or fly apart with temperature
    const T = t => 190 - (t + 20) / 160 * 170, state = v <= 0 ? 0 : v < 100 ? 1 : 2;
    let ticks = '';
    for (let t = -20; t <= 140; t += 20) ticks += `<line x1="92" y1="${T(t)}" x2="100" y2="${T(t)}" stroke="currentColor" stroke-width="2"/><text x="106" y="${T(t) + 5}" class="w-lab" style="font-size:12px">${t}</text>`;
    const dots = Array.from({ length: 24 }, (_, i) => {
      const [x, y] = state === 0 ? [312 + (i % 6) * 30, 176 - Math.floor(i / 6) * 24]
        : state === 1 ? [300 + RAND[i] * 170, 118 + RAND[i + 24] * 66] : [300 + RAND[i] * 170, 52 + RAND[i + 24] * 132];
      return `<circle class="w-jig" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8" fill="#4dabf7" style="animation-duration:${Math.max(.07, .7 - (v + 20) / 260).toFixed(2)}s;animation-delay:-${RAND[i].toFixed(2)}s"/>`;
    }).join('');
    return `<rect x="70" y="16" width="22" height="178" rx="11" fill="none" stroke="currentColor" stroke-width="3"/>
      <rect x="75" y="${T(v)}" width="12" height="${194 - T(v)}" fill="${g === null ? '#e63946' : BAD}"/><circle cx="81" cy="200" r="15" fill="${g === null ? '#e63946' : BAD}"/>
      ${ticks}${g === null ? '' : `<line x1="62" y1="${T(g)}" x2="100" y2="${T(g)}" stroke="${GOOD}" stroke-width="7" stroke-opacity=".6"/><text x="150" y="${T(g) + 5}" class="w-lab" style="fill:${GOOD}">${g} ${tr('°C', '°م')}</text>`}
      <path d="M280 30v160a12 12 0 0 0 12 12h186a12 12 0 0 0 12-12V30" fill="none" stroke="currentColor" stroke-width="3"/>
      ${dots}<text x="385" y="22" text-anchor="middle" class="w-lab">${[tr('Solid (ice)', 'صلب (جليد)'), tr('Liquid water', 'ماي سائل'), tr('Gas (steam)', 'غاز (بخار)')][state]}</text>`;
  },
};
// fixed pseudo-random numbers so particle layouts don't flicker between redraws
const RAND = Array.from({ length: 48 }, (_, i) => ((Math.sin(i * 12.9898 + 1) * 43758.5453) % 1 + 1) % 1);
WIDGETS.gauge = (q, el) => {
  const gid = uid('g');
  let ghost = null;
  el.innerHTML = `<svg class="w-svg" viewBox="0 0 600 220"></svg>
    <div class="w-ctl"><input type="range" min="${q.min}" max="${q.max}" step="${q.step}" value="${q.start}" aria-label="${esc(q.t)}"><output class="w-read" style="margin:0"></output></div>`;
  const svg = el.querySelector('svg'), inp = el.querySelector('input'), out = el.querySelector('output');
  const fmt = v => `${num(v)}${q.unit}`, right = () => q.correctText || fmt(q.answer);
  const draw = () => {
    const v = +inp.value;
    svg.innerHTML = GAUGE[q.kind](v, q, gid, ghost);
    out.innerHTML = ghost === null ? fmt(v) : `<span style="color:${BAD}">${tr('Yours', 'إجابتك')}: ${fmt(v)}</span> · <span style="color:${GOOD}">${tr('Correct', 'الصحيح')}: ${esc(right())}</span>`;
  };
  inp.oninput = draw; draw();
  return {
    check() { const v = +inp.value; return { ok: v >= q.lo && v <= q.hi, yours: fmt(v), correct: right() }; },
    reveal() { ghost = q.answer; draw(); },
    solve() { ghost = null; inp.value = q.answer; draw(); },
  };
};

// ---------- order: tap items into numbered slots ----------
const FIG = {
  // rock layers, top (youngest) to bottom (oldest)
  strata: { vb: '0 0 600 200', svg: () => [[tr('Soil', 'تربة'), '#6d4c41', '#fff'], [tr('Sandstone', 'حجر رملي'), '#e9c46a'], [tr('Shale', 'صخر طيني'), '#8d99ae'], [tr('Limestone', 'حجر جيري'), '#d6d1c4'], [tr('Conglomerate', 'كونغلوميرات'), '#a1887f']]
    .map(([n, c, t], i) => `<rect x="0" y="${i * 40}" width="600" height="40" fill="${c}"/><text x="18" y="${i * 40 + 26}" class="w-lab" style="fill:${t || '#1d2733'}">${n}</text>`).join('')
    + '<path d="M0 0h600" stroke="#52b788" stroke-width="6"/>' },
};
WIDGETS.order = (q, el) => {
  const pool = mix(q.items);
  let slots = q.items.map(() => null), shown = false;
  const draw = () => {
    el.innerHTML = `${q.figure ? `<svg class="w-svg" viewBox="${FIG[q.figure].vb}">${FIG[q.figure].svg()}</svg>` : ''}
      ${q.ends ? `<div class="w-ends"><span>${esc(q.ends[0])}</span><span>${esc(q.ends[1])} ${tr('→', '←')}</span></div>` : ''}
      <ol class="w-slots">${slots.map((s, k) => `<li><button class="w-slot${s === null ? ' empty' : ''}${shown ? (s === q.items[k] ? ' w-ok' : ' w-bad') : ''}" data-slot="${k}">${s === null ? '…' : chipInner(s)}</button></li>`).join('')}</ol>
      ${shown ? ghostRow(tr('Correct order', 'الترتيب الصحيح'), q.items.map((it, k) => `<span class="w-chip w-ghost">${k + 1}. ${chipInner(it)}</span>`).join(''))
        : `<div class="w-pool">${pool.map((p, k) => slots.includes(p) ? '' : `<button class="w-chip" data-pool="${k}">${chipInner(p)}</button>`).join('') || `<p class="w-hint">${tr('All placed. Tap a numbered slot to take an item back.', 'كل العناصر انحطّت. دوس على خانة مرقّمة عشان ترجّع عنصر.')}</p>`}</div>`}`;
  };
  el.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.pool !== undefined) { const k = slots.indexOf(null); if (k >= 0) slots[k] = pool[+b.dataset.pool]; }
    else if (b.dataset.slot !== undefined) slots[+b.dataset.slot] = null;
    draw();
  };
  draw();
  return {
    check: () => ({ ok: slots.every((s, k) => s === q.items[k]), yours: slots.map(s => s === null ? '?' : lbl(s)).join(` ${tr('→', '←')} `), correct: q.items.map(lbl).join(` ${tr('→', '←')} `) }),
    reveal() { shown = true; draw(); },
    solve() { shown = false; slots = q.items.slice(); draw(); },
  };
};

// ---------- bins: sort items into groups ----------
WIDGETS.bins = (q, el) => {
  const items = mix(q.items);
  let place = items.map(() => -1), sel = null, shown = false;
  const mark = k => shown ? (place[k] === items[k][1] ? ' w-ok' : ' w-bad') : '';
  const chip = k => `<button class="w-chip${sel === k ? ' sel' : ''}${mark(k)}" data-k="${k}">${chipInner(items[k][0])}</button>`;
  // after a wrong answer, a see-through copy of each misplaced item appears in its right group
  const ghosts = i => shown ? items.map((it, k) => it[1] === i && place[k] !== i ? `<span class="w-chip w-ghost">${chipInner(it[0])}</span>` : '').join('') : '';
  const draw = () => {
    el.innerHTML = `<p class="w-hint">${tr('Tap an item, then tap the group it belongs in.', 'دوس على عنصر، وبعدين دوس على المجموعة اللي ينتمي لها.')}</p>
      <div class="w-pool" data-b="-1">${items.map((_, k) => place[k] === -1 ? chip(k) : '').join('') || `<p class="w-hint">${tr('All sorted. Tap an item to move it.', 'كل العناصر انصنّفت. دوس على عنصر عشان تحرّكه.')}</p>`}</div>
      <div class="w-bins">${q.bins.map((b, i) => `<div class="w-bin" data-b="${i}"><b>${esc(b)}</b>${items.map((_, k) => place[k] === i ? chip(k) : '').join('')}${ghosts(i)}</div>`).join('')}</div>`;
  };
  el.onclick = e => {
    const c = e.target.closest('[data-k]');
    if (c) { const k = +c.dataset.k; sel = sel === k ? null : k; return draw(); }
    const b = e.target.closest('[data-b]');
    if (b && sel !== null) { place[sel] = +b.dataset.b; sel = null; draw(); }
  };
  draw();
  return {
    check() {
      const right = items.filter((it, k) => place[k] === it[1]).length;
      return { ok: right === items.length, yours: tr(`${right} of ${items.length} in the right group`, `${right} من ${items.length} بالمجموعة الصحيحة`),
        correct: q.bins.map((b, i) => `${b}: ${q.items.filter(it => it[1] === i).map(it => lbl(it[0])).join(', ')}`).join(' · ') };
    },
    reveal() { shown = true; sel = null; draw(); },
    solve() { shown = false; place = items.map(it => it[1]); draw(); },
  };
};

// ---------- match: pair left items with right items ----------
const PAIR = ['#e76f51', '#2a9d8f', '#e0a800', '#8e44ad', '#3a86ff', '#d62828'];
WIDGETS.match = (q, el) => {
  const left = q.pairs.map(p => p[0]), right = mix(q.pairs.map(p => p[1]));
  let link = left.map(() => -1), sel = null, shown = false;
  const okL = i => right[link[i]] === q.pairs[i][1];
  const badge = i => i < 0 ? '<span class="w-badge"></span>' : `<span class="w-badge" style="background:${PAIR[i % PAIR.length]}">${i + 1}</span>`;
  const draw = () => {
    el.innerHTML = `<p class="w-hint">${tr('Tap an item on the left, then its partner on the right.', 'دوس على عنصر من اليمين، وبعدين على اللي يناسبه من اليسار.')}</p><div class="w-match">${left.map((l, i) => {
      const owner = link.indexOf(i);
      return `<button class="w-chip${sel === i ? ' sel' : ''}${shown ? (okL(i) ? ' w-ok' : ' w-bad') : ''}" data-l="${i}">${badge(link[i] < 0 ? -1 : i)}${chipInner(l)}${shown && !okL(i) ? `<span class="w-ghost-tag">${tr('→', '←')} ${esc(lbl(q.pairs[i][1]))}</span>` : ''}</button>
        <button class="w-chip${shown && owner >= 0 ? (okL(owner) ? ' w-ok' : ' w-bad') : ''}" data-r="${i}">${badge(owner)}${chipInner(right[i])}</button>`;
    }).join('')}</div>`;
  };
  el.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.l !== undefined) { const i = +b.dataset.l; if (link[i] >= 0) { link[i] = -1; sel = i; } else sel = sel === i ? null : i; }
    else if (b.dataset.r !== undefined) {
      const j = +b.dataset.r;
      if (sel !== null) { link = link.map(x => x === j ? -1 : x); link[sel] = j; sel = null; }
      else link = link.map(x => x === j ? -1 : x);
    }
    draw();
  };
  draw();
  return {
    check: () => ({ ok: left.every((_, i) => okL(i)),
      yours: left.map((l, i) => `${lbl(l)} ${tr('→', '←')} ${link[i] < 0 ? '?' : lbl(right[link[i]])}`).join(' · '),
      correct: q.pairs.map(p => `${lbl(p[0])} ${tr('→', '←')} ${lbl(p[1])}`).join(' · ') }),
    reveal() { shown = true; sel = null; draw(); },
    solve() { shown = false; link = left.map((_, i) => right.indexOf(q.pairs[i][1])); draw(); },
  };
};

// ---------- hotspot: tap the right part of a diagram ----------
const ringMark = (x, y, c = '#ffd60a') => `<circle cx="${x}" cy="${y}" r="13" fill="none" stroke="${c}" stroke-width="4"/><circle cx="${x}" cy="${y}" r="3" fill="${c}"/>`;
const ring = (r1, r2) => `M300 ${300 - r1}a${r1} ${r1} 0 1 0 .01 0zM300 ${300 - r2}a${r2} ${r2} 0 1 0 .01 0z`;
const HOT = {
  cell: {
    vb: '0 0 600 300',
    names: { cytoplasm: 'Cytoplasm', membrane: 'Cell membrane', er: 'Endoplasmic reticulum', nucleus: 'Nucleus', mito: 'Mitochondrion', golgi: 'Golgi apparatus', ribo: 'Ribosome' },
    svg: `<ellipse data-id="cytoplasm" cx="300" cy="150" rx="280" ry="135" fill="#fde2e4"/>
      <ellipse data-id="membrane" cx="300" cy="150" rx="280" ry="135" fill="none" stroke="#e5989b" stroke-width="12"/>
      <path data-id="er" d="M190 205q15-20 30 0t30 0 30 0M185 232q15-20 30 0t30 0 30 0" fill="none" stroke="#90be6d" stroke-width="8" stroke-linecap="round"/>
      <g data-id="nucleus"><circle cx="300" cy="138" r="62" fill="#cdb4db" stroke="#9d79bc" stroke-width="4"/><circle cx="318" cy="126" r="17" fill="#9d79bc"/></g>
      ${[[140, 100, -20], [460, 215, 18]].map(([x, y, a]) => `<g data-id="mito" transform="translate(${x} ${y}) rotate(${a})"><ellipse rx="50" ry="22" fill="#f4a261" stroke="#c9732c" stroke-width="3"/><path d="M-36 0l8-12 8 24 8-24 8 24 8-24 8 24 8-12" fill="none" stroke="#c9732c" stroke-width="3"/></g>`).join('')}
      <g data-id="golgi" transform="translate(470 95)"><rect x="-46" y="-36" width="92" height="72" fill="transparent"/><path d="M-40-22q40-20 80 0M-36-6q36-18 72 0M-32 10q32-16 64 0M-28 26q28-14 56 0" fill="none" stroke="#5e7fbf" stroke-width="7" stroke-linecap="round"/></g>
      <g data-id="ribo" fill="#495057">${[[95, 150], [120, 205], [380, 245], [400, 55], [225, 62], [540, 150], [345, 225]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6"/>`).join('')}</g>`,
  },
  layers: {
    vb: '0 0 600 300',
    names: { space: 'Space (outside Earth)', crust: 'Crust', mantle: 'Mantle', outer: 'Outer core', inner: 'Inner core' },
    // crust and mantle are rings (even-odd holes) so a highlight covers only that layer
    svg: `<defs><radialGradient id="wMantle" cx="300" cy="300" r="270" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="#f4a261"/><stop offset="1" stop-color="#c8553d"/></radialGradient></defs>
      <rect data-id="space" width="600" height="300" fill="#0b1d3a"/>
      <g fill="#fff" opacity=".7">${[[40, 40], [90, 120], [530, 60], [570, 150], [20, 200], [480, 20]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`).join('')}</g>
      <path data-id="crust" d="${ring(282, 270)}" fill-rule="evenodd" fill="#7b5e48"/>
      <path data-id="mantle" d="${ring(270, 150)}" fill-rule="evenodd" fill="url(#wMantle)"/>
      <path data-id="outer" d="${ring(150, 55)}" fill-rule="evenodd" fill="#f9c74f"/>
      <circle data-id="inner" cx="300" cy="300" r="55" fill="#fff3b0"/>`,
  },
  body: {
    vb: '0 0 300 410',
    names: { body: 'Somewhere else on the body', brain: 'Brain', lungs: 'Lungs', heart: 'Heart', liver: 'Liver', stomach: 'Stomach', gut: 'Intestines' },
    svg: () => `<g data-id="body" fill="#f1d3b3"><circle cx="150" cy="48" r="32"/><rect x="138" y="74" width="24" height="20"/><rect x="95" y="90" width="110" height="175" rx="30"/>
        <rect x="62" y="96" width="30" height="150" rx="15" transform="rotate(8 77 96)"/><rect x="208" y="96" width="30" height="150" rx="15" transform="rotate(-8 223 96)"/>
        <rect x="102" y="250" width="42" height="145" rx="18"/><rect x="156" y="250" width="42" height="145" rx="18"/></g>
      <ellipse data-id="brain" cx="150" cy="42" rx="24" ry="17" fill="#f2a7b8"/>
      <g data-id="lungs" fill="#f7b5c4" stroke="#e07a95" stroke-width="2"><ellipse cx="124" cy="142" rx="22" ry="38"/><ellipse cx="176" cy="142" rx="22" ry="38"/></g>
      <ellipse data-id="heart" cx="162" cy="160" rx="14" ry="19" transform="rotate(25 162 160)" fill="#b23a48"/>
      <ellipse data-id="liver" cx="128" cy="198" rx="30" ry="15" fill="#8d4a3a"/>
      <ellipse data-id="stomach" cx="174" cy="200" rx="19" ry="14" fill="#e9a178"/>
      <g data-id="gut"><rect x="115" y="218" width="70" height="40" rx="16" fill="#d9a066"/><path d="M125 230h45q8 0 0 8h-45q-8 0 0 8h45" fill="none" stroke="#b07a3f" stroke-width="3"/></g>
      <text x="20" y="404" class="w-lab" style="font-size:11px">${tr('THEIR RIGHT', 'يمين الشخص')}</text><text x="280" y="404" text-anchor="end" class="w-lab" style="font-size:11px">${tr('THEIR LEFT', 'يسار الشخص')}</text>`,
  },
  thirds: {
    vb: '0 0 600 340',
    names: { thirds: 'On a rule-of-thirds point', center: 'Right in the centre', off: 'Away from the grid points' },
    svg: `<defs><linearGradient id="wSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb4a2"/><stop offset="1" stop-color="#ffe5d9"/></linearGradient></defs>
      <g data-id="off"><rect width="600" height="340" fill="url(#wSky)"/><rect y="226" width="600" height="114" fill="#2a6f97"/><path d="M0 250q30-8 60 0t60 0 60 0 60 0 60 0 60 0 60 0 60 0 60 0 60 0" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/></g>
      <g stroke="#fff" stroke-width="2" stroke-dasharray="6 6" opacity=".8" pointer-events="none"><path d="M200 0v340M400 0v340M0 113h600M0 227h600"/></g>
      <g data-id="thirds" fill="transparent">${[[200, 113], [400, 113], [200, 227], [400, 227]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="42"/>`).join('')}</g>
      <circle data-id="center" cx="300" cy="170" r="42" fill="transparent"/>`,
    mark: (x, y) => `<g transform="translate(${x} ${y})"><path d="M-12 30-8-20H8l4 50z" fill="#fff" stroke="#1d2733" stroke-width="1.5"/><path d="M-10.6 12h21.2l.8 10h-22.8zM-9-6H9l.8 10H-9.8z" fill="#d62828"/><rect x="-10" y="-30" width="20" height="10" fill="#333"/><circle cy="-25" r="4" fill="#ffd60a"/><path d="M-12-30 0-41l12 11z" fill="#d62828"/></g>`,
  },
};
// Moon at angle a around Earth (380,170); the lit half always faces the Sun on the left
const moonAt = (k, id) => {
  const a = k * Math.PI / 4, x = 380 + 120 * Math.cos(a), y = 170 - 120 * Math.sin(a);
  return `<g data-id="${id}"><circle cx="${x}" cy="${y}" r="24" fill="transparent"/><circle cx="${x}" cy="${y}" r="13" fill="#3d4451"/><path d="M${x} ${y - 13}a13 13 0 0 0 0 26z" fill="#e9ecef"/></g>`;
};
// first three rows of the periodic table: [symbol, row, column, name]
const PT = [['H', 1, 1, 'Hydrogen'], ['He', 1, 18, 'Helium'], ['Li', 2, 1, 'Lithium'], ['Be', 2, 2, 'Beryllium'], ['B', 2, 13, 'Boron'], ['C', 2, 14, 'Carbon'], ['N', 2, 15, 'Nitrogen'], ['O', 2, 16, 'Oxygen'], ['F', 2, 17, 'Fluorine'], ['Ne', 2, 18, 'Neon'],
  ['Na', 3, 1, 'Sodium'], ['Mg', 3, 2, 'Magnesium'], ['Al', 3, 13, 'Aluminium'], ['Si', 3, 14, 'Silicon'], ['P', 3, 15, 'Phosphorus'], ['S', 3, 16, 'Sulfur'], ['Cl', 3, 17, 'Chlorine'], ['Ar', 3, 18, 'Argon']];
const NOBLE = ['He', 'Ne', 'Ar'];
Object.assign(HOT, {
  phases: {
    vb: '0 0 600 340',
    names: { space: 'Empty space', sun: 'The Sun', earth: 'Earth', full: 'Opposite the Sun (full moon)', new: 'Between Earth and the Sun (new moon)', quarter: 'Side-on to the Sun (half moon)', gibbous: 'Gibbous moon spot', crescent: 'Crescent moon spot' },
    svg: () => `<defs><radialGradient id="wSunP"><stop offset="0" stop-color="#fff6c2"/><stop offset="1" stop-color="#f3700f"/></radialGradient></defs>
      <rect data-id="space" width="600" height="340" fill="#0b1d3a"/>
      <circle data-id="sun" cx="-30" cy="170" r="100" fill="url(#wSunP)"/><text x="12" y="176" class="w-lab" style="fill:#3b2300">${tr('Sun', 'الشمس')}</text>
      <g stroke="#ffd60a" stroke-opacity=".45" stroke-width="3" pointer-events="none"><path d="M95 110h90m-12-6 12 6-12 6M95 170h90m-12-6 12 6-12 6M95 230h90m-12-6 12 6-12 6" fill="none"/></g>
      <circle cx="380" cy="170" r="120" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2" stroke-dasharray="5 6" pointer-events="none"/>
      <g data-id="earth">${ORB.earth(380, 170, 26)}</g>
      ${['full', 'gibbous', 'quarter', 'crescent', 'new', 'crescent', 'quarter', 'gibbous'].map((id, k) => moonAt(k, id)).join('')}`,
  },
  ptable: {
    vb: '0 0 600 220',
    names: { gap: 'An empty gap in the table', noble: 'A noble gas', ...Object.fromEntries(PT.filter(e => !NOBLE.includes(e[0])).map(e => [e[0], e[3]])) },
    svg: `<rect data-id="gap" width="600" height="220" fill="transparent"/>${PT.map(([s, r, c]) => {
      const x = 12 + (c - 1) * 32.5, y = 14 + (r - 1) * 66;
      return `<g data-id="${NOBLE.includes(s) ? 'noble' : s}"><rect x="${x}" y="${y}" width="30" height="60" rx="5" fill="#e9ecef" stroke="#adb5bd"/><text x="${x + 15}" y="${y + 37}" text-anchor="middle" class="w-lab" style="fill:#1d2733">${s}</text></g>`;
    }).join('')}`,
  },
  plates: {
    vb: '0 0 600 300',
    names: { sky: 'The sky', mantle: 'The mantle', ocean: 'Ocean water', crust: 'Old ocean floor', continent: 'A continent', trench: 'Subduction zone (old floor sinking)', volcano: 'A volcano', ridge: 'Mid-ocean ridge (plates pulling apart)' },
    svg: `<rect data-id="sky" width="600" height="300" fill="#bde0fe"/>
      <rect data-id="mantle" y="168" width="600" height="132" fill="#e07a5f"/>
      <path data-id="ocean" d="M135 92H485V150H135Z" fill="#2a6f97"/>
      <path data-id="crust" d="M125 150H485L475 172H135Z" fill="#495057"/>
      <path data-id="continent" d="M0 70H140L150 172H0ZM472 70H600V180H520Z" fill="#8d6e63"/>
      <path data-id="trench" d="M470 150H492L572 300H540Z" fill="#343a40"/>
      <g data-id="volcano"><path d="M500 70 530 28 560 70Z" fill="#6d4c41"/><path d="M522 40 530 28 538 40Z" fill="#e63946"/></g>
      <g data-id="ridge"><rect x="262" y="118" width="76" height="182" fill="transparent"/><path d="M268 151Q300 126 332 151Z" fill="#495057"/><path d="M291 300Q299 220 300 146Q301 220 309 300Z" fill="#f77f00"/></g>
      <path d="M252 162h-56m0 0 10-6m-10 6 10 6M348 162h56m0 0-10-6m10 6-10 6" stroke="#fff" stroke-width="3" fill="none" pointer-events="none"/>`,
  },
  vanish: {
    vb: '0 0 600 340',
    names: { vp: 'The vanishing point', off: 'Not where the lines meet' },
    svg: `<defs><linearGradient id="wDusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ecae6"/><stop offset="1" stop-color="#ffe5d9"/></linearGradient></defs>
      <g data-id="off"><rect width="600" height="130" fill="url(#wDusk)"/><rect y="130" width="600" height="210" fill="#8ab17d"/>
        <path d="M110 340 300 130 490 340Z" fill="#b08968"/>
        ${[.06, .14, .25, .4, .58, .8].map(s => { const y = 130 + 210 * s, w = 170 * s; return `<path d="M${300 - w} ${y}H${300 + w}" stroke="#6d4c41" stroke-width="${2 + 6 * s}"/>`; }).join('')}
        <path d="M150 340 300 130M450 340 300 130" stroke="#495057" stroke-width="5"/>
        ${[1, .6, .36, .22].map(s => `<path d="M${300 - 270 * s} ${130 + 210 * s}v${-150 * s}M${300 + 270 * s} ${130 + 210 * s}v${-150 * s}" stroke="#6d4c41" stroke-width="${2 + 4 * s}"/>`).join('')}</g>
      <circle data-id="vp" cx="300" cy="130" r="26" fill="transparent"/>`,
  },
  xray: {
    vb: '0 0 300 400',
    names: { film: 'Empty X-ray film', femur: 'Thigh bone (femur), not broken', knee: 'Kneecap, not broken', tibia: 'Shin bone, away from the break', fibula: 'Fibula, not broken', break: 'The crack in the shin bone (tibia)' },
    svg: `<g data-id="film"><rect width="300" height="400" fill="#0d1b2a"/><path d="M95 0C90 120 120 180 105 250 95 320 110 360 105 400H200C195 360 205 320 195 250 185 180 215 120 210 0Z" fill="#1b263b"/></g>
      <path data-id="femur" d="M140 0H170V150Q185 165 180 178H130Q125 165 140 150Z" fill="#e0e6ee"/>
      <circle data-id="knee" cx="168" cy="186" r="13" fill="#cfd8e3"/>
      <path data-id="tibia" d="M132 196H170L166 380H140Z" fill="#e0e6ee"/>
      <path data-id="fibula" d="M176 204H186L184 378H178Z" fill="#cfd8e3"/>
      <g data-id="break"><rect x="124" y="266" width="50" height="34" fill="transparent"/><path d="M134 280l7 6 6-8 7 9 6-7 6 7" fill="none" stroke="#0d1b2a" stroke-width="4"/></g>`,
  },
});
const PT_AR = { H: 'هيدروجين', Li: 'ليثيوم', Be: 'بيريليوم', B: 'بورون', C: 'كربون', N: 'نيتروجين', O: 'أكسجين', F: 'فلور', Na: 'صوديوم', Mg: 'مغنيسيوم', Al: 'ألومنيوم', Si: 'سيليكون', P: 'فوسفور', S: 'كبريت', Cl: 'كلور' };
// Arabic names for what a tap lands on, same keys as HOT[...].names
const HOT_AR = {
  cell: { cytoplasm: 'السيتوبلازم', membrane: 'غشاء الخلية', er: 'الشبكة الإندوبلازمية', nucleus: 'النواة', mito: 'الميتوكوندريا', golgi: 'جهاز غولجي', ribo: 'الريبوسوم' },
  layers: { space: 'الفضاء (خارج الأرض)', crust: 'القشرة', mantle: 'الوشاح', outer: 'اللب الخارجي', inner: 'اللب الداخلي' },
  body: { body: 'مكان ثاني بالجسم', brain: 'الدماغ', lungs: 'الرئتين', heart: 'القلب', liver: 'الكبد', stomach: 'المعدة', gut: 'الأمعاء' },
  thirds: { thirds: 'على نقطة من قاعدة الأثلاث', center: 'بالنص بالضبط', off: 'بعيد عن نقاط الشبكة' },
  phases: { space: 'فضاء فاضي', sun: 'الشمس', earth: 'الأرض', full: 'مقابل الشمس (بدر)', new: 'بين الأرض والشمس (محاق)', quarter: 'بالجنب للشمس (نص قمر)', gibbous: 'مكان القمر الأحدب', crescent: 'مكان الهلال' },
  ptable: { gap: 'فراغ بالجدول', noble: 'غاز نبيل', ...PT_AR },
  plates: { sky: 'السما', mantle: 'الوشاح', ocean: 'ماي المحيط', crust: 'قاع المحيط القديم', continent: 'قارة', trench: 'منطقة اندساس (القاع القديم يغوص)', volcano: 'بركان', ridge: 'حيد وسط المحيط (الصفائح تتباعد)' },
  vanish: { vp: 'نقطة التلاشي', off: 'مب المكان اللي تتقابل فيه الخطوط' },
  xray: { film: 'فيلم الأشعة الفاضي', femur: 'عظمة الفخذ، مب مكسورة', knee: 'الرضفة، مب مكسورة', tibia: 'عظمة الساق، بعيد عن الكسر', fibula: 'الشظية، مب مكسورة', break: 'الشق بعظمة الساق (الظنبوب)' },
};
WIDGETS.hotspot = (q, el) => {
  const F = HOT[q.draw], NM = LANG === 'ar' ? HOT_AR[q.draw] : F.names;
  let pick = null, at = null;
  el.innerHTML = `<svg class="w-svg w-hot${F.vb.endsWith('410') ? ' w-sq' : ''}" viewBox="${F.vb}">${typeof F.svg === 'function' ? F.svg() : F.svg}<g class="w-mark"></g></svg>`;
  const svg = el.querySelector('svg'), mk = svg.querySelector('.w-mark');
  svg.onclick = e => {
    const r = e.target.closest('[data-id]');
    if (!r) return;
    pick = r.dataset.id;
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    at = p.matrixTransform(svg.getScreenCTM().inverse());
    mk.innerHTML = (F.mark || ringMark)(at.x, at.y);
  };
  return {
    check: () => ({ ok: pick === q.target, yours: pick ? NM[pick] : tr('No tap', 'ما دوست على شي'), correct: NM[q.target] }),
    reveal() {
      // see-through green copy of the right area, laid over the drawing
      svg.querySelectorAll(`[data-id="${q.target}"]`).forEach(n => { const c = n.cloneNode(true); c.removeAttribute('data-id'); c.classList.add('w-gfill'); mk.before(c); });
      if (at) mk.innerHTML += ringMark(at.x, at.y, BAD);
    },
    solve() { pick = q.target; },
  };
};

// ---------- sim: small custom simulations ----------
// trilinear RYB -> RGB (Gossett & Chen corners: white, R, Y, RY, B, RB, YB, RYB)
const RYB = [[1, 1, 1], [1, 0, 0], [1, 1, 0], [1, .5, 0], [.163, .373, .6], [.5, 0, .5], [0, .66, .2], [.2, .094, 0]];
const ryb = (r, y, b) => {
  const m = Math.max(r, y, b);
  if (!m) return '#ffffff';
  [r, y, b] = [r / m, y / m, b / m];
  const o = [0, 0, 0];
  RYB.forEach((c, i) => { const w = (i & 1 ? r : 1 - r) * (i & 2 ? y : 1 - y) * (i & 4 ? b : 1 - b); c.forEach((v, k) => o[k] += w * v); });
  return `rgb(${o.map(v => Math.round(v * 255)).join(',')})`;
};
const MOL = {
  H2: '<svg class="w-mol" viewBox="0 0 40 28"><circle cx="13" cy="14" r="9" fill="#e9ecef" stroke="#868e96" stroke-width="1.5"/><circle cx="27" cy="14" r="9" fill="#e9ecef" stroke="#868e96" stroke-width="1.5"/></svg>',
  O2: '<svg class="w-mol" viewBox="0 0 40 28"><circle cx="13" cy="14" r="10" fill="#e63946" stroke="#a4161a" stroke-width="1.5"/><circle cx="27" cy="14" r="10" fill="#e63946" stroke="#a4161a" stroke-width="1.5"/></svg>',
  H2O: '<svg class="w-mol" viewBox="0 0 40 28"><circle cx="20" cy="17" r="10" fill="#e63946" stroke="#a4161a" stroke-width="1.5"/><circle cx="8" cy="9" r="7" fill="#e9ecef" stroke="#868e96" stroke-width="1.5"/><circle cx="32" cy="9" r="7" fill="#e9ecef" stroke="#868e96" stroke-width="1.5"/></svg>',
};
const SIMS = {
  equation(q, el) {
    const c = [1, 1, 1];
    let shown = false, checked = false; // atom counts only turn green/red after Check
    const term = (k, f, name) => `<div class="w-term"><div class="w-step"><button data-k="${k}" data-d="-1" aria-label="${tr('Fewer', 'أقل')} ${name}">−</button><span>${c[k]}</span><button data-k="${k}" data-d="1" aria-label="${tr('More', 'أكثر')} ${name}">+</button></div><div class="w-mols">${MOL[f].repeat(c[k])}</div><b>${name}</b></div>`;
    const txt = () => `${c[0] > 1 ? c[0] : ''}H₂ + ${c[1] > 1 ? c[1] : ''}O₂ → ${c[2] > 1 ? c[2] : ''}H₂O`;
    const draw = () => {
      const H = [2 * c[0], 2 * c[2]], O = [2 * c[1], c[2]];
      const cls = (a, b) => checked ? (a === b ? 'eq' : 'ne') : '';
      const td = (a, b) => `<td class="n ${cls(a, b)}">${a}</td><td class="n ${cls(a, b)}">${b}</td>`;
      el.innerHTML = `<div class="w-eq">${term(0, 'H2', 'H₂')}<span class="w-op">+</span>${term(1, 'O2', 'O₂')}<span class="w-op">→</span>${term(2, 'H2O', 'H₂O')}</div>
        <table class="w-count"><tr><th>${tr('Atoms', 'الذرات')}</th><th>${tr('Left side', 'الطرف الأيسر')}</th><th>${tr('Right side', 'الطرف الأيمن')}</th></tr><tr><td>${tr('Hydrogen (H)', 'الهيدروجين (H)')}</td>${td(H[0], H[1])}</tr><tr><td>${tr('Oxygen (O)', 'الأكسجين (O)')}</td>${td(O[0], O[1])}</tr></table>
        ${shown ? ghostRow(tr('Balanced', 'متوازنة'), `<span class="w-chip w-ghost">2H₂ + O₂ → 2H₂O</span>`) : ''}`;
    };
    el.onclick = e => { const b = e.target.closest('[data-k]'); if (!b) return; const k = +b.dataset.k; c[k] = Math.min(6, Math.max(1, c[k] + +b.dataset.d)); draw(); };
    draw();
    return {
      check() { checked = true; draw(); return { ok: c[0] === c[2] && c[2] === 2 * c[1], yours: LTR(txt()), correct: LTR('2H₂ + O₂ → 2H₂O') }; },
      reveal() { shown = true; draw(); },
      solve() { shown = false; c.splice(0, 3, 2, 1, 2); draw(); },
    };
  },

  lever(q, el) {
    const X = m => 60 + m * 48, Y = 120, ans = 10 * q.light / (q.heavy + q.light);
    el.innerHTML = `<svg class="w-svg" viewBox="0 0 600 220">
        <line x1="20" y1="202" x2="580" y2="202" stroke="currentColor" stroke-opacity=".3" stroke-width="3"/>
        <polygon class="w-ful" fill="#6c757d"/>
        <g class="w-beam">
          <rect x="${X(0) - 12}" y="${Y - 6}" width="${X(10) - X(0) + 24}" height="12" rx="4" fill="#8d6e63"/>
          <rect x="${X(0) - 30}" y="${Y - 66}" width="60" height="60" rx="6" fill="#e67e22"/><text x="${X(0)}" y="${Y - 30}" text-anchor="middle" class="w-lab" style="fill:#fff">${q.heavy} ${tr('kg', 'كغ')}</text>
          <rect x="${X(10) - 21}" y="${Y - 48}" width="42" height="42" rx="6" fill="#f4a261"/><text x="${X(10)}" y="${Y - 22}" text-anchor="middle" class="w-lab" style="fill:#fff;font-size:13px">${q.light} ${tr('kg', 'كغ')}</text>
        </g></svg>
      <div class="w-ctl"><span>${tr('Move the fulcrum', 'حرّك نقطة الارتكاز')}</span><input type="range" min="0.5" max="9.5" step="0.5" value="5" aria-label="${tr('Fulcrum position', 'مكان نقطة الارتكاز')}"></div>
      <p class="w-read"></p>`;
    const svg = el.querySelector('svg'), beam = el.querySelector('.w-beam'), ful = el.querySelector('.w-ful'), inp = el.querySelector('input'), out = el.querySelector('.w-read');
    const net = f => q.light * (10 - f) - q.heavy * f; // > 0: the light end goes down
    const tri = f => `${X(f)},${Y + 6} ${X(f) - 24},202 ${X(f) + 24},202`;
    // the beam is held level while you move the fulcrum; it only tips (or stays balanced) when you press Check
    const draw = () => {
      const f = +inp.value;
      ful.setAttribute('points', tri(f));
      beam.style.transformOrigin = `${X(f)}px ${Y}px`;
      beam.style.transform = 'rotate(0deg)';
      out.textContent = tr(`Fulcrum: ${f} m from the ${q.heavy} kg box (beam is 10 m long). Press Check to let go.`, `نقطة الارتكاز: ${f} م من الصندوق اللي وزنه ${q.heavy} كغ (طول العارض 10 م). دوس شيّك عشان تفلته.`);
    };
    const tip = () => { beam.style.transform = `rotate(${Math.max(-16, Math.min(16, net(+inp.value) * 0.4))}deg)`; };
    inp.oninput = draw; draw();
    return {
      check() { tip(); return { ok: net(+inp.value) === 0, yours: tr(`${inp.value} m from the ${q.heavy} kg box`, `${inp.value} م من الصندوق ${q.heavy} كغ`), correct: tr(`${ans} m from the ${q.heavy} kg box`, `${ans} م من الصندوق ${q.heavy} كغ`) }; },
      reveal() {
        ful.setAttribute('fill', BAD);
        svg.insertAdjacentHTML('beforeend', `<rect x="${X(0) - 12}" y="${Y - 6}" width="${X(10) - X(0) + 24}" height="12" rx="4" fill="${GOOD}" fill-opacity=".35" stroke="${GOOD}" stroke-width="2" stroke-dasharray="7 5"/>
          <polygon points="${tri(ans)}" fill="${GOOD}" fill-opacity=".45" stroke="${GOOD}" stroke-width="2" stroke-dasharray="6 4"/>`);
        out.innerHTML = tr(`<span style="color:${BAD}">Yours: ${inp.value} m</span> · <span style="color:${GOOD}">Balanced (see-through): ${ans} m from the ${q.heavy} kg box</span>`, `<span style="color:${BAD}">إجابتك: ${inp.value} م</span> · <span style="color:${GOOD}">المتوازن (الشفاف): ${ans} م من الصندوق ${q.heavy} كغ</span>`);
      },
      solve() { inp.value = ans; draw(); },
    };
  },

  circuit(q, el) {
    const gid = uid('glow'), ans = q.V / q.I;
    el.innerHTML = `<svg class="w-svg" viewBox="0 0 600 240">
        <defs><radialGradient id="${gid}"><stop offset="0" stop-color="#fff7ae"/><stop offset="1" stop-color="#ffd60a" stop-opacity="0"/></radialGradient></defs>
        <path d="M100 60H500V180H100Z" fill="none" stroke="currentColor" stroke-width="4" stroke-opacity=".7"/>
        <rect x="84" y="96" width="32" height="48" style="fill:var(--bg)"/><path d="M84 112h32" stroke="currentColor" stroke-width="4"/><path d="M92 128h16" stroke="currentColor" stroke-width="9"/>
        <text x="74" y="126" text-anchor="end" class="w-lab">${q.V} ${tr('V', 'فولت')}</text>
        <rect x="236" y="46" width="128" height="28" style="fill:var(--bg)"/><path d="M236 60l10-12 18 24 18-24 18 24 18-24 18 24 18-24 10 12" fill="none" stroke="#e67e22" stroke-width="4" stroke-linejoin="round"/>
        <text class="w-rl w-lab" x="300" y="34" text-anchor="middle"></text>
        <circle class="w-glow" cx="500" cy="120" r="70" fill="url(#${gid})"/>
        <circle cx="500" cy="120" r="24" style="fill:var(--bg)"/><circle class="w-bulb" cx="500" cy="120" r="24" stroke="currentColor" stroke-width="3"/>
        <path d="M490 128q5-16 10 0t10 0" fill="none" stroke="#6c4a00" stroke-width="2"/>
        <circle cx="300" cy="180" r="20" style="fill:var(--panel)" stroke="currentColor" stroke-width="3"/><text x="300" y="186" text-anchor="middle" class="w-lab">A</text>
        <text class="w-amp w-lab" x="300" y="226" text-anchor="middle">${tr('Current: ? A', 'التيار: ؟ أمبير')}</text>
      </svg>
      <div class="w-ctl"><span>${tr('Resistor', 'المقاومة')}</span><input type="range" min="1" max="12" step="1" value="1" aria-label="${tr('Resistance in ohms', 'المقاومة بالأوم')}"><output class="w-read" style="margin:0"></output></div>`;
    const svg = el.querySelector('svg'), inp = el.querySelector('input'), R = () => +inp.value, I = () => q.V / R();
    const draw = () => {
      const b = Math.sqrt(Math.min(1, I() / q.V));
      el.querySelector('.w-glow').setAttribute('opacity', b);
      el.querySelector('.w-bulb').setAttribute('fill', `hsl(48 100% ${35 + b * 55}%)`);
      el.querySelector('.w-rl').textContent = tr(`R = ${R()} Ω`, `المقاومة = ${R()} أوم`);
      el.querySelector('output').textContent = tr(`${R()} Ω`, `${R()} أوم`);
    };
    const showAmp = () => { el.querySelector('.w-amp').textContent = tr(`Current: ${num(I())} A`, `التيار: ${num(I())} أمبير`); };
    inp.oninput = draw; draw();
    return {
      check() { showAmp(); return { ok: R() === ans, yours: tr(`${R()} Ω (${num(I())} A)`, `${R()} أوم (${num(I())} أمبير)`), correct: tr(`${ans} Ω (${q.V} V ÷ ${ans} Ω = ${q.I} A)`, `${ans} أوم (${q.V} فولت ÷ ${ans} أوم = ${q.I} أمبير)`) }; },
      reveal() {
        el.querySelector('.w-amp').style.fill = BAD;
        el.querySelector('.w-rl').style.fill = BAD;
        svg.insertAdjacentHTML('beforeend', `<rect x="238" y="80" width="124" height="28" rx="8" fill="${GOOD}" fill-opacity=".25" stroke="${GOOD}" stroke-width="2" stroke-dasharray="6 4"/><text x="300" y="100" text-anchor="middle" class="w-lab" style="fill:${GOOD}">${tr(`Needed: ${ans} Ω`, `المطلوب: ${ans} أوم`)}</text>`);
        el.querySelector('output').innerHTML = tr(`<span style="color:${BAD}">Yours: ${R()} Ω</span> · <span style="color:${GOOD}">Correct: ${ans} Ω</span>`, `<span style="color:${BAD}">إجابتك: ${R()} أوم</span> · <span style="color:${GOOD}">الصحيح: ${ans} أوم</span>`);
      },
      solve() { inp.value = ans; draw(); showAmp(); },
    };
  },

  mixer(q, el) {
    const n = { r: 0, y: 0, b: 0 }, T = q.target, tm = Math.max(T.r, T.y, T.b);
    const BTN = { r: [tr('Red', 'أحمر'), '#d62828'], y: [tr('Yellow', 'أصفر'), '#e0a800'], b: [tr('Blue', 'أزرق'), '#1d4e89'] };
    el.innerHTML = `<div class="w-paint">
        <div class="w-blobs"><div><span class="w-blob" style="background:${ryb(T.r, T.y, T.b)}"></span><b>${tr('Target', 'المطلوب')}</b></div><div><span class="w-blob w-mix"></span><b>${tr('Your mix', 'خلطتك')}</b></div></div>
        <div class="w-drops">${Object.entries(BTN).map(([k, [name, c]]) => `<button data-p="${k}" style="background:${c}">+ ${name}</button>`).join('')}<button class="w-plain" data-p="reset">${tr('Start over', 'ابدأ من جديد')}</button></div>
        <p class="w-read" style="text-align:center"></p><div class="w-gh"></div></div>`;
    const txt = () => tr(`${n.r} red, ${n.y} yellow, ${n.b} blue`, `${n.r} أحمر، ${n.y} أصفر، ${n.b} أزرق`);
    const draw = () => { el.querySelector('.w-mix').style.background = ryb(n.r, n.y, n.b); el.querySelector('.w-read').textContent = tr(`Drops: ${txt()}`, `القطرات: ${txt()}`); };
    el.onclick = e => {
      const b = e.target.closest('[data-p]');
      if (!b) return;
      if (b.dataset.p === 'reset') n.r = n.y = n.b = 0; else n[b.dataset.p] = Math.min(12, n[b.dataset.p] + 1);
      draw();
    };
    draw();
    return {
      check() {
        const m = Math.max(n.r, n.y, n.b);
        const ok = m > 0 && ['r', 'y', 'b'].every(k => Math.abs(n[k] / m - T[k] / tm) <= 0.25);
        return { ok, yours: txt(), correct: q.correctText };
      },
      reveal() {
        el.querySelector('.w-mix').classList.add('w-bad');
        el.querySelector('.w-mix').style.borderColor = BAD;
        el.querySelector('.w-gh').innerHTML = ghostRow(tr('Correct mix', 'الخلطة الصحيحة'), `<span class="w-chip w-ghost">${esc(q.correctText)}</span>`);
      },
      solve() { Object.assign(n, { r: T.r * 2, y: T.y * 2, b: T.b * 2 }); draw(); },
    };
  },

  // photo editing: CSS filters spoil the photo, the player drags each knob back until it matches the original.
  // Knobs show no numbers while you edit, so you have to judge by eye.
  photo(q, el) {
    const K = q.knobs, nm = i => (q.names || [])[i] || K[i].name;
    el.innerHTML = `<div class="w-photos"><div><img src="${q.src}" alt="${tr('Original photo', 'الصورة الأصلية')}">${tr('Original', 'الأصل')}</div><div><img class="w-edit" src="${q.src}" alt="${tr('Your edited photo', 'صورتك المعدّلة')}">${tr('Your edit', 'تعديلك')}</div></div>
      ${K.map((k, i) => `<div class="w-ctl"><span style="min-width:90px">${esc(nm(i))}</span><span class="w-knob"><input type="range" data-k="${i}" min="${k.min}" max="${k.max}" value="${k.start}" aria-label="${esc(nm(i))}" style="flex:1"></span></div>`).join('')}
      <p class="w-read"></p>`;
    const ins = [...el.querySelectorAll('input')];
    const fmt = (k, v) => `${k.f === 'hue-rotate' ? minus(v) : v}${k.unit}`;
    const filter = vals => K.map((k, i) => `${k.f}(${vals[i]}${k.f === 'hue-rotate' ? 'deg' : '%'})`).join(' ');
    const draw = () => { el.querySelector('.w-edit').style.filter = filter(ins.map(x => +x.value)); };
    el.oninput = draw; draw();
    const off = i => Math.abs(+ins[i].value - K[i].answer) > K[i].tol;
    const list = f => K.map((k, i) => `${nm(i)} ${fmt(k, f(k, i))}`).join(tr(', ', '، '));
    return {
      check: () => ({ ok: !K.some((k, i) => off(i)), yours: list((k, i) => +ins[i].value), correct: list(k => k.answer) }),
      reveal() {
        el.querySelector('.w-edit').classList.add('w-bad');
        K.forEach((k, i) => {
          if (!off(i)) return;
          ins[i].style.accentColor = BAD;
          ins[i].insertAdjacentHTML('afterend', `<i style="left:calc(9px + (100% - 18px) * ${(k.answer - k.min) / (k.max - k.min)})" title="${tr('Correct', 'الصحيح')}"></i>`);
        });
        el.querySelector('.w-read').innerHTML = K.map((k, i) => off(i)
          ? tr(`<span style="color:${BAD}">${esc(nm(i))}: yours ${fmt(k, +ins[i].value)}</span> · <span style="color:${GOOD}">correct (see-through dot) ${fmt(k, k.answer)}</span>`, `<span style="color:${BAD}">${esc(nm(i))}: إجابتك ${fmt(k, +ins[i].value)}</span> · <span style="color:${GOOD}">الصحيح (النقطة الشفافة) ${fmt(k, k.answer)}</span>`)
          : `<span style="color:${GOOD}">${esc(nm(i))}: ✓ ${fmt(k, +ins[i].value)}</span>`).join('<br>');
      },
      solve() { ins.forEach((x, i) => { x.value = K[i].answer; }); draw(); },
    };
  },
};
// ---------- more simulations: maths games, physics, space, genetics ----------
const svgPt = (svg, e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
const minus = n => String(n).replace('-', '−');
const wedgeD = (C, r, n, k) => {
  const pt = a => `${(C + r * Math.cos(a)).toFixed(1)} ${(C + r * Math.sin(a)).toFixed(1)}`, a0 = k / n * 2 * Math.PI - Math.PI / 2, a1 = (k + 1) / n * 2 * Math.PI - Math.PI / 2;
  return `M${C} ${C}L${pt(a0)}A${r} ${r} 0 0 1 ${pt(a1)}Z`;
};
const gearD = (r, n) => {
  const p = 2 * Math.PI / n, pt = (rr, a) => `${(rr * Math.cos(a)).toFixed(1)} ${(rr * Math.sin(a)).toFixed(1)}`;
  let d = '';
  for (let i = 0; i < n; i++) { const a = i * p; d += `${i ? 'L' : 'M'}${pt(r - 5, a)}L${pt(r + 5, a + p * .15)}L${pt(r + 5, a + p * .4)}L${pt(r - 5, a + p * .55)}`; }
  return d + 'Z';
};
// run f(t) for t = 0..1 over ms milliseconds; stops quietly if the widget has left the page
const animate = (el, ms, f, done) => {
  const t0 = performance.now();
  const step = now => { if (!el.isConnected) return; const t = Math.min(1, (now - t0) / ms); f(t); if (t < 1) requestAnimationFrame(step); else done?.(); };
  requestAnimationFrame(step);
};

// Arabic has its own plural forms for counted words
const jumps = n => tr(`${n} jump${n === 1 ? '' : 's'}`, n === 1 ? 'قفزة وحدة' : n === 2 ? 'قفزتين' : n <= 10 ? `${n} قفزات` : `${n} قفزة`);
const teeth = n => tr(`${n} teeth`, `${n} ${n <= 10 ? 'أسنان' : 'سن'}`);

Object.assign(SIMS, {
  treasure(q, el) {
    const S = 28, O = 160, P = (x, y) => [O + x * S, O - y * S], fmt = p => LTR(`(${p.map(minus).join(', ')})`);
    let pick = null, shown = false, grid = '';
    for (let i = -5; i <= 5; i++) {
      grid += `<path d="M${P(i, -5)}L${P(i, 5)}M${P(-5, i)}L${P(5, i)}" stroke="#7f5539" stroke-opacity="${i ? .25 : .8}" stroke-width="${i ? 1 : 2.5}"/>`;
      if (i) grid += `<text x="${P(i, 0)[0]}" y="${O + 16}" text-anchor="middle" class="w-lab" style="font-size:10px;fill:#7f5539">${minus(i)}</text><text x="${O - 7}" y="${P(0, i)[1] + 4}" text-anchor="end" class="w-lab" style="font-size:10px;fill:#7f5539">${minus(i)}</text>`;
    }
    el.innerHTML = `<svg class="w-svg w-sq w-hot" viewBox="0 0 320 320"><rect width="320" height="320" fill="#f4e1b6"/>
        <path d="M60 40q-40 60 0 120t20 120q80 30 170 0t30-140q-20-80-90-110T60 40z" fill="#e9c98f" opacity=".7"/>${grid}
        <text x="306" y="${O - 6}" class="w-lab" style="font-size:12px;fill:#7f5539">x</text><text x="${O + 6}" y="16" class="w-lab" style="font-size:12px;fill:#7f5539">y</text>
        <g class="w-gh"></g><g class="w-mark"></g></svg><p class="w-read"></p>`;
    const svg = el.querySelector('svg');
    const cross = (p, c) => { const [a, b] = P(...p); return `<path d="M${a - 9} ${b - 9}l18 18m0-18-18 18" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`; };
    const draw = () => {
      el.querySelector('.w-mark').innerHTML = pick ? cross(pick, shown ? BAD : '#9d0208') : '';
      el.querySelector('.w-read').innerHTML = !pick ? tr('Tap a point where the lines cross.', 'دوس على نقطة تتقاطع فيها الخطوط.')
        : shown ? tr(`<span style="color:${BAD}">You dug at ${fmt(pick)}</span> · <span style="color:${GOOD}">Treasure (see-through): ${fmt(q.at)}</span>`, `<span style="color:${BAD}">حفرت عند ${fmt(pick)}</span> · <span style="color:${GOOD}">الكنز (الشفاف): ${fmt(q.at)}</span>`) : tr(`You dug at ${fmt(pick)}`, `حفرت عند ${fmt(pick)}`);
    };
    svg.onclick = e => { const m = svgPt(svg, e), c = v => Math.max(-5, Math.min(5, Math.round(v))); pick = [c((m.x - O) / S), c((O - m.y) / S)]; draw(); };
    draw();
    return {
      check: () => ({ ok: !!pick && pick[0] === q.at[0] && pick[1] === q.at[1], yours: pick ? fmt(pick) : tr('No dig', 'ما حفرت'), correct: fmt(q.at) }),
      reveal() { shown = true; const [a, b] = P(...q.at); el.querySelector('.w-gh').innerHTML = `<circle cx="${a}" cy="${b}" r="14" fill="${GOOD}" fill-opacity=".4" stroke="${GOOD}" stroke-width="3" stroke-dasharray="6 4"/>`; draw(); },
      solve() { pick = q.at.slice(); draw(); },
    };
  },

  frogs(q, el) {
    const X = n => 40 + n / q.max * 520, Y = 150, ans = q.target / q.step;
    const hop = (a, b, attrs) => `<path d="M${X(a)} ${Y - 4}Q${(X(a) + X(b)) / 2} ${Y - 70} ${X(b)} ${Y - 4}" fill="none" ${attrs}/>`;
    let n = 1, busy = false, ticks = '';
    for (let t = 0; t <= q.max; t += 2) ticks += `<line x1="${X(t)}" y1="${Y}" x2="${X(t)}" y2="${Y + (t % 10 ? 6 : 12)}" stroke="currentColor" stroke-width="${t % 10 ? 1 : 2}"/>${t % 10 ? '' : `<text x="${X(t)}" y="${Y + 28}" text-anchor="middle" class="w-lab" style="font-size:12px">${t}</text>`}`;
    el.innerHTML = `<svg class="w-svg" viewBox="0 0 600 200"><rect y="${Y}" width="600" height="50" fill="#a9d6e5" opacity=".35"/>
        <line x1="30" y1="${Y}" x2="570" y2="${Y}" stroke="currentColor" stroke-width="3"/>${ticks}
        <ellipse cx="${X(q.target)}" cy="${Y - 2}" rx="26" ry="8" fill="#40916c"/><circle cx="${X(q.target) + 8}" cy="${Y - 8}" r="5" fill="#ff8fab"/>
        <g class="w-gh"></g><g class="w-trail"></g>
        <g class="w-frog" style="transition:transform .28s ease-out"><ellipse cy="${Y - 14}" rx="15" ry="11" fill="#52b788"/><circle cx="-6" cy="${Y - 25}" r="5" fill="#fff"/><circle cx="6" cy="${Y - 25}" r="5" fill="#fff"/><circle cx="-6" cy="${Y - 25}" r="2.2" fill="#1d2733"/><circle cx="6" cy="${Y - 25}" r="2.2" fill="#1d2733"/></g></svg>
      <div class="w-ctl"><span>${tr('Jumps', 'القفزات')}</span><div class="w-step"><button data-d="-1" aria-label="${tr('Fewer jumps', 'قفزات أقل')}">−</button><span class="w-n">1</span><button data-d="1" aria-label="${tr('More jumps', 'قفزات أكثر')}">+</button></div><button class="btn primary w-go">${tr('Jump!', 'قفز!')}</button></div>
      <p class="w-read"></p>`;
    const frog = el.querySelector('.w-frog'), trail = el.querySelector('.w-trail'), out = el.querySelector('.w-read');
    const place = v => { frog.style.transform = `translate(${X(v)}px, 0px)`; };
    place(0);
    el.onclick = e => {
      const b = e.target.closest('button');
      if (!b || busy) return;
      if (b.dataset.d) { n = Math.max(1, Math.min(12, n + +b.dataset.d)); el.querySelector('.w-n').textContent = n; return; }
      busy = true; trail.innerHTML = ''; place(0); out.textContent = '';
      for (let k = 1; k <= n; k++) setTimeout(() => {
        trail.insertAdjacentHTML('beforeend', hop((k - 1) * q.step, k * q.step, 'stroke="#52b788" stroke-width="3" stroke-dasharray="5 5"'));
        place(k * q.step);
        if (k === n) { busy = false; out.textContent = tr(`Landed on ${n * q.step}${n * q.step === q.target ? ': right on the lily pad!' : ''}`, `نزل على ${n * q.step}${n * q.step === q.target ? ': بالضبط على ورقة النيلوفر!' : ''}`); }
      }, k * 330);
    };
    return {
      check: () => ({ ok: n === ans, yours: tr(`${n} jumps (lands on ${n * q.step})`, `${jumps(n)} (ينزل على ${n * q.step})`), correct: tr(`${ans} jumps (${ans} × ${q.step} = ${q.target})`, `${jumps(ans)} (${LTR(`${ans} × ${q.step} = ${q.target}`)})`) }),
      reveal() {
        el.querySelector('.w-gh').innerHTML = Array.from({ length: ans }, (_, k) => hop(k * q.step, (k + 1) * q.step, `stroke="${GOOD}" stroke-opacity=".55" stroke-width="7"`)).join('');
        out.innerHTML = tr(`<span style="color:${BAD}">Yours: ${n} jumps</span> · <span style="color:${GOOD}">Correct (see-through): ${ans} jumps</span>`, `<span style="color:${BAD}">إجابتك: ${jumps(n)}</span> · <span style="color:${GOOD}">الصحيح (الشفاف): ${jumps(ans)}</span>`);
      },
      solve() { n = ans; el.querySelector('.w-n').textContent = n; },
    };
  },

  algebra(q, el) {
    const ans = (q.rhs - q.c) / q.a;
    const box = i => `<rect x="${112 + i * 44}" y="64" width="40" height="40" rx="6" fill="#2980b9"/><text x="${132 + i * 44}" y="91" text-anchor="middle" class="w-lab" style="fill:#fff;font-size:20px">x</text>`;
    const unit = (x, y) => `<rect x="${x}" y="${y}" width="18" height="18" rx="3" fill="#adb5bd" stroke="#6c757d"/>`;
    el.innerHTML = `<svg class="w-svg" viewBox="0 0 600 240"><path d="M300 118 262 226h76z" fill="#6c757d"/>
        <g class="w-beam" style="transform-origin:300px 112px"><rect x="90" y="106" width="420" height="12" rx="4" fill="#8d6e63"/>
          ${Array.from({ length: q.a }, (_, i) => box(i)).join('')}${Array.from({ length: q.c }, (_, j) => unit(112 + j * 22, 42)).join('')}
          ${Array.from({ length: q.rhs }, (_, k) => unit(320 + (k % 8) * 22, 84 - Math.floor(k / 8) * 22)).join('')}</g>
        <g class="w-gh"></g></svg>
      <div class="w-ctl"><span>${tr('Try x =', 'جرّب x =')}</span><input type="range" min="1" max="10" step="1" value="1" aria-label="${tr('Value of x', 'قيمة x')}"><output class="w-read" style="margin:0"></output></div>
      <p class="w-read w-sum"></p>`;
    const beam = el.querySelector('.w-beam'), inp = el.querySelector('input');
    // the scale stays level while you choose x; it only tips (or stays balanced) when you press Check
    const draw = () => {
      beam.style.transform = 'rotate(0deg)';
      el.querySelector('output').textContent = `x = ${inp.value}`;
      el.querySelector('.w-sum').textContent = tr('Press Check to let go of the scale and see which way it tips.', 'دوس شيّك عشان تفلت الميزان وتشوف لأي جهة يميل.');
    };
    const tip = () => {
      const x = +inp.value, left = q.a * x + q.c;
      beam.style.transform = `rotate(${-Math.max(-14, Math.min(14, (left - q.rhs) * 1.3))}deg)`; // heavier side goes down
      el.querySelector('.w-sum').textContent = tr(`Left side: ${q.a} × ${x} + ${q.c} = ${left} · Right side: ${q.rhs}`, `الطرف الأيسر: ${LTR(`${q.a} × ${x} + ${q.c} = ${left}`)} · الطرف الأيمن: ${q.rhs}`);
    };
    inp.oninput = draw; draw();
    return {
      check() { tip(); return { ok: +inp.value === ans, yours: LTR(`x = ${inp.value}`), correct: LTR(`x = ${ans} (${q.a} × ${ans} + ${q.c} = ${q.rhs})`) }; },
      reveal() {
        el.querySelector('.w-gh').innerHTML = `<rect x="90" y="106" width="420" height="12" rx="4" fill="${GOOD}" fill-opacity=".35" stroke="${GOOD}" stroke-width="2" stroke-dasharray="7 5"/>`;
        el.querySelector('output').innerHTML = tr(`<span style="color:${BAD}">Yours: x = ${inp.value}</span> · <span style="color:${GOOD}">Balanced (see-through): x = ${ans}</span>`, `<span style="color:${BAD}">إجابتك: ${LTR(`x = ${inp.value}`)}</span> · <span style="color:${GOOD}">المتوازن (الشفاف): ${LTR(`x = ${ans}`)}</span>`);
      },
      solve() { inp.value = ans; draw(); },
    };
  },

  area(q, el) {
    const S = 26, ox = 170, oy = 12;
    let shown = false;
    el.innerHTML = `<svg class="w-svg" viewBox="0 0 600 284"></svg>
      <div class="w-ctl"><span>${tr('Length', 'الطول')}</span><input type="range" min="1" max="10" step="1" value="3" aria-label="${tr('Length in metres', 'الطول بالأمتار')}"></div>
      <div class="w-ctl"><span>${tr('Width', 'العرض')}</span><input type="range" min="1" max="10" step="1" value="3" aria-label="${tr('Width in metres', 'العرض بالأمتار')}"></div>
      <p class="w-read"></p>`;
    const svg = el.querySelector('svg'), [iw, ih] = el.querySelectorAll('input');
    const draw = () => {
      const w = +iw.value, h = +ih.value;
      let g = '';
      for (let i = 0; i <= 10; i++) g += `<path d="M${ox + i * S} ${oy}v${10 * S}M${ox} ${oy + i * S}h${10 * S}" stroke="currentColor" stroke-opacity=".12"/>`;
      for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) g += `<rect x="${ox + i * S + 2}" y="${oy + j * S + 2}" width="${S - 4}" height="${S - 4}" rx="4" fill="#95d5b2"/><circle cx="${ox + i * S + S / 2}" cy="${oy + j * S + S / 2}" r="4" fill="#e76f51"/>`;
      g += `<rect x="${ox}" y="${oy}" width="${w * S}" height="${h * S}" fill="none" stroke="${shown ? BAD : '#8d6e63'}" stroke-width="5"/>`;
      if (shown) g += `<rect x="${ox}" y="${oy}" width="${q.w * S}" height="${q.h * S}" fill="${GOOD}" fill-opacity=".25" stroke="${GOOD}" stroke-width="4" stroke-dasharray="8 6"/>`;
      svg.innerHTML = g;
      el.querySelector('.w-read').textContent = tr(`${w} m × ${h} m · Area: ${w * h} m² · Fence: ${2 * (w + h)} m`, `${w} م × ${h} م · المساحة: ${w * h} م² · السياج: ${2 * (w + h)} م`);
    };
    iw.oninput = ih.oninput = draw; draw();
    const desc = (w, h) => tr(`${w} m × ${h} m (area ${w * h} m², fence ${2 * (w + h)} m)`, `${w} م × ${h} م (المساحة ${w * h} م²، السياج ${2 * (w + h)} م)`);
    return {
      check: () => ({ ok: iw.value * ih.value === q.area && 2 * (+iw.value + +ih.value) === q.perim, yours: desc(+iw.value, +ih.value), correct: desc(q.w, q.h) }),
      reveal() { shown = true; draw(); },
      solve() { shown = false; iw.value = q.w; ih.value = q.h; draw(); },
    };
  },

  symmetry(q, el) {
    const rows = q.left.length, half = q.left[0].length, S = 40, ox = 300 - half * S, oy = 10;
    const want = (r, c) => q.left[r][half - 1 - c] === '#';
    let on = q.left.map(() => Array(half).fill(false)), shown = false;
    const draw = () => {
      let g = '';
      q.left.forEach((row, r) => [...row].forEach((ch, c) => { g += `<rect x="${ox + c * S + 1}" y="${oy + r * S + 1}" width="${S - 2}" height="${S - 2}" rx="4" fill="${ch === '#' ? '#2980b9' : 'transparent'}" stroke="currentColor" stroke-opacity=".15"/>`; }));
      on.forEach((row, r) => row.forEach((v, c) => {
        const x = 300 + c * S + 1, y = oy + r * S + 1, extra = shown && v && !want(r, c);
        g += `<rect data-cell="${r},${c}" x="${x}" y="${y}" width="${S - 2}" height="${S - 2}" rx="4" fill="${v ? '#2980b9' : 'transparent'}" stroke="${extra ? BAD : 'currentColor'}" stroke-opacity="${extra ? 1 : .15}" stroke-width="${extra ? 4 : 1}" style="cursor:pointer"/>`;
        if (shown && !v && want(r, c)) g += `<rect x="${x}" y="${y}" width="${S - 2}" height="${S - 2}" rx="4" fill="${GOOD}" fill-opacity=".35" stroke="${GOOD}" stroke-width="2" stroke-dasharray="5 4" pointer-events="none"/>`;
      }));
      el.innerHTML = `<svg class="w-svg" viewBox="0 0 600 ${rows * S + 20}">${g}<path d="M300 2v${rows * S + 16}" stroke="#e0a800" stroke-width="3" stroke-dasharray="8 6"/></svg>`;
    };
    el.onclick = e => { const c = e.target.closest('[data-cell]'); if (!c) return; const [r, k] = c.dataset.cell.split(',').map(Number); on[r][k] = !on[r][k]; draw(); };
    draw();
    const wrong = () => on.reduce((s, row, r) => s + row.filter((v, c) => v !== want(r, c)).length, 0);
    return {
      check: () => ({ ok: wrong() === 0, yours: tr(`${wrong()} square${wrong() === 1 ? '' : 's'} not mirrored`, (n => n === 1 ? 'مربع واحد مب منعكس' : n === 2 ? 'مربعين مب منعكسين' : n <= 10 ? `${n} مربعات مب منعكسة` : `${n} مربع مب منعكس`)(wrong())), correct: tr('every square mirrored across the line', 'كل مربع منعكس عبر الخط') }),
      reveal() { shown = true; draw(); },
      solve() { shown = false; on = on.map((row, r) => row.map((_, c) => want(r, c))); draw(); },
    };
  },

  spinner(q, el) {
    const C = 130, r = 112, n = q.slices;
    let on = Array(n).fill(false), shown = false, turn = 0, busy = false;
    const count = () => on.filter(Boolean).length;
    const draw = () => {
      el.innerHTML = `<svg class="w-svg w-sq" viewBox="0 0 260 260"><circle cx="${C}" cy="${C}" r="${r + 6}" fill="#343a40"/>
          ${on.map((v, k) => `<path data-s="${k}" d="${wedgeD(C, r, n, k)}" fill="${v ? '#e63946' : '#f8f9fa'}" stroke="${shown && v ? BAD : '#343a40'}" stroke-width="${shown && v ? 4 : 2}" style="cursor:pointer"/>`).join('')}
          ${shown ? on.map((_, k) => k < q.target ? `<path d="${wedgeD(C, r, n, k)}" fill="${GOOD}" fill-opacity=".35" stroke="${GOOD}" stroke-width="3" stroke-dasharray="6 4" pointer-events="none"/>` : '').join('') : ''}
          <g class="w-needle" pointer-events="none" style="transform-origin:${C}px ${C}px;transform:rotate(${turn}deg);transition:transform 2.4s cubic-bezier(.15,.85,.25,1)"><path d="M${C - 7} ${C}L${C} ${C - 96}L${C + 7} ${C}Z" fill="#1d2733" stroke="#fff" stroke-width="2"/><circle cx="${C}" cy="${C}" r="10" fill="#1d2733" stroke="#fff" stroke-width="2"/></g></svg>
        <div class="w-ctl" style="justify-content:center"><button class="btn primary w-go">${tr('Spin!', 'لفّ!')}</button></div>
        <p class="w-read" style="text-align:center">${shown ? tr(`<span style="color:${BAD}">Yours: ${count()}/${n} red</span> · <span style="color:${GOOD}">Correct (see-through): ${q.target}/${n} red</span>`, `<span style="color:${BAD}">إجابتك: ${count()}/${n} أحمر</span> · <span style="color:${GOOD}">الصحيح (الشفاف): ${q.target}/${n} أحمر</span>`) : tr(`${count()} of ${n} slices red`, `${count()} من ${n} شرايح حمرا`)}</p>`;
    };
    el.onclick = e => {
      if (busy) return;
      const s = e.target.closest('[data-s]');
      if (s) { on[+s.dataset.s] = !on[+s.dataset.s]; return draw(); }
      if (!e.target.closest('.w-go')) return;
      busy = true; turn += 1080 + Math.random() * 360;
      el.querySelector('.w-needle').style.transform = `rotate(${turn}deg)`;
      setTimeout(() => {
        busy = false;
        if (el.isConnected) el.querySelector('.w-read').textContent = tr(`Landed on ${on[Math.floor((turn % 360) / (360 / n))] ? 'RED' : 'white'}! (${count()} of ${n} slices red)`, `وقف على ${on[Math.floor((turn % 360) / (360 / n))] ? 'الأحمر' : 'الأبيض'}! (${count()} من ${n} شرايح حمرا)`);
      }, 2500);
    };
    draw();
    return {
      check: () => ({ ok: count() === q.target, yours: tr(`${count()}/${n} slices red`, `${count()}/${n} شرايح حمرا`), correct: tr(`${q.target}/${n} slices red (= ${q.label})`, `${q.target}/${n} شرايح حمرا (= ${q.label})`) }),
      reveal() { shown = true; draw(); },
      solve() { shown = false; on = on.map((_, k) => k < q.target); draw(); },
    };
  },

  orbit(q, el) {
    const R = 6371, GM = 398600, r0 = R + 300, K = 60 / R, C = [300, 180];
    const vc = Math.sqrt(GM / r0), ve = Math.sqrt(2 * GM / r0);
    // launched sideways from 300 km up: below vc the low point of the ellipse may hit the ground; above ve it escapes
    const kind = v => v >= ve ? 'escape' : v < vc && r0 / (2 * GM / (r0 * v * v) - 1) < R + 100 ? 'crash' : 'orbit';
    const SAY = { crash: tr('crashed back to Earth', 'طاح على الأرض'), orbit: tr('in orbit!', 'بمدار!'), escape: tr('escaped into space', 'هرب للفضاء') };
    const fly = v => { // step the flight (km, s) until it lands, leaves the picture or goes once round
      let x = 0, y = r0, vx = v, vy = 0, turned = 0, prev = Math.PI / 2;
      const pts = [[C[0], C[1] - y * K]];
      for (let i = 1; i < 30000; i++) {
        const r = Math.hypot(x, y), a = -GM / (r * r * r);
        vx += a * x * 8; vy += a * y * 8; x += vx * 8; y += vy * 8;
        const th = Math.atan2(y, x); let d = th - prev; d -= Math.round(d / (2 * Math.PI)) * 2 * Math.PI; turned += Math.abs(d); prev = th;
        const end = Math.hypot(x, y) < R || turned > 2 * Math.PI || Math.abs(x * K) > 330 || Math.abs(y * K) > 200;
        if (i % 6 === 0 || end) pts.push([C[0] + x * K, C[1] - y * K]);
        if (end) break;
      }
      return pts;
    };
    const line = p => p.map(a => a.map(n => n.toFixed(1)).join(',')).join(' ');
    el.innerHTML = `<svg class="w-svg" viewBox="0 0 600 360"><rect width="600" height="360" fill="#0b1d3a"/>
        <g fill="#fff" opacity=".6">${RAND.slice(0, 30).map((r, i) => `<circle cx="${(r * 600).toFixed(0)}" cy="${(RAND[i + 18] * 360).toFixed(0)}" r="1.3"/>`).join('')}</g>
        <g class="w-gh"></g>${ORB.earth(C[0], C[1], 60)}
        <path d="M288 ${C[1] - 58}l12-12 12 12z" fill="#6d4c41"/>
        <polyline class="w-path" fill="none" stroke="#ffd60a" stroke-width="2.5" stroke-dasharray="5 5"/>
        <circle class="w-sat" r="5" fill="#ffd60a"/></svg>
      <div class="w-ctl"><span>${tr('Launch speed', 'سرعة الإطلاق')}</span><input type="range" min="4" max="13" step="0.1" value="${q.start}" aria-label="${tr('Launch speed in km/s', 'سرعة الإطلاق بالكم/ث')}"><button class="btn primary w-go">${tr('Launch!', 'أطلق!')}</button></div>
      <p class="w-read"></p>`;
    const inp = el.querySelector('input'), path = el.querySelector('.w-path'), sat = el.querySelector('.w-sat'), out = el.querySelector('.w-read');
    let busy = false;
    const reset = () => { path.setAttribute('points', ''); sat.setAttribute('cx', C[0]); sat.setAttribute('cy', C[1] - r0 * K); out.textContent = tr(`Launch speed: ${(+inp.value).toFixed(1)} km/s`, `سرعة الإطلاق: ${(+inp.value).toFixed(1)} كم/ث`); };
    inp.oninput = () => { if (!busy) reset(); };
    reset();
    el.querySelector('.w-go').onclick = () => {
      if (busy) return;
      busy = true;
      const v = +inp.value, pts = fly(v);
      animate(el, 2600, t => { const k = Math.max(1, Math.round(t * (pts.length - 1))); path.setAttribute('points', line(pts.slice(0, k + 1))); sat.setAttribute('cx', pts[k][0]); sat.setAttribute('cy', pts[k][1]); },
        () => { busy = false; out.textContent = tr(`${v.toFixed(1)} km/s: ${SAY[kind(v)]}`, `${v.toFixed(1)} كم/ث: ${SAY[kind(v)]}`); });
    };
    return {
      check() { const v = +inp.value; return { ok: kind(v) === 'orbit', yours: tr(`${v.toFixed(1)} km/s (${SAY[kind(v)]})`, `${v.toFixed(1)} كم/ث (${SAY[kind(v)]})`), correct: tr('about 7.7 to 10.9 km/s (in orbit)', 'من 7.7 لين 10.9 كم/ث تقريباً (بمدار)') }; },
      reveal() {
        el.querySelector('.w-gh').innerHTML = `<circle cx="${C[0]}" cy="${C[1]}" r="${(r0 * K).toFixed(1)}" fill="none" stroke="${GOOD}" stroke-opacity=".6" stroke-width="7"/>`;
        out.innerHTML = tr(`<span style="color:${BAD}">Yours: ${(+inp.value).toFixed(1)} km/s</span> · <span style="color:${GOOD}">An orbit (see-through) needs about 7.7–10.9 km/s</span>`, `<span style="color:${BAD}">إجابتك: ${(+inp.value).toFixed(1)} كم/ث</span> · <span style="color:${GOOD}">المدار (الشفاف) يحتاج من 7.7 لين 10.9 كم/ث تقريباً</span>`);
      },
      solve() { inp.value = 8; reset(); },
    };
  },

  projectile(q, el) {
    const V = q.speed, G = 9.8, PX = 12, X0 = 40, Y0 = 220, tx = X0 + q.target * PX;
    const rad = a => a * Math.PI / 180, range = a => V * V * Math.sin(2 * rad(a)) / G;
    const at = (a, t) => [X0 + V * Math.cos(rad(a)) * t * PX, Y0 - (V * Math.sin(rad(a)) * t - G * t * t / 2) * PX];
    const arc = a => { const T = 2 * V * Math.sin(rad(a)) / G; return Array.from({ length: 41 }, (_, i) => at(a, T * i / 40).map(n => n.toFixed(1)).join(',')).join(' '); };
    el.innerHTML = `<svg class="w-svg" viewBox="0 0 600 250"><rect y="${Y0}" width="600" height="30" fill="#8ab17d"/>
        <rect x="${tx - q.tol * PX}" y="${Y0}" width="${2 * q.tol * PX}" height="8" fill="#e63946"/><rect x="${tx - q.tol * PX / 2}" y="${Y0}" width="${q.tol * PX}" height="8" fill="#fff"/>
        <path d="M${tx} ${Y0}v-46" stroke="#495057" stroke-width="3"/><path d="M${tx} ${Y0 - 46}l26 8-26 8z" fill="#e63946"/>
        <text x="${tx}" y="${Y0 + 24}" text-anchor="middle" class="w-lab" style="font-size:12px">${q.target} ${tr('m', 'م')}</text>
        <g class="w-gh"></g><polyline class="w-path" fill="none" stroke="#e67e22" stroke-width="3" stroke-dasharray="6 5"/>
        <rect class="w-barrel" x="${X0}" y="${Y0 - 26}" width="42" height="12" rx="4" fill="#495057"/><circle cx="${X0}" cy="${Y0 - 20}" r="16" fill="#343a40"/>
        <circle class="w-ball" r="7" fill="#1d2733" cx="-20" cy="-20"/></svg>
      <div class="w-ctl"><span>${tr('Angle', 'الزاوية')}</span><input type="range" min="5" max="85" step="1" value="${q.start}" aria-label="${tr('Launch angle in degrees', 'زاوية الإطلاق بالدرجات')}"><button class="btn primary w-go">${tr('Fire!', 'أطلق!')}</button></div>
      <p class="w-read"></p>`;
    const inp = el.querySelector('input'), path = el.querySelector('.w-path'), ball = el.querySelector('.w-ball'), out = el.querySelector('.w-read');
    let busy = false;
    const aim = () => { el.querySelector('.w-barrel').setAttribute('transform', `rotate(${-inp.value} ${X0} ${Y0 - 20})`); out.textContent = tr(`Angle: ${inp.value}°`, `الزاوية: ${inp.value}°`); };
    inp.oninput = () => { if (!busy) { aim(); path.setAttribute('points', ''); } };
    aim();
    el.querySelector('.w-go').onclick = () => {
      if (busy) return;
      busy = true;
      const a = +inp.value, T = 2 * V * Math.sin(rad(a)) / G, pts = [];
      animate(el, 1400, t => { const p = at(a, T * t); pts.push(p.map(n => n.toFixed(1)).join(',')); path.setAttribute('points', pts.join(' ')); ball.setAttribute('cx', p[0]); ball.setAttribute('cy', p[1]); },
        () => { busy = false; const d = range(a); out.textContent = tr(`${a}°: landed ${d.toFixed(1)} m away${Math.abs(d - q.target) <= q.tol ? ', a direct hit!' : d < q.target ? ', too short' : ', too far'}`, `${a}°: نزلت على بعد ${d.toFixed(1)} م${Math.abs(d - q.target) <= q.tol ? '، إصابة مباشرة!' : d < q.target ? '، قصيرة' : '، بعيدة زيادة'}`); });
    };
    const fmt = a => tr(`${a}° (lands ${range(a).toFixed(1)} m away)`, `${a}° (تنزل على بعد ${range(a).toFixed(1)} م)`);
    return {
      check: () => ({ ok: Math.abs(range(+inp.value) - q.target) <= q.tol, yours: fmt(+inp.value), correct: tr(`${q.answers.join('° or ')}° (both land about ${q.target} m away)`, `${q.answers.join('° أو ')}° (الثنين ينزلون على بعد حوالي ${q.target} م)`) }),
      reveal() {
        el.querySelector('.w-gh').innerHTML = q.answers.map(a => `<polyline points="${arc(a)}" fill="none" stroke="${GOOD}" stroke-opacity=".55" stroke-width="7"/>`).join('');
        path.setAttribute('points', arc(+inp.value)); path.setAttribute('stroke', BAD);
        out.innerHTML = tr(`<span style="color:${BAD}">Yours: ${fmt(+inp.value)}</span> · <span style="color:${GOOD}">Hits (see-through): ${q.answers.join('° or ')}°</span>`, `<span style="color:${BAD}">إجابتك: ${fmt(+inp.value)}</span> · <span style="color:${GOOD}">تصيب (الشفاف): ${q.answers.join('° أو ')}°</span>`);
      },
      solve() { inp.value = q.answers[0]; aim(); },
    };
  },

  pendulum(q, el) {
    const PX = 80, P = [300, 22], period = L => 2 * Math.PI * Math.sqrt(L / 9.8);
    el.innerHTML = `<svg class="w-svg" viewBox="0 0 600 260"><rect x="200" y="10" width="200" height="12" rx="3" fill="#6c757d"/>
        <circle class="w-flash" cx="520" cy="60" r="18" fill="#ffd60a"/><text x="520" y="100" text-anchor="middle" class="w-lab" style="font-size:12px">${tr('flashes every second', 'يومض كل ثانية')}</text>
        <g class="w-gh"></g>
        <g class="w-swing" style="transform-origin:${P[0]}px ${P[1]}px"><line class="w-rod" x1="${P[0]}" y1="${P[1]}" x2="${P[0]}" stroke="currentColor" stroke-width="3"/><circle class="w-bob" cx="${P[0]}" r="15" fill="#e67e22"/></g></svg>
      <div class="w-ctl"><span>${tr('Length', 'الطول')}</span><input type="range" min="0.2" max="2.5" step="0.05" value="${q.start}" aria-label="${tr('Pendulum length in metres', 'طول البندول بالأمتار')}"><output class="w-read" style="margin:0"></output></div>`;
    const inp = el.querySelector('input');
    // restart every swing and the flash together so they stay in step after a change
    const restart = () => el.querySelectorAll('.w-swing, .w-flash').forEach(n => { n.style.animationName = 'none'; n.getBoundingClientRect(); n.style.animationName = ''; });
    const draw = () => {
      const L = +inp.value, y = P[1] + L * PX;
      el.querySelector('.w-rod').setAttribute('y2', y); el.querySelector('.w-bob').setAttribute('cy', y);
      el.querySelector('.w-swing').style.animationDuration = `${(period(L) / 2).toFixed(3)}s`;
      el.querySelector('output').textContent = tr(`${num(L)} m`, `${num(L)} م`);
      restart();
    };
    inp.oninput = draw; draw();
    const desc = L => tr(`${num(L)} m (there and back in ${period(L).toFixed(2)} s)`, `${num(L)} م (رايح راجع بـ ${period(L).toFixed(2)} ث)`);
    return {
      check() { const L = +inp.value; return { ok: L >= q.lo && L <= q.hi, yours: desc(L), correct: desc(q.answer) }; },
      reveal() {
        const y = P[1] + q.answer * PX;
        el.querySelector('.w-gh').innerHTML = `<g class="w-swing" style="transform-origin:${P[0]}px ${P[1]}px;animation-duration:${(period(q.answer) / 2).toFixed(3)}s"><line x1="${P[0]}" y1="${P[1]}" x2="${P[0]}" y2="${y}" stroke="${GOOD}" stroke-opacity=".5" stroke-width="6"/><circle cx="${P[0]}" cy="${y}" r="15" fill="${GOOD}" fill-opacity=".4" stroke="${GOOD}" stroke-width="2" stroke-dasharray="5 4"/></g>`;
        el.querySelector('.w-bob').setAttribute('fill', BAD);
        el.querySelector('output').innerHTML = tr(`<span style="color:${BAD}">Yours: ${num(inp.value)} m</span> · <span style="color:${GOOD}">Correct (see-through): ${q.answer} m</span>`, `<span style="color:${BAD}">إجابتك: ${num(inp.value)} م</span> · <span style="color:${GOOD}">الصحيح (الشفاف): ${q.answer} م</span>`);
        restart();
      },
      solve() { inp.value = q.answer; draw(); },
    };
  },

  gears(q, el) {
    const big = q.big, C = [200, 135], rOf = n => n * 2.4;
    let t = q.start, shown = false;
    const gear = (cx, n, dur, rev, fill) => `<g transform="translate(${cx} ${C[1]})"><g class="w-spin" style="animation-duration:${dur}s;animation-direction:${rev ? 'reverse' : 'normal'}"><path d="${gearD(rOf(n), n)}" fill="${fill}"/><circle r="7" style="fill:var(--bg)"/><circle cy="${-(rOf(n) - 14)}" r="6" fill="#ffd60a"/></g></g>`;
    el.innerHTML = `<svg class="w-svg" viewBox="0 0 600 270"></svg>
      <div class="w-ctl"><span>${tr('Small gear teeth', 'أسنان الترس الصغير')}</span><div class="w-step"><button data-d="-6" aria-label="${tr('Fewer teeth', 'أسنان أقل')}">−</button><span class="w-n"></span><button data-d="6" aria-label="${tr('More teeth', 'أسنان أكثر')}">+</button></div></div>
      <p class="w-read">${tr(`The big orange gear has ${big} teeth and turns once every 8 seconds.`, `الترس البرتقالي الكبير فيه ${big} سن ويلف لفة كل 8 ثواني.`)}</p>`;
    const draw = () => {
      const rb = rOf(big);
      let g = gear(C[0], big, 8, false, '#e67e22') + gear(C[0] + rb + rOf(t) + 2, t, 8 * t / big, true, '#2980b9');
      if (shown) g += `<path transform="translate(${C[0] + rb + rOf(q.answer) + 2} ${C[1]})" d="${gearD(rOf(q.answer), q.answer)}" fill="${GOOD}" fill-opacity=".3" stroke="${GOOD}" stroke-width="2" stroke-dasharray="5 4" pointer-events="none"/>`;
      el.querySelector('svg').innerHTML = g;
      el.querySelector('.w-n').textContent = t;
    };
    el.onclick = e => { const b = e.target.closest('[data-d]'); if (!b) return; t = Math.max(6, Math.min(36, t + +b.dataset.d)); draw(); };
    draw();
    return {
      check: () => ({ ok: t === q.answer, yours: tr(`${t} teeth (${num(big / t)} turns per big turn)`, `${teeth(t)} (${num(big / t)} لفة لكل لفة للترس الكبير)`), correct: tr(`${q.answer} teeth (${big} ÷ ${q.answer} = ${big / q.answer} turns)`, `${teeth(q.answer)} (${LTR(`${big} ÷ ${q.answer} = ${big / q.answer}`)} لفات)`) }),
      reveal() {
        shown = true; draw();
        el.querySelector('.w-read').innerHTML = tr(`<span style="color:${BAD}">Yours: ${t} teeth = ${num(big / t)} turns</span> · <span style="color:${GOOD}">Correct (see-through): ${q.answer} teeth = ${big / q.answer} turns</span>`, `<span style="color:${BAD}">إجابتك: ${teeth(t)} = ${num(big / t)} لفة</span> · <span style="color:${GOOD}">الصحيح (الشفاف): ${teeth(q.answer)} = ${big / q.answer} لفات</span>`);
      },
      solve() { t = q.answer; draw(); },
    };
  },

  punnett(q, el) {
    const OPT = ['?', 'BB', 'Bb', 'bb'], want = ['BB', 'Bb', 'Bb', 'bb'];
    let cell = [0, 0, 0, 0], shown = false;
    const fur = g => g === '?' ? 'transparent' : g.includes('B') ? '#8d5524' : '#f1f1f1';
    const btn = k => { const g = OPT[cell[k]]; return `<button class="w-chip w-pcell${shown ? (g === want[k] ? ' w-ok' : ' w-bad') : ''}" data-k="${k}"><span class="w-sw" style="background:${fur(g)};width:26px;height:26px"></span>${g}${shown && g !== want[k] ? `<span class="w-ghost-tag">${tr('→', '←')} ${want[k]}</span>` : ''}</button>`; };
    const draw = () => {
      const kids = cell.map(c => OPT[c]).filter(g => g !== '?');
      el.innerHTML = `<p class="w-hint" style="text-align:center">${tr("Dad's genes across the top, Mum's down the side. Tap a box to change it.", 'جينات الأب فوق، وجينات الأم على الجنب. دوس على مربع عشان تغيّره.')}</p>
        <div class="w-pun"><span></span><b>B</b><b>b</b><b>B</b>${btn(0)}${btn(1)}<b>b</b>${btn(2)}${btn(3)}</div>
        <p class="w-read" style="text-align:center">${tr(`Brown babies: ${kids.filter(g => g.includes('B')).length} · White babies: ${kids.filter(g => g === 'bb').length}`, `الصغار البنيين: ${kids.filter(g => g.includes('B')).length} · الصغار البيض: ${kids.filter(g => g === 'bb').length}`)}</p>`;
    };
    el.onclick = e => { const b = e.target.closest('[data-k]'); if (!b) return; cell[+b.dataset.k] = (cell[+b.dataset.k] + 1) % 4; draw(); };
    draw();
    return {
      check: () => ({ ok: cell.every((c, k) => OPT[c] === want[k]), yours: cell.map(c => OPT[c]).join(', '), correct: tr(`${want.join(', ')} (3 brown : 1 white)`, `${want.join(', ')} (3 بنيين : 1 أبيض)`) }),
      reveal() { shown = true; draw(); },
      solve() { shown = false; cell = want.map(g => OPT.indexOf(g)); draw(); },
    };
  },
});
WIDGETS.sim = (q, el) => SIMS[q.sim](q, el);
