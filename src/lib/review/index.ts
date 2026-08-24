import { REVIEW_PROMPT_AFTER, REVIEW_URL } from '@/lib/config';
import { msg } from '@/lib/i18n';

const REVIEW_ID = 'moises-kb-review';
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

function showReviewPrompt(): void {
  if (document.getElementById(REVIEW_ID) != null) {
    return;
  }

  const wrap = document.createElement('div');
  wrap.id = REVIEW_ID;
  // Bottom-right: clear of the feedback pill (bottom-left) and the toasts (top-right).
  Object.assign(wrap.style, {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    zIndex: '999999',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 12px',
    borderRadius: '20px',
    background: 'rgba(19,25,34,0.92)',
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(6px)',
    color: '#eee',
    fontSize: '12px',
    fontFamily: 'system-ui, sans-serif',
    boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
    opacity: '0',
    transition: 'opacity 0.3s ease',
  });

  const label = document.createElement('span');
  label.textContent = msg('reviewText');
  label.style.opacity = '0.85';

  const link = document.createElement('a');
  link.textContent = msg('reviewCta');
  link.href = REVIEW_URL;
  link.target = '_blank';
  link.rel = 'noopener';
  Object.assign(link.style, { color: '#8ab4ff', textDecoration: 'none' });
  // Following the CTA counts as handled: never prompt again once they act on it.
  link.addEventListener('click', markDone);

  const close = document.createElement('span');
  close.textContent = '✕';
  close.title = msg('feedbackDismiss');
  Object.assign(close.style, { cursor: 'pointer', opacity: '0.7' });
  close.addEventListener('click', () => {
    // Dismissing also marks it done: a "no thanks" should not be re-asked.
    markDone();
    wrap.remove();
  });

  wrap.appendChild(label);
  wrap.appendChild(link);
  wrap.appendChild(close);
  document.body.appendChild(wrap);
  requestAnimationFrame(() => {
    wrap.style.opacity = '1';
  });
}

// Called after every successful toggle from the content script. Increments the
// count and surfaces the one-time prompt the moment the threshold is crossed.
export function recordUse(): void {
  if (REVIEW_URL === '' || isDone()) {
    return;
  }
  const count = readCount() + 1;
  writeCount(count);
  if (shouldPrompt(count, isDone())) {
    showReviewPrompt();
  }
}
