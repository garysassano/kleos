# 0011 · The Action is configured through its inputs, not a config file

Date: 2026-11-07

## Context

[0001](0001-one-tool-repo.md) planned a small config file in the profile repository (which designs, ecosystems and limits) next to the workflow that runs the Action. Building the Action meant choosing that file's format and how the Action finds it.

## Decision

`action.yml` at the repository root is a composite action, used as `garysassano/kleos@main`. Its settings are inputs under `with:` in the profile repository's workflow; there is no separate config file. This supersedes the config file in 0001.

| Input            | Meaning                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| `designs`        | Required. Design ids, such as `D01 A05`, each optionally followed by its settings ([0012](0012-design-settings.md)). |
| `user`           | Whose contributions to show. Defaults to the repository owner.                                                       |
| `outcomes`       | `none`, `merged` or `full` (default) ([0009](0009-outcomes-option.md)).                                              |
| `ecosystems`     | One `Name: regular expression` per line, matched against owner logins. Replaces `DEFAULT_ECOSYSTEMS` when set.       |
| `out`            | Folder for the cards, `kleos` by default. Files are named `<ID>-<slug>-{dark,light}.svg`, like the catalog.          |
| `commit`         | Commit and push changed cards, `true` by default. Nothing is committed when the cards didn't change.                 |
| `commit-message` | That commit's message.                                                                                               |
| `token`          | GraphQL token. The workflow's own `GITHUB_TOKEN` is enough, because every counted contribution is in a public repo.  |

- **Node 26 runs the TypeScript sources directly** from the checked-out action ([0002](0002-typescript-on-node.md)). kleos has no runtime dependencies, so there is no install or build step.
- **Every input is checked before anything is fetched.** An unknown design id, an unsupported `outcomes` level for a listed design, or an invalid regular expression fails the run with an error naming the input.
- **Cards of designs removed from `designs` are deleted** from `out`. Other files there are left alone.
- **Excluding repos or owners** isn't an input yet. It can be added when someone needs it without breaking existing workflows.

## Why

- **One file to read.** The workflow is already YAML in the profile repository, so the settings sit next to the schedule that uses them.
- **No dependency.** Node has no YAML parser, and a JSON config can't hold comments. Inputs arrive as environment variables, which need no parser.
- **GitHub documents and validates inputs.** `action.yml` describes each one, and the Marketplace page lists them.

## Rejected

- **A `kleos.yml` config file.** It needs a YAML parser shipped with the Action, or a vendored one, and splits the setup across two files.
- **Inputs that are a JSON string.** They're hard to write and to read in a workflow.
