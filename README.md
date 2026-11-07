# kleos

> _κλέος_ (KLEH-os), ancient Greek: the renown a person earns through their deeds. Literally "what is heard" about you. In Homer, heroes don't claim it for themselves; other people carry it.

kleos does the same for open source. It turns the work you did in other people's projects into cards for your GitHub profile: the pull requests, issues and discussions you opened, summed per repository, per organization, and per ecosystem (such as AWS across `aws`, `awslabs`, `aws-samples` and its other organizations).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="gallery/lists/A03-repos-and-owners-dark.svg">
  <img alt="Example card: the author's top repositories and owners" src="gallery/lists/A03-repos-and-owners-light.svg" width="840">
</picture>

<table>
  <tr>
    <th width="50%">F01 · Sankey</th>
    <th width="50%">D01 · Orbit</th>
  </tr>
  <tr>
    <td><a href="gallery/README.md#f--flows-and-networks"><picture><source media="(prefers-color-scheme: dark)" srcset="gallery/flows/F01-sankey-dark.svg"><img alt="Sankey" src="gallery/flows/F01-sankey-light.svg" width="100%"></picture></a></td>
    <td><a href="gallery/README.md#d--visual"><picture><source media="(prefers-color-scheme: dark)" srcset="gallery/visual/D01-orbit-dark.svg"><img alt="Orbit" src="gallery/visual/D01-orbit-light.svg" width="100%"></picture></a></td>
  </tr>
  <tr>
    <th width="50%">H01 · Ecosystem deep-dive</th>
    <th width="50%">B02 · Treemap</th>
  </tr>
  <tr>
    <td><a href="gallery/README.md#h--focus-and-stories"><picture><source media="(prefers-color-scheme: dark)" srcset="gallery/focus/H01-ecosystem-deep-dive-dark.svg"><img alt="Ecosystem deep-dive" src="gallery/focus/H01-ecosystem-deep-dive-light.svg" width="100%"></picture></a></td>
    <td><a href="gallery/README.md#b--charts"><picture><source media="(prefers-color-scheme: dark)" srcset="gallery/charts/B02-treemap-dark.svg"><img alt="Treemap" src="gallery/charts/B02-treemap-light.svg" width="100%"></picture></a></td>
  </tr>
  <tr>
    <th width="50%">C02 · Terminal</th>
    <th width="50%">G03 · Periodic table</th>
  </tr>
  <tr>
    <td><a href="gallery/README.md#c--typographic"><picture><source media="(prefers-color-scheme: dark)" srcset="gallery/type/C02-terminal-dark.svg"><img alt="Terminal" src="gallery/type/C02-terminal-light.svg" width="100%"></picture></a></td>
    <td><a href="gallery/README.md#g--badges-and-collectibles"><picture><source media="(prefers-color-scheme: dark)" srcset="gallery/collectibles/G03-periodic-table-dark.svg"><img alt="Periodic table" src="gallery/collectibles/G03-periodic-table-light.svg" width="100%"></picture></a></td>
  </tr>
</table>

**[Browse all 48 designs →](gallery/README.md)**

## How it works

A scheduled GitHub Action in your profile repository does the work, so there's no server to host and no shared rate limit to run into. On each run it:

1. reads your contributions through GitHub's GraphQL API,
2. renders the designs you chose, each in a dark and a light version,
3. commits the SVG files; your README shows the one that matches the visitor's theme.

The cards update on whatever schedule you set.

**What counts:** a contribution is a pull request, issue or discussion you opened in a public repo you don't own. Cards sum them per **repo**, per **owner** (the org or person the repo belongs to) and per **ecosystem** (several orgs counted as one, such as AWS across `aws`, `awslabs` and `aws-samples`). Your own repos and private work are left out.

## Set it up

1. Pick designs in the [catalog](gallery/README.md). Each has an id, such as `D01`.
2. Add this workflow to your profile repository (the one named after your username) as `.github/workflows/kleos.yml`:

   ```yaml
   name: kleos
   on:
     schedule:
       - cron: "17 4 * * *" # daily
     workflow_dispatch:
   permissions:
     contents: write
   jobs:
     cards:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v7
         - uses: garysassano/kleos@main
           with:
             designs: |
               D01
               A05 repos=3
   ```

3. Run it once from the **Actions** tab. It commits the cards to a `kleos/` folder, two files per design (dark and light). Later runs commit only when your numbers change.
4. Show a card in your `README.md`. GitHub picks the file that matches the visitor's theme:

   ```html
   <picture>
     <source
       media="(prefers-color-scheme: dark)"
       srcset="kleos/D01-orbit-dark.svg"
     />
     <img alt="Where my contributions go" src="kleos/D01-orbit-light.svg" />
   </picture>
   ```

   The file names are `<id>-<name>-dark.svg` and `-light.svg`; the catalog shows each design's name.

