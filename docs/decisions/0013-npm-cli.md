# 0013 · A `kleos` command on npm, bundled from the same sources

Date: 2026-11-07

## Context

The Action ([0011](0011-action-inputs.md)) is the way to get cards onto a profile, but trying a design or a setting meant changing a workflow and waiting for a run. People on other CI systems can't use a GitHub Action at all. The npm name `kleos` was also free.

## Decision

- **`kleos <login> -d <design> [-d …] [--pr-outcomes …] [-e …] [--no-default-ecosystems] [-o …]`** renders the cards like the Action, without committing. Each Action input has a flag of the same name (`--design` and `--ecosystem` are repeatable, one value each), they go through the same parser, and errors name the flag. `--list-designs` prints every design with its settings.
- **One shared runner,** `src/action/run.ts`, does the fetching, rendering and cleanup for both.
- **The package ships one bundled file,** `dist/cli.mjs`, built by tsdown on `pnpm pack`. Node runs the TypeScript sources directly in this repository ([0002](0002-typescript-on-node.md)), but not from inside `node_modules`, so the published package can't rely on that. The bundle targets Node 22, the oldest supported.
- **Credentials:** `GITHUB_TOKEN` or `GH_TOKEN`, otherwise the GitHub CLI's signed-in account.
- **CI packs the package and runs the packed CLI on Node 22.**
- **Publishing** happens only when the owner agrees. The first version is published by hand, because npm trusted publishing (provenance from CI) can only be set up for a package that already exists; later versions are published from CI with provenance, together with the Action's version tag.

## Rejected

- **Running the sources with a TypeScript loader at runtime:** a dependency and slower start for no benefit over a bundle.
- **A separate package or repository for the CLI:** it would duplicate the parser and runner that the Action already tests.
