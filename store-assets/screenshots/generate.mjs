// Chrome Web Store screenshots, end to end.
//
// The extension has no UI pages to capture and the real player sits behind a
// Moises login, so every slide is a composed 1280x800 frame: a benefit
// headline next to a stylized replica of the player's track list, the real
// keycaps, and pixel-faithful replicas of the surfaces the extension does own
// (the toast and its exact copy strings, from src/lib/toast). Regenerate with
// this script rather than editing PNGs by hand.
//
// Usage: node generate.mjs <outDir>   (requires the `playwright` package)
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const OUT = resolve(process.argv[2] ?? 'shots');
mkdirSync(OUT, { recursive: true });

const TRACKS = [
  { name: 'Vocals', color: '#3ee6a0', bars: [5, 9, 7, 11, 6, 10, 8, 4, 9, 6] },
  { name: 'Drums', color: '#5ea0ff', bars: [10, 4, 11, 5, 10, 4, 11, 5, 10, 4] },
  { name: 'Bass', color: '#c084fc', bars: [7, 8, 6, 7, 9, 7, 6, 8, 7, 6] },
  { name: 'Other', color: '#fbbf24', bars: [4, 6, 8, 5, 7, 9, 6, 8, 5, 7] },
];

const COPY = {
  en: {
    brand: 'Moises Keyboard Shortcuts',
    mute: 'MUTE',
    solo: 'SOLO',
    slides: [
      {
        slot: '01-hero',
        title: 'Mute any stem with one key',
        sub: 'V, D, B, O toggle Vocals, Drums, Bass and Other in the Moises player — hands on your instrument, not on the mouse.',
        keys: ['V', 'D', 'B', 'O'],
        scene: { muted: ['Vocals'], soloed: [], toast: null, typing: false },
      },
      {
        slot: '02-solo',
        title: 'Shift solos. Plain key mutes.',
        sub: 'Shift+D isolates the drums to lock in the groove. Press it again and the full mix is back.',
        keys: ['Shift', 'D'],
        chord: true,
        scene: { muted: [], soloed: ['Drums'], toast: null, typing: false },
      },
      {
        slot: '03-toast',
        title: 'Every keypress, confirmed',
        sub: 'A small toast tells you exactly what happened — and if a track cannot be found, it says so. Nothing fails silently.',
        keys: ['V'],
        scene: { muted: ['Vocals'], soloed: [], toast: 'Vocals mute toggled', typing: false },
      },
      {
        slot: '04-safety',
        title: 'Typing? It stays out of the way',
        sub: 'Shortcuts switch off while you type in any text field, and Ctrl+V keeps pasting. No stolen keystrokes, ever.',
        keys: ['Ctrl', 'V'],
        chord: true,
        scene: { muted: [], soloed: [], toast: null, typing: true },
      },
      {
        slot: '05-privacy',
        title: 'Zero data. Zero requests.',
        sub: 'No analytics, no account, no server. The extension runs only on the Moises player and clicks the same buttons you would.',
        keys: [],
        scene: { muted: [], soloed: [], toast: null, typing: false, privacy: true },
      },
    ],
  },
  es: {
    brand: 'Moises Keyboard Shortcuts',
    mute: 'MUTE',
    solo: 'SOLO',
    slides: [
      {
        slot: '01-hero',
        title: 'Muteá cualquier stem con una tecla',
        sub: 'V, D, B y O alternan Vocals, Drums, Bass y Other en el player de Moises — las manos en tu instrumento, no en el mouse.',
        keys: ['V', 'D', 'B', 'O'],
        scene: { muted: ['Vocals'], soloed: [], toast: null, typing: false },
      },
      {
        slot: '02-solo',
        title: 'Shift pone en solo. La tecla sola, mutea.',
        sub: 'Shift+D aísla la batería para ajustar el groove. Apretala de nuevo y vuelve la mezcla completa.',
        keys: ['Shift', 'D'],
        chord: true,
        scene: { muted: [], soloed: ['Drums'], toast: null, typing: false },
      },
      {
        slot: '03-toast',
        title: 'Cada tecla, confirmada',
        sub: 'Un toast chico te dice exactamente qué pasó — y si una pista no se encuentra, también lo dice. Nada falla en silencio.',
        keys: ['V'],
        scene: { muted: ['Vocals'], soloed: [], toast: 'Vocals mute toggled', typing: false },
      },
      {
        slot: '04-safety',
        title: '¿Estás escribiendo? No se mete',
        sub: 'Los atajos se apagan mientras tipeás en cualquier campo de texto, y Ctrl+V sigue pegando. Nunca te roba una tecla.',
        keys: ['Ctrl', 'V'],
        chord: true,
        scene: { muted: [], soloed: [], toast: null, typing: true },
      },
      {
        slot: '05-privacy',
        title: 'Cero datos. Cero solicitudes.',
        sub: 'Sin analytics, sin cuenta, sin servidor. La extensión corre solo en el player de Moises y clickea los mismos botones que vos.',
        keys: [],
        scene: { muted: [], soloed: [], toast: null, typing: false, privacy: true },
      },
    ],
  },
};

