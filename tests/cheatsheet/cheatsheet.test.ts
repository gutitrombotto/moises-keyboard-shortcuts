import { afterEach, describe, expect, it, vi } from 'vitest';

import { surfaceCheatSheet } from '@/lib/cheatsheet';

// Echo the key so the module renders without a browser.i18n mock (same
// convention as the review-prompt and toast tests).
vi.mock('@/lib/i18n', () => ({ msg: (key: string) => key }));

const CARD_ID = 'moises-kb-cheatsheet';
const DISMISSED_KEY = 'moises-kb-cheatsheet-dismissed';

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

  it('stays dismissed across loads once closed — the ✕ is the only way out', async () => {
    mountPlayer();
    surfaceCheatSheet();
    await vi.waitFor(() => card());

    buttonWith('✕').click();
    expect(document.getElementById(CARD_ID)).toBeNull();
    expect(localStorage.getItem(DISMISSED_KEY)).not.toBeNull();

    surfaceCheatSheet();
    await new Promise((r) => setTimeout(r, 50));
    expect(document.getElementById(CARD_ID)).toBeNull();
  });

  it('using the shortcuts does not retire the card', async () => {
    mountPlayer();
    surfaceCheatSheet();
    await vi.waitFor(() => card());
    // The review prompt counts uses; the card deliberately ignores that.
    localStorage.setItem('moises-kb-uses', '50');
    document.getElementById(CARD_ID)?.remove();
    surfaceCheatSheet();
    await vi.waitFor(() => card());
    expect(document.getElementById(CARD_ID)).not.toBeNull();
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
