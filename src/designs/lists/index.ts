import type { Category } from "../types.ts";
import { design as a01 } from "./A01-repo-leaderboard.ts";
import { design as a02 } from "./A02-owner-leaderboard.ts";
import { design as a03 } from "./A03-repos-and-owners.ts";
import { design as a04 } from "./A04-repo-table.ts";
import { design as a05 } from "./A05-ecosystem-rollup.ts";
import { design as a06 } from "./A06-star-tier-vs-my-share.ts";

export const category: Category = {
  letter: "A",
  dir: "lists",
  name: "Ranked lists",
  blurb:
    "Evolutions of a classic profile card: rows of repositories or owners with a breakdown of what you contributed to each.",
  designs: [a01, a02, a03, a04, a05, a06],
};
