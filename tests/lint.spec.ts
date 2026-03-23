import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCLI } from "./helpers/cli.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));

test("lint exits 0 and reports no issues on clean fixture", () => {
  const fixture = path.join(testDir, "fixtures/lint-clean");
  const { stdout, exitCode } = runCLI(["lint", "--path", fixture]);
  expect(exitCode).toBe(0);
  expect(stdout).toMatch(/No issues found/);
});

test("lint exits 0 and reports issues on fixture with problems", () => {
  const fixture = path.join(testDir, "fixtures/lint-with-issues");
  const { stdout, exitCode } = runCLI(["lint", "--path", fixture]);
  expect(exitCode).toBe(0);
  expect(stdout).toContain("unused");
});

test("lint --format json outputs parseable JSON array", () => {
  const fixture = path.join(testDir, "fixtures/lint-with-issues");
  const { stdout, exitCode } = runCLI([
    "lint",
    "--path",
    fixture,
    "--format",
    "json",
  ]);
  expect(exitCode).toBe(0);
  const data = JSON.parse(stdout) as unknown[];
  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBeGreaterThan(0);
});

test("lint --format json on clean fixture outputs empty array", () => {
  const fixture = path.join(testDir, "fixtures/lint-clean");
  const { stdout, exitCode } = runCLI([
    "lint",
    "--path",
    fixture,
    "--format",
    "json",
  ]);
  expect(exitCode).toBe(0);
  expect(stdout).toMatch(/No issues found/);
});

test("lint --verbose writes diagnostics to stderr", () => {
  const fixture = path.join(testDir, "fixtures/lint-with-issues");
  const { stderr, exitCode } = runCLI([
    "lint",
    "--path",
    fixture,
    "--verbose",
  ]);
  expect(exitCode).toBe(0);
  expect(stderr).toContain("[lint]");
  expect(stderr).toContain("scan root");
});

test("lint exits 1 when path does not exist", () => {
  const bad = path.join(testDir, "fixtures/does-not-exist-lint");
  const { stderr, exitCode } = runCLI(["lint", "--path", bad]);
  expect(exitCode).toBe(1);
  expect(stderr).toMatch(/No directory found/);
});

test("lint on empty fixture reports no components", () => {
  const fixture = path.join(testDir, "fixtures/analyze-empty");
  const { stdout, exitCode } = runCLI(["lint", "--path", fixture]);
  expect(exitCode).toBe(0);
  expect(stdout).toMatch(/No React components found/);
});
