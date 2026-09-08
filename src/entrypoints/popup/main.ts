import { browser } from 'wxt/browser';

import { DEFAULT_TRACK_COLOR, FEEDBACK_URL, TRACK_COLORS } from '@/lib/config';
import { collectTrackKeys } from '@/lib/shortcuts';
import { msg } from '@/lib/i18n';
import { isPlayerUrl, PLAYER_URL } from '@/lib/urls';

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
