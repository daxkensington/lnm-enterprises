# L&M Enterprises Railway Migration

This folder contains a Railway-ready copy of the public `lnmenterprises.ca` site.

## What was migrated

- The live public CSS and JavaScript bundle from the Manus-hosted site
- Cleaned HTML shell without Manus editor/runtime scripts
- A small Express server for SPA routing on Railway
- Clean `robots.txt` and `sitemap.xml` that no longer expose admin routes

## What was not migrated

- Manus admin login
- Manus auth callbacks
- Any Manus-only backend or editor features

The original admin flow is tied to Manus account auth and will need to be rebuilt separately if you want an admin on Railway.

## Local run

Requires Node.js 20 or newer (matches `engines.node` in package.json).

```bash
npm install
npm start
```

## Railway deploy

1. Push this folder to a GitHub repo.
2. Create a new Railway project from that repo.
3. Set the root directory to `lnmenterprises-railway` if the repo contains other folders.
4. Railway should detect Node automatically (Node.js 20 or newer) and run `npm start`.
5. Point your custom domain at the new Railway service after you verify the site.

## Next recommended rebuilds

- The public homepage is now server-rendered HTML. Admin promotions, winners, gas prices, and Google reviews all flow into `/` without rewriting the old Vite bundle.
- Blog post thumbnails are photos under `public/images/blog/`.
