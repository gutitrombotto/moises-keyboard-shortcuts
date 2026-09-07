import { ACTION_CLASS_PATTERNS, TRACK_LABELS, type ToggleState } from '@/lib/config';

// Walking more levels than the track-row depth would let two rows share a
// "container" (e.g. the whole track list), so the climb is bounded.
const CONTAINER_SEARCH_DEPTH = 15;

// Distinguishes the player frame from the studio.moises.ai shell frame (which
// also runs this script under all_frames but has no track controls).
export function hasTrackControls(root: Document): boolean {
  return root.querySelector(`[class*="${ACTION_CLASS_PATTERNS.mute}"]`) != null;
}

// Every label a stem can render as, lowercased for a case-insensitive match.
// Falls back to the canonical name so a track absent from TRACK_LABELS still
// matches itself.
function acceptedLabels(trackName: string): string[] {
  const labels = TRACK_LABELS[trackName] ?? [trackName];
  return labels.map((label) => label.toLowerCase());
}

// Tracks have no stable ids or test hooks; the visible label text is the only
// reliable anchor, hence a TreeWalker over text nodes. The player localizes the
// label, so the match is against the stem's known labels (TRACK_LABELS), still
// on the full trimmed text node (never a substring).
export function findTrackTextNode(root: Document, trackName: string): Text | null {
  const accepted = acceptedLabels(trackName);
  const walker = root.createTreeWalker(root.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node): number {
      const text = node.textContent?.trim().toLowerCase();
      if (text != null && text.length > 0 && accepted.includes(text)) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_REJECT;
    },
  });
  return walker.nextNode() as Text | null;
}

// Climbs from the track label to the nearest ancestor holding BOTH a mute and
// a solo button — that pairing is what identifies a track row (the Smart
// Metronome row shares the control classes but has its own label, so anchoring
// on the track name keeps it out).
export function findTrackContainer(textNode: Text): HTMLElement | null {
  let el = textNode.parentElement;
  for (let i = 0; i < CONTAINER_SEARCH_DEPTH && el != null; i++) {
    const buttons = el.querySelectorAll('button');
    let hasMute = false;
    let hasSolo = false;
    for (const btn of buttons) {
      if (btn.className.includes(ACTION_CLASS_PATTERNS.mute)) {
        hasMute = true;
      }
      if (btn.className.includes(ACTION_CLASS_PATTERNS.solo)) {
        hasSolo = true;
      }
    }
    if (hasMute && hasSolo) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

// Every track label the player is currently rendering, in document order, one
// per track row — whatever the language and whatever the stem plan. This is the
// diagnostic counterpart to findTrackTextNode: when a lookup misses, this is
// what the DOM *does* carry, which is the one datum needed to fix TRACK_LABELS.
//
// A row is identified exactly as findTrackContainer defines it, so the two can
// never disagree; the first qualifying text node in a row is its label (a
// subtitle like "Lead" sits after the name and is skipped as a duplicate row).
// Text inside buttons is never a label. Rows that are not stems (the Smart
// Metronome shares the control classes) are deliberately included: filtering
// them would require knowing what a stem is, which is the very thing in doubt.
export function listDetectedTrackLabels(root: Document): string[] {
  const walker = root.createTreeWalker(root.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node): number {
      const text = node.textContent?.trim();
      if (text == null || text.length === 0) {
        return NodeFilter.FILTER_REJECT;
      }
      if (node.parentElement?.closest('button') != null) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const seen = new Set<HTMLElement>();
  const labels: string[] = [];
  let node = walker.nextNode();
  while (node != null) {
    const container = findTrackContainer(node as Text);
    if (container != null && !seen.has(container)) {
      seen.add(container);
      labels.push((node.textContent ?? '').trim());
    }
    node = walker.nextNode();
  }
  return labels;
}

export function findActionButton(container: HTMLElement, classPattern: string): HTMLButtonElement | null {
  const buttons = container.querySelectorAll('button');
  for (const btn of buttons) {
    if (btn.className.includes(classPattern)) {
      return btn;
    }
  }
  return null;
}

// Read BEFORE clicking: the click flips aria-pressed, and reading afterwards
// would race the player's re-render. The result is the state the click will
// produce; buttons without aria-pressed yield 'unknown'.
export function nextToggleState(button: HTMLButtonElement): ToggleState {
  const pressed = button.getAttribute('aria-pressed');
  if (pressed === 'true') {
    return 'off';
  }
  if (pressed === 'false') {
    return 'on';
  }
  return 'unknown';
}
