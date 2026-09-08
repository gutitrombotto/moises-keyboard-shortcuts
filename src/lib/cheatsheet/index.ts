import {
  DEFAULT_TRACK_COLOR,
  FEEDBACK_URL,
  PROBE_ATTEMPTS,
  PROBE_DELAY_MS,
  REVIEW_URL,
  TRACK_COLORS,
} from '@/lib/config';
import { hasTrackControls } from '@/lib/dom-finder';
import { msg } from '@/lib/i18n';
import { retryUntil } from '@/lib/retry';
import { isReviewEarned, markReviewHandled } from '@/lib/review';
import { collectTrackKeys, PLAYER_NATIVE_SHORTCUTS } from '@/lib/shortcuts';

const CARD_ID = 'moises-kb-cheatsheet';
// Minimised, never dismissed: closing the card leaves the launcher in its
// place, so the one surface that now holds the shortcuts, the feedback form and
// the rating can always be brought back.
const MINIMIZED_KEY = 'moises-kb-cheatsheet-minimized';
const LAUNCHER_ID = 'moises-kb-launcher';

// The card teaches the shortcuts to someone who never opens the toolbar popup,
// so it leads with one key they can try immediately rather than the whole table.
const TEASER_TRACK_INDEX = 0;

const STAR_COUNT = 5;

// Set while a collapsed card is on screen, so a toggle that earns the rating
// can flip the line without rebuilding the card.
let refreshLine: (() => void) | null = null;

// localStorage can throw in sandboxed/cross-origin frames; every access fails
// safe, matching the feedback and review pills.
function isMinimized(): boolean {
  try {
    return localStorage.getItem(MINIMIZED_KEY) != null;
  } catch {
    return false;
  }
}

function setMinimized(minimized: boolean): void {
  try {
    if (minimized) {
      localStorage.setItem(MINIMIZED_KEY, '1');
    } else {
      localStorage.removeItem(MINIMIZED_KEY);
    }
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
  table.appendChild(buildFooter());

  return table;
}

// The Web Store takes the actual rating on its own page, so these stars are a
// link, never an input: they all render the same and none of them fills on
// hover or click. Showing a captured vote we cannot capture would be a lie.
function starLink(onGo: () => void): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = REVIEW_URL;
  link.target = '_blank';
  link.rel = 'noopener';
  link.setAttribute('aria-label', msg('cheatsheetRateCta'));
  Object.assign(link.style, {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    textDecoration: 'none',
    cursor: 'pointer',
  });
  for (let i = 0; i < STAR_COUNT; i++) {
    const star = document.createElement('span');
    star.textContent = '★';
    star.setAttribute('aria-hidden', 'true');
    Object.assign(star.style, { color: '#fbbf24', fontSize: '13px', lineHeight: '1' });
    link.appendChild(star);
  }
  link.addEventListener('click', onGo);
  return link;
}

function actionLink(text: string, href: string, onGo?: () => void): HTMLAnchorElement {
  const link = document.createElement('a');
  link.textContent = text;
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener';
  Object.assign(link.style, { color: '#8ab4ff', textDecoration: 'none', fontSize: '11px' });
  if (onGo != null) {
    link.addEventListener('click', onGo);
  }
  return link;
}

// Feedback and the rating live inside the card instead of as pills of their
// own: one floating surface, and nothing of ours sits on the player's controls.
function buildFooter(): HTMLDivElement {
  const footer = document.createElement('div');
  Object.assign(footer.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  });

  if (REVIEW_URL !== '') {
    footer.appendChild(starLink(markReviewHandled));
    const rate = actionLink(msg('cheatsheetRate'), REVIEW_URL, markReviewHandled);
    footer.appendChild(rate);
  }

  const spacer = document.createElement('span');
  spacer.style.flex = '1';
  footer.appendChild(spacer);

  if (FEEDBACK_URL !== '') {
    footer.appendChild(actionLink(msg('cheatsheetFeedback'), FEEDBACK_URL));
  }
  return footer;
}

// The launcher takes the card's own position: shrinking in place is what makes
// it obvious what the icon is and where to click to get the card back. Parked
// in a corner it reads as unrelated chrome and goes unnoticed.
const ANCHOR = {
  position: 'fixed',
  top: '96px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: '999998',
} as const;

function showLauncher(): void {
  if (document.getElementById(LAUNCHER_ID) != null) {
    return;
  }
  const button = document.createElement('button');
  button.id = LAUNCHER_ID;
  button.type = 'button';
  button.title = msg('cheatsheetTitle');
  button.setAttribute('aria-label', msg('cheatsheetReopen'));
  Object.assign(button.style, {
    ...ANCHOR,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '50%',
    background: 'rgba(22,27,36,0.94)',
    border: '1px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 22px rgba(0,0,0,0.45)',
    cursor: 'pointer',
    opacity: '0',
    transition: 'opacity 0.25s ease',
  });
  button.appendChild(iconTile());
  button.addEventListener('click', () => {
    setMinimized(false);
    button.remove();
    showCard();
  });

  document.body.appendChild(button);
  void button.offsetHeight;
  button.style.opacity = '1';
}

function showCard(): void {
  if (document.getElementById(CARD_ID) != null) {
    return;
  }
  document.getElementById(LAUNCHER_ID)?.remove();

  const card = document.createElement('div');
  card.id = CARD_ID;
  card.setAttribute('role', 'complementary');
  card.setAttribute('aria-label', msg('cheatsheetTitle'));
  Object.assign(card.style, {
    // Below the player's own toolbar, not over it: at the very top the card
    // crowds the transport controls and collides with them on narrow windows.
    ...ANCHOR,
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
  Object.assign(title.style, { fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' });

  const teaser = document.createElement('span');
  Object.assign(teaser.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    color: 'rgba(238,242,247,0.6)',
    fontSize: '12px',
    whiteSpace: 'nowrap',
  });

  // Two modes, one surface: teach the keys until the shortcuts have proved
  // useful, then ask for the rating in the space the teaser was using. The ask
  // never spawns a second element of its own.
  const fillLine = (): void => {
    title.textContent = isReviewEarned() ? msg('reviewText') : msg('cheatsheetTitle');
    teaser.replaceChildren();
    if (isReviewEarned()) {
      teaser.appendChild(starLink(markReviewHandled));
      teaser.appendChild(actionLink(msg('cheatsheetRateCta'), REVIEW_URL, markReviewHandled));
      return;
    }
    const lead = collectTrackKeys()[TEASER_TRACK_INDEX];
    if (lead != null) {
      teaser.appendChild(document.createTextNode(msg('cheatsheetTryPrefix')));
      teaser.appendChild(keycap(lead.muteKey.toUpperCase(), true));
      teaser.appendChild(document.createTextNode(`${msg('cheatsheetTrySuffix')} ${lead.track}`));
    }
  };
  fillLine();
  refreshLine = fillLine;

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
    // Closing while it is asking for the rating is a "no thanks", and that is
    // honoured for good. Closing otherwise only minimises: the card comes back
    // from the launcher, in teaching mode.
    if (isReviewEarned()) {
      markReviewHandled();
    }
    setMinimized(true);
    refreshLine = null;
    card.remove();
    showLauncher();
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
      if (found == null) {
        return;
      }
      if (isMinimized()) {
        showLauncher();
        return;
      }
      showCard();
    },
  );
}

// Called after a successful toggle: re-renders the collapsed line so the rating
// ask appears the moment it is earned, without waiting for a reload.
export function refreshCheatSheet(): void {
  refreshLine?.();
}
