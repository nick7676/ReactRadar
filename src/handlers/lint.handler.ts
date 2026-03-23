import chalk from "chalk";
import Table from "cli-table3";
import { ESLint } from "eslint";
import globals from "globals";
import path from "node:path";
import { findComponent } from "../utils/findComponent.js";
import { consoleColor } from "../utils/colorFunction.js";
import { validateDirectory } from "../utils/validateDirectory.js";

export const lintHandler = async (argv: {
  path?: string;
  format?: "table" | "json";
  verbose?: boolean;
}) => {
  const targetDir = argv.path || process.cwd();
  const v = argv.verbose === true;
  const logV = (...lines: string[]) => {
    if (v) console.error(lines.map((l) => chalk.dim(`[lint] ${l}`)).join("\n"));
  };

  try {
    await validateDirectory(targetDir);
  } catch (err) {
    console.error(chalk.red(`\n${(err as Error).message}\n`));
    process.exitCode = 1;
    return;
  }

  logV(`scan root: ${path.resolve(targetDir)}`);

  const files = (await findComponent(targetDir)).map((f) => f.filePath);

  if (!files.length) {
    console.log(
      consoleColor(
        { type: "ansi", color: "yellow" },
        "\nNo React components found.\n"
      )
    );
    return;
  }

  logV(`${files.length} component file(s):`, ...files.map((f) => `  ${f}`));

  const tsPlugin = (await import("@typescript-eslint/eslint-plugin")).default;
  const tsParser = (await import("@typescript-eslint/parser")).default;
  const plugins: Record<string, unknown> = { "@typescript-eslint": tsPlugin };
  const rules: Record<string, unknown> = {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-undef": "error",
    "no-unreachable": "error",
  };

  try {
    const reactHooksPlugin = (await import("eslint-plugin-react-hooks"))
      .default;
    plugins["react-hooks"] = reactHooksPlugin;
    rules["react-hooks/rules-of-hooks"] = "error";
    rules["react-hooks/exhaustive-deps"] = "warn";
  } catch {
    console.warn(
      chalk.yellow(
        "Warning: eslint-plugin-react-hooks not installed — hooks rules skipped."
      )
    );
    logV("plugin react-hooks: not loaded");
  }

  if ("react-hooks" in plugins) {
    logV("plugin react-hooks: loaded");
  }

  logV(`rules: ${Object.keys(rules).sort().join(", ")}`);

  const overrideConfig = {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        React: "readonly",
        JSX: "readonly",
      },
    },
    rules,
  };

  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      overrideConfig,
    ] as unknown as ESLint.Options["overrideConfig"],
  });

  const results = await eslint.lintFiles(files);

  const flat = results.flatMap((r) =>
    r.messages.map((m) => ({
      file: r.filePath,
      line: m.line,
      col: m.column,
      severity: m.severity === 2 ? "error" : ("warn" as const),
      message: m.message,
      rule: m.ruleId ?? "unknown",
    }))
  );

  if (!flat.length) {
    console.log(
      consoleColor(
        { type: "ansi", color: "green" },
        "\n✔ No issues found.\n"
      )
    );
    return;
  }

  if (argv.format === "json") {
    console.log(JSON.stringify(flat, null, 2));
    return;
  }

  console.log(
    consoleColor(
      { type: "keyword", value: "blue" },
      `\nReactRadar Lint Results (${targetDir})\n`
    )
  );

  const table = new Table({
    head: [
      chalk.magenta("file"),
      chalk.magenta("line"),
      chalk.magenta("rule"),
      chalk.magenta("message"),
      chalk.magenta("severity"),
    ],
    style: { head: [], border: [] },
  });

  for (const issue of flat) {
    const severity =
      issue.severity === "error"
        ? chalk.red.bold("error")
        : chalk.yellow("warn");

    table.push([
      chalk.gray(issue.file.replace(targetDir + "/", "")),
      `${issue.line}:${issue.col}`,
      chalk.cyan(issue.rule),
      issue.message,
      severity,
    ]);
  }

  console.log(table.toString());

  const errors = flat.filter((i) => i.severity === "error").length;
  const warns = flat.filter((i) => i.severity === "warn").length;
  console.log(
    consoleColor(
      { type: "keyword", value: "red" },
      `\n${errors} error(s)`
    ) +
      "  " +
      consoleColor(
        { type: "keyword", value: "yellow" },
        `${warns} warning(s)\n`
      )
  );
};
