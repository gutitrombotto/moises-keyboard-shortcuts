import { REVIEW_PROMPT_AFTER, REVIEW_URL } from '@/lib/config';

// A running count of successful toggles and a one-shot "handled" flag. Both are
// UI state the extension generates about itself — not user data (see PRIVACY.md).
const USES_KEY = 'moises-kb-uses';
const DONE_KEY = 'moises-kb-review-done';

// localStorage can throw in sandboxed/cross-origin frames; every access fails
// safe so the prompt simply never appears rather than breaking the shortcuts.
function readCount(): number {
  try {
    const raw = localStorage.getItem(USES_KEY);
    const n = raw == null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeCount(n: number): void {
  try {
    localStorage.setItem(USES_KEY, String(n));
  } catch {
    // Sandboxed frame: the count won't persist, so the prompt just won't earn.
  }
}

function isDone(): boolean {
  try {
    return localStorage.getItem(DONE_KEY) != null;
  } catch {
    return false;
  }
}

function markDone(): void {
  try {
    localStorage.setItem(DONE_KEY, '1');
  } catch {
    // Sandboxed frame: the prompt may reappear next session, which is harmless.
  }
}

// Pure gate, kept separate from storage/DOM so the threshold logic is testable.
export function shouldPrompt(count: number, done: boolean): boolean {
  return !done && count >= REVIEW_PROMPT_AFTER;
}

// Called after every successful toggle from the content script. This module
// owns the counter and the one-shot flag only — the ask itself is rendered by
// the cheat-sheet card, so the extension never stacks a second floating pill on
// top of the player.
export function recordUse(): void {
  if (REVIEW_URL === '' || isDone()) {
    return;
  }
  writeCount(readCount() + 1);
}

// Whether the ask has been earned and not yet handled.
export function isReviewEarned(): boolean {
  if (REVIEW_URL === '') {
    return false;
  }
  return shouldPrompt(readCount(), isDone());
}

// Following the CTA, or dismissing the card, both count as handled: a "no
// thanks" must never be re-asked.
export function markReviewHandled(): void {
  markDone();
}
