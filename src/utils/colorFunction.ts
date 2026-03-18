import chalk from "chalk";

export type ConsoleColorInput =
  | { type: "ansi"; color: keyof typeof chalk }
  | { type: "hex"; value: string }
  | { type: "rgb"; value: [number, number, number] }
  | { type: "keyword"; value: string };

export function consoleColor(
  color: ConsoleColorInput,
  ...texts: string[]
): string {
  const joined = texts.join(" ");

  switch (color.type) {
    case "ansi":
      return (chalk[color.color] as any)(joined);
    case "hex":
      return chalk.hex(color.value)(joined);
    case "rgb":
      return chalk.rgb(...color.value)(joined);
    case "keyword":
      return chalk.keyword(color.value)(joined);
    default:
      return joined;
  }
}
