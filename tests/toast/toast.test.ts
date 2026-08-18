import { afterEach, describe, expect, it } from 'vitest';

import { showActionToast, showErrorToast } from '@/lib/toast';

const TOAST_ID = 'moises-kb-toast';

function mountedToast(): HTMLElement {
  const el = document.getElementById(TOAST_ID);
  if (el == null) {
    throw new Error('toast not mounted');
  }
  return el;
}

function chipOf(toast: HTMLElement): HTMLElement {
  const chip = toast.lastElementChild;
  if (!(chip instanceof HTMLElement)) {
    throw new Error('toast has no chip');
  }
  return chip;
}

afterEach(() => {
  document.getElementById(TOAST_ID)?.remove();
});

describe('showActionToast', () => {
  it('renders the track name and the action chip', () => {
    showActionToast('Vocals', 'mute', 'on');
    const toast = mountedToast();
    expect(toast.textContent).toContain('Vocals');
    expect(chipOf(toast).textContent).toBe('MUTE');
  });

  it('renders SOLO for solo actions', () => {
    showActionToast('Drums', 'solo', 'on');
    expect(chipOf(mountedToast()).textContent).toBe('SOLO');
  });

  it('strikes the chip through when the toggle turned the action off', () => {
    showActionToast('Vocals', 'mute', 'off');
    expect(chipOf(mountedToast()).style.textDecoration).toBe('line-through');
  });

  it('keeps the chip plain when the resulting state is unknown', () => {
    showActionToast('Vocals', 'mute', 'unknown');
    expect(chipOf(mountedToast()).style.textDecoration).toBe('none');
  });

  it('does not throw for tracks without a configured color', () => {
    showActionToast('Piano', 'mute', 'on');
    expect(mountedToast().textContent).toContain('Piano');
  });

  it('replaces the previous toast — only one at a time', () => {
    showActionToast('Vocals', 'mute', 'on');
    showActionToast('Drums', 'solo', 'on');
    const toasts = document.querySelectorAll(`#${TOAST_ID}`);
    expect(toasts.length).toBe(1);
    expect(mountedToast().textContent).toContain('Drums');
  });
});

describe('showErrorToast', () => {
  it('renders the message with the error icon', () => {
    showErrorToast('Piano track not found');
    const toast = mountedToast();
    expect(toast.textContent).toContain('Piano track not found');
    expect(toast.textContent).toContain('✕');
  });
});
