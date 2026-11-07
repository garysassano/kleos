# 0001 · One public tool repository; the profile repository only consumes it

Date: 2026-11-07

## Context

The goal is a better card on the `garysassano/garysassano` profile README, and maybe a tool other people can use too. The question was whether to keep everything in the profile repository, split into a reusable tool plus the profile, or go further and give the design catalog its own repository.

## Decision

Two repositories with clearly different jobs:

- **`kleos`** (this repository) holds everything reusable: the GitHub fetcher, the aggregation into `Stats`, every card design, the generated catalog, the decision records and, later, the GitHub Action.
- **The profile repository** holds only a workflow that runs the action on a schedule, a small config file (which designs, families and limits), the generated SVGs, and the README that shows them.

The design catalog stays inside `kleos` and does not get its own repository.

## Why

- Designs are code that renders `Stats`. Splitting them from the data model means two repositories changing in lockstep for every new field.
- Other people use it the same way the owner does, by pointing a workflow at the action. Nobody has to fork or host anything.
- Keeping the profile repository thin means its history stays readable: config changes and SVG refreshes, nothing else.
- The catalog doubles as the tool's documentation. `gallery/README.md` shows every design, rendered on GitHub itself, so people choose by looking.

## Rejected

- **Everything in the profile repository.** It works for one person, but nobody else can reuse it, and the README repository fills up with source code.
- **A separate designs repository.** It makes cross-repository changes for every data field, and it has no users of its own.
