import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { nodeRedBuild } from "./index.ts";

let dir: string;

const writePackageJson = (pkg: object) =>
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify(pkg));

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
    const envs = plugins
      .find((p) => p.name === "build-node-environments")
      .config().environments;
    expect(Object.keys(envs)).toEqual(["my_node_editor", "my_node_runtime"]);
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
