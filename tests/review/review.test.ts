import { afterEach, describe, expect, it } from 'vitest';

import { REVIEW_PROMPT_AFTER } from '@/lib/config';
import { isReviewEarned, markReviewHandled, recordUse, shouldPrompt } from '@/lib/review';

const USES_KEY = 'moises-kb-uses';
const DONE_KEY = 'moises-kb-review-done';

afterEach(() => {
  localStorage.clear();
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

  // The ask is rendered by the cheat-sheet card, so this module must never put
  // anything on the page itself — that is what kept a second pill off the
  // player's own controls.
  it('renders nothing at all', () => {
    for (let i = 0; i < REVIEW_PROMPT_AFTER + 3; i++) {
      recordUse();
    }
    expect(document.body.children.length).toBe(0);
  });
});

describe('isReviewEarned', () => {
  it('is false before the threshold', () => {
    for (let i = 0; i < REVIEW_PROMPT_AFTER - 1; i++) {
      recordUse();
    }
    expect(isReviewEarned()).toBe(false);
  });

  it('becomes true exactly when the threshold is crossed', () => {
    for (let i = 0; i < REVIEW_PROMPT_AFTER; i++) {
      recordUse();
    }
    expect(isReviewEarned()).toBe(true);
  });

  it('goes quiet for good once handled', () => {
    for (let i = 0; i < REVIEW_PROMPT_AFTER; i++) {
      recordUse();
    }
    markReviewHandled();
    expect(localStorage.getItem(DONE_KEY)).not.toBeNull();
    expect(isReviewEarned()).toBe(false);

    recordUse();
    expect(isReviewEarned()).toBe(false);
  });

  it('stops counting once handled, so the counter cannot resurrect the ask', () => {
    markReviewHandled();
    recordUse();
    expect(localStorage.getItem(USES_KEY)).toBeNull();
  });
});
