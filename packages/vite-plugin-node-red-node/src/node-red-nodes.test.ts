import { describe, expect, it, vi } from "vitest";
import { buildNodeEnvironments } from "./node-red-nodes.ts";

// Hooks are typed as `function | { handler }`; ours are plain functions.
const environmentsFor = (nodeTypes: string[]) =>
  (buildNodeEnvironments(nodeTypes) as any).config().environments;

describe("buildNodeEnvironments", () => {
  it("turns on the app builder", () => {
    const plugin = buildNodeEnvironments(["a"]) as any;
    expect(plugin.config().builder).toEqual({});
  });

  it("adds an editor and a runtime environment per node type", () => {
    const envs = environmentsFor(["my-node", "other"]);
    expect(Object.keys(envs)).toEqual([
      "my_node_editor",
      "my_node_runtime",
      "other_editor",
      "other_runtime",
    ]);
  });

  it("builds the editor as an IIFE .html file", () => {
    const editor = environmentsFor(["my-node"]).my_node_editor;
    expect(editor.consumer).toBe("client");
    expect(editor.build.outDir).toBe("dist/nodes/my-node");
    expect(editor.build.rolldownOptions).toEqual({
      input: "src/nodes/my-node/my-node.html/index.ts",
      output: { format: "iife", entryFileNames: "my-node.html" },
    });
  });

  it("builds the runtime as an ES module .js file", () => {
    const runtime = environmentsFor(["my-node"]).my_node_runtime;
    expect(runtime.consumer).toBe("server");
    expect(runtime.build.outDir).toBe("dist/nodes/my-node");
    expect(runtime.build.rolldownOptions).toEqual({
      input: "src/nodes/my-node/my-node.ts",
      output: { format: "es", entryFileNames: "my-node.js" },
    });
  });

  it("builds only its own environments that are not built yet", async () => {
    const plugin = buildNodeEnvironments(["a"]) as any;
    const environments = {
      a_editor: { isBuilt: true },
      a_runtime: { isBuilt: false },
      client: { isBuilt: false },
    };
    const build = vi.fn();
    await plugin.buildApp({ environments, build });
    expect(build.mock.calls).toEqual([[environments.a_runtime]]);
  });
});
