import { DEFAULT_TRACK_COLOR, PROBE_ATTEMPTS, PROBE_DELAY_MS, TRACK_COLORS } from '@/lib/config';
import { hasTrackControls } from '@/lib/dom-finder';
import { msg } from '@/lib/i18n';
import { retryUntil } from '@/lib/retry';
import { collectTrackKeys, PLAYER_NATIVE_SHORTCUTS } from '@/lib/shortcuts';

const CARD_ID = 'moises-kb-cheatsheet';
const DISMISSED_KEY = 'moises-kb-cheatsheet-dismissed';

// The card teaches the shortcuts to someone who never opens the toolbar popup,
// so it leads with one key they can try immediately rather than the whole table.
const TEASER_TRACK_INDEX = 0;

// localStorage can throw in sandboxed/cross-origin frames; every access fails
// safe, matching the feedback and review pills.
function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) != null;
  } catch {
    return false;
  }
}

function markDismissed(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, '1');
  } catch {
    // Sandboxed frame: the card reappears next load, which is harmless.
  }
}

function keycap(label: string, small: boolean): HTMLSpanElement {
  const el = document.createElement('span');
  el.textContent = label;
  Object.assign(el.style, {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: small ? '18px' : '24px',
    height: small ? '18px' : '24px',
    padding: '0 5px',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.09)',
    border: '1px solid rgba(255,255,255,0.16)',
    borderBottomWidth: '2px',
    color: '#eef2f7',
    fontSize: small ? '10px' : '11px',
    fontWeight: '700',
    lineHeight: '1',
  });
  return el;
}

function iconTile(): HTMLSpanElement {
  const tile = document.createElement('span');
  tile.textContent = '⌨';
  Object.assign(tile.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '34px',
    flexShrink: '0',
    borderRadius: '11px',
    background: 'linear-gradient(140deg, #3ee6a0 0%, #2bb4d6 100%)',
    color: '#06231a',
    fontSize: '17px',
  });
  return tile;
}

function trackRow(track: string, muteKey: string, soloKey: string | null): HTMLDivElement {
  const row = document.createElement('div');
  Object.assign(row.style, { display: 'flex', alignItems: 'center', gap: '9px', padding: '5px 0' });

  row.appendChild(keycap(muteKey.toUpperCase(), false));

  const dot = document.createElement('span');
  Object.assign(dot.style, {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    flexShrink: '0',
    background: TRACK_COLORS[track] ?? DEFAULT_TRACK_COLOR,
  });
  row.appendChild(dot);

  const name = document.createElement('span');
  name.textContent = track;
  Object.assign(name.style, { fontWeight: '600', flex: '1', fontSize: '12px' });
  row.appendChild(name);

  const actions = document.createElement('span');
  Object.assign(actions.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: 'rgba(238,242,247,0.5)',
    fontSize: '11px',
  });
  actions.appendChild(document.createTextNode(`${msg('popupMute')} ·`));
  if (soloKey != null) {
    actions.appendChild(keycap('⇧', true));
    actions.appendChild(keycap(soloKey, true));
    actions.appendChild(document.createTextNode(msg('popupSolo')));
  }
  row.appendChild(actions);

  return row;
}

function buildKeyTable(): HTMLDivElement {
  const table = document.createElement('div');
  Object.assign(table.style, {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  });
  for (const { track, muteKey, soloKey } of collectTrackKeys()) {
    table.appendChild(trackRow(track, muteKey, soloKey));
  }

  if (PLAYER_NATIVE_SHORTCUTS.length > 0) {
    const native = document.createElement('div');
    Object.assign(native.style, {
      marginTop: '8px',
      paddingTop: '8px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
    });

    const caption = document.createElement('div');
    caption.textContent = msg('cheatsheetNativeTitle');
    Object.assign(caption.style, {
      color: 'rgba(238,242,247,0.4)',
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginBottom: '4px',
    });
    native.appendChild(caption);

    for (const { key, labelKey } of PLAYER_NATIVE_SHORTCUTS) {
      const row = document.createElement('div');
      Object.assign(row.style, { display: 'flex', alignItems: 'center', gap: '9px', padding: '3px 0' });
      row.appendChild(keycap(key, false));
      const label = document.createElement('span');
      label.textContent = msg(labelKey);
      Object.assign(label.style, { color: 'rgba(238,242,247,0.6)', fontSize: '12px' });
      row.appendChild(label);
      native.appendChild(row);
    }
    table.appendChild(native);
  }

  const hint = document.createElement('div');
  hint.textContent = msg('popupHintTyping');
  Object.assign(hint.style, {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(238,242,247,0.45)',
    fontSize: '11px',
  });
  table.appendChild(hint);

  return table;
}

