import { withReducedMotion } from "../kit/svg.ts";
import type { Stats } from "../stats/types.ts";
import { category as charts } from "./charts/index.ts";
import { category as collectibles } from "./collectibles/index.ts";
import { category as compact } from "./compact/index.ts";
import { category as flows } from "./flows/index.ts";
import { category as focus } from "./focus/index.ts";
import { category as lists } from "./lists/index.ts";
import { category as type } from "./type/index.ts";
import {
  type Category,
  DEFAULT_LEVEL,
  type Design,
  LEVELS,
  type Level,
  type SettingValue,
  type ThemeName,
} from "./types.ts";
import { category as visual } from "./visual/index.ts";

/** Every category in catalog order (by letter). */
export const categories: Category[] = [
  lists,
  charts,
  type,
  visual,
  compact,
  flows,
  collectibles,
  focus,
];

/** How callers ask for a card; unset `outcomes` means the default level, unset settings their defaults. */
export interface CardOptions {
  outcomes?: Level;
  settings?: Record<string, SettingValue>;
}

/** Retired ids, never reused, with what replaces each (decision 0012). */
export const RETIRED: Readonly<Record<string, string>> = {
  A07: "A05 owners=no repos=3",
  A08: "A05 repos=3",
};

/** Every setting of `d` filled in: the given values over the defaults. Throws on unknown or invalid ones. */
export function settingsOf(
  d: Pick<Design, "id" | "settings">,
  given: Record<string, SettingValue> = {},
): Record<string, SettingValue> {
  const specs = d.settings ?? [];
  const out: Record<string, SettingValue> = {};
  for (const spec of specs) out[spec.name] = spec.default;
  for (const [name, value] of Object.entries(given)) {
    const spec = specs.find((s) => s.name === name);
    if (!spec)
      throw new Error(
        specs.length
          ? `${d.id} has no setting "${name}"; it has ${specs.map((s) => s.name).join(", ")}`
          : `${d.id} has no settings, so "${name}" can't be set`,
      );
    if (typeof value !== typeof spec.default)
      throw new Error(
        `${d.id} ${name}: expected ${typeof spec.default === "boolean" ? "yes or no" : "a whole number"}`,
      );
    if (
      typeof value === "number" &&
      (!Number.isInteger(value) ||
        (spec.min !== undefined && value < spec.min) ||
        (spec.max !== undefined && value > spec.max))
    )
      throw new Error(`${d.id} ${name}: expected a whole number from ${spec.min} to ${spec.max}`);
    out[name] = value;
  }
  return out;
}

/** Settings as written in the Action's input, such as "owners=no repos=3"; defaults are left out. */
export const settingsText = (
  d: Pick<Design, "settings">,
  values: Record<string, SettingValue>,
): string =>
  (d.settings ?? [])
    .filter((s) => values[s.name] !== undefined && values[s.name] !== s.default)
    .map((s) => {
      const v = values[s.name];
      return `${s.name}=${typeof v === "boolean" ? (v ? "yes" : "no") : v}`;
    })
    .join(" ");

export interface CatalogDesign extends Omit<Design, "render"> {
  category: Category;
  render(stats: Stats, theme: ThemeName, options?: CardOptions): string;
}

/** Every design, with unset options filled in, and the reduced-motion rule added to animated cards. */
export const allDesigns = (): CatalogDesign[] =>
  categories.flatMap((category) =>
    category.designs.map((d) => ({
      ...d,
      category,
      render: (stats: Stats, theme: ThemeName, options: CardOptions = {}) =>
        withReducedMotion(
          d.render(stats, theme, {
            outcomes: options.outcomes ?? DEFAULT_LEVEL,
            settings: settingsOf(d, options.settings),
          }),
        ),
    })),
  );

export type {
  Category,
  Design,
  Level,
  RenderOptions,
  Setting,
  SettingValue,
  ThemeName,
} from "./types.ts";
export { DEFAULT_LEVEL, DEFAULT_OPTIONS, LEVELS } from "./types.ts";

/** The levels a design supports. */
export const outcomesOf = (d: Pick<Design, "outcomes">): readonly Level[] => d.outcomes ?? LEVELS;
