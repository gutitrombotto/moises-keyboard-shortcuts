import { afterEach, describe, expect, it, vi } from 'vitest';

import { REVIEW_PROMPT_AFTER } from '@/lib/config';
import { refreshCheatSheet, surfaceCheatSheet } from '@/lib/cheatsheet';
import { recordUse } from '@/lib/review';

// Echo the key so the module renders without a browser.i18n mock (same
// convention as the review-prompt and toast tests).
vi.mock('@/lib/i18n', () => ({ msg: (key: string) => key }));

const CARD_ID = 'moises-kb-cheatsheet';
const MINIMIZED_KEY = 'moises-kb-cheatsheet-minimized';
const LAUNCHER_ID = 'moises-kb-launcher';

function mountPlayer(): void {
  document.body.innerHTML = `
    <div class="channel_line__C98CH">
      <div class="controls_container__GkwAw">
        <button class="controls_buttonMute__HNRvx"></button>
        <button class="controls_buttonSolo__KzYrB"></button>
      </div>
      <p class="channel_title__dZiv2">Vocals</p>
    </div>`;
}

function card(): HTMLElement {
  const el = document.getElementById(CARD_ID);
  if (el == null) {
    throw new Error('card not mounted');
  }
  return el;
}

function buttonWith(text: string): HTMLButtonElement {
  const btn = [...card().querySelectorAll('button')].find((b) => (b.textContent ?? '').includes(text));
  if (btn == null) {
    throw new Error(`no button containing "${text}"`);
  }
  return btn;
}

afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('surfaceCheatSheet', () => {
  it('shows the card once the player controls are present', async () => {
    mountPlayer();
    surfaceCheatSheet();
    await vi.waitFor(() => card());
    expect(card().textContent).toContain('cheatsheetTitle');
  });

  it('leads with one key to try instead of the whole table', async () => {
    mountPlayer();
    surfaceCheatSheet();
    await vi.waitFor(() => card());
    expect(card().textContent).toContain('cheatsheetTryPrefix');
    // Collapsed: the other tracks are not rendered yet.
    expect(card().textContent).not.toContain('Drums');
  });

  it('expands to the full table and collapses again', async () => {
    mountPlayer();
    surfaceCheatSheet();
    await vi.waitFor(() => card());

    buttonWith('cheatsheetShowKeys').click();
    expect(card().textContent).toContain('Drums');
    expect(card().textContent).toContain('Bass');
    expect(card().textContent).toContain('Other');

    buttonWith('cheatsheetHideKeys').click();
    expect(buttonWith('cheatsheetShowKeys').getAttribute('aria-expanded')).toBe('false');
  });

  // Closing must never be a dead end: the card is now the only home of the
  // shortcuts, the feedback form and the rating.
  it('minimises to a launcher instead of vanishing', async () => {
    mountPlayer();
    surfaceCheatSheet();
    await vi.waitFor(() => card());

    buttonWith('✕').click();
    expect(document.getElementById(CARD_ID)).toBeNull();
    expect(document.getElementById(LAUNCHER_ID)).not.toBeNull();
    expect(localStorage.getItem(MINIMIZED_KEY)).not.toBeNull();
  });

  it('leaves the launcher where the card was, so it reads as the same thing', async () => {
    mountPlayer();
    surfaceCheatSheet();
    await vi.waitFor(() => card());
    const cardTop = card().style.top;
    const cardLeft = card().style.left;

    buttonWith('✕').click();
    const launcher = document.getElementById(LAUNCHER_ID) as HTMLElement;
    expect(launcher.style.top).toBe(cardTop);
    expect(launcher.style.left).toBe(cardLeft);
  });

  it('brings the card back when the launcher is clicked', async () => {
    mountPlayer();
    surfaceCheatSheet();
    await vi.waitFor(() => card());
    buttonWith('✕').click();

    (document.getElementById(LAUNCHER_ID) as HTMLElement).click();
    expect(document.getElementById(CARD_ID)).not.toBeNull();
    expect(document.getElementById(LAUNCHER_ID)).toBeNull();
    expect(localStorage.getItem(MINIMIZED_KEY)).toBeNull();
  });

  it('comes back minimised across loads, never as nothing', async () => {
    mountPlayer();
    surfaceCheatSheet();
    await vi.waitFor(() => card());
    buttonWith('✕').click();
    document.getElementById(LAUNCHER_ID)?.remove();

    surfaceCheatSheet();
    await vi.waitFor(() => document.getElementById(LAUNCHER_ID));
    expect(document.getElementById(LAUNCHER_ID)).not.toBeNull();
    expect(document.getElementById(CARD_ID)).toBeNull();
  });

  it('using the shortcuts does not retire the card', async () => {
    mountPlayer();
    surfaceCheatSheet();
    await vi.waitFor(() => card());
    localStorage.setItem('moises-kb-uses', '50');
    document.getElementById(CARD_ID)?.remove();
    surfaceCheatSheet();
    await vi.waitFor(() => card());
    expect(document.getElementById(CARD_ID)).not.toBeNull();
  });

  it('offers the rating and the feedback form from the expanded footer', async () => {
    mountPlayer();
    surfaceCheatSheet();
    await vi.waitFor(() => card());
    buttonWith('cheatsheetShowKeys').click();

    const hrefs = [...card().querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs.some((h) => h?.includes('chromewebstore.google.com'))).toBe(true);
    expect(hrefs.some((h) => h?.includes('forms.gle'))).toBe(true);
    expect(card().textContent).toContain('★★★★★');
  });

  // The stars are a link to the store, never an input: a fill-on-click would
  // claim to have captured a rating the Web Store takes on its own page.
  it('renders every star identically, with no captured-vote state', async () => {
    mountPlayer();
    surfaceCheatSheet();
    await vi.waitFor(() => card());
    buttonWith('cheatsheetShowKeys').click();

    const stars = [...card().querySelectorAll('span')].filter((s) => s.textContent === '★');
    expect(stars).toHaveLength(5);
    expect(new Set(stars.map((s) => s.style.color)).size).toBe(1);
  });

  describe('rating ask', () => {
    const earnIt = (): void => {
      for (let i = 0; i < REVIEW_PROMPT_AFTER; i++) {
        recordUse();
      }
    };

    it('is absent while the shortcuts have not proved useful yet', async () => {
      mountPlayer();
      surfaceCheatSheet();
      await vi.waitFor(() => card());
      expect(card().textContent).toContain('cheatsheetTryPrefix');
      expect(card().textContent).not.toContain('cheatsheetRateCta');
    });

    it('takes over the collapsed line once earned, without adding a second element', async () => {
      mountPlayer();
      earnIt();
      surfaceCheatSheet();
      await vi.waitFor(() => card());
      expect(card().textContent).toContain('cheatsheetRateCta');
      expect(card().textContent).not.toContain('cheatsheetTryPrefix');
      expect(document.body.children).toHaveLength(2); // the player rows + the card
    });

    it('appears the moment the threshold is crossed, without a reload', async () => {
      mountPlayer();
      surfaceCheatSheet();
      await vi.waitFor(() => card());
      expect(card().textContent).not.toContain('cheatsheetRateCta');

      earnIt();
      refreshCheatSheet();
      expect(card().textContent).toContain('cheatsheetRateCta');
    });

    // Closing while it is asking is a "no thanks" and is honoured for good, but
    // it still only minimises: the card returns from the launcher, teaching.
    it('closing while it asks silences the ask for good, without losing the card', async () => {
      mountPlayer();
      earnIt();
      surfaceCheatSheet();
      await vi.waitFor(() => card());

      buttonWith('✕').click();
      expect(localStorage.getItem('moises-kb-review-done')).not.toBeNull();

      (document.getElementById(LAUNCHER_ID) as HTMLElement).click();
      expect(card().textContent).not.toContain('cheatsheetRateCta');
      expect(card().textContent).toContain('cheatsheetTryPrefix');
    });

    it('closing while it only teaches leaves the ask free to arrive later', async () => {
      mountPlayer();
      surfaceCheatSheet();
      await vi.waitFor(() => card());

      buttonWith('✕').click();
      expect(localStorage.getItem('moises-kb-review-done')).toBeNull();

      earnIt();
      (document.getElementById(LAUNCHER_ID) as HTMLElement).click();
      expect(card().textContent).toContain('cheatsheetRateCta');
    });
  });

  it('stays away from the shell frame, which has no track controls', async () => {
    document.body.innerHTML = '<div id="__next"><p>Moises Studio</p></div>';
    surfaceCheatSheet();
    await new Promise((r) => setTimeout(r, 50));
    expect(document.getElementById(CARD_ID)).toBeNull();
  });

  it('never mounts twice', async () => {
    mountPlayer();
    surfaceCheatSheet();
    await vi.waitFor(() => card());
    surfaceCheatSheet();
    await new Promise((r) => setTimeout(r, 50));
    expect(document.querySelectorAll(`#${CARD_ID}`).length).toBe(1);
  });
});
