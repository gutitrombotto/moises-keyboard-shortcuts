import { DEFAULT_TRACK_COLOR, TRACK_COLORS, type ToggleState, type TrackAction } from '@/lib/config';

const TOAST_ID = 'moises-kb-toast';
const TOAST_VISIBLE_MS = 1500;
const TOAST_FADE_MS = 300;

function chipColors(action: TrackAction, state: ToggleState): { background: string; color: string } {
  if (state === 'on') {
    return action === 'mute'
      ? { background: '#f87171', color: '#1a0d0d' }
      : { background: '#3ee6a0', color: '#0d1a13' };
  }
  return { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)' };
}

function buildChip(action: TrackAction, state: ToggleState): HTMLSpanElement {
  const chip = document.createElement('span');
  chip.textContent = action.toUpperCase();
  Object.assign(chip.style, {
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '0.08em',
    padding: '3px 8px',
    borderRadius: '20px',
    textDecoration: state === 'off' ? 'line-through' : 'none',
    ...chipColors(action, state),
  });
  return chip;
}

function buildAccentBar(track: string): HTMLSpanElement {
  const bar = document.createElement('span');
  Object.assign(bar.style, {
    width: '3px',
    alignSelf: 'stretch',
    borderRadius: '2px',
    background: TRACK_COLORS[track] ?? DEFAULT_TRACK_COLOR,
  });
  return bar;
}

function buildErrorIcon(): HTMLSpanElement {
  const icon = document.createElement('span');
  icon.textContent = '✕';
  Object.assign(icon.style, {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: 'rgba(248,113,113,0.15)',
    color: '#f87171',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '700',
    flexShrink: '0',
  });
  return icon;
}

// One toast at a time; a new one replaces the current. Timing is part of the
// behavior contract (SPECS §7): 1.5 s visible, 0.3 s fade.
function mountToast(children: HTMLElement[], borderColor: string): void {
  const existing = document.getElementById(TOAST_ID);
  if (existing != null) {
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.id = TOAST_ID;
  Object.assign(toast.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 14px 9px 10px',
    borderRadius: '10px',
    background: 'rgba(19,25,34,0.92)',
    border: `1px solid ${borderColor}`,
    boxShadow: '0 10px 30px rgba(0,0,0,0.55)',
    backdropFilter: 'blur(6px)',
    color: '#eef2f7',
    fontSize: '13px',
    fontFamily: 'system-ui, sans-serif',
    zIndex: '999999',
    pointerEvents: 'none',
    opacity: '0',
    transition: 'opacity 0.3s ease',
  });
  for (const child of children) {
    toast.appendChild(child);
  }
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, TOAST_FADE_MS);
  }, TOAST_VISIBLE_MS);
}

export function showActionToast(track: string, action: TrackAction, state: ToggleState): void {
  const name = document.createElement('span');
  name.textContent = track;
  name.style.fontWeight = '700';
  mountToast([buildAccentBar(track), name, buildChip(action, state)], 'rgba(255,255,255,0.1)');
}

export function showErrorToast(message: string): void {
  const text = document.createElement('span');
  text.textContent = message;
  text.style.color = '#fca5a5';
  mountToast([buildErrorIcon(), text], 'rgba(248,113,113,0.4)');
}
