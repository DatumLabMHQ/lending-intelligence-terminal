import { bindings, defineConfig, defineWorker } from "cf/config";
import { createWorkersCacheConfig } from "@vinext/cloudflare/cache/config";

const cache = await createWorkersCacheConfig();

export default defineConfig({
  accountId: "c9bf3d8e875ffe933a9bf895695e0fd1", // Datum Labs
  worker: defineWorker({
    ...cache,
    name: "lending-intelligence-terminal",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-05",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ...cache.env,
      ASSETS: bindings.assets(),
      // No plain settings needed. Secrets (DATABASE_URL, ETH_RPC_URL, LIQUIDATOR_DATABASE_URL,
      // CRON_SECRET, BEEHIIV_API_KEY, BEEHIIV_PUBLICATION_ID) are Worker secrets:
      // see scripts/set-secrets.sh.
    },
  }),
});
