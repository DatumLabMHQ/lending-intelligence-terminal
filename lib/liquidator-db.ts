/**
 * Read-only pool for the existing liquidator-economy Neon DB.
 * Exposes `liquidation_events`, `price_cache`, `token_metadata`, and
 * `fluid_vaults` from the Liquidator Economy terminal. We never write to this
 * DB from the lending terminal — all mutations happen in the Liquidator
 * Economy project's own pipeline.
 */
import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

// Neon HTTP driver: stateless per query. A module-scope WebSocket Pool
// breaks on Cloudflare Workers after the first request (sockets can't be
// reused across requests), so we don't keep one.
let client: NeonQueryFunction<false, false> | null = null

function getClient(): NeonQueryFunction<false, false> {
  if (!client) {
    if (!process.env.LIQUIDATOR_DATABASE_URL) {
      throw new Error("LIQUIDATOR_DATABASE_URL environment variable is required")
    }
    const url = process.env.LIQUIDATOR_DATABASE_URL.replace(/&?channel_binding=[^&]*/g, "")
    client = neon(url)
  }
  return client
}

export async function liquidatorSql<T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T[]> {
  let query = ""
  strings.forEach((str, i) => {
    query += str
    if (i < values.length) query += `$${i + 1}`
  })
  return (await getClient().query(query, values)) as T[]
}

/** Check whether LIQUIDATOR_DATABASE_URL is configured — used by page-level guards. */
export function hasLiquidatorDb(): boolean {
  return !!process.env.LIQUIDATOR_DATABASE_URL
}
