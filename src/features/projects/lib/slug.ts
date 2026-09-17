/**
 * Converts a raw project name into a sanitized URL-safe slug.
 * Example: "Marketing Dashboard" -> "marketing-dashboard"
 */
export function generateProjectSlug(name: string): string {
  const sanitized = name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents/diacritics
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumerics with hyphen
    .replace(/^-+|-+$/g, "") // Strip leading/trailing hyphens
    .slice(0, 80);

  if (sanitized.length < 2) {
    return `project-${Math.random().toString(36).slice(2, 6)}`;
  }

  return sanitized;
}

/**
 * Builds the next candidate slug for collision resolution within a workspace.
 * e.g., "marketing-dashboard" -> "marketing-dashboard-2" -> "marketing-dashboard-3"
 */
export function buildCandidateSlug(baseSlug: string, counter: number): string {
  if (counter <= 1) return baseSlug;
  const suffix = `-${counter}`;
  const truncatedBase = baseSlug.slice(0, 100 - suffix.length).replace(/-+$/, "");
  return `${truncatedBase}${suffix}`;
}
