/**
 * Reads and checks the GitHub Action's inputs. Pure: every mistake becomes an error that names the
 * input, so a misconfigured workflow fails on its first run instead of rendering something else.
 * See docs/decisions/0011-action-inputs.md.
 */
import {
  type CatalogDesign,
  OUTCOMES,
  type Outcomes,
  allDesigns,
  outcomesOf,
} from "../designs/index.ts";
import { DEFAULT_ECOSYSTEMS, type EcosystemRule } from "../stats/aggregate.ts";

export interface ActionConfig {
  user: string;
  designs: CatalogDesign[];
  outcomes: Outcomes;
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

  const catalog = allDesigns();
  const ids = (raw.designs ?? "").split(/[\s,]+/).filter(Boolean);
  if (!ids.length) throw new Error("designs: list at least one design id, such as D01");
  const unknown = ids.filter((id) => !catalog.some((d) => d.id === id.toUpperCase()));
  if (unknown.length)
    throw new Error(
      `designs: unknown id ${unknown.join(", ")}; the ids are listed in gallery/README.md`,
    );
  const designs = [...new Set(ids.map((id) => id.toUpperCase()))].map(
    (id) => catalog.find((d) => d.id === id) as CatalogDesign,
  );

  const outcomes = (raw.outcomes?.trim() || "original") as Outcomes;
  if (!OUTCOMES.includes(outcomes))
    throw new Error(`outcomes: "${outcomes}" must be one of ${OUTCOMES.join(", ")}`);
  for (const d of designs)
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
