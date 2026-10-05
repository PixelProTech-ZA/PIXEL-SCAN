# PIXEL SCAN

**Scan your digital life. Know what needs attention.**
A personal security diagnostic by PixelProTech Solutions (Pty) Ltd, built as an offline-capable PWA.

PIXEL SCAN never fakes a result. It separates three kinds of check:

| Kind | Meaning |
|---|---|
| **Direct check** | Tested by the app itself from the browser, with the evidence shown |
| **Guided check** | The browser cannot see this area, so the app shows exactly where to look |
| **User confirmation** | The user reports what they found. Recorded as *user-reported*, never as verified |

It is not antivirus and does not detect malware. Nothing leaves the device: no accounts, no analytics, no network requests beyond loading its own files.

## Run locally

Service workers need `https` or `localhost`:

```
python3 -m http.server 8080
```

Open http://localhost:8080

## Deploy

Static files only, no build step. Serve this folder over HTTPS from the repo root: GitHub Pages, Netlify, Cloudflare Pages or any web server. `.nojekyll` is included for GitHub Pages.

## Files (flat on purpose)

| File | Purpose |
|---|---|
| `index.html` | App shell, strict Content-Security-Policy |
| `styles.css` | Pixel Grid design system and self-hosted `@font-face` rules |
| `app.js` | Checks, scan engine, report, learn, threat library, emergency response |
| `sw.js` | Offline cache. **Bump `VERSION` on every release** |
| `manifest.webmanifest` | Install metadata, icons, shortcuts (`#scan`, `#emergency`) |
| `icon-192.png` `icon-512.png` `icon-maskable-512.png` | PWA icons (any + maskable) |
| `apple-touch-icon.png` `favicon.ico` `favicon.svg` | iOS home screen and browser tab icons |
| `*.woff2` | JetBrains Mono and Silkscreen (SIL Open Font License), self-hosted so it works offline |
| `generate-icons.py` | Regenerates every icon (`pip install pillow`) |

## Palette

`#07070a` base · `#1a1a22` / `#1c1c26` panels · `#00d4aa` teal (main accent) · `#7b2fff` violet (rare) · `#d8b96a` gold (rare, "needs attention") · `#ff8a3d` high priority · `#ff4d5e` critical · `#f1eefa` text

## Maintaining the checks

Guided checks live in the `GUIDED` array in `app.js`. Each defines its click path, why it matters, what good looks like, a fix, and a fixed severity with a stated reason. Settings menus change with OS and router updates, so review the paths regularly. Severities are deliberately fixed per check and explained in the report, never calculated into a score.

## Adding a file

When you add or rename a file the app needs offline, add it to `FILES` in `sw.js` and bump `VERSION`.

---
PixelProTech Solutions (Pty) Ltd · Reg 2026/622131/07 · Gauteng, South Africa · pixelprotechsolutions.co.za
