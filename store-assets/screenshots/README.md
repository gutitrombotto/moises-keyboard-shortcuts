# Store screenshots

Ten images, 1280×800, five slots per locale. Regenerate with `generate.mjs` rather than
editing by hand.

```bash
mkdir -p /tmp/shots-workdir && cd /tmp/shots-workdir
npm init -y && npm i playwright@latest && npx playwright install chromium
node <repo>/store-assets/screenshots/generate.mjs /tmp/shots
cp /tmp/shots/en/*.png <repo>/store-assets/screenshots/en/
cp /tmp/shots/es/*.png <repo>/store-assets/screenshots/es/
```

Unlike Cartly, this extension has no UI page to capture and the real player sits behind
a Moises login, so the slides are **composed frames**: a benefit headline, real-looking
keycaps, and a stylized replica of the player's track list. The toast is a pixel-faithful
replica of the one in `src/lib/toast` (same copy strings, colors, and placement). Nothing
in the frames claims to be a raw screenshot of Moises' UI — the track list is deliberately
schematic (waveform bars + MUTE/SOLO pills) to avoid misrepresenting their product.

## Slots

| Slot         | Shows                                      | Why                                                      |
| ------------ | ------------------------------------------ | -------------------------------------------------------- |
| `01-hero`    | V/D/B/O keycaps, Vocals muted in the list  | The one-keypress promise                                 |
| `02-solo`    | Shift+D keycaps, Drums soloed, rest dimmed | The second half of the feature set (solo)                |
| `03-toast`   | The real toast copy "Vocals mute toggled"  | Feedback: nothing fails silently                         |
| `04-safety`  | Focused search input, Ctrl+V keycaps       | Input safety — the objection every keyboard tool gets    |
| `05-privacy` | Lock badge, "0 REQUESTS"                   | Zero data / zero network — the listing's strongest claim |

Each locale has its own headline copy (`COPY` in the script); the ES copy is voseo
rioplatense, matching `store-assets/listing/es.md`.
