# afl-data-report

A simple showcase site for AFL infographic carousels and data reports, published with GitHub Pages.

## 🔗 The site (one link)

**https://dough1e.github.io/afl-data-report/**

Open the link and click around — no GitHub knowledge needed:

- **Infographic carousels** → tap any cover to swipe through the slides
- **Data reports** → the Hawthorn 2026 season report

## What's here

```
index.html                 The whole site — links to everything
carousels.json             Manifest — add an entry to add a carousel
social/<slug>/slide_NN.png Carousel slides
assets/css, assets/js      Styling + the lightbox viewer
Hawthorn_2026_Report.html  Standalone data report
tools/                     Deferred Instagram archive puller (see below)
```

## Adding a carousel

1. Drop the slides in `social/<your-slug>/` as `slide_01.png`, `slide_02.png`, …
2. Add an entry to `carousels.json` with `id`, `title`, `blurb`, `tag`, `dir`
   (`"social/<your-slug>"`), `cover` and `slides`.
3. Commit and push — GitHub Pages redeploys automatically.

## Instagram archive (deferred)

`tools/fetch_instagram.py` pulls the live @puntedit media via the Meta Graph API once a fresh
access token is available. See **`tools/INSTAGRAM_TOKEN_HOWTO.md`** to mint the token, then run the
script to download images/videos into `social/instagram/` and append them to `carousels.json`.
