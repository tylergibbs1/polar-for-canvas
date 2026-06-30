# Fonts

Drop bundled font files here. They're declared as `@font-face` in
`public/polar.css` and served from the extension origin, so no other wiring is
needed — just add the files and rebuild (`npm run build`).

If a file is absent, its `@font-face` fails silently and the theme falls back
(Inter for sans, Google-Fonts Geist Mono for mono).

## Expected filenames

### PP Neue Montreal — commercial, supply your own license
Buy/license from Pangram Pangram, then export WOFF2 as:

```
PPNeueMontreal-Book.woff2       (weight 400)
PPNeueMontreal-Medium.woff2     (weight 500)
PPNeueMontreal-SemiBold.woff2   (weight 600)
```

### Geist Mono — open (SIL OFL), free to bundle
Download from https://github.com/vercel/geist-font (or Google Fonts) and place:

```
GeistMono-Regular.woff2         (weight 400)
GeistMono-Medium.woff2          (weight 500)
```

Once Geist Mono is bundled here you can drop the Google Fonts `<link>` from
`entrypoints/content.ts` if you want zero external requests.
