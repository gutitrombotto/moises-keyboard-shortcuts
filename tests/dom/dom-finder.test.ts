import { describe, expect, it } from 'vitest';

import { ACTION_CLASS_PATTERNS } from '@/lib/config';
import {
  findActionButton,
  findTrackContainer,
  findTrackTextNode,
  hasTrackControls,
  listDetectedTrackLabels,
  nextToggleState,
} from '@/lib/dom-finder';
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

describe('findTrackTextNode across locales (real 2026 player DOM)', () => {
  // The player renders the label in the user's Moises UI language; detection
  // must resolve the canonical stem to whatever the player actually shows.
  it.each([
    ['Vocals', 'Vocais'],
    ['Drums', 'Bateria'],
    ['Bass', 'Baixo'],
    ['Other', 'Outro'],
  ])('resolves %s to the Portuguese label "%s"', (trackName, label) => {
    const textNode = findTrackTextNode(loadFixture('player-pt'), trackName);
    expect(textNode?.textContent?.trim()).toBe(label);
  });

  it.each([
    ['Vocals', 'Voz'],
    ['Drums', 'Batería'],
    ['Bass', 'Bajo'],
    ['Other', 'Otros'],
  ])('resolves %s to the Spanish label "%s"', (trackName, label) => {
    const textNode = findTrackTextNode(loadFixture('player-es'), trackName);
    expect(textNode?.textContent?.trim()).toBe(label);
  });

  it('drives the localized row end to end: container + mute button', () => {
    const doc = loadFixture('player-pt');
    const container = containerFor(doc, 'Drums'); // "Bateria" in the fixture
    expect(container.className).toContain('channel_line__');
    expect(findActionButton(container, ACTION_CLASS_PATTERNS.mute)).not.toBeNull();
    expect(findActionButton(container, ACTION_CLASS_PATTERNS.solo)).not.toBeNull();
  });

  it('keeps the localized Smart Metronome row out of track lookups', () => {
    // "Metrônomo Inteligente" is not any stem's label, so it never resolves.
    expect(findTrackTextNode(loadFixture('player-pt'), 'Other')?.textContent?.trim()).toBe('Outro');
    expect(findTrackTextNode(loadFixture('player-pt'), 'Metronome')).toBeNull();
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

  it('predicts the resulting toggle state from aria-pressed before clicking', () => {
    const button = document.createElement('button');
    expect(nextToggleState(button)).toBe('unknown');
    button.setAttribute('aria-pressed', 'false');
    expect(nextToggleState(button)).toBe('on');
    button.setAttribute('aria-pressed', 'true');
    expect(nextToggleState(button)).toBe('off');
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

describe('listDetectedTrackLabels', () => {
  it('lists one label per row, skipping the subtitle that shares the row', () => {
    // "Lead" sits in the Vocals row: it is a second text node in an already
    // claimed container, not a track of its own.
    expect(listDetectedTrackLabels(loadFixture('player'))).toEqual([
      'Vocals',
      'Drums',
      'Bass',
      'Other',
      'Smart Metronome',
    ]);
  });

  it('reports the localized labels the player actually renders', () => {
    expect(listDetectedTrackLabels(loadFixture('player-pt'))).toEqual([
      'Vocais',
      'Bateria',
      'Baixo',
      'Outro',
      'Metrônomo Inteligente',
    ]);
  });

  it('includes stems that have no shortcut mapped', () => {
    const labels = listDetectedTrackLabels(loadFixture('player-5stem'));
    expect(labels).toContain('Piano');
    expect(labels).toContain('Guitarra');
    expect(labels).toHaveLength(6);
  });

  it('names the labels when every lookup misses — the M9 failure', () => {
    const doc = loadFixture('player-unknown-labels');
    expect(findTrackTextNode(doc, 'Vocals')).toBeNull();
    expect(findTrackTextNode(doc, 'Drums')).toBeNull();
    expect(listDetectedTrackLabels(doc)).toEqual(['Voix', 'Batterie', 'Basse', 'Autre']);
  });

  it('finds nothing on the shell frame', () => {
    expect(listDetectedTrackLabels(loadFixture('shell'))).toEqual([]);
  });
});
