# Hong Kong 02

A hyper-realistic satirical **"fake news"** portal for media-literacy education, styled to
match the **Hong Kong 02** Figma design (brand blue `#1428E8`, Arial Black wordmark, Noto Sans HK,
Top Story / Latest Updates / More Top Stories layout). It pulls **live market indices from
CNN Markets**, and when students try to *share* or *verify* a story, it breaks the illusion
with the **AI Ethics Inspector**.

> ⚠️ All articles are **fictional** and exist solely for teaching media literacy, AI safety,
> misinformation and ethical responsibility.

---

## Quick start (zero dependencies)

```bash
node server.js            # default port 3000
node server.js 8080       # or any other port
```

| Page | URL |
|---|---|
| News homepage | http://localhost:3000/ |
| Terms of Use | http://localhost:3000/terms.html |
| About Us | http://localhost:3000/about.html |
| Contact Us | http://localhost:3000/contact.html |
| Article + AI Inspector | http://localhost:3000/article.html?slug=kowloon-east-traffic-llm |
| Educator dashboard | http://localhost:3000/dashboard.html |

Requires Node.js only — no `npm install`.

---

## What the homepage does

- **Header** — Hong Kong 02 wordmark, "In Hong Kong, with Hong Kong" tagline and a live **HKT clock**.
- **Market strip** — real indices (Hang Seng, Dow, S&P 500, Nasdaq, Nikkei, Shanghai, FTSE,
  DAX, KOSPI, ASX, Taiwan, Sensex) fetched server-side from CNN Markets and shown in a slow,
  hover-pausable marquee.
- **Latest Updates** — five numbered headlines in a 5-column grid.
- **More Top Stories** — an image card for every story (tag / headline / date).
- **Footer** — dark band with links to Terms of Use, About Us and Contact Us.

## The "gotcha" (educational payoff)

The stories themselves never mention AI — they read like ordinary sensational WhatsApp/forum
forward-bait. When a reader clicks **Share to WhatsApp**, **Share to Facebook** or **Share to
Threads**, the share is intercepted and an **educational popup** appears instead, with a bold
warning followed by "The AI Ethics Connection" breakdown of the manipulation technique.

Comments are seeded English reader reactions; a **random number of extra comments** appear
each time an article is opened again, simulating a live thread. Posting a comment just adds
your comment — no automated bot reply.

## Educator analytics

Every interaction (views, share/verify clicks, reveals, comments) is tracked by browser
session and surfaced at `/dashboard.html`: total sessions, "fell for it" count, reveal rate,
per-article breakdown and a live event feed. Data persists to `data/store.json`; use
**Reset data** on the dashboard for a fresh class run.

---

## Project structure

```
hk-tech-post/
├── server.js               # zero-dependency Node server (static + JSON API + store)
├── data/
│   ├── articles.js         # 9 fictional STEAM articles (EN + 中文) + AI provenance
│   └── store.json          # runtime analytics (generated)
└── public/
    ├── index.html          # Hong Kong 02 homepage
    ├── terms.html          # Terms & Conditions
    ├── about.html          # About Us
    ├── contact.html        # Contact Us
    ├── article.html        # article detail + AI Ethics Inspector
    ├── dashboard.html      # educator analytics
    ├── css/hk02.css        # marquees (market 180s, breaking 60s)
    ├── css/style.css       # article / inspector / dashboard components
    ├── js/core.js          # session id, API helpers
    ├── js/app.js           # homepage rendering
    ├── js/article.js       # article + inspector + comments
    ├── js/dashboard.js     # analytics rendering
    └── images/             # About-page photos
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/articles` | List articles |
| GET | `/api/articles/:slug` | One article |
| GET | `/api/comments/:slug` | Seeded + user comments |
| POST | `/api/comments/:slug` | Post comment → returns user + instant bot reply |
| GET | `/api/ticker` | Real market indices (CNN Markets, cached 60s) |
| GET | `/api/weather` | Weather widget |
| POST | `/api/events` | Record an interaction |
| GET | `/api/analytics` | Aggregated educator metrics |
| POST | `/api/reset` | Clear all interaction data |

## Design notes

- Brand colour `#1428E8` (dark `#0C197F`), logo = "Hong Kong 02" in Arial Black.
- Typeface: **Noto Sans HK**.
- Pages use Tailwind (CDN) with a small custom CSS file for the marquees.
- Content is 9 STEAM fake-news articles (English display) placed into the Hong Kong 02 layout;
  the original Chinese is retained in `data/articles.js`.

## The 9 stories (all fictional)

| Type | Slug | Headline |
|---|---|---|
| S | `dark-mode-retina-damage` | WhatsApp dark mode causes permanent retina damage |
| T | `octopus-bluetooth-hack` | Octopus Bluetooth glitch drains your bank account |
| S | `super-typhoon-omega` | Super Typhoon "Omega" — Observatory hiding trajectory |
| T | `exploding-earbuds` | Exploding wireless earbuds hospitalise 3 students |
| S | `plastic-eating-bacteria-water` | Mutant plastic-eating bacteria in Kowloon tap water |
| T | `instagram-hk-slang-ban` | Instagram to auto-ban accounts using HK slang |
| S | `infinite-battery-salt-water` | HKU student's "infinite battery" suppressed |
| T | `west-kowloon-wifi-photos` | Station Wi-Fi secretly downloads your photos |
| S | `sai-kung-meteorite` | NASA: meteorite debris to hit Sai Kung tonight |

Images are real Wikimedia Commons photographs stored in `public/images/` (see
[`public/images/CREDITS.md`](public/images/CREDITS.md) for sources). Swap `image.src` in
`data/articles.js` with your own Gen-AI images at any time.
