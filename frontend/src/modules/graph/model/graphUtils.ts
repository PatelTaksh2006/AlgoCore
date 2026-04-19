import type { GraphEdge, GraphNode } from './graphModel';

export const edgeExists = (
  edges: GraphEdge[],
  sourceId: string,
  targetId: string,
  isDirected: boolean,
): boolean => edges.some((edge) => (
  (edge.source === sourceId && edge.target === targetId)
  || (!isDirected && edge.source === targetId && edge.target === sourceId)
));

export const normalizeNodesForLoad = (nodes: GraphNode[]): GraphNode[] => (
  nodes.map((node) => ({
    ...node,
    originalPos: { x: node.x, y: node.y },
    treePos: null,
  }))
);

export const normalizeEdgesForLoad = (edges: GraphEdge[]): GraphEdge[] => (
  edges.map((edge) => ({
    ...edge,
    classification: null,
  }))
);
