import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import fs from "node:fs";

// Shared library build for every package in `packages/*`. Run from the
// package folder (`vite build --config ../../vite.config.ts`), so the
// paths below and package.json are that package's.
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

// Dependencies stay imports; only the package's own code is bundled.
const deps = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies });
const external = [/^node:/, ...deps.map((d) => new RegExp(`^${d}(/|$)`))];

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index",
    },
    minify: false,
    rolldownOptions: { external },
  },
  plugins: [
    dts({
      bundleTypes: true,
      include: ["src"],
      exclude: ["src/**/*.test.ts"],
    }),
  ],
});
