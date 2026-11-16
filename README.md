# VoteBoxApp — Official Website

Source for [voteboxapp.org](https://voteboxapp.org), the public marketing site
for VoteBoxApp — an open-source, blockchain-based direct democracy platform.

## What it is

A single static HTML page (Tailwind CSS via CDN, vanilla JS, no build step)
covering VoteBoxApp's mission, features, and roadmap. Hosted on GitHub Pages
with a custom domain.

## Structure

```
voteboxapp-website/
├── index.html   # The entire site
├── images/      # Logos and graphics
├── CNAME        # Custom domain config (voteboxapp.org)
└── LICENSE
```

## Local development

Just open `index.html` in a browser — no build step, no dependencies to
install.

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
