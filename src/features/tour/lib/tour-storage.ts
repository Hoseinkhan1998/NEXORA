import type { TourRole } from "../types";

const TOUR_STORAGE_PREFIX = "nexora_tour_completed";

export function getTourStorageKey(workspaceId: string, userId: string, role: TourRole): string {
  return `${TOUR_STORAGE_PREFIX}_${workspaceId}_${userId}_${role}`;
}

export function hasCompletedTour(workspaceId: string, userId: string, role: TourRole): boolean {
  if (typeof window === "undefined") return true;
  try {
    const key = getTourStorageKey(workspaceId, userId, role);
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

export function markTourCompleted(workspaceId: string, userId: string, role: TourRole): void {
  if (typeof window === "undefined") return;
  try {
    const key = getTourStorageKey(workspaceId, userId, role);
    window.localStorage.setItem(key, "true");
  } catch (err) {
    console.warn("[tourStorage] Failed to save tour completion status:", err);
  }
}

export function resetTour(workspaceId: string, userId: string, role: TourRole): void {
  if (typeof window === "undefined") return;
  try {
    const key = getTourStorageKey(workspaceId, userId, role);
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn("[tourStorage] Failed to reset tour completion status:", err);
  }
}
