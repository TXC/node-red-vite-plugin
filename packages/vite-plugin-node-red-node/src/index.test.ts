import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { nodeRedBuild } from "./index.ts";

let dir: string;

const writePackageJson = (pkg: object, file = "package.json") => {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), JSON.stringify(pkg));
};

const environmentNames = (plugins: any[]) =>
  Object.keys(
    plugins.find((p) => p.name === "build-node-environments").config()
      .environments,
  );

const pluginNames = (generateTypes: boolean) =>
  (nodeRedBuild({ generateTypes }) as any[]).map((p) => p.name);

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "node-red-build-"));
  vi.spyOn(process, "cwd").mockReturnValue(dir);
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("nodeRedBuild", () => {
  it("reads node types from the project's package.json", () => {
    writePackageJson({ "node-red": { nodes: { "my-node": "./x.js" } } });
    const plugins = nodeRedBuild({ generateTypes: false }) as any[];
    expect(environmentNames(plugins)).toEqual([
      "my_node_editor",
      "my_node_runtime",
    ]);
  });

  it.each([
    ["relative to the working directory", "config/package.json"],
    ["absolute", "<dir>/config/package.json"],
  ])("reads the package.json given as a path, %s", (_case, file) => {
    writePackageJson(
      { "node-red": { nodes: { a: "" } } },
      "config/package.json",
    );
    const packageJson = file.replace("<dir>", dir);
    const plugins = nodeRedBuild({ generateTypes: false, packageJson });
    expect(environmentNames(plugins as any[])).toEqual([
      "a_editor",
      "a_runtime",
    ]);
  });

  it.each([
    ["no node-red section", {}],
    ["no nodes", { "node-red": { nodes: {} } }],
  ])("throws when package.json has %s", (_case, pkg) => {
    writePackageJson(pkg);
    expect(() => nodeRedBuild({ generateTypes: false })).toThrow(
      /No "node-red.nodes" entries/,
    );
  });

  it("adds no type generation unless asked", () => {
    writePackageJson({ "node-red": { nodes: { a: "", b: "" } } });
    expect(pluginNames(false)).toEqual([
      "node-red-editor-html",
      "build-node-environments",
    ]);
  });

  it("generates types per node, only in that node's runtime build", () => {
    writePackageJson({ "node-red": { nodes: { a: "", "b-c": "" } } });
    const [typesA, typesB] = nodeRedBuild({ generateTypes: true }) as any[];
    expect(pluginNames(true)).toHaveLength(4);
    expect(typesA.applyToEnvironment({ name: "a_runtime" })).toBe(true);
    expect(typesA.applyToEnvironment({ name: "a_editor" })).toBe(false);
    expect(typesA.applyToEnvironment({ name: "b_c_runtime" })).toBe(false);
    expect(typesB.applyToEnvironment({ name: "b_c_runtime" })).toBe(true);
  });
});
