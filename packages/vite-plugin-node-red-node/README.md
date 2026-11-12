# vite-plugin-node-red-node

A Vite plugin that builds custom [Node-RED](https://nodered.org) nodes
written in TypeScript.

For every node in your project it produces the two files Node-RED loads,
side by side:

- **`<type>.html`**: the editor part. Your editor code is bundled and wrapped
  in a `<script>` tag, followed by the node's HTML templates (edit dialog,
  help text).
- **`<type>.js`**: the runtime part, as an ES module with a default export.

A single `vite build` builds every node listed in your `package.json`.

## Requirements

- Node.js 22 or newer
- Vite 8 or newer
- A Node-RED version that loads nodes as ES modules (Node-RED 5)

## Installation

```sh
npm install --save-dev vite vite-plugin-node-red-node
```

## Project layout

The plugin expects one folder per node under `src/nodes/`, named after the
node type:

```text
src/nodes/my-node/
├── my-node.ts               runtime entry, default-exports the node
└── my-node.html/
    ├── index.ts             editor entry, calls RED.nodes.registerType
    ├── editor.html          edit dialog template
    └── help.html            help text
```

Every `.html` file in the `<type>.html/` folder is added to the editor file,
in alphabetical order.

List your nodes in `package.json` the way Node-RED expects. The keys are the
node types the plugin builds:

```json
{
  "node-red": {
    "nodes": {
      "my-node": "./dist/nodes/my-node/my-node.js"
    }
  }
}
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { nodeRedBuild } from "vite-plugin-node-red-node";

export default defineConfig({
  build: {
    // The editor and runtime builds share an output folder;
    // emptying it would delete the other build's file.
    emptyOutDir: false,
  },
  plugins: [nodeRedBuild({ generateTypes: false })],
});
```

Run `vite build` from the project root. For the example above, the result is:

```text
dist/nodes/my-node/
├── my-node.html
└── my-node.js
```

## Options

| Option          | Type      | Description                                                                                                              |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| `generateTypes` | `boolean` | Also write type declarations for each node next to its runtime file. Needs a `tsconfig.types.json` in the project root.  |
| `packageJson`   | `string`  | Path to the `package.json` that lists the nodes, relative to the working directory or absolute. Default: `package.json`. |

## Good to know

- Run Vite from the project root. The source and output paths
  (`src/nodes/…`, `dist/nodes/…`) are relative to the working directory,
  even when `packageJson` points elsewhere.
- The build stops with an error if `package.json` lists no nodes under
  `node-red.nodes`.
- Only the node builds run. Vite's default `client` and `ssr` builds are
  skipped.

## License

MIT
