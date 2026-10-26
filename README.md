# Instagram Downloader

A free **Instagram downloader** for public **videos, reels, photos, carousels and stories** — use it two ways:

- **Telegram bot:** [@instagram_media_downloader_bot](https://t.me/instagram_media_downloader_bot) — paste a link, get the media back.
- **Web:** [downloader.herascrape.com](https://downloader.herascrape.com) — paste a link, click Download.

Both are free and handle **public** Instagram content only.

## What it does

Paste any public Instagram link and get the original-quality file:

| Link | You get |
| --- | --- |
| `instagram.com/reel/…` | the reel video (MP4) |
| `instagram.com/p/…` | the photo or video |
| a carousel post | every item, or all of them as a `.zip` |
| `instagram.com/stories/…` | the story (while it is live) |

## This repository

This repo is the **web front end** — the Cloudflare Worker that serves the page and streams your download straight from Instagram's CDN at the edge (same-origin, so you get a real "Save As" with a clean filename, and no file ever passes through a slow middle box).

Resolution runs on the hosted **[herascrape](https://herascrape.com)** Instagram API, so this front end points at that backend rather than scraping anything itself. If you want to pull Instagram data at scale, into your own product, that is exactly what herascrape is for.

```
browser ──▶ Cloudflare Worker (this repo) ──▶ herascrape (resolve) 
   ▲                │
   └── media bytes ◀┘  (streamed from Instagram's CDN at the edge)
```

## Develop

```bash
npm install
npm run typecheck     # tsc --noEmit
npm run dev           # wrangler dev
```

Configure before deploying:

- `TURNSTILE_SITE_KEY` (var) and `RESOLVE_SERVICE_URL` (var) in `wrangler.toml`.
- `DOWNLOAD_SIGNING_SECRET` (secret) shared with the backend: `wrangler secret put DOWNLOAD_SIGNING_SECRET`.

```bash
npm run deploy
```

## Limits

The web tool and the bot are rate-limited and verify a human check — they are for grabbing a handful of links, not bulk scraping. For unlimited, programmatic access use the [herascrape API](https://herascrape.com).

## License

MIT.
