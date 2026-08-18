import { describe, expect, it } from 'vitest';

import { createTriggerDebouncer } from '@/lib/debounce';

const WINDOW_MS = 300;

describe('createTriggerDebouncer', () => {
  it('allows the first trigger for a key', () => {
    const debouncer = createTriggerDebouncer(WINDOW_MS);
    expect(debouncer.shouldTrigger('Vocals:mute', 1000)).toBe(true);
  });

  it('drops a repeat of the same key inside the window', () => {
    const debouncer = createTriggerDebouncer(WINDOW_MS);
    debouncer.shouldTrigger('Vocals:mute', 1000);
    expect(debouncer.shouldTrigger('Vocals:mute', 1000 + WINDOW_MS - 1)).toBe(false);
  });

  it('allows the same key again once the window has passed', () => {
    const debouncer = createTriggerDebouncer(WINDOW_MS);
    debouncer.shouldTrigger('Vocals:mute', 1000);
    expect(debouncer.shouldTrigger('Vocals:mute', 1000 + WINDOW_MS)).toBe(true);
  });

  it('tracks keys independently — muting Drums right after Vocals is fine', () => {
    const debouncer = createTriggerDebouncer(WINDOW_MS);
    debouncer.shouldTrigger('Vocals:mute', 1000);
    expect(debouncer.shouldTrigger('Drums:mute', 1001)).toBe(true);
    expect(debouncer.shouldTrigger('Vocals:solo', 1002)).toBe(true);
  });

  it('does not extend the window on dropped triggers', () => {
    // A held key auto-repeats faster than the window; the gate must reopen
    // relative to the last ACCEPTED trigger, or holding the key would lock it.
    const debouncer = createTriggerDebouncer(WINDOW_MS);
    debouncer.shouldTrigger('Vocals:mute', 1000);
    debouncer.shouldTrigger('Vocals:mute', 1250);
    expect(debouncer.shouldTrigger('Vocals:mute', 1300)).toBe(true);
  });
});
