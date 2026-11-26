# Baithak Counter Ledger

Order entry, live ingredient stock and sales analytics for the Baithak cafe counter.
The entry screen follows the cafe's paper ledger: **Sr. No. → Table → Item → Q → Price → Total**,
with the bill total circled.

- **Orders**: tap items (or the Quick Tab), pick the table, save. Each saved entry deducts
  its recipe ingredients from stock automatically and shows what was used.
- **Inventory**: live stock with low-stock warnings and restock / set-exact adjustments.
- **Analytics**: revenue, top sellers, and which ingredient is used most and which items drive it.

Works on phone (bottom tab bar + order sheet), tablet and laptop.

## Stack

| Part | Tech |
| --- | --- |
| UI | React 19, Vite, React Router, TanStack Query (`src/`) |
| API | Vercel Functions in `api/` (shared code in `server/`, types in `shared/`) |
| Database | Postgres (Neon via the Vercel Storage tab), driver `postgres` |

## Deploying on Vercel

1. Import the repo as a Vite project (this repo's `vercel.json` already sets the framework and region).
2. **Storage tab → Create Database → Neon**, connect it to the project for all environments.
   That adds `DATABASE_URL` automatically.
3. Deploy. `npm run build` first runs `scripts/migrate.mjs`, which creates the tables and, on a
   brand-new database only, loads the starting menu, ingredients and recipes from `db/seed.sql`.
   It is safe to run on every deploy and never deletes or overwrites data.

If `DATABASE_URL` is missing, the build still succeeds and the app shows a clear
"database is not connected" message instead of crashing.

## Local development

```bash
npm install
cp .env.example .env        # then set DATABASE_URL to any Postgres you have
export DATABASE_URL=postgres://user:pass@127.0.0.1:5432/baithak
npm run db:migrate          # create tables + starting menu
npm run dev:api &           # the /api functions on :3001
npm run dev                 # the UI on :5173 (proxies /api)
```

`npm run typecheck` checks the whole project.

## Customising

- Menu, prices and recipes: `db/seed.sql` (only applied to an empty database), or edit the tables directly.
- Number of tables in the picker: `TABLE_COUNT` in `shared/cafe.ts`.
- The cafe's day (serial numbers restart, "Today" starts) runs on India time: `CAFE_TIMEZONE` in `shared/cafe.ts`.
