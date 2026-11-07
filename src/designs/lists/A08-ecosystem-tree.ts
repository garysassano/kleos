import { DEFAULT_OPTIONS, type Design } from "../types.ts";
import { ecosystemRollup } from "./_shared.ts";

const title = "Ecosystem tree";

export const design: Design = {
  id: "A08",
  slug: "ecosystem-tree",
  title,
  idea: "The full tree: each ecosystem, every owner in it, and each owner's top 3 repos by contributions. An owner with one repo names it on its own line instead; an ecosystem with one owner lists its top 3 repos directly.",
  render: (stats, theme, options = DEFAULT_OPTIONS) =>
    ecosystemRollup(stats, theme, options.outcomes, "tree", title),
};
