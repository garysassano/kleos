/**
 * The GitHub Action's entry point (action.yml). Inputs arrive as INPUT_* environment variables;
 * see src/action/run.ts for what happens with them.
 */
import { resolve } from "node:path";
import { parseInputs } from "../action/inputs.ts";
import { renderCards } from "../action/run.ts";

const env = process.env;
let config: ReturnType<typeof parseInputs>;
try {
  config = parseInputs({
    user: env.INPUT_USER,
    designs: env.INPUT_DESIGNS,
    outcomes: env.INPUT_PR_OUTCOMES,
    ecosystems: env.INPUT_ECOSYSTEMS,
    defaultEcosystems: env.INPUT_DEFAULT_ECOSYSTEMS?.trim().toLowerCase() !== "false",
    out: env.INPUT_OUT_DIR,
  });
} catch (e) {
  console.log(`::error title=kleos configuration::${(e as Error).message}`);
  process.exit(1);
}

// parseInputs keeps `out` relative and inside the repository.
await renderCards(
  config,
  resolve(env.GITHUB_WORKSPACE ?? ".", config.out),
  env.GITHUB_TOKEN || undefined,
);
