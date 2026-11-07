import { defineConfig } from "tsdown";

/** The npm package: one bundled ESM file for the `kleos` command (src/cli/kleos.ts). */
export default defineConfig({
  entry: { cli: "src/cli/kleos.ts" },
  format: "esm",
  platform: "node",
  target: "node22",
  outDir: "dist",
  clean: true,
  dts: false,
});
