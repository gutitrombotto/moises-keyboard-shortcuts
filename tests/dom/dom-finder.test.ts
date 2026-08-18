import { describe, expect, it } from 'vitest';

import { ACTION_CLASS_PATTERNS } from '@/lib/config';
import { findActionButton, findTrackContainer, findTrackTextNode, hasTrackControls } from '@/lib/dom-finder';
import { loadFixture } from './load-fixture';

function containerFor(doc: Document, trackName: string): HTMLElement {
  const textNode = findTrackTextNode(doc, trackName);
  expect(textNode).not.toBeNull();
  const container = findTrackContainer(textNode as Text);
  expect(container).not.toBeNull();
  return container as HTMLElement;
}

describe('hasTrackControls (frame-inert guard)', () => {
  it('detects the player frame', () => {
    expect(hasTrackControls(loadFixture('player'))).toBe(true);
  });

  it('stays inert on the shell frame, which has no track controls', () => {
    expect(hasTrackControls(loadFixture('shell'))).toBe(false);
  });
});

describe('findTrackTextNode', () => {
  it.each(['Vocals', 'Drums', 'Bass', 'Other'])('finds the "%s" label', (trackName) => {
    const textNode = findTrackTextNode(loadFixture('player'), trackName);
    expect(textNode?.textContent?.trim()).toBe(trackName);
  });

  it('requires an exact label match, not a substring', () => {
    // "Vocals" must not match inside "Mute Vocals" aria-labels or subtitles.
    expect(findTrackTextNode(loadFixture('player'), 'Voc')).toBeNull();
  });

  it('returns null for a track that is not in the player', () => {
    expect(findTrackTextNode(loadFixture('player'), 'Piano')).toBeNull();
  });
});

describe('findTrackContainer', () => {
  it('returns the track row owning both a mute and a solo button', () => {
    const container = containerFor(loadFixture('player'), 'Vocals');
    expect(container.className).toContain('controls_track__');
    expect(container.getAttribute('data-track')).toBe('vocals');
  });

  it('scopes each track to its own row, not a shared ancestor', () => {
    const doc = loadFixture('player');
    const vocals = containerFor(doc, 'Vocals');
    const drums = containerFor(doc, 'Drums');
    expect(vocals).not.toBe(drums);
    expect(vocals.contains(drums)).toBe(false);
  });

  it('keeps the Smart Metronome row out of real track lookups', () => {
    const container = containerFor(loadFixture('player'), 'Other');
    expect(container.getAttribute('data-track')).toBe('other');
    expect(container.textContent).not.toContain('Smart Metronome');
  });
});

describe('findActionButton', () => {
  it('finds the mute button by class substring despite the hashed suffix', () => {
    const container = containerFor(loadFixture('player'), 'Drums');
    const button = findActionButton(container, ACTION_CLASS_PATTERNS.mute);
    expect(button?.getAttribute('aria-label')).toBe('Mute Drums');
  });

  it('finds the solo button, not the mute one, when asked for solo', () => {
    const container = containerFor(loadFixture('player'), 'Bass');
    const button = findActionButton(container, ACTION_CLASS_PATTERNS.solo);
    expect(button?.getAttribute('aria-label')).toBe('Solo Bass');
  });

  it('returns null when the pattern matches no button in the container', () => {
    const container = containerFor(loadFixture('player'), 'Bass');
    expect(findActionButton(container, 'buttonRecord')).toBeNull();
  });

  it('yields a clickable button', () => {
    const container = containerFor(loadFixture('player'), 'Vocals');
    const button = findActionButton(container, ACTION_CLASS_PATTERNS.mute) as HTMLButtonElement;
    let clicked = false;
    button.addEventListener('click', () => {
      clicked = true;
    });
    button.click();
    expect(clicked).toBe(true);
  });
});
