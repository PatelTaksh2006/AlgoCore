export type GraphNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  originalPos?: { x: number; y: number };
  treePos?: { x: number; y: number } | null;
  color?: string;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  weight: number;
  classification: string | null;
};

export type GraphState = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  isDirected: boolean;
};

export const createNode = (id: string, label: string, x: number, y: number): GraphNode => ({
  id,
  label,
  x,
  y,
  originalPos: { x, y },
  treePos: null,
});

export const createEdge = (id: string, source: string, target: string, weight = 1): GraphEdge => ({
  id,
  source,
  target,
  weight,
  classification: null,
});
