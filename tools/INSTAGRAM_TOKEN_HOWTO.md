# Minting a fresh Instagram access token

The puller (`fetch_instagram.py`) needs a valid **Instagram Graph API** access token. The token
previously stored in the AFL Social Media v2 `.env` **expired on 2026-05-03** (`OAuthException` 190),
so you need a new one. This takes ~5 minutes.

You only need this for the **Instagram archive pull** — the rest of the site already works without it.

## What you already have

- **Instagram user ID:** `17841442146561009` (@puntedit) — the script defaults to this.
- A Meta app + the @puntedit Instagram Business account linked to a Facebook Page (used previously).

## Option A — Graph API Explorer (fastest, ~60-day token)

1. Go to **https://developers.facebook.com/tools/explorer/**
2. Top-right: select your **Meta app** from the dropdown.
3. Click **Generate Access Token** / **Get Token → Get User Access Token**.
4. Tick these permissions, then confirm:
   - `instagram_basic`
   - `pages_show_list`
   - `pages_read_engagement`
   - (optional, for the engagement sync tool) `instagram_manage_insights`
5. Complete the Facebook login/consent popup. A token string appears in the box — **copy it**.
6. (Recommended) Extend it to a long-lived (~60-day) token at
   **https://developers.facebook.com/tools/debug/accesstoken/** → paste → **Extend Access Token**.

## Option B — exchange for a long-lived token via the API

If you have the app ID + secret, swap a short-lived token for a 60-day one:

```
https://graph.facebook.com/v19.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id=<APP_ID>
  &client_secret=<APP_SECRET>
  &fb_exchange_token=<SHORT_LIVED_TOKEN>
```

## Use the token

Either set an environment variable:

```powershell
# Windows PowerShell
$env:IG_ACCESS_TOKEN = "EAA...your token..."
```

…or create **`tools/.env`** (already git-ignored) with one line:

```
IG_ACCESS_TOKEN=EAA...your token...
```

Then, from the repo root:

```
python tools/fetch_instagram.py --dry-run   # preview — writes nothing
python tools/fetch_instagram.py             # download + update the gallery manifest
git add social && git commit -m "Add Instagram archive" && git push
```

## Notes

- The script **skips posts already in the gallery**, so it won't duplicate the six carousels
  already published here.
- **Images** appear in the gallery immediately. **Video (Reel) slides** download as `.mp4` plus a
  poster frame; to make them play in the lightbox, add a `<video>` branch in `assets/js/viewer.js`
  (the `show()` function) — currently it renders `<img>` only. Happy to wire that up when you have
  videos to show.
- Tokens expire. If you see `OAuthException` code 190 again, repeat this process.