function bars(track, dimmed) {
  return track.bars
    .map(
      (h) =>
        `<div style="width:5px;height:${h * 3}px;border-radius:2px;background:${track.color};opacity:${dimmed ? 0.18 : 0.75};margin-right:3px;align-self:center"></div>`,
    )
    .join('');
}

function trackRow(track, scene, labels) {
  const isMuted = scene.muted.includes(track.name);
  const someSolo = scene.soloed.length > 0;
  const isSoloed = scene.soloed.includes(track.name);
  const dimmed = isMuted || (someSolo && !isSoloed);
  const btn = (label, active, activeColor) => `
    <div style="min-width:44px;padding:0 10px;height:30px;border-radius:15px;display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:700;letter-spacing:.06em;
      border:1.5px solid ${active ? activeColor : 'rgba(255,255,255,.22)'};
      color:${active ? '#0d1117' : 'rgba(255,255,255,.75)'};
      background:${active ? activeColor : 'transparent'}">${label}</div>`;
  return `
  <div style="display:flex;align-items:center;gap:16px;padding:14px 18px;border-radius:12px;background:rgba(255,255,255,.045);
    ${dimmed ? 'opacity:.55;' : ''}border:1px solid rgba(255,255,255,.06)">
    <div style="width:10px;height:10px;border-radius:50%;background:${track.color}"></div>
    <div style="width:86px;font-size:15px;font-weight:600;color:#eef2f7">${track.name}</div>
    <div style="flex:1;display:flex;height:36px;overflow:hidden">${bars(track, dimmed)}</div>
    ${btn(labels.mute, isMuted, '#f87171')}
    ${btn(labels.solo, isSoloed, '#3ee6a0')}
  </div>`;
}

function keycap(k) {
  const wide = k.length > 1;
  return `<div style="min-width:64px;${wide ? 'padding:0 22px;' : ''}height:64px;border-radius:12px;
    background:linear-gradient(180deg,#2b3240,#1a1f29);border:1px solid rgba(255,255,255,.14);
    border-bottom:3px solid rgba(0,0,0,.55);box-shadow:0 10px 24px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.12);
    display:flex;align-items:center;justify-content:center;font-size:${wide ? 20 : 26}px;font-weight:700;color:#e8fff4">${k}</div>`;
}

// A chord (Shift+D) renders with "+" separators; alternatives (V D B O) with plain gaps.
function keyRow(keys, chord) {
  if (keys.length === 0) {
    return '';
  }
  const plus = '<div style="font-size:22px;color:rgba(255,255,255,.4)">+</div>';
  return `<div style="display:flex;align-items:center;gap:14px;margin-top:34px">
    ${keys.map(keycap).join(chord ? plus : '')}
  </div>`;
}

