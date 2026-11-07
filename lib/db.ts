import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

// Neon HTTP driver: stateless per query. A module-scope WebSocket Pool
// breaks on Cloudflare Workers after the first request (sockets can't be
// reused across requests), so we don't keep one.
let client: NeonQueryFunction<false, false> | null = null

function getClient(): NeonQueryFunction<false, false> {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required")
    }
    // Neon's serverless driver doesn't accept the channel_binding param some URLs include.
    const dbUrl = process.env.DATABASE_URL.replace(/&?channel_binding=[^&]*/g, "")
    client = neon(dbUrl)
  }
  return client
}

/**
 * Tagged template literal for parameterized queries.
 *
 * @example
 *   const rows = await sql`SELECT * FROM protocols WHERE slug = ${slug}`
 */
export async function sql<T = any>(
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

/** Direct string execution for dynamic SQL (single statement; the HTTP
 *  driver does not run multi-statement scripts, see scripts/init-db.ts). */
export async function rawSql<T = any>(text: string, params?: any[]): Promise<T[]> {
  return (await getClient().query(text, params ?? [])) as T[]
}

/** Kept for scripts that call it. The HTTP driver holds no connections. */
export async function closePool(): Promise<void> {
  client = null
}
