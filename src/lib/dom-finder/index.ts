import { ACTION_CLASS_PATTERNS } from '@/lib/config';

// Walking more levels than the track-row depth would let two rows share a
// "container" (e.g. the whole track list), so the climb is bounded.
const CONTAINER_SEARCH_DEPTH = 15;

// Distinguishes the player frame from the studio.moises.ai shell frame (which
// also runs this script under all_frames but has no track controls).
export function hasTrackControls(root: Document): boolean {
  return root.querySelector(`[class*="${ACTION_CLASS_PATTERNS.mute}"]`) != null;
}

// Tracks have no stable ids or test hooks; the visible label text is the only
// reliable anchor, hence a TreeWalker over text nodes.
export function findTrackTextNode(root: Document, trackName: string): Text | null {
  const walker = root.createTreeWalker(root.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node): number {
      if (node.textContent != null && node.textContent.trim() === trackName) {
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

export function findActionButton(container: HTMLElement, classPattern: string): HTMLButtonElement | null {
  const buttons = container.querySelectorAll('button');
  for (const btn of buttons) {
    if (btn.className.includes(classPattern)) {
      return btn;
    }
  }
  return null;
}
