/** Helpers shared by the G (badges and collectibles) designs. */

import { MONTHS, hash, plural } from "../../kit/format.ts";
import type { OwnerStats, RepoStats, Stats } from "../../stats/types.ts";
import type { ThemeName } from "../types.ts";

export { hash, plural };

/** "2023-02-23T05:07:15Z" → "Feb 2023". */
export const monthYear = (iso: string): string =>
  `${MONTHS[Number(iso.slice(5, 7)) - 1] ?? "?"} ${iso.slice(0, 4)}`;

/** "2023-02-23T05:07:15Z" → "23 FEB 2023". */
export const stampDate = (iso: string): string =>
  `${iso.slice(8, 10)} ${(MONTHS[Number(iso.slice(5, 7)) - 1] ?? "?").toUpperCase()} ${iso.slice(0, 4)}`;

export const reposOf = (stats: Stats, owner: string): RepoStats[] =>
  stats.repos.filter((r) => r.owner === owner);

/** Earliest and latest PR, issue or discussion across an owner's repos (null when unknown). */
export function ownerSpan(
  stats: Stats,
  owner: string,
): { first: string | null; last: string | null } {
  let first: string | null = null;
  let last: string | null = null;
  for (const r of reposOf(stats, owner)) {
    if (r.first && (!first || r.first < first)) first = r.first;
    if (r.last && (!last || r.last > last)) last = r.last;
  }
  return { first, last };
}

/** Language of the owner's repo with the most activity. */
export const ownerLanguage = (stats: Stats, owner: string): string | null =>
  reposOf(stats, owner).find((r) => r.language)?.language ?? null;

/** Rarity tiers by total stars on the owner's repos the user contributed to. */
export interface Rarity {
  name: string;
  min: number;
  color: string;
}

export function rarities(theme: ThemeName): Rarity[] {
  const dark = theme === "dark";
  return [
    { name: "Common", min: 0, color: dark ? "#9198a1" : "#6e7781" },
    { name: "Uncommon", min: 1000, color: dark ? "#3fb950" : "#1a7f37" },
    { name: "Rare", min: 10000, color: dark ? "#4493f8" : "#0969da" },
    { name: "Epic", min: 50000, color: dark ? "#ab7df8" : "#8250df" },
    { name: "Legendary", min: 200000, color: dark ? "#e3b341" : "#9a6700" },
  ];
}

export const rarityOf = (o: OwnerStats, theme: ThemeName): Rarity => {
  const tiers = rarities(theme);
  return [...tiers].reverse().find((t) => o.stars >= t.min) ?? (tiers[0] as Rarity);
};

/** Bronze, silver and gold, tuned to read on both GitHub backgrounds. */
export interface Metal {
  name: string;
  light: string;
  dark: string;
  ink: string;
}

export function metals(theme: ThemeName): Metal[] {
  return theme === "dark"
    ? [
        { name: "Bronze", light: "#e0a070", dark: "#9a5a2e", ink: "#2b1608" },
        { name: "Silver", light: "#e6ebf1", dark: "#8b949e", ink: "#1f2328" },
        { name: "Gold", light: "#f6d66b", dark: "#b8860b", ink: "#2e2100" },
      ]
    : [
        { name: "Bronze", light: "#e9b48a", dark: "#a0582a", ink: "#3b1d08" },
        { name: "Silver", light: "#f2f4f7", dark: "#97a1ab", ink: "#1f2328" },
        { name: "Gold", light: "#fbe08a", dark: "#c2930f", ink: "#3b2a00" },
      ];
}

/** Categorical colours (Primer scale steps) for ecosystems and series, per theme. */
export const series = (theme: ThemeName): string[] =>
  theme === "dark"
    ? ["#4493f8", "#3fb950", "#d29922", "#ab7df8", "#f778ba", "#39c5cf", "#f0883e", "#8b949e"]
    : ["#0969da", "#1a7f37", "#9a6700", "#8250df", "#bf3989", "#1b7c83", "#bc4c00", "#6e7781"];

/** Ecosystem name of an owner, or null when the owner is not in any ecosystem. */
export const ecosystemOf = (stats: Stats, owner: string): string | null =>
  stats.ecosystems.find((f) => f.owners.includes(owner))?.name ?? null;
