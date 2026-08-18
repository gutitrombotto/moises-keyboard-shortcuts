import {
  ACTION_CLASS_PATTERNS,
  DEBOUNCE_MS,
  RETRY_ATTEMPTS,
  RETRY_DELAY_MS,
  type TrackAction,
} from '@/lib/config';
import { createTriggerDebouncer } from '@/lib/debounce';
import { findActionButton, findTrackContainer, findTrackTextNode, hasTrackControls } from '@/lib/dom-finder';
import { surfaceFeedbackLink } from '@/lib/feedback';
import { resolveShortcut, shouldIgnoreKeypress } from '@/lib/keyboard';
import { log, logError } from '@/lib/logger';
import { retryUntil } from '@/lib/retry';
import { showToast } from '@/lib/toast';

async function toggleTrackAction(trackName: string, action: TrackAction): Promise<void> {
  const classPattern = ACTION_CLASS_PATTERNS[action];

  const textNode = await retryUntil(
    () => findTrackTextNode(document, trackName),
    RETRY_ATTEMPTS,
    RETRY_DELAY_MS,
  );
  if (textNode == null) {
    logError(`Track "${trackName}" not found after retries`);
    showToast(`${trackName} track not found`, true);
    return;
  }

  const container = await retryUntil(() => findTrackContainer(textNode), RETRY_ATTEMPTS, RETRY_DELAY_MS);
  if (container == null) {
    logError(`Could not find track container for "${trackName}"`);
    showToast(`${trackName} container not found`, true);
    return;
  }

  const button = await retryUntil(
    () => findActionButton(container, classPattern),
    RETRY_ATTEMPTS,
    RETRY_DELAY_MS,
  );
  if (button == null) {
    logError(`${action} button not found in "${trackName}" container`);
    showToast(`${trackName} ${action} button not found`, true);
    return;
  }

  button.click();
  log(`${trackName} ${action} toggled`);
  showToast(`${trackName} ${action} toggled`, false);
}

export default defineContentScript({
  matches: ['https://studio.moises.ai/*', 'https://studio1.moises.ai/*'],
  runAt: 'document_idle',
  allFrames: true,
  main() {
    const debouncer = createTriggerDebouncer(DEBOUNCE_MS);

    document.addEventListener('keydown', (event) => {
      if (shouldIgnoreKeypress(document.activeElement)) {
        return;
      }

      const shortcut = resolveShortcut(event);
      if (shortcut == null) {
        return;
      }

      // The player runs inside a studio1.moises.ai iframe; with all_frames the
      // script also loads in the shell frame. Stay inert where there are no
      // track controls so the shell doesn't emit "track not found" toasts.
      if (!hasTrackControls(document)) {
        return;
      }

      if (!debouncer.shouldTrigger(`${shortcut.track}:${shortcut.action}`, Date.now())) {
        return;
      }

      event.preventDefault();
      log(`Shortcut "${event.key}" -> ${shortcut.track} ${shortcut.action}`);
      void toggleTrackAction(shortcut.track, shortcut.action);
    });

    log('Extension loaded, shortcuts active');

    surfaceFeedbackLink();
  },
});
