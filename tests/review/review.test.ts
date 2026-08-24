import { afterEach, describe, expect, it, vi } from 'vitest';

import { REVIEW_PROMPT_AFTER } from '@/lib/config';
import { recordUse, shouldPrompt } from '@/lib/review';

// The pill text is the only thing that needs i18n; echo the key so the module
// can render without a browser.i18n mock (matches how the popup helper resolves).
vi.mock('@/lib/i18n', () => ({ msg: (key: string) => key }));

const REVIEW_ID = 'moises-kb-review';
const USES_KEY = 'moises-kb-uses';
const DONE_KEY = 'moises-kb-review-done';

function pill(): HTMLElement | null {
  return document.getElementById(REVIEW_ID);
}

afterEach(() => {
  localStorage.clear();
  document.getElementById(REVIEW_ID)?.remove();
});

describe('shouldPrompt', () => {
  it('stays silent below the threshold', () => {
    expect(shouldPrompt(REVIEW_PROMPT_AFTER - 1, false)).toBe(false);
  });

  it('fires at the threshold', () => {
    expect(shouldPrompt(REVIEW_PROMPT_AFTER, false)).toBe(true);
  });

  it('never fires once handled, even past the threshold', () => {
    expect(shouldPrompt(REVIEW_PROMPT_AFTER + 10, true)).toBe(false);
  });
});

describe('recordUse', () => {
  it('counts each call in localStorage', () => {
    recordUse();
    recordUse();
    expect(localStorage.getItem(USES_KEY)).toBe('2');
  });

  it('does not surface the prompt before the threshold', () => {
    for (let i = 0; i < REVIEW_PROMPT_AFTER - 1; i++) {
      recordUse();
    }
    expect(pill()).toBeNull();
  });

  it('surfaces the prompt exactly when the threshold is crossed', () => {
    for (let i = 0; i < REVIEW_PROMPT_AFTER; i++) {
      recordUse();
    }
    expect(pill()).not.toBeNull();
  });

  it('mounts a single prompt even if more toggles arrive', () => {
    for (let i = 0; i < REVIEW_PROMPT_AFTER + 3; i++) {
      recordUse();
    }
    expect(document.querySelectorAll(`#${REVIEW_ID}`).length).toBe(1);
  });

  it('does not re-prompt after the user dismisses it', () => {
    for (let i = 0; i < REVIEW_PROMPT_AFTER; i++) {
      recordUse();
    }
    const close = pill()?.lastElementChild;
    if (!(close instanceof HTMLElement)) {
      throw new Error('review prompt has no dismiss control');
    }
    close.click();

    expect(pill()).toBeNull();
    expect(localStorage.getItem(DONE_KEY)).not.toBeNull();

    recordUse();
    expect(pill()).toBeNull();
  });
});
