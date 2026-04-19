import { orderNodesFromStart, buildAdjacencyMap } from '../../core/helpers.js';
import { STEP_TYPES, createStep } from '../../protocol/stepProtocol.ts';

export function* bfs(nodes, edges, startNodeId) {
  const adjMap = buildAdjacencyMap(nodes, edges);
  const orderedNodes = orderNodesFromStart(nodes, startNodeId || nodes[0]?.id);

  const colors = {};
  const parent = {};
  const parentEdge = {};
  const queue = [];

  const isAncestor = (candidateAncestor, nodeId) => {
    let current = parent[nodeId] ?? null;

    while (current !== null && current !== undefined) {
      if (current === candidateAncestor) {
        return true;
      }
      current = parent[current] ?? null;
    }

    return false;
  };

  yield createStep(STEP_TYPES.SET_LINE, { lineIndex: 0 });

  for (const n of nodes) {
    colors[n.id] = 'WHITE';
    parent[n.id] = null;
    parentEdge[n.id] = null;
    yield createStep(STEP_TYPES.SET_NODE_COLOR, { nodeId: n.id, color: undefined });
  }

  for (const root of orderedNodes) {
    if (colors[root.id] !== 'WHITE') {
      continue;
    }

    yield createStep(STEP_TYPES.SET_LINE, { lineIndex: 1 });

    colors[root.id] = 'GRAY';
    queue.push(root.id);
    yield createStep(STEP_TYPES.DS_UPDATE, { data: [...queue], action: 'push', node: root.id });
    yield createStep(STEP_TYPES.SET_NODE_COLOR, { nodeId: root.id, color: '#fbbf24' });
    yield createStep(STEP_TYPES.UPDATE_VISITED, { nodeId: root.id });

    yield createStep(STEP_TYPES.SET_LINE, { lineIndex: 2 });
    yield createStep(STEP_TYPES.SET_LINE, { lineIndex: 3 });

    while (queue.length > 0) {
      const u = queue.shift();
      yield createStep(STEP_TYPES.DS_UPDATE, { data: [...queue], action: 'pop', node: u });

      yield createStep(STEP_TYPES.SET_LINE, { lineIndex: 4 });

      const neighbors = adjMap[u] || [];
      yield createStep(STEP_TYPES.SET_LINE, { lineIndex: 5 });

      for (const edge of neighbors) {
        if (edge.undirected && edge.id === parentEdge[u]) {
          continue;
        }

        const v = edge.to;
        yield createStep(STEP_TYPES.SET_LINE, { lineIndex: 6 });

        if (colors[v] === 'WHITE') {
          colors[v] = 'GRAY';
          parent[v] = u;
          parentEdge[v] = edge.id;
          queue.push(v);
          yield createStep(STEP_TYPES.UPDATE_VISITED, { nodeId: v });
          yield createStep(STEP_TYPES.UPDATE_PARENT, { childId: v, parentId: u });

          yield createStep(STEP_TYPES.SET_LINE, { lineIndex: 7 });

          yield createStep(STEP_TYPES.DS_UPDATE, { data: [...queue], action: 'push', node: v });
          yield createStep(STEP_TYPES.CLASSIFY_EDGE, { edgeId: edge.id, classification: 'tree' });
          yield createStep(STEP_TYPES.SET_NODE_COLOR, { nodeId: v, color: '#fbbf24' });

          yield createStep(STEP_TYPES.SET_LINE, { lineIndex: 8 });
        } else if (colors[v] === 'GRAY') {
          yield createStep(STEP_TYPES.CLASSIFY_EDGE, { edgeId: edge.id, classification: 'back' });
        } else {
          if (!edge.undirected && isAncestor(u, v)) {
            yield createStep(STEP_TYPES.CLASSIFY_EDGE, { edgeId: edge.id, classification: 'forward' });
          } else {
            yield createStep(STEP_TYPES.CLASSIFY_EDGE, { edgeId: edge.id, classification: 'cross' });
          }
        }

        yield createStep(STEP_TYPES.SET_LINE, { lineIndex: 5 });
      }

      colors[u] = 'BLACK';
      yield createStep(STEP_TYPES.SET_NODE_COLOR, { nodeId: u, color: '#3b82f6' });
    }
  }

  yield createStep(STEP_TYPES.SET_LINE, { lineIndex: -1 });
}
