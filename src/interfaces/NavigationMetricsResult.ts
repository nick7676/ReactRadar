import type { ComponentNode } from "./ComponentNode.js";

export interface NavigationMetricsResult {
  components: ComponentNode[];
  avgDepth: number;
  avgChildren: number;
  totalComponents: number;
  relations: {
    parent: string;
    children: string[];
  }[];
}
