import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { nodeRedEditorHtml } from "./node-red-editor-html.ts";

// Hooks are typed as `function | { handler }`; ours are plain functions.
const plugin = nodeRedEditorHtml() as any;

let dir: string;
let entry: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "editor-html-"));
  entry = path.join(dir, "index.ts");
  fs.writeFileSync(entry, "");
  fs.writeFileSync(path.join(dir, "template.html"), "<template/>");
  fs.writeFileSync(path.join(dir, "help.html"), "<help/>");
});

afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("nodeRedEditorHtml", () => {
  it.each([
    ["client", true],
    ["server", false],
  ])("applies to %s environments: %s", (consumer, expected) => {
    expect(plugin.applyToEnvironment({ config: { consumer } })).toBe(expected);
  });

  it("watches the HTML files beside a module", () => {
    const addWatchFile = vi.fn();
    plugin.load.call({ addWatchFile }, entry);
    expect(addWatchFile.mock.calls.flat()).toEqual([
      path.join(dir, "help.html"),
      path.join(dir, "template.html"),
    ]);
  });

  it("ignores virtual modules with no folder on disk", () => {
    const addWatchFile = vi.fn();
    plugin.load.call({ addWatchFile }, "\0virtual:thing");
    expect(addWatchFile).not.toHaveBeenCalled();
  });

  it("wraps the chunk in a script tag and appends the HTML", () => {
    const chunk = { type: "chunk", facadeModuleId: entry, code: "go();" };
    plugin.generateBundle({}, { "x.html": chunk });
    expect(chunk.code).toBe(
      '<script type="text/javascript">\ngo();\n</script>\n' +
        "<help/>\n<template/>",
    );
  });

  it("leaves assets and chunks without an entry module alone", () => {
    const asset = { type: "asset", source: "a" };
    const shared = { type: "chunk", facadeModuleId: null, code: "b" };
    plugin.generateBundle({}, { a: asset, b: shared });
    expect(asset).toEqual({ type: "asset", source: "a" });
    expect(shared.code).toBe("b");
  });
});
