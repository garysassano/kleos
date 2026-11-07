# kleos

> _κλέος_ (KLEH-os), ancient Greek: the renown a person earns through their deeds. Literally "what is heard" about you. In Homer, heroes don't claim it for themselves; other people carry it.

kleos does the same for open source. It turns the work you did in other people's projects into cards for your GitHub profile: the pull requests, issues and discussions you opened, summed per repository, per organization, and per vendor family (such as AWS across `aws`, `awslabs`, `aws-samples` and its other organizations).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="gallery/lists/A03-repos-and-owners-dark.svg">
  <img alt="Example card: the author's top repositories and owners" src="gallery/lists/A03-repos-and-owners-light.svg" width="840">
</picture>

<table>
  <tr>
    <td width="50%"><a href="gallery/README.md#f--flows-and-networks"><picture><source media="(prefers-color-scheme: dark)" srcset="gallery/flows/F01-sankey-dark.svg"><img alt="Contribution Sankey" src="gallery/flows/F01-sankey-light.svg" width="100%"></picture></a><br><sub><b>F01</b> · Contribution Sankey</sub></td>
    <td width="50%"><a href="gallery/README.md#d--visual"><picture><source media="(prefers-color-scheme: dark)" srcset="gallery/visual/D01-orbit-dark.svg"><img alt="Orbit" src="gallery/visual/D01-orbit-light.svg" width="100%"></picture></a><br><sub><b>D01</b> · Orbit</sub></td>
  </tr>
  <tr>
    <td><a href="gallery/README.md#h--focus-and-stories"><picture><source media="(prefers-color-scheme: dark)" srcset="gallery/focus/H01-family-deep-dive-dark.svg"><img alt="Family deep-dive" src="gallery/focus/H01-family-deep-dive-light.svg" width="100%"></picture></a><br><sub><b>H01</b> · Family deep-dive</sub></td>
    <td><a href="gallery/README.md#g--badges-and-collectibles"><picture><source media="(prefers-color-scheme: dark)" srcset="gallery/collectibles/G03-periodic-table-dark.svg"><img alt="Periodic table of owners" src="gallery/collectibles/G03-periodic-table-light.svg" width="100%"></picture></a><br><sub><b>G03</b> · Periodic table of owners</sub></td>
  </tr>
  <tr>
    <td><a href="gallery/README.md#b--charts"><picture><source media="(prefers-color-scheme: dark)" srcset="gallery/charts/B02-treemap-dark.svg"><img alt="Treemap" src="gallery/charts/B02-treemap-light.svg" width="100%"></picture></a><br><sub><b>B02</b> · Treemap</sub></td>
    <td><a href="gallery/README.md#c--typographic"><picture><source media="(prefers-color-scheme: dark)" srcset="gallery/type/C02-terminal-dark.svg"><img alt="Terminal table" src="gallery/type/C02-terminal-light.svg" width="100%"></picture></a><br><sub><b>C02</b> · Terminal table</sub></td>
  </tr>
</table>

**[Browse all 48 designs →](gallery/README.md)** The examples show the author's own contributions.

## How it works

```mermaid
flowchart LR
  A[Scheduled workflow<br/>in your profile repo] --> B[kleos reads your activity<br/>GitHub GraphQL API]
  B --> C[Renders your chosen designs<br/>dark + light SVG]
  C --> D[Commits the images]
  D --> E[Your README shows the one<br/>matching the visitor's theme]
```

kleos runs as a scheduled GitHub Action in your profile repository. There's no server to host and no shared rate limit to run into, and the cards update on whatever schedule you choose.
