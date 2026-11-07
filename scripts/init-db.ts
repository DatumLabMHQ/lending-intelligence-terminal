/**
 * Apply lib/schema.sql to the configured Neon DB.
 *
 *   npm run db:init
 *
 * Idempotent — uses CREATE TABLE IF NOT EXISTS + INSERT ... ON CONFLICT.
 */
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"
import * as dotenv from "dotenv"

dotenv.config()

import { Pool } from "@neondatabase/serverless"
import { rawSql, closePool } from "../lib/db"

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.")
    process.exit(1)
  }

  const here = path.dirname(fileURLToPath(import.meta.url))
  const schemaPath = path.resolve(here, "..", "lib", "schema.sql")
  const sql = await readFile(schemaPath, "utf-8")

  console.log(`Applying schema from ${schemaPath}...`)
  // Multi-statement schema needs the WebSocket Pool (Node script only; the
  // app itself uses the HTTP driver in lib/db.ts).
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL.replace(/&?channel_binding=[^&]*/g, ""),
  })
  try {
    await pool.query(sql)
  } finally {
    await pool.end()
  }
  console.log("Schema applied.")

  const rows = await rawSql<{ slug: string; name: string }>(
    "SELECT slug, name FROM protocols ORDER BY slug",
  )
  console.log("Seeded protocols:")
  for (const r of rows) console.log(`  - ${r.slug} (${r.name})`)

  await closePool()
}

main().catch(async (err) => {
  console.error(err)
  await closePool().catch(() => {})
  process.exit(1)
})
