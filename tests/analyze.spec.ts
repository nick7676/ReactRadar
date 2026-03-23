import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCLI } from "./helpers/cli";

const testDir = path.dirname(fileURLToPath(import.meta.url));

test("analyze command exits with 0 and prints table for project with components", () => {
  const fixture = path.join(testDir, "fixtures/analyze-with-components");
  const { stdout, exitCode } = runCLI(["analyze", "--path", fixture]);
  expect(exitCode).toBe(0);
  expect(stdout).toContain("ReactRadar is scanning");
  expect(stdout).toContain("Button");
});

test("analyze command with --format json outputs parseable JSON", () => {
  const fixture = path.join(testDir, "fixtures/analyze-with-components");
  const { stdout, exitCode } = runCLI([
    "analyze",
    "--path",
    fixture,
    "--format",
    "json",
  ]);
  expect(exitCode).toBe(0);
  const i = stdout.indexOf("[");
  expect(i).toBeGreaterThan(-1);
  const data = JSON.parse(stdout.slice(i)) as Array<{
    componentName: string;
    filePath: string;
    loc: number;
  }>;
  expect(Array.isArray(data)).toBe(true);
  expect(data.some((x) => x.componentName === "Button")).toBe(true);
});

test("analyze command exits with 0 when no components are found", () => {
  const fixture = path.join(testDir, "fixtures/analyze-empty");
  const { stdout, exitCode } = runCLI(["analyze", "--path", fixture]);
  expect(exitCode).toBe(0);
  expect(stdout).toContain("No components found.");
});

test("analyze command exits with 1 when path does not exist", () => {
  const bad = path.join(testDir, "fixtures/does-not-exist-rr");
  const { stdout, stderr, exitCode } = runCLI(["analyze", "--path", bad]);
  expect(exitCode).toBe(1);
  expect(stderr + stdout).toMatch(/No directory found/);
});
