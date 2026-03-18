export interface ComponentNode {
  name: string;
  filePath: string;
  children: string[];
  parents: string[];
  depth?: number | undefined;
}

export type ComponentGraph = Map<string, ComponentNode>;
