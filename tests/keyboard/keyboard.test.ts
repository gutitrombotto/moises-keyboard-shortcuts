import { describe, expect, it } from 'vitest';

import { SHORTCUTS } from '@/lib/config';
import { resolveShortcut, shouldIgnoreKeypress, type KeypressLike } from '@/lib/keyboard';

function press(key: string, modifiers: Partial<KeypressLike> = {}): KeypressLike {
  return { key, ctrlKey: false, metaKey: false, altKey: false, ...modifiers };
}

describe('resolveShortcut', () => {
  it.each([
    ['v', 'Vocals'],
    ['d', 'Drums'],
    ['b', 'Bass'],
    ['o', 'Other'],
  ])('maps lowercase "%s" to muting %s', (key, track) => {
    expect(resolveShortcut(press(key))).toEqual({ track, action: 'mute' });
  });

  it.each([
    ['V', 'Vocals'],
    ['D', 'Drums'],
    ['B', 'Bass'],
    ['O', 'Other'],
  ])('maps Shift-ed "%s" to soloing %s', (key, track) => {
    expect(resolveShortcut(press(key))).toEqual({ track, action: 'solo' });
  });

  it('ignores keys with no mapping', () => {
    expect(resolveShortcut(press('x'))).toBeNull();
    expect(resolveShortcut(press('Enter'))).toBeNull();
  });

  it.each([
    ['ctrlKey', { ctrlKey: true }],
    ['metaKey', { metaKey: true }],
    ['altKey', { altKey: true }],
  ])('lets %s combinations pass through (paste etc. keep working)', (_name, modifiers) => {
    expect(resolveShortcut(press('v', modifiers))).toBeNull();
  });

  it('covers every configured shortcut key', () => {
    for (const key of Object.keys(SHORTCUTS)) {
      expect(resolveShortcut(press(key))).toEqual(SHORTCUTS[key]);
    }
  });
});

describe('shouldIgnoreKeypress (input safety)', () => {
  it.each(['input', 'textarea', 'select'])('ignores keypresses while a <%s> is focused', (tag) => {
    expect(shouldIgnoreKeypress(document.createElement(tag))).toBe(true);
  });

  it('ignores keypresses inside contentEditable elements', () => {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    // happy-dom only reports isContentEditable once the element is attached.
    document.body.appendChild(div);
    expect(shouldIgnoreKeypress(div)).toBe(true);
    div.remove();
  });

  it('handles keypresses when nothing relevant is focused', () => {
    expect(shouldIgnoreKeypress(null)).toBe(false);
    expect(shouldIgnoreKeypress(document.body)).toBe(false);
    expect(shouldIgnoreKeypress(document.createElement('button'))).toBe(false);
  });
});
