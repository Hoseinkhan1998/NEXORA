/**
 * Pure helper for calculating new task position in fractional/gap-based ordering.
 * Default standard spacing: 1000.
 */

export const DEFAULT_INITIAL_POSITION = 1000;
export const DEFAULT_POSITION_STEP = 1000;
export const MIN_POSITION_GAP_THRESHOLD = 0.001;

/**
 * Calculates a new position based on surrounding neighbors.
 *
 * @param previousPosition - Position of the preceding task, or null if moving to the beginning.
 * @param nextPosition - Position of the succeeding task, or null if moving to the end.
 * @returns The computed numeric position.
 */
export function calculateTaskPosition(
  previousPosition: number | null | undefined,
  nextPosition: number | null | undefined
): number {
  const prev = previousPosition ?? null;
  const next = nextPosition ?? null;

  // Case 1: Empty list or no neighbors
  if (prev === null && next === null) {
    return DEFAULT_INITIAL_POSITION;
  }

  // Case 2: Move to beginning (precedes the first task)
  if (prev === null && next !== null) {
    // If next is 1000 -> 500
    // If next is <= 0 -> next - 1000
    return next > 0 ? next / 2 : next - DEFAULT_POSITION_STEP;
  }

  // Case 3: Move to end (follows the last task)
  if (prev !== null && next === null) {
    return prev + DEFAULT_POSITION_STEP;
  }

  // Case 4: Move between two existing tasks
  if (prev !== null && next !== null) {
    return (prev + next) / 2;
  }

  return DEFAULT_INITIAL_POSITION;
}

/**
 * Determines whether the gap between two neighboring tasks has become too small,
 * requiring a resequence of the column.
 */
export function isRebalanceNeeded(
  previousPosition: number | null | undefined,
  nextPosition: number | null | undefined,
  threshold: number = MIN_POSITION_GAP_THRESHOLD
): boolean {
  if (previousPosition == null || nextPosition == null) {
    return false;
  }
  return Math.abs(nextPosition - previousPosition) < threshold;
}

/**
 * Resequences a list of items with standard 1000-interval positions.
 */
export function resequenceList<T>(
  items: T[],
  startPosition: number = DEFAULT_POSITION_STEP,
  step: number = DEFAULT_POSITION_STEP
): { item: T; position: number }[] {
  return items.map((item, index) => ({
    item,
    position: startPosition + index * step,
  }));
}
