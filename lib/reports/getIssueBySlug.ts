/**
 * Read a single issue MDX file from /content/reports/<slug>.mdx and parse
 * its frontmatter via gray-matter. Used by the issue page route.
 */
import matter from "gray-matter"
import { REPORT_FILES } from "@/lib/generated/content-bundle"
import type { IssueFrontmatter, IssueRecord } from "./types"

/** Validate the parsed frontmatter shape. Throws if a required field is
 *  missing — author error should fail the build, not silently drop. */
function validateFrontmatter(slug: string, data: Record<string, unknown>): IssueFrontmatter {
  const requiredKeys: Array<keyof IssueFrontmatter> = [
    "title",
    "issue_number",
    "issue_label",
    "date",
    "publication_date",
    "theme",
    "tagline",
    "reading_time_min",
    "cover_image",
    "social_image",
    "protocols",
    "freeze_date",
    "status",
  ]
  for (const k of requiredKeys) {
    if (data[k] == null) {
      throw new Error(`[reports] ${slug}.mdx: missing required frontmatter field "${k}"`)
    }
  }
  return data as unknown as IssueFrontmatter
}

export async function getIssueBySlug(slug: string): Promise<IssueRecord | null> {
  // Bundled at build time (scripts/bundle-content.mjs); Workers have no
  // project filesystem at request time.
  const file = Object.prototype.hasOwnProperty.call(REPORT_FILES, slug)
    ? REPORT_FILES[slug]
    : undefined
  if (!file) return null
  const parsed = matter(file.raw)
  const frontmatter = validateFrontmatter(slug, parsed.data)
  return {
    slug,
    frontmatter,
    body: parsed.content,
    fileMtime: file.mtime,
  }
}
