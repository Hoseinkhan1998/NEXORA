import { describe, it, expect } from "vitest";
import { generateSlug, generateCollisionSlug } from "./slug";

describe("Workspace Slug Generator", () => {
  describe("generateSlug", () => {
    it("converts mixed-case names to lowercase kebab-case", () => {
      expect(generateSlug("Acme Design Team")).toBe("acme-design-team");
      expect(generateSlug("NEXORA Core")).toBe("nexora-core");
    });

    it("strips special characters and normalizes diacritics", () => {
      expect(generateSlug("Café & Crème Labs!")).toBe("cafe-creme-labs");
      expect(generateSlug("Über Product #1")).toBe("uber-product-1");
    });

    it("compacts consecutive hyphens and trims leading/trailing hyphens", () => {
      expect(generateSlug("---Test---Workspace---")).toBe("test-workspace");
      expect(generateSlug("Alpha  --  Beta")).toBe("alpha-beta");
    });

    it("truncates names longer than 48 characters", () => {
      const longName = "A".repeat(60);
      const slug = generateSlug(longName);
      expect(slug.length).toBeLessThanOrEqual(48);
    });

    it("falls back to random workspace prefix when sanitized name is too short", () => {
      const slug = generateSlug("!@#");
      expect(slug).toMatch(/^workspace-[a-z0-9]{4}$/);
    });
  });

  describe("generateCollisionSlug", () => {
    it("appends a 4-character random alphanumeric suffix", () => {
      const base = "acme-corp";
      const collisionSlug = generateCollisionSlug(base);
      expect(collisionSlug).toMatch(/^acme-corp-[a-z0-9]{4}$/);
    });

    it("truncates long base slugs before appending suffix", () => {
      const longBase = "a".repeat(50);
      const collisionSlug = generateCollisionSlug(longBase);
      expect(collisionSlug.length).toBeLessThanOrEqual(50);
      expect(collisionSlug).toMatch(/-[a-z0-9]{4}$/);
    });
  });
});
