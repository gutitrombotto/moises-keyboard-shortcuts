import { browser } from 'wxt/browser';

import { DEFAULT_TRACK_COLOR, FEEDBACK_URL, SHORTCUTS, TRACK_COLORS } from '@/lib/config';
import { isPlayerUrl, PLAYER_URL } from '@/lib/urls';

interface TrackKeys {
  track: string;
  muteKey: string;
  soloKey: string | null;
}

// One row per track, in SHORTCUTS insertion order; the solo key is looked up
// so config-only additions (e.g. Piano) appear here without touching the popup.
function collectTrackKeys(): TrackKeys[] {
  const entries = Object.entries(SHORTCUTS);
  const rows: TrackKeys[] = [];
  for (const [key, shortcut] of entries) {
    if (shortcut.action !== 'mute') {
      continue;
    }
    const solo = entries.find(([, s]) => s.track === shortcut.track && s.action === 'solo');
    rows.push({ track: shortcut.track, muteKey: key, soloKey: solo?.[0] ?? null });
  }
  return rows;
}

// WXT generates a literal union of the _locales keys for getMessage.
type MessageKey = Parameters<typeof browser.i18n.getMessage>[0];

function msg(key: MessageKey): string {
  return browser.i18n.getMessage(key);
}

function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (el == null) {
    throw new Error(`popup: missing #${id}`);
  }
  return el;
}

function kbd(text: string, small: boolean): HTMLSpanElement {
  const el = document.createElement('span');
  el.className = small ? 'kbd small' : 'kbd';
  el.textContent = text;
  return el;
}

function span(className: string, text: string): HTMLSpanElement {
  const el = document.createElement('span');
  el.className = className;
  el.textContent = text;
  return el;
}

function renderTracks(): void {
  const container = getEl('tracks');
  for (const { track, muteKey, soloKey } of collectTrackKeys()) {
    const row = document.createElement('div');
    row.className = 'track';
    // Keycaps read as physical keys, so display uppercase; the actual
    // KeyboardEvent.key stays lowercase for mute (SPECS §5).
    row.appendChild(kbd(muteKey.toUpperCase(), false));

    const dot = span('track-dot', '');
    dot.style.background = TRACK_COLORS[track] ?? DEFAULT_TRACK_COLOR;
    row.appendChild(dot);

    row.appendChild(span('track-name', track));

    const actions = span('track-actions', '');
    actions.appendChild(document.createTextNode(`${msg('popupMute')} ·`));
    if (soloKey != null) {
      actions.appendChild(kbd('⇧', true));
      actions.appendChild(span('plus', '+'));
      actions.appendChild(kbd(soloKey, true));
      actions.appendChild(document.createTextNode(msg('popupSolo')));
    }
    row.appendChild(actions);

    container.appendChild(row);
  }
}

function renderHint(): void {
  const hint = getEl('hint');
  hint.appendChild(document.createTextNode(`${msg('popupHintTyping')} `));
  hint.appendChild(kbd('Ctrl', true));
  hint.appendChild(span('plus', '+'));
  hint.appendChild(kbd('V', true));
  hint.appendChild(document.createTextNode(` ${msg('popupHintPasteSuffix')}`));
}

function renderStatus(onPlayer: boolean): void {
  const status = getEl('status');
  status.className = onPlayer ? 'status on' : 'status off';
  status.appendChild(span('dot', ''));
  if (onPlayer) {
    status.appendChild(document.createTextNode(msg('popupStatusActive')));
    return;
  }
  status.appendChild(document.createTextNode(`${msg('popupStatusWaiting')} `));
  const link = document.createElement('a');
  link.href = PLAYER_URL;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = msg('popupOpenPlayer');
  status.appendChild(link);
  getEl('tracks').classList.add('dimmed');
}

async function init(): Promise<void> {
  getEl('version').textContent = `v${browser.runtime.getManifest().version}`;

  const feedback = getEl('feedback');
  feedback.textContent = msg('popupFeedback');
  feedback.setAttribute('href', FEEDBACK_URL);

  getEl('privacy').textContent = msg('popupPrivacy');

  renderTracks();
  renderHint();

  // Tab URLs are only visible where we hold host permissions, which is exactly
  // the check we need: a readable moises URL means the extension runs there.
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  renderStatus(isPlayerUrl(tab?.url));
}

void init();
