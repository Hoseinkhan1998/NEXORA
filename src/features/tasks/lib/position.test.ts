import { describe, it, expect } from "vitest";
import {
  calculateTaskPosition,
  isRebalanceNeeded,
  resequenceList,
  DEFAULT_INITIAL_POSITION,
  DEFAULT_POSITION_STEP,
  MIN_POSITION_GAP_THRESHOLD,
} from "./position";

describe("Kanban Position Engine", () => {
  describe("calculateTaskPosition", () => {
    it("returns default initial position when column is empty", () => {
      expect(calculateTaskPosition(null, null)).toBe(DEFAULT_INITIAL_POSITION);
      expect(calculateTaskPosition(undefined, undefined)).toBe(DEFAULT_INITIAL_POSITION);
    });

    it("prepends to the beginning of the list by halving next position", () => {
      // First task at 1000 -> prepend gives 500
      expect(calculateTaskPosition(null, 1000)).toBe(500);
      expect(calculateTaskPosition(null, 500)).toBe(250);
    });

    it("handles non-positive next positions when prepending", () => {
      expect(calculateTaskPosition(null, 0)).toBe(-DEFAULT_POSITION_STEP);
      expect(calculateTaskPosition(null, -500)).toBe(-1500);
    });

    it("appends to the end of the list by adding standard step", () => {
      expect(calculateTaskPosition(1000, null)).toBe(2000);
      expect(calculateTaskPosition(2500, undefined)).toBe(3500);
    });

    it("calculates exact midpoint when inserting between two tasks", () => {
      expect(calculateTaskPosition(1000, 2000)).toBe(1500);
      expect(calculateTaskPosition(1000, 1500)).toBe(1250);
      expect(calculateTaskPosition(1000, 1001)).toBe(1000.5);
    });

    it("handles multiple consecutive fractional insertions without loss of order", () => {
      let p1 = 1000;
      const p2 = 2000;
      const inserted: number[] = [];

      for (let i = 0; i < 5; i++) {
        const mid = calculateTaskPosition(p1, p2);
        inserted.push(mid);
        p1 = mid; // insert repeatedly closer to p2
      }

      // Ensure strictly increasing order
      for (let i = 1; i < inserted.length; i++) {
        expect(inserted[i]).toBeGreaterThan(inserted[i - 1]!);
      }
    });
  });

  describe("isRebalanceNeeded", () => {
    it("returns false if either neighbor is null or undefined", () => {
      expect(isRebalanceNeeded(null, 1000)).toBe(false);
      expect(isRebalanceNeeded(1000, null)).toBe(false);
      expect(isRebalanceNeeded(undefined, undefined)).toBe(false);
    });

    it("returns true when position gap falls below threshold", () => {
      expect(isRebalanceNeeded(1000, 1000 + MIN_POSITION_GAP_THRESHOLD / 2)).toBe(true);
      expect(isRebalanceNeeded(1000, 1000.0001)).toBe(true);
    });

    it("returns false when position gap is above threshold", () => {
      expect(isRebalanceNeeded(1000, 1001)).toBe(false);
      expect(isRebalanceNeeded(1000, 1000.5)).toBe(false);
    });
  });

  describe("resequenceList", () => {
    it("re-indexes an array with even 1000 increments", () => {
      const tasks = [{ id: "t1" }, { id: "t2" }, { id: "t3" }];
      const resequenced = resequenceList(tasks);

      expect(resequenced).toEqual([
        { item: { id: "t1" }, position: 1000 },
        { item: { id: "t2" }, position: 2000 },
        { item: { id: "t3" }, position: 3000 },
      ]);
    });

    it("supports custom start and step parameters", () => {
      const items = ["a", "b"];
      const resequenced = resequenceList(items, 500, 500);

      expect(resequenced).toEqual([
        { item: "a", position: 500 },
        { item: "b", position: 1000 },
      ]);
    });
  });
});
