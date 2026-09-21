import { describe, it, expect, beforeEach, vi } from "vitest";
import { getTourStepsForRole, ROLE_TOUR_STEPS } from "./lib/tour-steps";
import {
  getTourStorageKey,
  hasCompletedTour,
  markTourCompleted,
  resetTour,
} from "./lib/tour-storage";
import type { TourRole } from "./types";

describe("Tour Feature", () => {
  describe("Tour Step Configurations by Role", () => {
    const roles: TourRole[] = ["owner", "admin", "member", "viewer"];

    it("defines distinct step sequences for all roles", () => {
      roles.forEach((role) => {
        const steps = getTourStepsForRole(role);
        expect(steps.length).toBeGreaterThan(0);
        steps.forEach((step) => {
          expect(step.id).toBeDefined();
          expect(typeof step.title).toBe("string");
          expect(typeof step.description).toBe("string");
          expect(step.title.trim().length).toBeGreaterThan(0);
          expect(step.description.trim().length).toBeGreaterThan(0);
        });
      });
    });

    it("customizes welcome badge and content per role", () => {
      const ownerSteps = getTourStepsForRole("owner");
      expect(ownerSteps[0]!.badge).toBe("Owner Access");
      expect(ownerSteps[0]!.title).toContain("Workspace");

      const adminSteps = getTourStepsForRole("admin");
      expect(adminSteps[0]!.badge).toBe("Admin Privileges");
      expect(adminSteps[0]!.title).toContain("Administrator");

      const memberSteps = getTourStepsForRole("member");
      expect(memberSteps[0]!.badge).toBe("Contributor");

      const viewerSteps = getTourStepsForRole("viewer");
      expect(viewerSteps[0]!.badge).toBe("Read-Only Access");
      expect(viewerSteps[0]!.title).toContain("Stakeholder");
    });

    it("falls back to member steps if an unrecognized role is passed", () => {
      // @ts-expect-error Testing runtime fallback
      const fallbackSteps = getTourStepsForRole("unknown_role");
      expect(fallbackSteps).toEqual(ROLE_TOUR_STEPS.member);
    });

    it("tailors navigation steps to role access (viewer omits settings step)", () => {
      const viewerSteps = getTourStepsForRole("viewer");
      const viewerSettings = viewerSteps.find((s) => s.id.includes("settings"));
      expect(viewerSettings).toBeUndefined();

      const ownerSteps = getTourStepsForRole("owner");
      const ownerSettings = ownerSteps.find((s) => s.id === "owner-settings");
      expect(ownerSettings).toBeDefined();
      expect(ownerSettings?.badge).toBe("Administration");

      const adminSteps = getTourStepsForRole("admin");
      const adminSettings = adminSteps.find((s) => s.id === "admin-settings");
      expect(adminSettings).toBeDefined();
      expect(adminSettings?.badge).toBe("Team Management");
    });
  });

  describe("Tour LocalStorage Persistence", () => {
    const workspaceId = "ws-test-123";
    const userId = "usr-test-456";
    const role: TourRole = "admin";

    beforeEach(() => {
      window.localStorage.clear();
      vi.restoreAllMocks();
    });

    it("generates correct scoped storage key", () => {
      const key = getTourStorageKey(workspaceId, userId, role);
      expect(key).toBe(`nexora_tour_completed_${workspaceId}_${userId}_${role}`);
    });

    it("reports incomplete tour when key is not in localStorage", () => {
      expect(hasCompletedTour(workspaceId, userId, role)).toBe(false);
    });

    it("correctly records and verifies tour completion", () => {
      markTourCompleted(workspaceId, userId, role);
      expect(hasCompletedTour(workspaceId, userId, role)).toBe(true);

      const differentRoleHasCompleted = hasCompletedTour(workspaceId, userId, "viewer");
      expect(differentRoleHasCompleted).toBe(false);
    });

    it("resets tour completion when resetTour is called", () => {
      markTourCompleted(workspaceId, userId, role);
      expect(hasCompletedTour(workspaceId, userId, role)).toBe(true);

      resetTour(workspaceId, userId, role);
      expect(hasCompletedTour(workspaceId, userId, role)).toBe(false);
    });

    it("gracefully handles localStorage exceptions without throwing", () => {
      const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("QuotaExceeded or SecurityError");
      });

      expect(() => hasCompletedTour(workspaceId, userId, role)).not.toThrow();
      expect(hasCompletedTour(workspaceId, userId, role)).toBe(false);

      getItemSpy.mockRestore();
    });
  });
});
