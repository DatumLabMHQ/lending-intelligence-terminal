// Parse only selected members out of a large JSON document.
//
// DefiLlama's /protocol/<slug> responses are 4–36 MB of JSON. A full JSON.parse of the larger ones
// needs 70–110 MB of heap each, which is over the Cloudflare Workers 128 MB isolate limit, while the
// code reads only `chainTvls.Ethereum`, `chainTvls["Ethereum-borrowed"]` and `currentChainTvls`
// (under 9 MB). These helpers find those members by bracket matching on the raw text and parse just
// their slices. Verified identical to a full JSON.parse for every protocol the overview loads.

/** Index just past the JSON object/array that starts at `t[i]`. String- and escape-aware. */
function spanEnd(t: string, i: number): number {
  let depth = 0
  let inStr = false
  for (let k = i; k < t.length; k++) {
    const c = t.charCodeAt(k)
    if (inStr) {
      if (c === 92) k++ // backslash: skip the escaped char
      else if (c === 34) inStr = false
      continue
    }
    if (c === 34) inStr = true
    else if (c === 123 || c === 91) depth++
    else if (c === 125 || c === 93) {
      if (--depth === 0) return k + 1
    }
  }
  throw new Error("json-slice: unterminated JSON value")
}

/** Index just past a JSON scalar (number, string, true/false/null) starting at `t[i]`. */
function scalarEnd(t: string, i: number): number {
  if (t[i] === '"') {
    for (let k = i + 1; k < t.length; k++) {
      if (t.charCodeAt(k) === 92) k++
      else if (t.charCodeAt(k) === 34) return k + 1
    }
    throw new Error("json-slice: unterminated string")
  }
  let k = i
  while (k < t.length && t[k] !== "," && t[k] !== "}" && t[k] !== "]") k++
  return k
}

function skipWs(t: string, i: number): number {
  while (i < t.length && (t[i] === " " || t[i] === "\n" || t[i] === "\r" || t[i] === "\t")) i++
  return i
}

/**
 * Parse the value of the first `"<member>":` in `text`. With `keys`, `member` must be an object and
 * only those of its own keys are parsed (others are skipped without parsing). Returns undefined
 * when the member is absent.
 */
export function pickMember<T = unknown>(text: string, member: string, keys?: string[]): T | undefined {
  const at = text.indexOf(`"${member}":`)
  if (at < 0) return undefined
  const start = skipWs(text, at + member.length + 3)
  const c = text[start]
  if (!keys || c !== "{") {
    const end = c === "{" || c === "[" ? spanEnd(text, start) : scalarEnd(text, start)
    return JSON.parse(text.slice(start, end)) as T
  }
  const end = spanEnd(text, start)
  const out: Record<string, unknown> = {}
  let k = start + 1
  while (k < end - 1) {
    k = skipWs(text, k)
    if (text[k] === ",") { k = skipWs(text, k + 1) }
    if (text[k] !== '"') break
    const keyEnd = scalarEnd(text, k)
    const key = JSON.parse(text.slice(k, keyEnd)) as string
    const v = skipWs(text, skipWs(text, keyEnd) + 1) // past the ':'
    const ve = text[v] === "{" || text[v] === "[" ? spanEnd(text, v) : scalarEnd(text, v)
    if (keys.includes(key)) out[key] = JSON.parse(text.slice(v, ve))
    k = ve
  }
  return out as T
}
