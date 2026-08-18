import { SHORTCUTS, type Shortcut } from '@/lib/config';

export interface KeypressLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

// Input safety: never steal keys from form fields or rich-text editors.
export function shouldIgnoreKeypress(activeElement: Element | null): boolean {
  if (activeElement == null) {
    return false;
  }
  const tag = activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }
  if (activeElement instanceof HTMLElement && activeElement.isContentEditable) {
    return true;
  }
  return false;
}

// Modified keys pass through untouched so Ctrl+V/Cmd+V keep pasting.
export function resolveShortcut(event: KeypressLike): Shortcut | null {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return null;
  }
  return SHORTCUTS[event.key] ?? null;
}
