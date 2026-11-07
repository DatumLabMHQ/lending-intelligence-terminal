# Lending Intelligence Terminal

Multi-protocol lending analytics for Ethereum. Unified view of **Aave V3, Spark, Morpho Blue, Fluid, Compound V3, Euler V2** — TVL, rates, utilization, revenue, liquidations, collateral risk.

Product of Datum Labs. Companion to the Liquidator Economy terminal.

## Pages

1. **Overview** — aggregate market metrics across all tracked protocols.
2. **Protocols** — per-protocol deep dive (TVL, utilization, revenue, rate curves).
3. **Rates** — cross-protocol supply/borrow rate comparison per asset.
4. **Collateral** — collateral risk monitor (peg stability, oracle config, cross-chain dependency).
5. **Events** — stress-event timeline (rsETH exploit, Aug 2024 crash, Feb 2025 selloff).

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind, built with [vinext](https://github.com/cloudflare/vinext) for Cloudflare Workers
- Neon Postgres (`@neondatabase/serverless`)
- viem for on-chain reads
- Recharts for visualization
- DefiLlama for aggregate TVL / borrow / fees history

## Getting started

```bash
cp .env.example .env
# fill in DATABASE_URL and ETH_RPC_URL
npm install
npm run db:init     # applies lib/schema.sql to the Neon DB
npm run dev         # http://localhost:3000 (vite; `npm run dev:next` for plain Next)
```

## Deploy (Cloudflare Workers)

The app runs on the `lending-intelligence-terminal` Worker
(https://lending-intelligence-terminal.datumlabs.workers.dev), configured in
`cloudflare.config.ts` and `vite.config.ts`.

```bash
npx cf auth login
./scripts/set-secrets.sh   # DATABASE_URL, ETH_RPC_URL, LIQUIDATOR_DATABASE_URL, CRON_SECRET, BEEHIIV_*
npm run deploy             # vite build + vinext-cloudflare deploy
```

Workers have no project filesystem at request time, so `content/reports/*.mdx`,
`content/watch.md` and the `public/reports` file list are bundled into
`lib/generated/content-bundle.ts` by `scripts/bundle-content.mjs` (runs
automatically before `dev`/`build`). Editing content needs a redeploy.

The daily sector snapshot is triggered by the separate `lending-terminal-cron`
Worker in `worker/cloudflare-cron/` (its `BASE_URL` must point at this Worker).
`alerts/` is the separate `datumlabs-alerts` Worker. Both deploy on their own
with `wrangler deploy` from their directories.

## Phase 1 scope

- Page 1 (Overview) with DefiLlama aggregates
- Page 2 (Protocols) with Aave V3 + Spark first (shared ABI), then Morpho + Fluid

See the project brief for the full build sequence.
