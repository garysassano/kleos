/**
 * One place that decides what each `outcomes` level shows, so every design frames PR results the
 * same way. Designs keep their own colours; they map each part's `key` to a colour.
 */
import type { Level } from "../designs/types.ts";

export interface PrCounts {
  prs: number;
  prsMerged: number;
  prsOpen: number;
}

/**
 * "pr": PRs shown without outcome (all of them under "none", the not-yet-merged rest under "merged").
 * "merged", "open", "closed": the outcomes, where the level shows them.
 */
export type PrPartKey = "pr" | "merged" | "open" | "closed";

export interface PrPart {
  key: PrPartKey;
  count: number;
  /** Legend or column label for this part. */
  label: string;
}

/** Closed without merging, never negative even if counts disagree. */
export const prsClosed = (c: PrCounts): number => Math.max(0, c.prs - c.prsMerged - c.prsOpen);

/**
 * The PR segments to draw, in order, for a bar or a breakdown. Zero-count parts are kept so
 * columns line up between rows; skip them when drawing if needed.
 *
 * - none:   [PRs]
 * - merged: [merged, PRs]   Read as "PRs, of which merged": label the whole span "PRs" and the
 *                           strong part "merged". Never label the rest on its own.
 * - full:   [merged, open, closed]
 */
export function prParts(c: PrCounts, outcomes: Level): PrPart[] {
  switch (outcomes) {
    case "none":
      return [{ key: "pr", count: c.prs, label: "PRs" }];
    case "merged":
      return [
        { key: "merged", count: c.prsMerged, label: "merged" },
        { key: "pr", count: c.prs - c.prsMerged, label: "PRs" },
      ];
    case "full":
      return [
        { key: "merged", count: c.prsMerged, label: "merged" },
        { key: "open", count: c.prsOpen, label: "open" },
        { key: "closed", count: prsClosed(c), label: "closed unmerged" },
      ];
  }
}

/** Legend entries for PRs at this level, in drawing order. */
export function prLegend(outcomes: Level): { key: PrPartKey; label: string }[] {
  switch (outcomes) {
    case "none":
      return [{ key: "pr", label: "PRs" }];
    case "merged":
      return [
        { key: "pr", label: "PRs" },
        { key: "merged", label: "of which merged" },
      ];
    case "full":
      return [
        { key: "merged", label: "PRs merged" },
        { key: "open", label: "PRs open" },
        { key: "closed", label: "PRs closed unmerged" },
      ];
  }
}

/** "278 merged", or "" when the level hides merges. */
export const mergedNote = (c: PrCounts, outcomes: Level): string =>
  outcomes === "none" ? "" : `${c.prsMerged} merged`;

/** Merge rate in percent, only where the level allows it ("full"); null otherwise. */
export const mergeRate = (c: PrCounts, outcomes: Level): number | null =>
  outcomes === "full" && c.prs > 0 ? Math.round((100 * c.prsMerged) / c.prs) : null;

/** Totals as PrCounts, for headline figures. */
export const totalsCounts = (t: {
  externalPRs: number;
  externalMerged: number;
  externalOpen: number;
}): PrCounts => ({
  prs: t.externalPRs,
  prsMerged: t.externalMerged,
  prsOpen: t.externalOpen,
});
