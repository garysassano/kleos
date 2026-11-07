import { readFileSync } from "node:fs";
import type { Stats } from "./types.ts";

/** The fixture the catalog and README render from: the author's real data (decision 0007). */
export const DEFAULT_FIXTURE = "garysassano";

/** Loads a committed data snapshot from fixtures/<name>.json. */
export function loadFixture(name = DEFAULT_FIXTURE): Stats {
  const url = new URL(`../../fixtures/${name}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8")) as Stats;
}
