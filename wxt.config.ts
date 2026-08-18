import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    // Localized via public/_locales. The Web Store builds its listing-language
    // dropdown from the _locales shipped in the package, so a locale that is not
    // declared here cannot have a translated listing at all.
    default_locale: 'en',
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    host_permissions: ['https://studio.moises.ai/*', 'https://studio1.moises.ai/*'],
    action: {
      default_title: '__MSG_extName__',
    },
  },
});
