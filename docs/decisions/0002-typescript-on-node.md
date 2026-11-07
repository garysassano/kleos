# 0002 · TypeScript on Node LTS, with Biome, TypeScript 7, tsdown, Vitest and mise

Date: 2026-11-07

## Context

The owner usually writes TypeScript or Rust, and asked whether a scripting language such as Lua would suit GitHub better.

The work has three parts: about 30 GraphQL requests, a few thousand objects to aggregate, and string templating of SVG. None of it is CPU-bound.

## Decision

TypeScript, run on **Node 26 (the current LTS)**. The toolchain follows the owner's other repositories and uses the newest stable releases:

- **mise** pins Node (major `26`) and pnpm (exact version, matching `packageManager` in `package.json`).
- **pnpm** with `minimumReleaseAge: 4320`: a dependency must have been published for at least three days before it can be installed. All dev dependencies are pinned exactly.
- **Node runs `.ts` files directly** through built-in type stripping, so there is no tsx and no build step to run the CLIs. The tsconfig enables `erasableSyntaxOnly`, so no enums, namespaces or parameter properties sneak in.
- **TypeScript 7**, the native compiler, for type checking only (`tsc --noEmit`).
- **Biome** for linting and formatting TypeScript and JSON; **Prettier** for Markdown only.
- **tsdown**, VoidZero's library bundler built on Rolldown, for the day something has to be bundled: the GitHub Action, or a Cloudflare Worker.
- **Vitest** for tests.

## Why

- SVG is text, so the language that templates strings most comfortably wins. Template literals with types do that well.
- The same code runs in a GitHub Action, locally, and on Cloudflare Workers if an interactive page is ever added ([0003](0003-static-svgs-from-actions.md)). No second implementation is needed.
- Rust would add a wasm build for Workers and a slower edit-and-look loop for visual work, and its speed doesn't matter for I/O-bound work.
- Lua and other scripting languages don't matter: GitHub never runs code in a README. Whatever generates it, the output is an SVG image.

## Rejected

- **Rust.** It's the right tool for heavy work, but this isn't heavy work, and quick visual iteration matters more.
- **Lua, Python, shell.** There is no rendering advantage, the owner uses none of them day to day, and they can't run on Workers.
- **Node 24.** It was considered because it matches GitHub Actions' `node24` runtime for JavaScript actions. It was rejected because the action can be a composite action that installs Node 26 itself, and the owner standardizes on the current LTS.

## Update, 2026-11-07

The Action runs the sources directly and needs no bundle. tsdown bundles the npm CLI instead, because Node won't strip types from files inside `node_modules` ([0013](0013-npm-cli.md)).
