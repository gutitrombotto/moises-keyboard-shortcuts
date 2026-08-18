import { FEEDBACK_URL } from '@/lib/config';
import { hasTrackControls } from '@/lib/dom-finder';
import { retryUntil } from '@/lib/retry';

const FEEDBACK_ID = 'moises-kb-feedback';
const DISMISSED_KEY = 'moises-kb-feedback-dismissed';
// The player mounts well after document_idle, so this one-shot probe waits far
// longer than the shortcut retries do.
const PROBE_ATTEMPTS = 10;
const PROBE_DELAY_MS = 500;

// localStorage can throw in sandboxed/cross-origin frames; failing open (show
// the link) matches the pre-migration behavior.
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
    // Sandboxed frame: the link will reappear next load, which is harmless.
  }
}

function showFeedbackLink(): void {
  if (isDismissed()) {
    return;
  }
  if (document.getElementById(FEEDBACK_ID) != null) {
    return;
  }

  const wrap = document.createElement('div');
  wrap.id = FEEDBACK_ID;
  Object.assign(wrap.style, {
    position: 'fixed',
    bottom: '16px',
    left: '16px',
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

  const link = document.createElement('a');
  link.textContent = '⌨️ Shortcuts feedback';
  link.href = FEEDBACK_URL;
  link.target = '_blank';
  link.rel = 'noopener';
  Object.assign(link.style, { color: '#8ab4ff', textDecoration: 'none' });

  const close = document.createElement('span');
  close.textContent = '✕';
  close.title = 'Dismiss';
  Object.assign(close.style, { cursor: 'pointer', opacity: '0.7' });
  close.addEventListener('click', () => {
    markDismissed();
    wrap.remove();
  });

  wrap.appendChild(link);
  wrap.appendChild(close);
  document.body.appendChild(wrap);
  requestAnimationFrame(() => {
    wrap.style.opacity = '1';
  });
}

// Only surfaces in the frame that actually holds the player controls.
export function surfaceFeedbackLink(): void {
  if (FEEDBACK_URL === '') {
    return;
  }
  void retryUntil(() => (hasTrackControls(document) ? true : null), PROBE_ATTEMPTS, PROBE_DELAY_MS).then(
    (found) => {
      if (found != null) {
        showFeedbackLink();
      }
    },
  );
}
