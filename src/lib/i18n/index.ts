import { browser } from 'wxt/browser';

// WXT generates a literal union of the _locales keys for getMessage, so an
// unknown key is a compile error. One entry point for every localized string:
// popup, in-page toasts, feedback pill, review prompt.
export type MessageKey = Parameters<typeof browser.i18n.getMessage>[0];

export function msg(key: MessageKey): string {
  return browser.i18n.getMessage(key);
}
