# Moises Keyboard Shortcuts — notas para Claude Code

Extensión de Chrome (MV3, WXT + TypeScript, sin UI propia) publicada en el Chrome Web
Store como **Moises Keyboard Shortcuts** (ítem `oednmjhdohclojfahpjabgjmmegojbef`).
Agrega atajos de teclado para mutear/solear pistas en el stem player de Moises.ai.

## Chrome Web Store

- Para **auditar el estado del store** (versión publicada vs local, borrador, listing,
  privacidad) o **publicar una versión nueva**, usá la skill del repo: `/store-check`
  (`.claude/skills/store-check/SKILL.md`). Ahí están el protocolo completo, las
  constantes y las reglas duras (p. ej. "Enviar a revisión" siempre requiere
  confirmación explícita del usuario).
- El dashboard del CWS se opera con el servidor MCP `cws-browser` (definido en
  `.mcp.json`), que usa un perfil de browser persistente en
  `~/.local/share/moises-kbd/cws-profile` con la sesión de Google del store
  (gutitrombotto@gmail.com). No usar otros perfiles de Playwright para esto.
- Las fuentes de verdad del listing viven en `store-assets/` — el dashboard debe
  reflejarlas, nunca al revés.

## Referencias del repo

- `SPECS.md` — especificación del producto (arquitectura de iframe, detección DOM,
  modelo de teclado, taxonomía de toasts); `ROADMAP.md` — estado y plan por fases.
- `store-assets/SUBMISSION_CHECKLIST.md` — checklist de publicación en el CWS.
- Convenciones de código en `CODESTYLE.md`. Lint: `pnpm lint`; tests: `pnpm test`;
  build/paquete del store: `pnpm zip` (deja el ZIP en `.output/`).
- Los archivos legacy de v1.3 (`manifest.json`, `config.js`, `content.js`, `docs/`,
  `scripts/`) quedan hasta cerrar la validación manual de ROADMAP §M5 — no tocarlos.
