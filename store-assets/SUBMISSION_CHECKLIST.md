# Chrome Web Store — v1.4.0 Submission Checklist

Dashboard: https://chrome.google.com/webstore/devconsole → open the existing item (`oednmjhdohclojfahpjabgjmmegojbef`) → **Package → Upload new package**. This is an update, not a new item: v1.3 is already published (since 2026-07-19, ~91 users).

## 0. Blockers — resolved 2026-08-17

- [x] **Privacy policy URL** — the repo was made public and GitHub Pages now serves `docs/privacy.html` (kept in sync with `PRIVACY.md`) at the URL the listing declares: `https://gutitrombotto.github.io/moises-keyboard-shortcuts/privacy.html`. Verify it returns 200 before submitting.
- [x] **"Open source" claim** — the repo is public (MIT); the linked repository resolves again.
- [x] **Manual validation** — v1.4.0 (M5) and v1.5.0 popup/toasts (M6) verified by hand on the real player.

## 1. Package

- [ ] Upload `.output/moises-keyboard-shortcuts-1.4.0-chrome.zip` (built from `main` with `pnpm zip`)

## 2. Store listing (Listing tab)

- [ ] **Languages**: the dashboard builds its language dropdown from the `_locales` in the uploaded ZIP. v1.3 shipped none, so the item currently has a single listing whose language reads "Spanish (Latin America)" while its copy is English. After uploading the v1.4.0 package (which ships `_locales/{en,es}`): fill the **English** listing from `store-assets/listing/en.md` and the **Spanish** one from `es.md` (name and short description come from the manifest; only the detailed description and assets are editable here).
- [ ] **Category**: Productivity (keep the current subcategory unless the dashboard offers a better fit; see the rationale in `listing/en.md`)
- [ ] **Icon**: `store-assets/icons/store-icon-128.png`
- [ ] **Screenshots** (1280×800): upload the 5 from `store-assets/screenshots/en/` on the English listing and the 5 from `store-assets/screenshots/es/` on the Spanish one
- [ ] **Support/homepage**: GitHub repo URL once public, or leave as-is

## 3. Privacy tab

- [ ] **Single purpose description**: from `store-assets/permissions-justifications.md`
- [ ] **Permission justifications** (one per host permission — both drafted in `store-assets/permissions-justifications.md`): `https://studio.moises.ai/*`, `https://studio1.moises.ai/*`
- [ ] **Remote code**: No, extension does not use remote code
- [ ] **Data usage**: nothing is collected — **all data-type boxes unchecked**. This matches v1.3's declaration and remains true in v1.4.0 (zero network requests). Any change to this tab requires showing the user the diff first (hard rule 3 of `/store-check`).
- [ ] **Privacy policy URL**: the fixed URL from §0
- [ ] Certify the disclosures

## 4. Distribution tab

- [ ] **Visibility**: Public
- [ ] **Regions**: all
- [ ] **Pricing**: Free

## 5. Submit

- [ ] Save draft → **Submit for review** — only with the user's explicit confirmation in the session (hard rule 1 of `/store-check`)
- [ ] Expected review time: days. Zero permissions beyond two same-vendor host permissions and a no-data declaration work in our favor.

## After approval

- [ ] Verify both listing languages render with their localized screenshots
- [ ] Mark the v1.4.0 release in ROADMAP status; tag `v1.4.0` in git
- [ ] Remove the legacy v1.3 files in their own commit (ROADMAP §M5 — only after the store version is live and healthy)
