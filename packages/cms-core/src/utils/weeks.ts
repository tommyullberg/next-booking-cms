/**
 * ISO 8601 week calculation utilities.
 */

/**
 * Returns the number of ISO 8601 weeks in a given year (52 or 53).
 * A year has 53 ISO weeks if 1 January or 31 December is a Thursday.
 */
export function getWeeksInYear(year: number): number {
  const p = (y: number) =>
    (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)) % 7;
  return p(year) === 4 || p(year - 1) === 3 ? 53 : 52;
}

