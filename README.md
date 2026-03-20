# GreenTrack — Green-Tech Inventory Assistant

A sustainability-focused inventory system for small teams. Tracks perishable items, monitors expiry dates, and provides AI-powered reorder suggestions.

## Setup

```bash
npm install
npm run dev
```

## Features

- Full CRUD with validation
- Expiry tracking (🔴 <3d, 🟡 3-7d, 🟢 >7d)
- AI reorder suggestions (moving average forecasting) with manual fallback toggle
- Search/filter by name, category, expiry status
- Waste logging and analytics charts
- Mobile responsive, offline-first (localStorage)

## AI Forecasting

Moving average of daily consumption → estimates depletion date → suggests reorder quantity. Falls back to min/max threshold alerts automatically.

## Sample Data

`/data/seed-data.json` — 12 items, 22 consumption records. Auto-seeded on first run.

## Tradeoffs & Assumptions

| Decision | Choice | Rationale |
|---|---|---|
| Storage | localStorage | Zero setup, offline, fits <1000 items |
| AI | Moving average | Works with sparse data, interpretable |
| No backend | Client-only | Simplicity, offline support |

Assumes small teams, stable consumption, single-tenant use. No real barcode scanning (simulated).
