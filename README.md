# World Cup 2026 Sweepstake

A multi-tenant sweepstake platform for the 2026 FIFA World Cup. Each group (office, family, etc.) runs their own independent sweepstake under a unique code. The app tracks live tournament stats and automatically determines novelty prize leaders.

## Architecture

### Pages

| Route | Description |
|---|---|
| `/` | Sweepstake dashboard — requires `?code=YOURCODE`. Shows prize leaders, group standings, and participant assignments. Names are hidden until everyone has claimed, or tournament kick-off. |
| `/setup` | Self-service registration — creates a new sweepstake and redirects to the manage page. |
| `/manage?code=X` | Organiser panel — assign participants to teams, set ticket price, generate QR codes, reset the draw. Password-protected per sweepstake. |
| `/print?code=X` | Printable A4 sheet — 48 ticket cards (with QR codes) plus a draw register. |
| `/advert?code=X` | Display/poster page for sharing. |
| `/claim/[token]` | QR claim page — participants scan their printed ticket to enter their name against their team. |
| `/admin` | Global admin panel — manage all sweepstakes, trigger stats sync, apply global prize overrides. Requires `ADMIN_PASSWORD`. |

### Data model (PostgreSQL / Neon)

| Table | Scope | Description |
|---|---|---|
| `companies` | global | One row per sweepstake group. Holds the short code, name, bcrypt admin password, email, and optional ticket price. |
| `participants` | per company | 48 rows per company (one per team). Stores the participant name once claimed, plus a UUID claim token for QR codes. |
| `team_stats` | shared | Cards, own goals, goals conceded, elimination status — refreshed on every sync. Shared across all companies. |
| `group_standings` | shared | Group table positions — refreshed on sync. |
| `top_scorer` | shared | Single-row table for the current tournament top scorer. |
| `prize_overrides` | per company | Manual overrides for prizes that can't be derived automatically (longest shot, bicycle kick, etc.). |
| `squad_cache` | shared | Player names, positions, photos, and club data from the football API. TTL of 90 days once photos exist, 2 hours if not yet available. |
| `sessions` | global | Server-side sessions for admin and per-company organiser logins. 7-day TTL. |
| `audit_log` | global | Audit trail of significant actions (logins, resets, etc.). |
| `sync_log` | global | Record of each stats sync with outcome and details. |
| `password_resets` | global | Time-limited (1 hour) tokens for organiser password resets via email. |

### Stats sync

`POST /api/sync` (authenticated with `SYNC_SECRET`) or `POST /api/cron` (authenticated with `CRON_SECRET`) pulls from [football-data.org](https://www.football-data.org) and updates all shared tables:

1. Fetches finished matches, top scorers, and group standings in parallel
2. Computes card totals, own goals, goals conceded, and eliminations from match data
3. Upserts `team_stats` and `group_standings`
4. Updates the `top_scorer` row
5. Logs the sync result to `sync_log`

During the tournament this should run every 15 minutes (Railway cron or equivalent).

### Authentication

- **Global admin** — single shared `ADMIN_PASSWORD` env var, verified at `POST /api/admin/verify`. Issues an `admin_session` cookie (7-day server-side session).
- **Organiser (per company)** — bcrypt password stored per company in the database. Issues a `manage_session` cookie scoped to that company's ID.
- **Participant claim** — one-time UUID token embedded in the printed QR code. No login required; the token is consumed when the participant enters their name.
- **Rate limiting** — login endpoints are rate-limited to 10 attempts per 15 minutes per IP.

### Novelty prizes

Prizes are computed by `lib/prizes.ts` from the shared `team_stats`. Per-company overrides in `prize_overrides` take precedence.

| Prize | How determined |
|---|---|
| Card King | Most cards (yellow + red×2) |
| First Out | First team with `is_eliminated = true` |
| Long-Range Rocket | Manual entry by organiser (distance + description) |
| Unlucky OG | Most own goals conceded |
| Golden Boot Nation | Team of the tournament top scorer |
| Bicycle Kick | Manual entry by organiser (mystery prize) |
| Derby Day / Simunic | Additional mystery prizes, manually set |

### Flag images

Flag images are served from [flagcdn.com](https://flagcdn.com) as PNG files (e.g. `https://flagcdn.com/w40/fr.png`). Country-code mappings live in `lib/flags.ts`. This avoids relying on emoji rendering, which is unsupported for flag characters on Windows.

### External services

| Service | Purpose |
|---|---|
| [Neon](https://neon.tech) | Serverless PostgreSQL |
| [Railway](https://railway.app) | Hosting + cron jobs |
| [football-data.org](https://www.football-data.org) | Live match stats (free tier) |
| [flagcdn.com](https://flagcdn.com) | Flag images |
| [Resend](https://resend.com) | Email — password reset links and bug reports |

---

## Setup

### 1. Database

Run the migrations in order against your Neon database:

```bash
node scripts/migrate.mjs
```

Or apply them manually in `migrations/` from `001` to the latest.

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
DATABASE_URL             — Neon connection string
FOOTBALL_DATA_API_KEY    — football-data.org key (free tier covers World Cup)
SYNC_SECRET              — secret to authenticate POST /api/sync
CRON_SECRET              — secret to authenticate POST /api/cron
ADMIN_PASSWORD           — password for the global /admin page
RESEND_API_KEY           — for password reset emails and bug reports
NEXT_PUBLIC_BASE_URL     — public URL of your deployment (used in QR code links)
```

Optional:
```
FOOTBALL_SEASON          — defaults to 2026; set to 2022 to test against Qatar data
NEXT_PUBLIC_TROPHY_VIDEO_URL   — YouTube URL for trophy easter egg
NEXT_PUBLIC_VIDEO_OWN_GOAL     — YouTube URL for own goal easter egg
NEXT_PUBLIC_VIDEO_BICYCLE      — YouTube URL for bicycle kick easter egg
NEXT_PUBLIC_VIDEO_THUNDERBASTARD
NEXT_PUBLIC_VIDEO_ZIDANE
```

### 3. Run locally

```bash
npm install
npm run dev
```

### 4. Create your first sweepstake

Go to `/setup`, enter your group name and choose a short code (e.g. `ACME26`). This creates the company, seeds 48 participant rows, and redirects to the manage page where you can set a password and assign names.

Participants access the sweepstake at `/?code=ACME26`.

### 5. Deploy to Railway

1. Push this repo to GitHub
2. Create a new Railway project → deploy from GitHub
3. Add the environment variables in Railway's Variables tab
4. Railway auto-detects Next.js and builds/deploys

### 6. Keeping stats fresh

Set up a Railway Cron job (or any scheduler) to hit `/api/cron` every 15 minutes during the tournament:

```
*/15 * * * *  curl -X POST https://your-url/api/cron -H "x-cron-key: YOUR_CRON_SECRET"
```

Or use `/api/sync` with `x-sync-key` — both trigger the same sync logic.
