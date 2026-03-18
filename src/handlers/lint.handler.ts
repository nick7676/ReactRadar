import fs from "fs";
import chalk from "chalk";
import Table from "cli-table3";
import { ESLint } from "eslint";
import globals from "globals";
import { findComponent } from "../utils/findComponent.js";
import { consoleColor } from "../utils/colorFunction.js";

export const lintHandler = async (argv: {
  path?: string;
  format?: "table" | "json";
}) => {
  const targetDir = argv.path || process.cwd();

  if (!fs.existsSync(targetDir)) {
    console.error(chalk.red(`\nNo directory found: ${targetDir}\n`));
    process.exit(1);
  }

  const files = (await findComponent(targetDir)).map((f) => f.name);

  if (!files.length) {
    console.log(
      consoleColor(
        { type: "ansi", color: "yellow" },
        "\nNo React components found.\n"
      )
    );
    return;
  }

  const tsPlugin = (await import("@typescript-eslint/eslint-plugin"))
    .default as any;
  const tsParser = (await import("@typescript-eslint/parser")).default as any;
  const plugins: Record<string, any> = { "@typescript-eslint": tsPlugin };
  const rules: Record<string, any> = {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-undef": "error",
    "no-unreachable": "error",
  };
  try {
    const reactHooksPlugin = (await import("eslint-plugin-react-hooks"))
      .default as any;
    plugins["react-hooks"] = reactHooksPlugin;
    rules["react-hooks/rules-of-hooks"] = "error";
    rules["react-hooks/exhaustive-deps"] = "warn";
  } catch {
    /* optional */
  }

  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      {
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
      },
    ],
  });

  const results = await eslint.lintFiles(files);

  const flat = results.flatMap((r) =>
    r.messages.map((m) => ({
      file: r.filePath,
      line: m.line,
      col: m.column,
      severity: m.severity === 2 ? "error" : "warn",
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
