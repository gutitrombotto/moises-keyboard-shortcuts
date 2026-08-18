---
name: store-check
description: Audita el estado de Moises Keyboard Shortcuts en el Chrome Web Store (versión publicada vs local, borrador, listing, privacidad) y ejecuta los pasos de publicación de una versión nueva hasta dejar el borrador listo para enviar a revisión. Usar cuando el usuario pida revisar/verificar/auditar la extensión en el store, comparar versiones, o publicar/actualizar la versión del CWS.
---

# Store check — auditoría y publicación de Moises Keyboard Shortcuts en el Chrome Web Store

Protocolo por fases con salida temprana: hacé solo las fases necesarias. La Fase 1 no
requiere login; las siguientes sí (browser `cws-browser` con perfil persistente).

## Constantes

| Qué             | Valor                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| ID del ítem     | `oednmjhdohclojfahpjabgjmmegojbef`                                                                                           |
| Listing público | `https://chromewebstore.google.com/detail/moises-keyboard-shortcuts/oednmjhdohclojfahpjabgjmmegojbef`                        |
| Dashboard       | `https://chrome.google.com/webstore/devconsole` → ítem → edit                                                                |
| Cuenta          | gutitrombotto@gmail.com                                                                                                      |
| Browser         | Servidor MCP `cws-browser` (definido en `.mcp.json` del repo), perfil persistente en `~/.local/share/moises-kbd/cws-profile` |

Fuentes de verdad en el repo (el dashboard debe reflejarlas, nunca al revés):

- Paquete: `.output/moises-keyboard-shortcuts-<versión>-chrome.zip` (generar con `pnpm zip` si falta)
- Descripciones: `store-assets/listing/en.md` y `es.md` (sección "Detailed description" / "Descripción detallada")
- Screenshots: `store-assets/screenshots/en/` y `es/`, 5 de 1280×800 por idioma
- Ícono: `store-assets/icons/store-icon-128.png`
- Privacidad: `store-assets/permissions-justifications.md` (single purpose, justificación de los 2 host permissions, data types, remote code)
- Checklist de referencia: `store-assets/SUBMISSION_CHECKLIST.md`

## Reglas duras

1. **"Enviar a revisión" requiere confirmación explícita del usuario en la sesión actual.**
   Nunca lo hagas de forma autónoma, aunque el borrador esté perfecto. Al confirmar, dejá
   tildado "Publicar automáticamente después de que haya pasado la revisión" salvo pedido
   contrario.
2. **Si el estado del ítem es "Revisión pendiente", no toques el borrador.** Reportá el
   estado y frená. Cambios durante una review en vuelo pueden invalidarla.
3. **La declaración de datos (Uso de datos, pestaña Privacidad) solo se modifica mostrando
   antes el diff** contra `permissions-justifications.md` y con OK del usuario. Una
   declaración incorrecta es una violación de policy (false disclosure). La declaración
   correcta hoy: **ningún data type marcado** — la extensión no recolecta nada y hace
   cero solicitudes de red.
4. Guardá con "Guardar borrador" y verificá el snackbar "Se guardó el elemento" **antes**
   de cambiar de idioma de edición o navegar — los cambios sin guardar se pierden.
5. Al terminar, borrá los residuos de Playwright del repo: `rm -rf .playwright-mcp` y
   cualquier `.yml`/`.png` de snapshots que haya quedado en la raíz.

## Fase 0 — Estado local

1. Versión: `version` en `package.json` (y tag `v<versión>` en git).
2. ZIP: existe `.output/moises-keyboard-shortcuts-<versión>-chrome.zip`? Si no: `pnpm zip`.
3. Sanity del ZIP (sin browser): descomprimir en el scratchpad y verificar `manifest.json`
   (`version`, `name` = `__MSG_extName__`, los 2 host permissions, `all_frames: true`) y
   `_locales/{en,es}/messages.json` (extName = "Moises Keyboard Shortcuts").

## Fase 1 — Chequeo público (sin login)

WebFetch al listing público → versión publicada, nombre, idiomas, última actualización.

- **Publicado == local** → reportar "el store está al día" y terminar (salvo que el
  usuario haya pedido auditoría completa).