function showCard(): void {
  if (isDismissed() || document.getElementById(CARD_ID) != null) {
    return;
  }

  const card = document.createElement('div');
  card.id = CARD_ID;
  card.setAttribute('role', 'complementary');
  card.setAttribute('aria-label', msg('cheatsheetTitle'));
  Object.assign(card.style, {
    position: 'fixed',
    // Below the player's own toolbar, not over it: at the very top the card
    // crowds the transport controls and collides with them on narrow windows.
    top: '96px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '999998',
    boxSizing: 'border-box',
    maxWidth: 'calc(100vw - 32px)',
    padding: '11px 14px',
    borderRadius: '18px',
    background: 'rgba(22,27,36,0.94)',
    border: '1px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 12px 34px rgba(0,0,0,0.5)',
    color: '#eef2f7',
    fontFamily: 'system-ui, sans-serif',
    opacity: '0',
    transition: 'opacity 0.25s ease',
  });

  const header = document.createElement('div');
  Object.assign(header.style, { display: 'flex', alignItems: 'center', gap: '11px' });

  const text = document.createElement('div');
  Object.assign(text.style, { display: 'flex', flexDirection: 'column', gap: '1px', minWidth: '0' });

  const title = document.createElement('span');
  title.textContent = msg('cheatsheetTitle');
  Object.assign(title.style, { fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' });

  const rows = collectTrackKeys();
  const teaser = document.createElement('span');
  Object.assign(teaser.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    color: 'rgba(238,242,247,0.6)',
    fontSize: '12px',
    whiteSpace: 'nowrap',
  });
  const lead = rows[TEASER_TRACK_INDEX];
  if (lead != null) {
    teaser.appendChild(document.createTextNode(msg('cheatsheetTryPrefix')));
    teaser.appendChild(keycap(lead.muteKey.toUpperCase(), true));
    teaser.appendChild(document.createTextNode(`${msg('cheatsheetTrySuffix')} ${lead.track}`));
  }

  text.appendChild(title);
  text.appendChild(teaser);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  Object.assign(toggle.style, {
    marginLeft: '6px',
    padding: '0',
    border: 'none',
    background: 'none',
    color: '#8ab4ff',
    fontSize: '12px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: '0',
  });

  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '✕';
  close.title = msg('feedbackDismiss');
  close.setAttribute('aria-label', msg('feedbackDismiss'));
  Object.assign(close.style, {
    padding: '0 0 0 4px',
    border: 'none',
    background: 'none',
    color: 'rgba(238,242,247,0.55)',
    fontSize: '12px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    flexShrink: '0',
  });
  close.addEventListener('click', () => {
    markDismissed();
    card.remove();
  });

  header.appendChild(iconTile());
  header.appendChild(text);
  header.appendChild(toggle);
  header.appendChild(close);
  card.appendChild(header);

  let table: HTMLDivElement | null = null;
  const render = (expanded: boolean): void => {
    toggle.textContent = expanded ? `${msg('cheatsheetHideKeys')} ⌃` : `${msg('cheatsheetShowKeys')} ⌄`;
    toggle.setAttribute('aria-expanded', String(expanded));
    teaser.style.display = expanded ? 'none' : 'flex';
    if (expanded && table == null) {
      table = buildKeyTable();
      card.appendChild(table);
    }
    if (table != null) {
      table.style.display = expanded ? 'block' : 'none';
    }
  };
  render(false);
  toggle.addEventListener('click', () => {
    render(toggle.getAttribute('aria-expanded') !== 'true');
  });

  document.body.appendChild(card);
  // Forcing a reflow commits the opacity:0 start value, so the transition runs
  // on the very next style change. requestAnimationFrame would do the same only
  // while the tab is visible — in a background tab the card would mount and
  // stay invisible.
  void card.offsetHeight;
  card.style.opacity = '1';
}

// Only surfaces in the frame that actually holds the player controls, once the
// player has mounted — same probe as the feedback pill.
export function surfaceCheatSheet(): void {
  void retryUntil(() => (hasTrackControls(document) ? true : null), PROBE_ATTEMPTS, PROBE_DELAY_MS).then(
    (found) => {
      if (found != null) {
        showCard();
      }
    },
  );
}
