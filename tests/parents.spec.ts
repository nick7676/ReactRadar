import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCLI } from "./helpers/cli.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));

test("parents exits 0 and shows tree for navigation fixture", () => {
  const fixture = path.join(testDir, "fixtures/navigation");
  const { stdout, exitCode } = runCLI(["parents", "--path", fixture]);
  expect(exitCode).toBe(0);
  expect(stdout).toContain("App");
  expect(stdout).toContain("Header");
  expect(stdout).toContain("Main");
  expect(stdout).toContain("Content");
});

test("parents --format json outputs parseable JSON with components", () => {
  const fixture = path.join(testDir, "fixtures/navigation");
  const { stdout, exitCode } = runCLI([
    "parents",
    "--path",
    fixture,
    "--format",
    "json",
  ]);
  expect(exitCode).toBe(0);
  const data = JSON.parse(stdout) as {
    totalComponents: number;
    components: { name: string; children: string[]; parents: string[] }[];
    relations: { parent: string; children: string[] }[];
  };
  expect(data.totalComponents).toBeGreaterThan(0);
  expect(Array.isArray(data.components)).toBe(true);

  const app = data.components.find((c) => c.name === "App");
  expect(app).toBeDefined();
  expect(app!.children).toContain("Header");
  expect(app!.children).toContain("Main");
});

test("parents --format json includes correct parent-child relations", () => {
  const fixture = path.join(testDir, "fixtures/navigation");
  const { stdout } = runCLI([
    "parents",
    "--path",
    fixture,
    "--format",
    "json",
  ]);
  const data = JSON.parse(stdout) as {
    components: { name: string; children: string[]; parents: string[] }[];
  };
  const header = data.components.find((c) => c.name === "Header");
  expect(header).toBeDefined();
  expect(header!.parents).toContain("App");
});

test("parents on flat fixture (no nesting) shows components without relations", () => {
  const fixture = path.join(testDir, "fixtures/parents-flat");
  const { stdout, exitCode } = runCLI([
    "parents",
    "--path",
    fixture,
    "--format",
    "json",
  ]);
  expect(exitCode).toBe(0);
  const data = JSON.parse(stdout) as {
    totalComponents: number;
    relations: unknown[];
  };
  expect(data.totalComponents).toBe(2);
  expect(data.relations.length).toBe(0);
});

test("parents exits 0 with no-components message on empty fixture", () => {
  const fixture = path.join(testDir, "fixtures/analyze-empty");
  const { stdout, exitCode } = runCLI(["parents", "--path", fixture]);
  expect(exitCode).toBe(0);
  expect(stdout).toMatch(/No React components found/);
});

test("parents exits 1 when path does not exist", () => {
  const bad = path.join(testDir, "fixtures/does-not-exist-parents");
  const { stderr, exitCode } = runCLI(["parents", "--path", bad]);
  expect(exitCode).toBe(1);
  expect(stderr).toMatch(/No directory found/);
});