function playerCard(copy, scene) {
  const toast = scene.toast
    ? `<div style="position:absolute;top:16px;right:16px;padding:10px 18px;border-radius:8px;background:#333;color:#fff;
        font-size:14px;box-shadow:0 6px 18px rgba(0,0,0,.5)">${scene.toast}</div>`
    : '';
  const search = scene.typing
    ? `<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:10px 14px;border-radius:10px;
        background:rgba(255,255,255,.07);border:1.5px solid #3ee6a0">
        <span style="opacity:.55;font-size:14px">🔍</span>
        <span style="font-size:14px;color:#eef2f7">my next song</span>
        <span style="width:2px;height:18px;background:#3ee6a0"></span>
      </div>`
    : '';
  const privacyBadge = scene.privacy
    ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(10,13,18,.82);border-radius:18px">
        <div style="text-align:center;padding:28px 44px;border-radius:16px;background:#12161d;
          border:1px solid rgba(62,230,160,.35);box-shadow:0 20px 60px rgba(0,0,0,.6)">
          <div style="font-size:56px">🔒</div>
          <div style="margin-top:12px;font-size:17px;font-weight:800;color:#3ee6a0;letter-spacing:.16em">0 REQUESTS</div>
          <div style="margin-top:6px;font-size:13px;color:rgba(255,255,255,.55)">no analytics · no tracking · no server</div>
        </div>
      </div>`
    : '';
  return `
  <div style="position:relative;width:560px;padding:22px;border-radius:18px;background:#12161d;
    box-shadow:0 34px 80px -20px rgba(0,0,0,.85), 0 0 0 1px rgba(255,255,255,.07)">
    ${search}
    <div style="display:flex;flex-direction:column;gap:10px">
      ${TRACKS.map((t) => trackRow(t, scene, copy)).join('')}
    </div>
    ${toast}
    ${privacyBadge}
  </div>`;
}

function frame(copy, slide) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1280px;height:800px;overflow:hidden;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
    background:#0a0d12;color:#eef2f7;display:flex;align-items:center;gap:64px;padding:0 72px;position:relative}
  body::before{content:'';position:absolute;inset:0;pointer-events:none;
    background:radial-gradient(52rem 34rem at 80% -12%, rgba(62,230,160,.16), transparent 68%),
               radial-gradient(40rem 30rem at -10% 110%, rgba(94,160,255,.12), transparent 60%)}
  </style></head><body>
  <div style="flex:1;position:relative;max-width:520px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:30px">
      <div style="width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,#3ee6a0,#5ea0ff);
        display:flex;align-items:center;justify-content:center;font-size:18px">⌨️</div>
      <span style="font-size:18px;font-weight:800;letter-spacing:-.01em">${copy.brand}</span>
    </div>
    <h1 style="font-size:50px;line-height:1.08;font-weight:800;letter-spacing:-.03em">${slide.title}</h1>
    <p style="margin-top:22px;font-size:20px;line-height:1.5;opacity:.72">${slide.sub}</p>
    ${keyRow(slide.keys, slide.chord === true)}
  </div>
  <div style="position:relative;flex-shrink:0">${playerCard(copy, slide.scene)}</div>
  </body></html>`;
}

const browser = await chromium.launch({ headless: true });
for (const locale of ['en', 'es']) {
  mkdirSync(join(OUT, locale), { recursive: true });
  for (const slide of COPY[locale].slides) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const html = join(OUT, `.frame-${slide.slot}-${locale}.html`);
    writeFileSync(html, frame(COPY[locale], slide));
    await page.goto(`file://${html}`);
    await page.waitForTimeout(400);
    const final = join(OUT, locale, `${slide.slot}.png`);
    await page.screenshot({ path: final });
    await page.close();
    console.log('✓', locale, slide.slot, '→', final);
  }
}
await browser.close();
console.log('done');
