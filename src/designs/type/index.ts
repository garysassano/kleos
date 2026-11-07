import type { Category } from "../types.ts";
import { design as C01 } from "./C01-big-numbers.ts";
import { design as C02 } from "./C02-terminal.ts";
import { design as C03 } from "./C03-receipt.ts";
import { design as C04 } from "./C04-git-log.ts";
import { design as C05 } from "./C05-in-brief.ts";
import { design as C06 } from "./C06-index.ts";

export const category: Category = {
  letter: "C",
  dir: "type",
  name: "Typographic",
  blurb: "Type-led layouts: big numbers, terminal output, ledgers, logs and indexes.",
  designs: [C01, C02, C03, C04, C05, C06],
};
