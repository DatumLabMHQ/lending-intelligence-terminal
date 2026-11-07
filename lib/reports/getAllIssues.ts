/**
 * Enumerate all issue MDX files in /content/reports. Returns frontmatter +
 * slugs, no body — consumers that need the body call getIssueBySlug per slug.
 *
 * Used by:
 *  - /reports archive page (ranked by publication_date desc)
 *  - generateStaticParams for /reports/[slug]
 *  - /reports/feed.xml RSS generator
 */
import { REPORT_FILES } from "@/lib/generated/content-bundle"
import { getIssueBySlug } from "./getIssueBySlug"
import type { IssueRecord } from "./types"

export async function getAllIssues(): Promise<IssueRecord[]> {
  // MDX sources are bundled at build time (scripts/bundle-content.mjs):
  // Workers have no project filesystem to readdir at request time.
  const slugs = Object.keys(REPORT_FILES)
  const results = await Promise.all(slugs.map((s) => getIssueBySlug(s)))
  // Drop nulls (shouldn't happen since the slug came from readdir).
  const issues = results.filter((r): r is IssueRecord => r !== null)
  // Hide drafts and archived from public lists by default. Mirror gate
  // matches app/reports/[slug]/page.tsx: NEXT_PUBLIC_DRAFT_PREVIEW=1 on
  // the Vercel project surfaces drafts on the deployed index too. Issue
  // pages themselves can still render a draft via direct slug if/when
  // needed.
  const visible = issues.filter(
    (r) =>
      r.frontmatter.status === "published" ||
      process.env.NEXT_PUBLIC_DRAFT_PREVIEW === "1",
  )
  // Sort by publication_date desc, with file mtime as a stable fallback.
  visible.sort((a, b) => {
    const ad = Date.parse(a.frontmatter.publication_date) || a.fileMtime * 1000
    const bd = Date.parse(b.frontmatter.publication_date) || b.fileMtime * 1000
    return bd - ad
  })
  return visible
}
