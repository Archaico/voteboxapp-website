# VoteBoxApp — Official Website

Source for [voteboxapp.org](https://voteboxapp.org), the public marketing site
for VoteBoxApp — an open-source, blockchain-based direct democracy platform.

## What it is

Static HTML pages (vanilla JS) covering VoteBoxApp's mission, features,
roadmap and concept designs. Hosted on GitHub Pages with a custom domain.

The site loads nothing from other servers: no CDNs, no Google Fonts, no
trackers. Tailwind CSS, the Lucide icons, Chart.js and the fonts are served
from `assets/`.

## Structure

```
voteboxapp-website/
├── index.html, *.html   # The pages (English is the source)
├── de/ fr/ es/ … zh/    # Generated translations — don't edit
├── assets/              # Self-hosted CSS, JS and fonts — generated
├── i18n/                # Site tools (translations, assets)
├── images/              # Logos and graphics
├── CNAME                # Custom domain config (voteboxapp.org)
└── LICENSE
```

## Local development

The pages use paths like `/assets/...`, so view them through a local server
rather than by opening the file:

```
python -m http.server 8765    # then open http://localhost:8765
```

## Self-hosted assets

After adding Tailwind classes or Lucide icons to `index.html`, rebuild:

```
cd i18n
npm install       # first time only
npm run assets    # tailwind.css, icons.js, chart.umd.js
npm run build     # then refresh the translated copies
```

`npm run fonts` re-copies the Google Fonts used by bounty.html and vision.html
(only needed if a page's fonts change; edit the list in `i18n/fonts.js`).

## Translations

The home page, Get the App and How It Works are also published in German,
French, Spanish, Portuguese, Italian, Dutch, Swahili and Chinese, under
`/de/`, `/fr/`, `/es/`, `/pt/`, `/it/`, `/nl/`, `/sw/` and `/zh/`. These
folders are generated: always edit the English pages, never the copies.

After changing English text on a translated page:

```
cd i18n
npm install      # first time only
npm run check    # lists every sentence that needs translating again
```

Add the missing translations to `i18n/<language>.json` (each entry's ID and
English text are in `i18n/en-strings.json`), then run `npm run build` to
regenerate the copies and the language menu. Settings, the page list and
text that stays the same in every language are in `i18n/languages.json`.

## Related repos

- [VoteBoxApp](https://github.com/Archaico/VoteBoxApp) — the mobile app
- [voteboxapp-vote](https://github.com/Archaico/voteboxapp-vote) — the
  proposal-sharing landing page at `vote.voteboxapp.org`

---
AGPLv3 — LifeGround Community
