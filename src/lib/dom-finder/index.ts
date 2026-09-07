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

// Text that never renders as a label, and would otherwise be walked into: the
// GTM <noscript> and Next.js' __NEXT_DATA__ blob both live in the body.
const NON_RENDERED_TAGS = new Set(['SCRIPT', 'NOSCRIPT', 'STYLE', 'TEMPLATE', 'TITLE']);

function holdsControls(el: HTMLElement): boolean {
  const selector = `[class*="${ACTION_CLASS_PATTERNS.mute}"], [class*="${ACTION_CLASS_PATTERNS.solo}"]`;
  return el.querySelector(selector) != null;
}

// A row's label is its text that sits outside the controls subtree — which is
// what separates "Vocals" from the volume readout rendered beside the buttons.
// Ancestors are only inspected up to the row: above it every ancestor holds
// controls, so an unbounded walk would reject everything.
function isRowLabel(node: Text, row: HTMLElement): boolean {
  const text = node.textContent?.trim();
  if (text == null || text.length === 0) {
    return false;
  }
  let el = node.parentElement;
  while (el != null && el !== row) {
    if (NON_RENDERED_TAGS.has(el.tagName) || el.tagName === 'BUTTON' || holdsControls(el)) {
      return false;
    }
    el = el.parentElement;
  }
  return true;
}

// Climbs from a mute button to its row: the nearest ancestor that pairs mute
// with solo AND carries a label. The pairing alone is not enough — it first
// matches the controls wrapper, which has the buttons but no name.
function findRowLabel(button: HTMLElement): { row: HTMLElement; label: string } | null {
  let el = button.parentElement;
  for (let i = 0; i < CONTAINER_SEARCH_DEPTH && el != null; i++) {
    let hasMute = false;
    let hasSolo = false;
    for (const btn of el.querySelectorAll('button')) {
      if (btn.className.includes(ACTION_CLASS_PATTERNS.mute)) {
        hasMute = true;
      }
      if (btn.className.includes(ACTION_CLASS_PATTERNS.solo)) {
        hasSolo = true;
      }
    }
    if (hasMute && hasSolo) {
      const row = el;
      const walker = row.ownerDocument.createTreeWalker(row, NodeFilter.SHOW_TEXT, {
        acceptNode: (node: Node): number =>
          isRowLabel(node as Text, row) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
      });
      const first = walker.nextNode();
      if (first != null) {
        return { row, label: (first.textContent ?? '').trim() };
      }
    }
    el = el.parentElement;
  }
  return null;
}

// Every track label the player is currently rendering, in row order, whatever
// the language and whatever the stem plan. This is the diagnostic counterpart
// to findTrackTextNode: when a lookup misses, this is what the DOM *does*
// carry, which is the one datum needed to extend TRACK_LABELS.
//
// Anchored on the mute buttons rather than on text: walking every text node
// instead sweeps up the song title, the volume readouts and __NEXT_DATA__,
// because near the top of the tree every ancestor pairs mute with solo.
// Verified against the live 2026 player frame — it returns the five row labels
// and nothing else. Non-stem rows (the Smart Metronome shares the control
// classes) are deliberately kept: filtering them would require knowing what a
// stem is, which is the very thing in doubt.
export function listDetectedTrackLabels(root: Document): string[] {
  const seen = new Set<HTMLElement>();
  const labels: string[] = [];
  for (const button of root.querySelectorAll<HTMLElement>(`[class*="${ACTION_CLASS_PATTERNS.mute}"]`)) {
    const hit = findRowLabel(button);
    if (hit != null && !seen.has(hit.row)) {
      seen.add(hit.row);
      labels.push(hit.label);
    }
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
