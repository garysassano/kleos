/** Number, word and date formatting shared by every design category. */

/** 12345 → "12,345". */
export const fmt = (n: number): string => n.toLocaleString("en-US");

/** Count with a singular or plural noun: plural(1, "repo") → "1 repo", plural(1200, "PR") → "1,200 PRs". */
export const plural = (n: number, one: string, many = `${one}s`): string =>
  `${fmt(n)} ${n === 1 ? one : many}`;

/** Rounds to one decimal, for SVG coordinates. */
export const r1 = (n: number): number => Math.round(n * 10) / 10;

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Small deterministic string hash (FNV-1a), for stable jitter such as rotations. */
export function hash(s: string): number {
  let h = 2166136261;
  for (const ch of s) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
