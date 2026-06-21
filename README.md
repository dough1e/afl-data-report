# afl-data-report

AFL data work by **Punted It** — Instagram carousels and club data reports, published as a small static site.

## 🔗 Browse it (one link)

**https://dough1e.github.io/afl-data-report/**

No GitHub knowledge needed — open the link and click around:

- **Social Media** → swipeable gallery of the Instagram carousels
- **Reports** → the Hawthorn 2026 data report

## What's here

```
index.html                 Landing / navigation hub
social/index.html          Carousel gallery (data-driven)
social/carousels.json      Manifest — add an entry to add a carousel
social/<slug>/slide_NN.png Carousel slides
assets/css, assets/js      Styling + the lightbox viewer
Hawthorn_2026_Report.html  Standalone data report (unchanged)
tools/                      Deferred Instagram archive puller (see below)
```

## Adding a carousel

1. Drop the slides in `social/<your-slug>/` as `slide_01.png`, `slide_02.png`, …
2. Add an entry to `social/carousels.json` (`slug`, `title`, `blurb`, `tag`, `cover`, `slides`).
3. Commit and push — GitHub Pages redeploys automatically.

## Instagram archive (deferred)

`tools/fetch_instagram.py` pulls the live @puntedit media via the Meta Graph API once a fresh
access token is available. See **`tools/INSTAGRAM_TOKEN_HOWTO.md`** for how to mint the token,
then run the script to download images/videos and append them to the gallery.