- **Publicado < local** → seguir a Fase 2.
- Ojo: la página pública puede cachear; el dato canónico es el del dashboard (Fase 2).

## Fase 2 — Auditoría del dashboard (con login)

Navegar con `cws-browser` a la URL del dashboard. **Si aterriza en `accounts.google.com`**:
la sesión expiró (o nunca se inició — este perfil arranca vacío) — pedirle al usuario que
se loguee en la ventana abierta (cuenta de las constantes) y esperar su confirmación. El
perfil persistente hace que esto ocurra solo la primera vez o tras expiración.

Revisar y reportar como tabla de paridad (dashboard vs repo):

1. **Estado del ítem** (header): Publicado / Revisión pendiente / Rechazado. Si es
   "Revisión pendiente" → regla dura 2.
2. **Paquete**: versión del Borrador vs local; idiomas detectados (con el paquete v1.4.0+
   deben ser "inglés, español"; v1.3 no shippeó `_locales` y el listing quedó con idioma
   "Spanish (Latin America)" y copy en inglés — normalizar al publicar); permisos (solo
   los 2 host permissions, sin API permissions).
3. **Ficha (listing)**, en ambos idiomas (dropdown "Idioma de edición actual"):
   descripción vs el `.md` correspondiente (una mención a "Open source" o al link del
   repo delata copy viejo de v1.3), categoría (Productivity), ícono, screenshots (5 por
   idioma).
4. **Privacidad**: single purpose, justificación de cada host permission, remote code =
   No, data types (regla dura 3: ninguno marcado), certificaciones firmadas, policy URL
   (`https://gutitrombotto.github.io/moises-keyboard-shortcuts/privacy.html`, servida por
   GitHub Pages desde `main:/docs` — verificar que devuelva 200 antes de cualquier envío).
5. **Distribución**: Sin costo, Pública, todas las regiones.

## Fase 3 — Publicación (cerrar gaps)

Solo si el usuario pidió publicar/actualizar. Antes de empezar: los blockers de
`SUBMISSION_CHECKLIST.md` §0 (policy URL rota, claim "open source", validación manual
de ROADMAP §M5) tienen que estar resueltos. Orden recomendado:

1. **Subir ZIP** (Paquete → Subir un nuevo paquete). El dropdown de idiomas del listing
   se construye con los `_locales` del ZIP subido — subir el paquete ANTES de tocar el
   listing ES.
2. **Descripciones**: pegar el texto de `listing/en.md` / `es.md` en el textarea
   "Descripción" de cada idioma. Guardar (regla dura 4) antes de cambiar de idioma.
3. **Screenshots**: el uploader acepta UN archivo por vez. Por cada una: click en la
   zona de subida → file chooser → subir → esperar a que desaparezca "Procesando…" →
   siguiente. Verificar 5/5 por idioma al final.
4. **Guardar borrador** y verificar con recarga de página que todo persistió.
5. **Enviar a revisión**: regla dura 1 — solo con confirmación explícita. Tras confirmar
   en el diálogo, verificar que el estado pase a "Revisión pendiente" y aparezca
   "Se envió el elemento".
6. Reportar al usuario: qué se cambió, estado final, y los pendientes post-aprobación de
   `SUBMISSION_CHECKLIST.md` § "After approval".

## Trampas conocidas

- El snapshot de accesibilidad a veces muestra el textarea de descripción vacío justo
  después de cargar la página; re-tomar el snapshot antes de concluir que falta contenido.
- Al cambiar el idioma de edición, los refs del snapshot cambian — re-snapshotear.
- "Enviar a revisión" aparece deshabilitado mientras hay cambios sin guardar: primero
  "Guardar borrador".
- Los campos "Título del paquete" y "Resumen del paquete" NO se editan en el dashboard:
  salen del manifest/`_locales` del ZIP. Solo la descripción larga y los assets se editan ahí.
- No usar el perfil default de Playwright ni el de Cartly (`~/.local/share/cartly/cws-profile`):
  dos sesiones sobre el mismo perfil se pisan. Usar siempre `cws-browser` de este repo
  (`~/.local/share/moises-kbd/cws-profile`).