## Configure

| Input                | Default                  | What it does                                                                                                                   |
| -------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `designs`            | required                 | The cards to render: design ids, one per line, each followed by its settings ([design settings](#design-settings)).            |
| `pr-outcomes`        | `full`                   | How PR results are shown: `none` (PRs as one number), `merged` (merged PRs highlighted), or `full` (merged, open, and closed). |
| `ecosystems`         | none                     | Extra ecosystems, one per line ([ecosystems](#ecosystems)).                                                                    |
| `default-ecosystems` | `true`                   | Start from kleos's default ecosystems. `false` uses only yours.                                                                |
| `user`               | the repository owner     | Whose contributions to show.                                                                                                   |
| `out-dir`            | `kleos`                  | Folder for the cards. Cards of designs you remove from `designs` are deleted from it; other files are left alone.              |
| `commit`             | `true`                   | Commit and push the cards when they changed. Set `false` to handle the files in a later step.                                  |
| `commit-message`     | `Update kleos cards`     | Message of that commit.                                                                                                        |
| `token`              | the workflow's own token | Token for GitHub's API. Public data is all kleos reads, so the default is enough.                                              |

A mistake in any input, such as an unknown id or a setting a design doesn't have, fails the run with a message that names it, before anything is fetched.

### Design settings

Some designs have settings, written after the id as `name=value`. Switches take `yes` or `no`, numbers a whole number. Each design's settings are listed in a table under its picture in the [catalog](gallery/README.md), and `npx kleos --list-designs` prints them in the terminal. For example, A05 (ecosystem roll-up) lists every owner under each ecosystem; with `owners=no repos=3` it lists the top 3 repos instead:

```yaml
designs: |
  D01
  A05 owners=no repos=3   # top 3 repos under each ecosystem
```

Text after `#` is a comment. Each design can be listed once.

### PR outcomes

Showing PRs that were never merged can read like a list of failures, so you choose how much to show. `pr-outcomes` applies to every card:

- `none`: PRs as one number.
- `merged`: PRs, with the merged ones highlighted; the rest isn't labeled.
- `full`: merged, still open, and closed without merging.

### Ecosystems

kleos counts these as ecosystems by default: AWS, HashiCorp, OpenTelemetry, Microsoft, Cloudflare and GitHub (each across its orgs, such as `aws`, `awslabs` and `aws-samples`). Add your own, one per line, as a name and a regular expression matched against the owner's login:

```yaml
ecosystems: |
  jdx: ^jdx$                       # one person's projects, counted together
  Google: ^(google|googleapis|GoogleCloudPlatform)$
```

A rule with the same name as a default replaces it. Set `default-ecosystems: false` to use only your own.

## Preview locally

The `kleos` command renders the same cards on your machine, so you can try designs and settings before changing your workflow. It also works in other CI systems, where you commit the output folder yourself. It needs Node.js 22 or later, and nothing to install:

```sh
npx kleos <your-login> -d D01 -d "A05 repos=3"
```

The cards land in `./kleos`; open the `.svg` files in a browser. More examples:

```sh
npx kleos --list-designs                                # every design, with its settings
npx kleos octocat -d A02 --pr-outcomes none -o preview  # into ./preview, without merged counts
npx kleos octocat -d A05 -e "jdx: ^jdx$"                # add an ecosystem
npx kleos octocat -d A05 --no-default-ecosystems -e "AWS: ^aws"
```

Every Action input has a matching flag, and they combine freely:

| Flag                      | Action input                | What it does                                                      |
| ------------------------- | --------------------------- | ----------------------------------------------------------------- |
| `<login>`                 | `user`                      | Whose contributions to show.                                      |
| `-d`, `--design`          | `designs`                   | One card, with its settings: `-d "A05 repos=3"`. Repeat for more. |
| `--pr-outcomes`           | `pr-outcomes`               | `none`, `merged` or `full`.                                       |
| `-e`, `--ecosystem`       | `ecosystems`                | One ecosystem, `"Name: regex"`. Repeat for more.                  |
| `--no-default-ecosystems` | `default-ecosystems: false` | Use only the ecosystems you give.                                 |
| `-o`, `--out-dir`         | `out-dir`                   | Folder for the cards (default `kleos`).                           |
| `--list-designs`          |                             | List every design and its settings.                               |

It reads your data with `GITHUB_TOKEN` (or `GH_TOKEN`) when set, and otherwise with the account the [GitHub CLI](https://cli.github.com) is signed in to. No token scopes are needed.
