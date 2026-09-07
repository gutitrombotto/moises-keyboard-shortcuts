import { afterEach, describe, expect, it, vi } from 'vitest';

import { showActionToast, showDiagnosticToast } from '@/lib/toast';

// Echo the key so the module renders without a browser.i18n mock (same
// convention as the review-prompt tests).
vi.mock('@/lib/i18n', () => ({ msg: (key: string) => key }));

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

describe('showDiagnosticToast', () => {
  const REPORT = 'https://forms.example/report';

  it('renders the message with the error icon', () => {
    showDiagnosticToast('Piano: track not found', [], REPORT);
    const toast = mountedToast();
    expect(toast.textContent).toContain('Piano: track not found');
    expect(toast.textContent).toContain('✕');
  });

  it('names the labels the player actually renders', () => {
    showDiagnosticToast('Vocals: track not found', ['Vocais', 'Bateria'], REPORT);
    expect(mountedToast().textContent).toContain('Vocais · Bateria');
  });

  it('drops the label line when nothing was detected', () => {
    showDiagnosticToast('Vocals: track not found', [], REPORT);
    expect(mountedToast().textContent).not.toContain('errDetectedLabels');
  });

  it('offers a report link pointing at the feedback form', () => {
    showDiagnosticToast('Vocals: track not found', ['Vocais'], REPORT);
    const link = mountedToast().querySelector('a');
    expect(link?.getAttribute('href')).toBe(REPORT);
    expect(link?.getAttribute('target')).toBe('_blank');
  });

  it('drops the report link when no URL is configured', () => {
    showDiagnosticToast('Vocals: track not found', ['Vocais'], '');
    expect(mountedToast().querySelector('a')).toBeNull();
  });

  // It carries something to click, so it must not fade out from under the user
  // nor sit behind pointer-events: none.
  it('stays interactive and does not auto-dismiss', () => {
    vi.useFakeTimers();
    showDiagnosticToast('Vocals: track not found', ['Vocais'], REPORT);
    expect(mountedToast().style.pointerEvents).toBe('auto');
    vi.advanceTimersByTime(10_000);
    expect(document.getElementById(TOAST_ID)).not.toBeNull();
    vi.useRealTimers();
  });

  it('dismisses on the ✕', () => {
    showDiagnosticToast('Vocals: track not found', ['Vocais'], REPORT);
    const close = mountedToast().lastElementChild as HTMLElement;
    close.click();
    expect(document.getElementById(TOAST_ID)).toBeNull();
  });
});
