# Polar for Canvas

A Chrome/Firefox extension that re-skins **Canvas LMS** with **Polar's**
monochrome design system — Night/Ash/Mist/Snow surfaces, a single Ether accent,
and Neue Montreal / Geist Mono typography.

Built with [WXT](https://wxt.dev).

```
Night   #171717  Surface
Ash     #1D1D1D  Raised
Mist    #7b7b7b  Secondary
Snow    #BDBDBD  Foreground
Ether   #3619CC  Accent  — reserved for energy
```

## What it does

- Repaints every Canvas surface from white to **Night**, raising cards/panels to **Ash**.
- Retires Canvas's per-course rainbow: dashboard cards become a uniform neutral
  system with a thin **Ether** seam.
- Re-themes Canvas's own framework by overriding its `--ic-brand-*` variables, so
  branded buttons, links, and the global nav follow Polar without per-element hacks.
- Routes the **Ether** accent to the things that carry energy: the active nav item,
  primary actions, focus rings, unread badges.
- Sets **Geist Mono** (with tabular figures) on grades, points, and code.
- Works on Instructure-hosted Canvas **and** custom school domains (e.g.
  `canvas.okstate.edu`) — the content script fingerprints Canvas before applying.
- Toggle on/off from the popup; the preference syncs across devices.

## Install (development)

```bash
npm install
npm run dev          # Chrome, with HMR
npm run dev:firefox  # Firefox
```

`npm run dev` launches a browser with the extension loaded. Open any Canvas page.

## Build / package

```bash
npm run build         # → .output/chrome-mv3
npm run build:firefox # → .output/firefox-mv2
npm run zip           # store-ready zip
```

To load the production build manually: `chrome://extensions` → enable Developer
mode → **Load unpacked** → select `.output/chrome-mv3`.

## How it's wired

| File | Role |
| --- | --- |
| `wxt.config.ts` | Manifest: `storage` permission, host permissions, web-accessible CSS. |
| `entrypoints/content.ts` | Detects Canvas, injects the stylesheet, toggles the `polar-active` root class from storage. |
| `public/polar.css` | The full Polar theme. All rules are scoped under `html.polar-active`, so toggling is instant and the file is inert on non-Canvas pages. |
| `entrypoints/popup/` | Polar-styled on/off control with a live palette. |
| `public/icon/` | Extension icons. |

The stylesheet ships as a web-accessible resource and is injected **only** when a
page is detected as Canvas, so it never touches unrelated sites even though the
content script is registered broadly (needed to reach custom domains).

## Custom Canvas domains

Common patterns (`*.instructure.com`, `canvas.<school>.edu`) are detected
automatically. Other custom domains are matched by a DOM fingerprint (Canvas's
`.ic-app-header` / CSRF meta). If your school uses an unusual hostname and the
theme doesn't apply, open an issue with the domain.

## Typography note

**PP Neue Montreal** is a commercial typeface and is not bundled; the theme falls
back to **Inter**. **Geist Mono** is open and loaded from Google Fonts at runtime
(best-effort — some Canvas CSP configurations may block it, in which case the
system monospace is used).

## Known limitations

A few of Canvas's newer React/InstUI controls render their color into hashed
"emotion" class names with no stable selector (e.g. the green *Show by Date*
segmented toggle and some collapsible section headers on the Assignments index).
These keep their default styling. Everything structural — layout, nav, cards,
tables, forms, modals, calendar, inbox, files — is fully themed.
