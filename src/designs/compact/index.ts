import type { Category } from "../types.ts";
import { design as E01 } from "./E01-stat-tiles.ts";
import { design as E02 } from "./E02-owner-badges.ts";
import { design as E03 } from "./E03-repo-spotlight.ts";
import { design as E04 } from "./E04-dashboard.ts";
import { design as E05 } from "./E05-primer-list.ts";
import { design as E06 } from "./E06-ecosystems-narrow.ts";

export const category: Category = {
  letter: "E",
  dir: "compact",
  name: "Compact and dashboards",
  blurb: "Small tiles and badges, single-repository spotlights and full dashboards.",
  designs: [E01, E02, E03, E04, E05, E06],
};
