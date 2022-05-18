/**
 * Generate an array of numbers from start to the end
 *
 * @example
 *      range(1, 5);
 *      // => [1, 2, 3, 4]
 * @param start
 * @param end
 * @returns
 */
export function range(start: number, end: number): number[] {
  return Array.from({ length: end - start }, (_, i) => i + start);
}
