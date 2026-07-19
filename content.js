(function () {
  'use strict';

  const LOG_PREFIX = '[Moises Keyboard]';

  function log(...args) {
    console.log(LOG_PREFIX, ...args);
  }

  function logError(...args) {
    console.error(LOG_PREFIX, ...args);
  }

  // --- Toast notification ---

  function showToast(message, isError) {
    const existing = document.getElementById('moises-kb-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'moises-kb-toast';
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '10px 18px',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '14px',
      fontFamily: 'system-ui, sans-serif',
      zIndex: '999999',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.3s ease',
      background: isError ? '#d32f2f' : '#333',
    });
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 1500);
  }

  // --- DOM finders ---

  function findTrackTextNode(trackName) {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (node.textContent.trim() === trackName) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        },
      }
    );
    return walker.nextNode();
  }

  function findTrackContainer(textNode) {
    let el = textNode.parentElement;
    for (let i = 0; i < 15 && el; i++) {
      const buttons = el.querySelectorAll('button');
      let hasMute = false;
      let hasSolo = false;
      for (const btn of buttons) {
        if (btn.className.includes('buttonMute')) hasMute = true;
        if (btn.className.includes('buttonSolo')) hasSolo = true;
      }
      if (hasMute && hasSolo) return el;
      el = el.parentElement;
    }
    return null;
  }

  function findActionButton(container, classPattern) {
    const buttons = container.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.className.includes(classPattern)) return btn;
    }
    return null;
  }

  // --- Retry helper ---

  function retryUntil(fn, attempts, delay) {
    return new Promise(function (resolve) {
      function tryOnce(n) {
        var result = fn();
        if (result || n >= attempts) return resolve(result);
        setTimeout(function () { tryOnce(n + 1); }, delay);
      }
      tryOnce(1);
    });
  }

  // --- Core toggle ---

  async function toggleTrackAction(trackName, action) {
    var classPattern = ACTION_CLASS_PATTERNS[action];

    if (!classPattern) {
      logError('Unknown action:', action);
      showToast('Unknown action: ' + action, true);
      return;
    }

    var textNode = await retryUntil(function () { return findTrackTextNode(trackName); }, 3, 100);
    if (!textNode) {
      logError('Track "' + trackName + '" not found after retries');
      showToast(trackName + ' track not found', true);
      return;
    }

    var container = await retryUntil(function () { return findTrackContainer(textNode); }, 3, 100);
    if (!container) {
      logError('Could not find track container for "' + trackName + '"');
      showToast(trackName + ' container not found', true);
      return;
    }

    var btn = await retryUntil(function () { return findActionButton(container, classPattern); }, 3, 100);
    if (!btn) {
      logError(action + ' button not found in "' + trackName + '" container');
      showToast(trackName + ' ' + action + ' button not found', true);
      return;
    }

    btn.click();
    log(trackName + ' ' + action + ' toggled');
    showToast(trackName + ' ' + action + ' toggled', false);
  }

  // --- Keyboard handler ---

  function shouldIgnoreKeypress() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  const lastTrigger = {};

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (shouldIgnoreKeypress()) return;

    const shortcut = SHORTCUTS[e.key];
    if (!shortcut) return;

    // The player runs inside a studio1.moises.ai iframe; with all_frames the
    // script also loads in the shell frame. Stay inert where there are no
    // track controls so the shell doesn't emit "track not found" toasts.
    if (!document.querySelector('[class*="buttonMute"]')) return;

    const triggerKey = shortcut.track + ':' + shortcut.action;
    const now = Date.now();
    if (lastTrigger[triggerKey] && now - lastTrigger[triggerKey] < 300) return;
    lastTrigger[triggerKey] = now;

    e.preventDefault();
    log('Shortcut "' + e.key + '" -> ' + shortcut.track + ' ' + shortcut.action);
    toggleTrackAction(shortcut.track, shortcut.action);
  });

  log('Extension loaded, shortcuts active');

  // --- Opt-in feedback link ---

  function showFeedbackLink() {
    if (typeof FEEDBACK_URL !== 'string' || !FEEDBACK_URL || FEEDBACK_URL === 'PASTE_FEEDBACK_URL_HERE') return;
    try { if (localStorage.getItem('moises-kb-feedback-dismissed')) return; } catch (e) {}
    if (document.getElementById('moises-kb-feedback')) return;

    const wrap = document.createElement('div');
    wrap.id = 'moises-kb-feedback';
    Object.assign(wrap.style, {
      position: 'fixed', bottom: '16px', left: '16px', zIndex: '999999',
      display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px',
      borderRadius: '8px', background: 'rgba(30,30,30,0.9)', color: '#eee',
      fontSize: '12px', fontFamily: 'system-ui, sans-serif',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)', opacity: '0',
      transition: 'opacity 0.3s ease',
    });

    const link = document.createElement('a');
    link.textContent = '⌨️ Shortcuts feedback';
    link.href = FEEDBACK_URL;
    link.target = '_blank';
    link.rel = 'noopener';
    Object.assign(link.style, { color: '#8ab4ff', textDecoration: 'none' });

    const close = document.createElement('span');
    close.textContent = '✕';
    close.title = 'Dismiss';
    Object.assign(close.style, { cursor: 'pointer', opacity: '0.7' });
    close.addEventListener('click', function () {
      try { localStorage.setItem('moises-kb-feedback-dismissed', '1'); } catch (e) {}
      wrap.remove();
    });

    wrap.appendChild(link);
    wrap.appendChild(close);
    document.body.appendChild(wrap);
    requestAnimationFrame(function () { wrap.style.opacity = '1'; });
  }

  // Only surface it in the frame that actually holds the player controls.
  retryUntil(function () { return document.querySelector('[class*="buttonMute"]'); }, 10, 500)
    .then(function (found) { if (found) showFeedbackLink(); });
})();
