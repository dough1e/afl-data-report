#!/usr/bin/env python3
"""Pull the live @puntedit media archive from the Meta Graph API into this repo.

DEFERRED TOOL — run this once you have a fresh access token.
See tools/INSTAGRAM_TOKEN_HOWTO.md for how to mint the token (the one previously
in the AFL Social Media v2 .env expired on 2026-05-03).

Standard library only — no `pip install` required. Just Python 3.9+.

Usage (from the repo root):

    # 1. Put your fresh token somewhere the script can read it, either:
    #      set IG_ACCESS_TOKEN=...        (Windows)  /  export IG_ACCESS_TOKEN=...  (bash)
    #    or create tools/.env  with a line:  IG_ACCESS_TOKEN=EAA...
    #
    # 2. Preview what would be downloaded (no files written, no manifest changes):
    python tools/fetch_instagram.py --dry-run
    #
    # 3. Do it for real:
    python tools/fetch_instagram.py

Images drop straight into the gallery. Each post becomes a carousel under
social/instagram/<date>-<id>/ and is appended to social/carousels.json (skipping
any slug already present, so it never duplicates posts you've already added).
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://graph.facebook.com/v19.0"
DEFAULT_IG_USER_ID = "17841442146561009"  # @puntedit — already known, not a secret

REPO_ROOT = Path(__file__).resolve().parent.parent
SOCIAL_DIR = REPO_ROOT / "social"
IG_DIR = SOCIAL_DIR / "instagram"
MANIFEST = SOCIAL_DIR / "carousels.json"

MEDIA_FIELDS = (
    "id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,"
    "children{media_url,media_type,thumbnail_url}"
)


def load_token() -> str:
    """Token from $IG_ACCESS_TOKEN, else tools/.env, else fail with guidance."""
    tok = os.environ.get("IG_ACCESS_TOKEN", "").strip()
    if tok:
        return tok
    env = Path(__file__).resolve().parent / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            if line.startswith("IG_ACCESS_TOKEN="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit(
        "No IG_ACCESS_TOKEN found.\n"
        "Set the env var or create tools/.env with IG_ACCESS_TOKEN=...\n"
        "See tools/INSTAGRAM_TOKEN_HOWTO.md."
    )


def api_get(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=60) as resp:  # noqa: S310 (trusted host)
        data = json.loads(resp.read().decode("utf-8"))
    if "error" in data:
        e = data["error"]
        sys.exit(f"Graph API error {e.get('code')}: {e.get('message')}")
    return data


def list_media(user_id: str, token: str) -> list[dict]:
    """Paginate through every post on the account."""
    items: list[dict] = []
    q = urllib.parse.urlencode({"fields": MEDIA_FIELDS, "limit": 100, "access_token": token})
    url = f"{API}/{user_id}/media?{q}"
    while url:
        page = api_get(url)
        items.extend(page.get("data", []))
        url = page.get("paging", {}).get("next", "")
    return items


def slugify(text: str, fallback: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    s = "-".join(s.split("-")[:6])  # keep it short
    return s or fallback


def download(url: str, dest: Path, dry: bool) -> bool:
    if dry:
        print(f"      would download -> {dest.name}")
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=120) as r:  # noqa: S310
        dest.write_bytes(r.read())
    print(f"      saved {dest.name}")
    return True


def child_units(post: dict) -> list[dict]:
    """Normalise a post into a list of {url, kind} download units."""
    mt = post.get("media_type")
    if mt == "CAROUSEL_ALBUM":
        out = []
        for ch in post.get("children", {}).get("data", []):
            is_vid = ch.get("media_type") == "VIDEO"
            out.append({"url": ch.get("media_url"), "kind": "video" if is_vid else "image",
                        "poster": ch.get("thumbnail_url")})
        return out
    if mt == "VIDEO":
        return [{"url": post.get("media_url"), "kind": "video", "poster": post.get("thumbnail_url")}]
    return [{"url": post.get("media_url"), "kind": "image", "poster": None}]


def main() -> None:
    ap = argparse.ArgumentParser(description="Pull @puntedit media into the gallery.")
    ap.add_argument("--user-id", default=os.environ.get("IG_USER_ID", DEFAULT_IG_USER_ID))
    ap.add_argument("--dry-run", action="store_true", help="show what would happen; write nothing")
    args = ap.parse_args()

    token = load_token()
    posts = list_media(args.user_id, token)
    print(f"Found {len(posts)} posts on the account.\n")

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {"carousels": []}
    existing = {c["slug"] for c in manifest.get("carousels", [])}
    added = 0

    for post in posts:
        date = (post.get("timestamp") or "")[:10]
        cap = (post.get("caption") or "").splitlines()
        title = cap[0][:80] if cap else "Instagram post"
        slug = f"ig-{date}-{slugify(title, post['id'][-6:])}"
        if slug in existing:
            print(f"· skip (already in gallery): {slug}")
            continue

        units = [u for u in child_units(post) if u.get("url")]
        if not units:
            print(f"· skip (no media url): {slug}")
            continue

        print(f"+ {slug}  ({len(units)} item(s), {post.get('media_type')})")
        slides: list[str] = []
        for i, u in enumerate(units, 1):
            ext = "mp4" if u["kind"] == "video" else "png"
            name = f"slide_{i:02d}.{ext}"
            if download(u["url"], IG_DIR / slug / name, args.dry_run):
                slides.append(name)
            # save a poster frame for videos so the gallery has a thumbnail
            if u["kind"] == "video" and u.get("poster"):
                download(u["poster"], IG_DIR / slug / f"slide_{i:02d}_poster.png", args.dry_run)

        cover = next((s for s in slides if s.endswith(".png")), slides[0])
        manifest["carousels"].append({
            "slug": f"instagram/{slug}",
            "title": title,
            "blurb": (cap[0] if cap else "")[:140],
            "tag": f"Instagram · {date}",
            "permalink": post.get("permalink"),
            "cover": cover,
            "slides": slides,
        })
        existing.add(slug)
        added += 1

    if args.dry_run:
        print(f"\n[dry-run] {added} new post(s) would be added. Nothing written.")
        return

    manifest["updated"] = max((c.get("tag", "")[-10:] for c in manifest["carousels"]), default="")
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\nDone. Added {added} post(s). Review social/carousels.json, then commit + push.")
    print("Note: video slides (.mp4) need the small <video> tweak in viewer.js noted in the HOWTO.")


if __name__ == "__main__":
    main()
