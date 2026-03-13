export interface ComponentNode {
  name: string;
  filePath: string;
  children: string[];
  partens: string[];
}

export type ComponentGraph = Map<string, ComponentNode>;
