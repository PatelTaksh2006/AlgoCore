import { algorithms } from '../registry/algorithms.js';

function freezeSnapshot(nodes, edges, isDirected, selectedAlgorithm) {
  // MST algorithms only work on undirected graphs — force undirected
  const effectiveDirected = (selectedAlgorithm === 'prim' || selectedAlgorithm === 'kruskal')
    ? false
    : isDirected;

  const frozenNodes = Object.freeze(
    nodes.map((node) => Object.freeze({ ...node }))
  );

  const frozenEdges = Object.freeze(
    edges.map((edge) => Object.freeze({ ...edge, directed: effectiveDirected }))
  );

  return Object.freeze({ nodes: frozenNodes, edges: frozenEdges, isDirected: effectiveDirected });
}

function resolveStartTarget({ selectedAlgorithm, startNodeId, targetNodeId, nodes }) {
  const evaluatedStartNode = selectedAlgorithm === 'kruskal' || selectedAlgorithm === 'scc'
    ? null
    : (startNodeId || nodes[0]?.id || null);

  let evaluatedTargetNode = targetNodeId;
  if (selectedAlgorithm === 'dijkstra' && !evaluatedTargetNode) {
    evaluatedTargetNode = nodes.find((n) => n.id !== evaluatedStartNode)?.id || null;
  }

  return { evaluatedStartNode, evaluatedTargetNode };
}

export function createAlgorithmGenerator({
  selectedAlgorithm,
  nodes,
  edges,
  isDirected,
  startNodeId,
  targetNodeId,
}) {
  const algoFn = algorithms[selectedAlgorithm];
  if (!algoFn) {
    return null;
  }

  const snapshot = freezeSnapshot(nodes, edges, isDirected, selectedAlgorithm);
  const { evaluatedStartNode, evaluatedTargetNode } = resolveStartTarget({
    selectedAlgorithm,
    startNodeId,
    targetNodeId,
    nodes: snapshot.nodes,
  });

  return algoFn(snapshot.nodes, snapshot.edges, evaluatedStartNode, evaluatedTargetNode);
}
