import type { EnvironmentOptions, Plugin } from "vite";

// Environment names only allow [A-Za-z0-9$_].
const envName = (nodeType: string) => nodeType.replace(/[^\w$]/g, "_");

export const runtimeEnvName = (nodeType: string) =>
  `${envName(nodeType)}_runtime`;

const editorDir = (nodeType: string) =>
  `src/nodes/${nodeType}/${nodeType}.html`;

const editorBuildOptions = (nodeType: string): EnvironmentOptions => {
  return {
    consumer: "client",
    build: {
      outDir: `dist/nodes/${nodeType}`,
      rolldownOptions: {
        input: `${editorDir(nodeType)}/index.ts`,
        output: {
          format: "iife",
          entryFileNames: `${nodeType}.html`,
        },
      },
    },
  };
};

// Node-RED 5 loads node files with import() and uses the default export.
const runtimeBuildOptions = (nodeType: string): EnvironmentOptions => {
  return {
    consumer: "server",
    build: {
      outDir: `dist/nodes/${nodeType}`,
      rolldownOptions: {
        input: `src/nodes/${nodeType}/${nodeType}.ts`,
        output: {
          format: "es",
          entryFileNames: `${nodeType}.js`,
        },
      },
    },
  };
};

// Per node type: an editor build (`<type>.html`) and a runtime build
// (`<type>.js`), side by side, as Node-RED expects.
const buildNodes = (nodeType: string): [string, EnvironmentOptions][] => [
  [`${envName(nodeType)}_editor`, editorBuildOptions(nodeType)],
  [runtimeEnvName(nodeType), runtimeBuildOptions(nodeType)],
];

// Builds only our environments, not Vite's default `client`/`ssr` ones.
export const buildNodeEnvironments = (nodeTypes: string[]): Plugin => {
  const environments: Record<string, EnvironmentOptions> = Object.fromEntries(
    nodeTypes.flatMap(buildNodes),
  );

  return {
    name: "build-node-environments",
    // A `builder` key makes `vite build` use the app builder.
    config: () => ({ builder: {}, environments }),
    async buildApp(builder) {
      for (const name of Object.keys(environments)) {
        const env = builder.environments[name];
        // Another buildApp hook may have built it already.
        if (!env.isBuilt) {
          await builder.build(env);
        }
      }
    },
  };
};
