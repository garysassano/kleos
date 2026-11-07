/**
 * Reads and checks the GitHub Action's inputs. Pure: every mistake becomes an error that names the
 * input, so a misconfigured workflow fails on its first run instead of rendering something else.
 * See docs/decisions/0011-action-inputs.md.
 */
import {
  type CatalogDesign,
  DEFAULT_LEVEL,
  LEVELS,
  type Level,
  RETIRED,
  type SettingValue,
  allDesigns,
  outcomesOf,
  settingsOf,
} from "../designs/index.ts";
import { DEFAULT_ECOSYSTEMS, type EcosystemRule } from "../stats/aggregate.ts";

export interface ActionConfig {
  user: string;
  /** Each listed design with every one of its settings filled in. */
  designs: { design: CatalogDesign; settings: Record<string, SettingValue> }[];
  outcomes: Level;
  ecosystems: EcosystemRule[];
  out: string;
}

export interface RawInputs {
  user?: string;
  designs?: string;
  outcomes?: string;
  ecosystems?: string;
  out?: string;
}

const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

export function parseInputs(raw: RawInputs): ActionConfig {
  const user = raw.user?.trim() ?? "";
  if (!LOGIN.test(user)) throw new Error(`user: "${user}" is not a GitHub login`);

  const designs = parseDesigns(raw.designs ?? "");

  const outcomes = (raw.outcomes?.trim() || DEFAULT_LEVEL) as Level;
  if (!LEVELS.includes(outcomes))
    throw new Error(`outcomes: "${outcomes}" must be one of ${LEVELS.join(", ")}`);
  for (const { design: d } of designs)
    if (!outcomesOf(d).includes(outcomes))
      throw new Error(
        `outcomes: ${d.id} (${d.title}) supports ${outcomesOf(d).join(", ")}, not ${outcomes}`,
      );

  const out = raw.out?.trim() || "kleos";
  if (out.startsWith("/") || out.split(/[\\/]/).includes(".."))
    throw new Error(`out: "${out}" must be a folder inside the repository`);

  return { user, designs, outcomes, ecosystems: parseEcosystems(raw.ecosystems), out };
}

/**
 * Design ids separated by spaces, commas or new lines, each followed by its settings as
 * `name=value` (`D01 A05 owners=no repos=3`). Switches take yes or no, numbers a whole number.
 */
export function parseDesigns(text: string): ActionConfig["designs"] {
  const catalog = allDesigns();
  const out: { design: CatalogDesign; given: Record<string, SettingValue> }[] = [];
  for (const token of text.split(/[\s,]+/).filter(Boolean)) {
    const eq = token.indexOf("=");
    if (eq < 0) {
      const id = token.toUpperCase();
      const replacement = RETIRED[id];
      if (replacement) throw new Error(`designs: ${id} was retired; use ${replacement}`);
      const design = catalog.find((d) => d.id === id);
      if (!design)
        throw new Error(`designs: unknown id ${token}; the ids are listed in gallery/README.md`);
      if (out.some((x) => x.design.id === id)) throw new Error(`designs: ${id} is listed twice`);
      out.push({ design, given: {} });
      continue;
    }
    const last = out.at(-1);
    if (!last) throw new Error(`designs: "${token}" must follow the id of the design it sets`);
    const name = token.slice(0, eq).toLowerCase();
    const raw = token.slice(eq + 1).toLowerCase();
    const value: SettingValue | undefined =
      raw === "yes" || raw === "true"
        ? true
        : raw === "no" || raw === "false"
          ? false
          : /^\d+$/.test(raw)
            ? Number(raw)
            : undefined;
    if (value === undefined)
      throw new Error(`designs: ${last.design.id} ${name}: "${raw}" is not yes, no or a number`);
    last.given[name] = value;
  }
  if (!out.length) throw new Error("designs: list at least one design id, such as D01");
  return out.map(({ design, given }) => {
    try {
      return { design, settings: settingsOf(design, given) };
    } catch (e) {
      throw new Error(`designs: ${(e as Error).message}`);
    }
  });
}

/**
 * One ecosystem per line, `Name: regular expression` matched against the whole owner login.
 * Empty means kleos's defaults. Blank lines and lines starting with # are ignored.
 */
export function parseEcosystems(text = ""): EcosystemRule[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  if (!lines.length) return DEFAULT_ECOSYSTEMS;
  return lines.map((line) => {
    const i = line.indexOf(":");
    const name = line.slice(0, i).trim();
    const match = line.slice(i + 1).trim();
    if (i < 0 || !name || !match)
      throw new Error(`ecosystems: "${line}" should read "Name: regular expression"`);
    try {
      new RegExp(match);
    } catch (e) {
      throw new Error(`ecosystems: ${name}: ${(e as Error).message}`);
    }
    return { name, match };
  });
}

/** The files a design writes: `<ID>-<slug>-dark.svg` and `-light.svg`. */
export const cardFiles = (d: Pick<CatalogDesign, "id" | "slug">) =>
  ({ dark: `${d.id}-${d.slug}-dark.svg`, light: `${d.id}-${d.slug}-light.svg` }) as const;

/** Matches any file kleos writes, so cards of designs dropped from the list can be removed. */
export const CARD_FILE = /^[A-H]\d\d-[a-z0-9-]+-(dark|light)\.svg$/;
