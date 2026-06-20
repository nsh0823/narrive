# Narrive

<br />

<p align="center">
  <img width="90" alt="Narrive" src="./app/icon.svg" />
  <div align="center">AI-powered investment research reports from market data, news, and automated analysis.</div>
  <div align="center">
    <a href="https://narrive.vercel.app" target="_blank">
      <img src="https://custom-icon-badges.demolab.com/badge/Visit%20Narrive-f97316.svg?logo=link-external&logoColor=white" />
    </a>
  </div>
</p>

#

## Overview

Narrive is an MVP web service that generates AI-powered investment research reports for selected market symbols. Users can search symbols, choose an analysis type and time horizon, generate a report through an n8n workflow, and review saved reports with AI scores, confidence scores, technical signals, news sentiment, risks, and evidence.

The application uses Next.js App Router for both the frontend and API routes. Server-side API routes proxy RapidAPI Yahoo Finance requests, call a production n8n webhook for report generation, validate webhook responses with Zod, and persist generated report JSON in Neon PostgreSQL through Prisma.

<br />

> [!NOTE]
> This project is currently an MVP. Login, subscriptions, user-specific report history, and automated scheduled reports are intentionally not implemented yet. Recent analyses are shown globally, ordered by creation time.

<br />

## My Role

- Designed and implemented the end-to-end MVP flow for report generation, persistence, and report viewing.
- Built the Next.js frontend, report dashboard, symbol search, market snapshot, calendar events, and report detail UI.
- Integrated server-side RapidAPI Yahoo Finance endpoints for symbol search, trending tickers, and market calendar events.
- Integrated an n8n production webhook for AI report generation and validated/stored report output with Zod, Prisma, and PostgreSQL.
- Designed the report UI for AI Score, Confidence Score, news sentiment distribution, technical charts, risks, evidence, and metric tooltips.

<br />

## Notable Features

### Report Generation

- Debounced symbol search using Yahoo Finance data through RapidAPI.
- Analysis type and time horizon configuration.
- Server-side n8n webhook call from `POST /api/reports`.
- Structured validation of webhook responses before saving report data.
- Automatic redirect to the generated report detail page.

### Dashboard

- Market Snapshot powered by RapidAPI trending tickers.
- Market Calendar powered by RapidAPI calendar events.
- Global Recent Analyses list from PostgreSQL ordered by `createdAt desc`.
- Average AI Score badge for recent reports.
- Orange primary color and QuantPilot-inspired UI style.

### Report Detail

- Executive Summary with opportunity, risk, and confidence tiles.
- Top Opportunities ranking by AI Score.
- Symbol Analysis tabs for overview, technical signals, news analysis, risks, and evidence.
- Technical charts using Recharts.
- News sentiment badges and sentiment distribution chart.
- Report Confidence panel with confidence score and supporting breakdown metrics.
- Informational tooltips for AI Score and confidence-related terms.

### Data And Automation

- Neon PostgreSQL stores generated reports as structured JSON.
- Prisma manages the `Report` model and database access.
- n8n orchestrates market/news data collection and Gemini-based analysis.
- RapidAPI Yahoo Finance endpoints are proxied server-side so API keys are not exposed to the browser.

<br />

## Architecture

<img width="1566" height="1004" alt="image" src="https://github.com/user-attachments/assets/39a758d5-1e95-4a3f-8c93-8b8248b333aa" />

<br />

## Tech Stack

**Frontend And App**

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript_6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**Backend And Data**

![Prisma](https://img.shields.io/badge/Prisma_5-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Neon](https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=neon&logoColor=black)
![Zod](https://img.shields.io/badge/Zod-3068B7?style=for-the-badge)
![n8n](https://img.shields.io/badge/n8n-EA4B71?style=for-the-badge&logo=n8n&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![RapidAPI](https://img.shields.io/badge/RapidAPI-0055DA?style=for-the-badge&logo=rapidapi&logoColor=white)

<br />

## Project Structure

```txt
app/                         Next.js App Router pages, layout, and API routes
app/page.tsx                 Dashboard page
app/reports/[reportId]/      Saved report detail page
app/api/reports/             Report generation, persistence, and recent reports API
app/api/symbol-search/       Server-side Yahoo Finance symbol search proxy
app/api/trending-tickers/    Server-side trending tickers proxy
app/api/calendar-events/     Server-side market calendar proxy
components/                  Dashboard, report, chart, and UI components
components/ui/               Shared UI primitives
lib/                         Schemas, API normalizers, Prisma client, and report utilities
prisma/                      Prisma schema and migrations
```

<br />

## Routes

```txt
/                    Dashboard and report generation flow
/reports/[reportId]  Saved report detail page

GET  /api/reports              Recent global reports
POST /api/reports              Generate and save a report through n8n
GET  /api/symbol-search        Yahoo Finance symbol search
GET  /api/trending-tickers     Trending market tickers
GET  /api/calendar-events      Market calendar events
```

<br />

## Environment

Create a local environment file:

```bash
cp .env.example .env
```

Configure the required variables:

```env
N8N_REPORT_WEBHOOK_URL=https://your-n8n-domain.com/webhook/investment-research/report
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_YAHOO_FINANCE_HOST=yahoo-finance-real-time1.p.rapidapi.com
```

<br />

## Run Locally

Install dependencies:

```bash
pnpm install
```

Generate the Prisma client and apply migrations:

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

Start the development server:

```bash
pnpm dev
```

Open:

```txt
http://localhost:3000
```

<br />

## Useful Commands

```bash
pnpm dev
pnpm typecheck
pnpm build
pnpm start
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:studio
```

<br />

## API Notes

The report generation endpoint expects:

```json
{
  "reportId": "uuid",
  "symbols": ["NVDA", "AAPL"],
  "analysisType": "short_term",
  "timeHorizon": "3m",
  "symbolMetadata": [
    {
      "symbol": "NVDA",
      "name": "NVIDIA Corporation",
      "type": "EQUITY"
    }
  ]
}
```

The n8n webhook must return:

```json
{
  "success": true,
  "reportId": "same-request-report-id",
  "report": {
    "reportId": "same-request-report-id",
    "generatedAt": "2026-06-20T00:00:00.000Z",
    "analysisType": "short_term",
    "symbols": [],
    "metadata": {
      "failedSymbols": [],
      "disclaimer": "For research purposes only."
    }
  }
}
```

<br />

## Deployment Notes

- The Next.js app is deployed on Vercel.
- `DATABASE_URL`, `N8N_REPORT_WEBHOOK_URL`, and RapidAPI variables must be configured in Vercel environment variables.
- The n8n workflow must be active when using the production `/webhook/...` URL.
- For self-hosted n8n behind a proxy, configure `WEBHOOK_URL` and `N8N_EDITOR_BASE_URL` to the public n8n base URL.
- The deployed app calls n8n from Vercel server-side API routes, so `localhost` webhook URLs will not work in production.
