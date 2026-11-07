import { describe, expect, it } from 'vitest';

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
    expect(findActionButton(container, 'mute')).not.toBeNull();
    expect(findActionButton(container, 'solo')).not.toBeNull();
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
    const button = findActionButton(container, 'mute');
    expect(button?.getAttribute('aria-label')).toBe('Mute Drums');
  });

  it('finds the solo button, not the mute one, when asked for solo', () => {
    const container = containerFor(loadFixture('player'), 'Bass');
    const button = findActionButton(container, 'solo');
    expect(button?.getAttribute('aria-label')).toBe('Solo Bass');
  });

  it('returns null when the container holds no button for that action', () => {
    const container = document.createElement('div');
    container.innerHTML = '<button class="controls_buttonMute__HNRvx"></button>';
    expect(findActionButton(container, 'solo')).toBeNull();
  });

  // The live 2026 frame carries no aria-pressed on any button (verified
  // 2026-09-07), so the engaged marker is the class. Keying on aria-pressed
  // alone made every real toggle 'unknown'.
  it('predicts the resulting state from the engaged class before clicking', () => {
    const button = document.createElement('button');
    button.className = 'controls_button__Ixo9N controls_buttonMute__HNRvx';
    expect(nextToggleState(button, 'mute')).toBe('on');
    button.className += ' controls_isMuted____3K7 controls_isSilentMuted__tlyG4';
    expect(nextToggleState(button, 'mute')).toBe('off');
  });

  it('reads the solo marker independently of the mute marker', () => {
    const button = document.createElement('button');
    button.className = 'controls_button__Ixo9N controls_buttonSolo__KzYrB';
    expect(nextToggleState(button, 'solo')).toBe('on');
    button.className += ' controls_active__1T8c4';
    expect(nextToggleState(button, 'solo')).toBe('off');
  });

  it('prefers aria-pressed if the player ever exposes it', () => {
    const button = document.createElement('button');
    button.className = 'controls_buttonMute__HNRvx controls_isMuted____3K7';
    button.setAttribute('aria-pressed', 'false');
    expect(nextToggleState(button, 'mute')).toBe('on');
    button.setAttribute('aria-pressed', 'true');
    expect(nextToggleState(button, 'mute')).toBe('off');
  });

  it('reads the real fixture rows the way the live player marks them', () => {
    const doc = loadFixture('player');
    const muted = findActionButton(containerFor(doc, 'Smart Metronome'), 'mute') as HTMLButtonElement;
    expect(nextToggleState(muted, 'mute')).toBe('off');

    const idle = findActionButton(containerFor(doc, 'Vocals'), 'mute') as HTMLButtonElement;
    expect(nextToggleState(idle, 'mute')).toBe('on');
  });

  it('yields a clickable button', () => {
    const container = containerFor(loadFixture('player'), 'Vocals');
    const button = findActionButton(container, 'mute') as HTMLButtonElement;
    let clicked = false;
    button.addEventListener('click', () => {
      clicked = true;
    });
    button.click();
    expect(clicked).toBe(true);
  });
});

describe('listDetectedTrackLabels', () => {
  // Matches what the live 2026 player frame returns (verified 2026-09-07): the
  // five row labels and nothing else. The fixture carries the same noise the
  // real frame does — song title, GTM <noscript>, __NEXT_DATA__ — all of which
  // a text-anchored walk sweeps up.
  it('lists one label per row and nothing else', () => {
    expect(listDetectedTrackLabels(loadFixture('player'))).toEqual([
      'Vocals',
      'Drums',
      'Bass',
      'Other',
      'Smart Metronome',
    ]);
  });

  it('never reports the song title, the tag manager or page data', () => {
    const labels = listDetectedTrackLabels(loadFixture('player'));
    expect(labels.some((l) => l.includes('Obsesionario'))).toBe(false);
    expect(labels.some((l) => l.includes('__N_SSP') || l.includes('buildId'))).toBe(false);
    expect(labels.some((l) => l.includes('googletagmanager'))).toBe(false);
  });

  it('skips a subtitle that shares the row with the label', () => {
    expect(listDetectedTrackLabels(loadFixture('player'))).not.toContain('Lead');
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

// The /play/:trackId player renders the mixer in the shell document itself,
// with CSS-module classes (_mute_e3u0i_65) and aria-pressed (live, 2026-11-06).
describe('the /play/ player rendered in the shell', () => {
  it('holds track controls, so the shell is no longer inert there', () => {
    expect(hasTrackControls(loadFixture('player-play'))).toBe(true);
  });

  it.each(['Vocals', 'Drums', 'Bass', 'Other'])(
    'resolves the %s row to its own mute and solo',
    (trackName) => {
      const container = containerFor(loadFixture('player-play'), trackName);
      expect(container.closest('[role="group"]')?.getAttribute('aria-label')).toBe(trackName);
      expect(findActionButton(container, 'mute')?.textContent).toBe('M');
      expect(findActionButton(container, 'solo')?.textContent).toBe('S');
    },
  );

  it('reads the state from aria-pressed, as the live player marks it', () => {
    const doc = loadFixture('player-play');
    const muted = findActionButton(containerFor(doc, 'Metronome'), 'mute') as HTMLButtonElement;
    expect(nextToggleState(muted, 'mute')).toBe('off');
    const idle = findActionButton(containerFor(doc, 'Vocals'), 'mute') as HTMLButtonElement;
    expect(nextToggleState(idle, 'mute')).toBe('on');
  });

  it('lists the rendered row labels for the diagnostic', () => {
    expect(listDetectedTrackLabels(loadFixture('player-play'))).toEqual([
      'Vocals',
      'Drums',
      'Bass',
      'Other',
      'Metronome',
    ]);
  });
});
