import { chromium } from "playwright-core";
import chalk from "chalk";
import ora from "ora";

interface RenderEntry {
  __reactRadar: boolean;
  componentName: string;
  renderTime: number;
  timestamp: string;
}

function isRenderEntry(obj: unknown): obj is RenderEntry {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "__reactRadar" in obj &&
    (obj as RenderEntry).__reactRadar === true &&
    typeof (obj as RenderEntry).componentName === "string" &&
    typeof (obj as RenderEntry).renderTime === "number" &&
    typeof (obj as RenderEntry).timestamp === "string"
  );
}

function formatRenderLine(entry: RenderEntry): string {
  const time = entry.timestamp.split("T")[1]?.split(".")[0] ?? "??:??:??";
  const timeColor =
    entry.renderTime < 5
      ? chalk.green
      : entry.renderTime < 16
        ? chalk.yellow
        : chalk.red;

  return (
    chalk.cyan(`[${time}]`) +
    " " +
    chalk.bold.white(entry.componentName.padEnd(30)) +
    " render: " +
    timeColor(`${entry.renderTime} ms`)
  );
}

export async function watchHandler(argv: { port: number }) {
  const url = `http://localhost:${argv.port}`;
  const spinner = ora(`Connessione a ${url}...`).start();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { timeout: 10000 });
  } catch {
    spinner.fail(chalk.red(`Impossibile connettersi a ${url}.`));
    await browser.close();
    process.exit(1);
  }

  spinner.succeed(chalk.green(`Connesso a ${url} — monitoraggio attivo\n`));
  console.log(chalk.gray("Premi Ctrl+C per interrompere.\n"));

  await page.addInitScript(() => {
    const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) return;

    const originalOnCommitFiberRoot = hook.onCommitFiberRoot?.bind(hook);
    hook.onCommitFiberRoot = (
      rendererID: number,
      root: any,
      priorityLevel: any,
    ) => {
      originalOnCommitFiberRoot?.(rendererID, root, priorityLevel);
      traverseFiber(root.current);
    };

    function traverseFiber(fiber: any) {
      if (!fiber) return;
      const name =
        fiber.type?.displayName ||
        fiber.type?.name ||
        (typeof fiber.type === "string" ? fiber.type : null);

      if (name && /^[A-Z]/.test(name)) {
        console.log(
          JSON.stringify({
            __reactRadar: true,
            componentName: name,
            renderTime: parseFloat((fiber.actualDuration ?? 0).toFixed(3)),
            timestamp: new Date().toISOString(),
          }),
        );
      }
      traverseFiber(fiber.child);
      traverseFiber(fiber.sibling);
    }
  });

  await page.reload();

  page.on("console", (msg) => {
    const text = msg.text();
    if (!text) return;

    try {
      const parsed: unknown = JSON.parse(text);
      if (!isRenderEntry(parsed)) return;
      console.log(formatRenderLine(parsed));
    } catch {}
  });

  page.on("close", async () => {
    console.log(chalk.yellow("\nPagina chiusa. Disconnessione..."));
    await browser.close();
    process.exit(0);
  });

  await new Promise<void>((resolve) => {
    process.on("SIGINT", async () => {
      console.log(chalk.yellow("\nInterruzione. Chiusura browser..."));
      await browser.close();
      resolve();
      process.exit(0);
    });
  });
}
