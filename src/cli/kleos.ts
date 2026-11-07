#!/usr/bin/env node
/**
 * The npm CLI: the GitHub Action without the commit, for previewing cards and for other CI systems.
 * Flags mirror the Action's inputs and go through the same parser (decision 0013).
 *
 * Uses $GITHUB_TOKEN (or $GH_TOKEN) when set; otherwise the GitHub CLI's signed-in account.
 */
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import pkg from "../../package.json" with { type: "json" };
import { parseInputs } from "../action/inputs.ts";
import { renderCards } from "../action/run.ts";
import { allDesigns, outcomesOf, settingsOf } from "../designs/index.ts";
import { DEFAULT_ECOSYSTEMS } from "../stats/aggregate.ts";

const CATALOG = "https://github.com/garysassano/kleos/blob/main/gallery/README.md";

const HELP = `kleos ${pkg.version}: SVG cards of the PRs, issues and discussions you opened in other people's repos.

Usage
  kleos <login> --design <id> [--design <id> …] [options]
  kleos --list-designs

Cards
  -d, --design <id [setting=value …]>
                          A card to render, by design id, with its settings after it. Repeat for
                          more cards: -d D01 -d "A05 owners=no repos=3". Ids and settings are in
                          kleos --list-designs and the catalog: ${CATALOG}
      --pr-outcomes <level>
                          How PR results are shown on every card: none (PRs as one number),
                          merged (merged PRs highlighted) or full (merged, open and closed). Default full.

Ecosystems (several orgs counted as one, such as AWS)
  -e, --ecosystem <"Name: regex">
                          Add an ecosystem: a name and a regular expression matched against owner
                          logins, such as -e "jdx: ^jdx$". Repeat for more. A default's name
                          replaces that default. Defaults: ${DEFAULT_ECOSYSTEMS.map((e) => e.name).join(", ")}.
      --no-default-ecosystems
                          Use only the ecosystems given with --ecosystem.

Output
  -o, --out-dir <dir>     Folder for the cards, created if missing (default kleos). Each card is
                          written as <ID>-<name>-dark.svg and -light.svg; card files of designs
                          you no longer list are removed, other files are left alone.

Other
      --list-designs      List every design with its id, title and settings, then exit.
  -h, --help              Show this help.
  -v, --version           Show the version.

Examples
  kleos octocat -d D01                              one card into ./kleos
  kleos octocat -d D01 -d "A05 repos=3" -o preview  two cards into ./preview
  kleos octocat -d A02 --pr-outcomes none           PRs without merged or closed counts
  kleos octocat -d A05 -e "jdx: ^jdx$"              add an ecosystem to the defaults

Authentication
  GITHUB_TOKEN or GH_TOKEN when set, otherwise the account the GitHub CLI (gh) is signed in to.
  Public data is enough; the token needs no scopes.`;

function listDesigns(): string {
  const lines: string[] = [];
  for (const d of allDesigns()) {
    const levels =
      outcomesOf(d).length === 3 ? "" : `  (pr-outcomes: ${outcomesOf(d).join(", ")} only)`;
    lines.push(`${d.id}  ${d.title}${levels}`);
    const defaults = settingsOf(d);
    for (const s of d.settings ?? []) {
      const v = defaults[s.name];
      const shown = typeof v === "boolean" ? (v ? "yes" : "no") : String(v);
      const range =
        s.max !== undefined ? `, ${s.min}–${s.max}` : typeof v === "boolean" ? ", yes or no" : "";
      lines.push(`       ${s.name}=${shown}  (default${range})  ${s.description}`);
    }
  }
  return `${lines.join("\n")}\n\nPictures of every design: ${CATALOG}`;
}

let parsed: ReturnType<typeof parse>;
function parse() {
  return parseArgs({
    allowPositionals: true,
    options: {
      design: { type: "string", short: "d", multiple: true },
      "pr-outcomes": { type: "string" },
      ecosystem: { type: "string", short: "e", multiple: true },
      "no-default-ecosystems": { type: "boolean" },
      "out-dir": { type: "string", short: "o" },
      "list-designs": { type: "boolean" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });
}
try {
  parsed = parse();
} catch (e) {
  console.error(`kleos: ${(e as Error).message}\nRun kleos --help for usage.`);
  process.exit(2);
}
const { values, positionals } = parsed;

if (values.help) {
  console.log(HELP);
  process.exit(0);
}
if (values.version) {
  console.log(pkg.version);
  process.exit(0);
}
if (values["list-designs"]) {
  console.log(listDesigns());
  process.exit(0);
}
if (positionals.length !== 1) {
  console.error(
    "kleos: give exactly one GitHub login, such as kleos octocat -d D01.\nRun kleos --help for usage.",
  );
  process.exit(2);
}
if (!values.design?.length) {
  console.error(
    "kleos: choose at least one card with --design, such as -d D01.\nRun kleos --list-designs to see them.",
  );
  process.exit(2);
}

let config: ReturnType<typeof parseInputs>;
try {
  config = parseInputs(
    {
      user: positionals[0],
      designs: values.design.join("\n"),
      outcomes: values["pr-outcomes"],
      ecosystems: values.ecosystem?.join("\n"),
      defaultEcosystems: !values["no-default-ecosystems"],
      out: values["out-dir"],
    },
    { anywhere: true },
  );
} catch (e) {
  // The parser names Action inputs ("designs: …"); point at the matching flag instead.
  const message = (e as Error).message
    .replace(/^designs: /, "--design: ")
    .replace(/^ecosystems: /, "--ecosystem: ")
    .replace(/^(pr-outcomes|out-dir): /, "--$1: ");
  console.error(`kleos: ${message}`);
  process.exit(2);
}

try {
  await renderCards(
    config,
    resolve(config.out),
    process.env.GITHUB_TOKEN || process.env.GH_TOKEN || undefined,
  );
} catch (e) {
  const message = (e as Error).message;
  console.error(
    /gh api graphql|ENOENT/.test(message)
      ? `kleos: couldn't reach GitHub through the GitHub CLI (${message.split("\n")[0]}).\nSet GITHUB_TOKEN, or install gh and run gh auth login.`
      : `kleos: ${message}`,
  );
  process.exit(1);
}
