# Narrive

Narrive is an AI-powered investment research report MVP built with Next.js App Router, TypeScript, Tailwind CSS, shadcn-style UI primitives, Prisma, PostgreSQL, TanStack Query, Zod, and Recharts.

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env`:

```bash
cp .env.example .env
```

Required variables:

```env
N8N_REPORT_WEBHOOK_URL=
DATABASE_URL=
RAPIDAPI_KEY=
RAPIDAPI_YAHOO_FINANCE_HOST=yahoo-finance-real-time1.p.rapidapi.com
```

3. Apply the Prisma schema:

```bash
pnpm prisma:migrate
```

4. Run the app:

```bash
pnpm dev
```

## MVP Flow

- `/` lets users search and select supported symbols, choose an analysis type, and generate a report.
- `/api/symbol-search` searches Yahoo Finance through RapidAPI server-side, so the RapidAPI key is never exposed to the browser.
- `/api/trending-tickers` loads `/market/get-trending-tickers` through RapidAPI for the dashboard Market Snapshot.
- `/api/calendar-events` loads `/calendar/get-events` through RapidAPI for the dashboard Market Calendar.
- `GET /api/reports` lists global recent reports from PostgreSQL ordered by `createdAt desc` for the no-login MVP history panel.
- `POST /api/reports` validates the request, calls the n8n webhook server-side, validates the response, and stores the report JSON in PostgreSQL.
- `/reports/[reportId]` loads the saved report and renders the summary, symbol ranking, and comparison charts.
