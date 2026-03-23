import { test, expect } from "@playwright/test";
import { runCLI } from "./helpers/cli.js";

test("no command shows help and exits with non-zero", () => {
  const { stderr, exitCode } = runCLI([]);
  expect(exitCode).not.toBe(0);
  expect(stderr).toMatch(/Not enough non-option arguments/i);
});

test("--help flag shows available commands", () => {
  const { stdout, exitCode } = runCLI(["--help"]);
  expect(exitCode).toBe(0);
  expect(stdout).toContain("analyze");
  expect(stdout).toContain("lint");
  expect(stdout).toContain("parents");
  expect(stdout).toContain("watch");
});

test("unknown command is silently accepted (no strict mode)", () => {
  const { stdout, stderr, exitCode } = runCLI(["nonexistent"]);
  expect(exitCode).toBe(0);
  expect(stdout.trim()).toBe("");
  expect(stderr.trim()).toBe("");
});

test("analyze --help shows analyze-specific options", () => {
  const { stdout, exitCode } = runCLI(["analyze", "--help"]);
  expect(exitCode).toBe(0);
  expect(stdout).toContain("--format");
  expect(stdout).toContain("--path");
});

test("lint --help shows verbose option", () => {
  const { stdout, exitCode } = runCLI(["lint", "--help"]);
  expect(exitCode).toBe(0);
  expect(stdout).toContain("--verbose");
});

test("invalid --format choice is rejected", () => {
  const { stderr, exitCode } = runCLI(["analyze", "--format", "xml"]);
  expect(exitCode).not.toBe(0);
  expect(stderr).toMatch(/Invalid values/i);
});
