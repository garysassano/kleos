import type { Category } from "../types.ts";
import { design as G01 } from "./G01-trading-cards.ts";
import { design as G02 } from "./G02-achievement-medals.ts";
import { design as G03 } from "./G03-periodic-table.ts";
import { design as G04 } from "./G04-passport-stamps.ts";
import { design as G05 } from "./G05-ticket-stubs.ts";
import { design as G06 } from "./G06-arcade-high-scores.ts";

export const category: Category = {
  letter: "G",
  dir: "collectibles",
  name: "Badges and collectibles",
  blurb: "Playful formats such as trading cards, stamps and medals, with every number still real.",
  designs: [G01, G02, G03, G04, G05, G06],
};
