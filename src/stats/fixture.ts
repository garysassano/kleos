import { readFileSync } from "node:fs";
import type { Stats } from "./types.ts";

/** Loads a committed data snapshot from fixtures/<name>.json. */
export function loadFixture(name = "garysassano"): Stats {
  const url = new URL(`../../fixtures/${name}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8")) as Stats;
}
