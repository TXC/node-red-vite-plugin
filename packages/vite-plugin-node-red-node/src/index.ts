import type { PluginOption, Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";
import { buildNodeEnvironments, runtimeEnvName } from "./node-red-nodes.ts";
import { nodeRedEditorHtml } from "./node-red-editor-html.ts";
import dts from "vite-plugin-dts";

interface NodeRedBuilder {
  generateTypes: boolean;
  // Path to the package.json listing the nodes, relative to the working
  // directory. Defaults to the one in the working directory.
  packageJson?: string;
}

// Node types come from the `node-red.nodes` map in the project's package.json.
const readNodeTypes = (packageJson = "package.json"): string[] => {
  const file = path.resolve(packageJson);
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  const nodeTypes = Object.keys(pkg["node-red"]?.nodes ?? {});
  if (nodeTypes.length === 0) {
    throw new Error(`No "node-red.nodes" entries in ${file}`);
  }
  return nodeTypes;
};

// Type declarations for one node, written next to its runtime build.
const typesPlugin = (nodeType: string): Plugin => ({
  name: "vite-plugin-dts",
  ...dts({
    bundleTypes: true,
    tsconfigPath: "./tsconfig.types.json",
    entryRoot: `src/nodes/${nodeType}`,
    include: [`src/nodes/${nodeType}/**/*.ts`],
    exclude: ["**/*.test.ts", "**/*.html/**"],
  }),
  applyToEnvironment: (env) => env.name === runtimeEnvName(nodeType),
});

export const nodeRedBuild = (conf: NodeRedBuilder): PluginOption => {
  const nodeTypes = readNodeTypes(conf.packageJson);
  return [
    ...(conf.generateTypes ? nodeTypes.map(typesPlugin) : []),
    nodeRedEditorHtml(),
    buildNodeEnvironments(nodeTypes),
  ];
};
