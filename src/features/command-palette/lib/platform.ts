/**
 * Detects whether the current client platform is macOS or iOS.
 * Safe for SSR (defaults to Mac symbol if window is undefined).
 */
export function isMacPlatform(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  return /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent || "");
}

/**
 * Returns the platform-appropriate modifier key text ("⌘" on Mac, "Ctrl" on Windows/Linux).
 */
export function getModifierKey(): string {
  return isMacPlatform() ? "⌘" : "Ctrl";
}

/**
 * Formats a key combo with the appropriate platform modifier (e.g. "⌘K" or "Ctrl+K").
 */
export function formatShortcut(key: string): string {
  const mod = getModifierKey();
  return mod === "⌘" ? `⌘${key}` : `Ctrl+${key}`;
}
