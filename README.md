# World Cup 2026 Sweepstake

Office sweepstake tracker for the 2026 FIFA World Cup. Ingests team/name assignments from a Google Sheet and polls live stats to show current novelty prize leaders.

## Novelty prizes tracked automatically

| Prize | Description |
|-------|-------------|
| 🟨 Card King | Team with the most cards (yellow + red×2) |
| ✈️ First Out | First team eliminated from the tournament |
| 🚀 Long-Range Rocket | Furthest-distance goal scored (manual entry) |
| 😬 Unlucky OG | Team with the most own goals conceded |
| 👟 Golden Boot Nation | Team of the tournament's top scorer |

## Stack

- **Next.js 15** — frontend + API routes
- **Neon** — PostgreSQL database
- **Railway** — hosting
- **football-data.org** — live match stats (free tier)
- **Google Sheets** — participant draw data

## Setup

### 1. Database

Run `migrations/001_initial.sql` against your Neon database to create the schema.

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
DATABASE_URL       — Neon connection string
FOOTBALL_DATA_API_KEY — football-data.org key (free at football-data.org/client/register)
SYNC_SECRET        — any secret string used to authenticate sync calls
ADMIN_PASSWORD     — password for the /admin page
```

### 3. Run locally

```bash
npm install
npm run dev
```

### 4. Deploy to Railway

1. Push this repo to GitHub
2. Create a new Railway project → deploy from GitHub
3. Add the four environment variables above in Railway's Variables tab
4. Railway auto-detects Next.js and builds/deploys

### 5. Initial data sync

Once deployed, trigger the first sync from the `/admin` page (or via curl):

```bash
curl -X POST https://your-railway-url/api/sync \
  -H "x-sync-key: YOUR_SYNC_SECRET"
```

This pulls team names from the Google Sheet and live stats from the football API.

### 6. Keeping stats fresh

Set up a Railway Cron job (or any cron service) to hit `/api/sync` every 15 minutes during the tournament:

```
*/15 * * * *  curl -X POST https://your-url/api/sync -H "x-sync-key: YOUR_SECRET"
```

## Admin panel

Visit `/admin` to:
- Trigger a manual sync
- Set the **Longest Range Shot** leader (team name + description, e.g. `38.2m — Rüdiger vs USA`)

## Google Sheet format

The sheet must be published as CSV with two columns:
- Column A: **Team** (country name, matching the spreadsheet exactly)
- Column B: **Name** (participant — fill in after the draw)
