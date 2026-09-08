import {
  ACTION_CLASS_PATTERNS,
  DEBOUNCE_MS,
  FEEDBACK_URL,
  PROBE_ATTEMPTS,
  PROBE_DELAY_MS,
  RETRY_ATTEMPTS,
  RETRY_DELAY_MS,
  type TrackAction,
} from '@/lib/config';
import { createTriggerDebouncer } from '@/lib/debounce';
import {
  findActionButton,
  findTrackContainer,
  findTrackTextNode,
  hasTrackControls,
  listDetectedTrackLabels,
  nextToggleState,
} from '@/lib/dom-finder';
import { surfaceFeedbackLink } from '@/lib/feedback';
import { msg } from '@/lib/i18n';
import { resolveShortcut, shouldIgnoreKeypress } from '@/lib/keyboard';
import { log, logError } from '@/lib/logger';
import { retryUntil } from '@/lib/retry';
import { isPlayerFrame } from '@/lib/urls';
import { recordUse } from '@/lib/review';
import { showActionToast, showDiagnosticToast } from '@/lib/toast';

// Every failure path reports the same way: what broke, plus the labels this
// player is really rendering, plus a route to say so. The labels are read at
// failure time, not at load, so they describe the DOM the miss happened on.
function reportFailure(message: string): void {
  showDiagnosticToast(message, listDetectedTrackLabels(document), FEEDBACK_URL);
}

// One report per page load: even if the frame check is ever wrong, the damage
// is a single toast, never one per keypress.
let controlsProbeStarted = false;

// The player mounts late, so a keypress in the first seconds finds no controls
// on a perfectly healthy page. Only a probe that outlives the mount can tell
// "still loading" from "we no longer recognize this player".
async function reportControlsUnavailable(): Promise<void> {
  if (controlsProbeStarted) {
    return;
  }
  controlsProbeStarted = true;

  const found = await retryUntil(
    () => (hasTrackControls(document) ? true : null),
    PROBE_ATTEMPTS,
    PROBE_DELAY_MS,
  );
  if (found != null) {
    return;
  }

  logError('Player frame exposes no recognizable track controls');
  reportFailure(msg('errNoControls'));
}

async function toggleTrackAction(trackName: string, action: TrackAction): Promise<void> {
  const classPattern = ACTION_CLASS_PATTERNS[action];

  const textNode = await retryUntil(
    () => findTrackTextNode(document, trackName),
    RETRY_ATTEMPTS,
    RETRY_DELAY_MS,
  );
  if (textNode == null) {
    logError(`Track "${trackName}" not found after retries`);
    reportFailure(`${trackName}: ${msg('errTrackNotFound')}`);
    return;
  }

  const container = await retryUntil(() => findTrackContainer(textNode), RETRY_ATTEMPTS, RETRY_DELAY_MS);
  if (container == null) {
    logError(`Could not find track container for "${trackName}"`);
    reportFailure(`${trackName}: ${msg('errContainerNotFound')}`);
    return;
  }

  const button = await retryUntil(
    () => findActionButton(container, classPattern),
    RETRY_ATTEMPTS,
    RETRY_DELAY_MS,
  );
  if (button == null) {
    logError(`${action} button not found in "${trackName}" container`);
    reportFailure(`${trackName} ${action}: ${msg('errButtonNotFound')}`);
    return;
  }

  const state = nextToggleState(button, action);
  button.click();
  log(`${trackName} ${action} toggled`);
  showActionToast(trackName, action, state);
  // A successful toggle is the only signal that the extension delivered value,
  // so it is the trigger that (eventually) earns the review prompt.
  recordUse();
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

      // With all_frames the script also loads in the shell frame, which has no
      // track controls and must stay inert. In the player frame the same
      // absence is a breakage, and staying quiet there is what made a broken
      // build indistinguishable from an uninstalled one.
      if (!hasTrackControls(document)) {
        if (isPlayerFrame(location.hostname)) {
          void reportControlsUnavailable();
        }
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
