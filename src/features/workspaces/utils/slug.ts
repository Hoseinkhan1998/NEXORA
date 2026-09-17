/**
 * Converts a raw workspace name into a sanitized URL-safe slug.
 * Example: "Acme Design Team" -> "acme-design-team"
 */
export function generateSlug(name: string): string {
  const sanitized = name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents/diacritics
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumerics with hyphen
    .replace(/^-+|-+$/g, "") // Strip leading/trailing hyphens
    .slice(0, 48); // Ensure room for collision suffix if needed

  if (sanitized.length < 2) {
    return `workspace-${Math.random().toString(36).slice(2, 6)}`;
  }

  return sanitized;
}

/**
 * Appends an alphanumeric suffix for collision resolution.
 */
export function generateCollisionSlug(baseSlug: string): string {
  const suffix = Math.random().toString(36).slice(2, 6);
  const truncatedBase = baseSlug.slice(0, 45).replace(/-+$/, "");
  return `${truncatedBase}-${suffix}`;
}
