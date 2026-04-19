import { orderNodesFromStart, buildAdjacencyMap } from '../../core/helpers.js';

export function* articulationPoints(nodes, edges, startNodeId) {
  const adjMap = buildAdjacencyMap(nodes, edges, { forceUndirected: true });
  const orderedNodes = orderNodesFromStart(nodes, startNodeId || nodes[0]?.id);

  const discovery = {};
  const low = {};
  const parent = {};
  const ap = new Set();
  const visited = new Set();
  let time = 0;

  const internalState = {
    lowLink: {},
    discovery: {},
    visited: [],
    ap: [],
  };

  for (const n of nodes) {
    discovery[n.id] = -1;
    low[n.id] = -1;
    parent[n.id] = null;
    yield { type: 'SET_NODE_COLOR', nodeId: n.id, color: undefined };
  }

  function* dfs(u) {
    let children = 0;
    time += 1;
    discovery[u] = low[u] = time;
    visited.add(u);

    yield { type: 'SET_LINE', lineIndex: 1 };

    internalState.discovery = { ...discovery };
    internalState.lowLink = { ...low };
    internalState.visited = [...visited];

    yield { type: 'UPDATE_VISITED', nodeId: u };
    yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#fbbf24', internalState: { ...internalState } };
    yield { type: 'LOG', message: `Visited ${nodes.find((n) => n.id === u)?.label}`, internalState: { ...internalState } };

    const neighbors = adjMap[u] || [];
    for (const edge of neighbors) {
      yield { type: 'SET_LINE', lineIndex: 2 };

      const v = edge.to;
      if (v === parent[u]) {
        continue;
      }

      if (visited.has(v)) {
        yield { type: 'SET_LINE', lineIndex: 3 };
        yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'back' };

        low[u] = Math.min(low[u], discovery[v]);
        internalState.lowLink = { ...low };

        yield { type: 'SET_LINE', lineIndex: 4 };
        yield { type: 'LOG', message: `Back-edge to ${nodes.find((n) => n.id === v)?.label}. Low: ${low[u]}`, internalState: { ...internalState } };
      } else {
        children += 1;
        parent[v] = u;
        yield { type: 'UPDATE_PARENT', childId: v, parentId: u };
        yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' };

        yield { type: 'SET_LINE', lineIndex: 5 };
        yield* dfs(v);

        low[u] = Math.min(low[u], low[v]);
        internalState.lowLink = { ...low };

        if (parent[u] !== null && low[v] >= discovery[u]) {
          yield { type: 'SET_LINE', lineIndex: 6 };
          ap.add(u);
          internalState.ap = [...ap];
          yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#f97316', internalState: { ...internalState } };
          yield { type: 'LOG', message: `Articulation Point found: ${nodes.find((n) => n.id === u)?.label}`, internalState: { ...internalState } };
        }
      }
    }

    if (parent[u] === null && children > 1) {
      yield { type: 'SET_LINE', lineIndex: 7 };
      ap.add(u);
      internalState.ap = [...ap];
      yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#f97316', internalState: { ...internalState } };
      yield { type: 'LOG', message: `Root Articulation Point: ${nodes.find((n) => n.id === u)?.label}`, internalState: { ...internalState } };
    }

    if (!ap.has(u)) {
      yield { type: 'SET_LINE', lineIndex: 8 };
      yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#3b82f6', internalState: { ...internalState } };
    }
  }

  yield { type: 'SET_LINE', lineIndex: 0 };
  for (const n of orderedNodes) {
    if (!visited.has(n.id)) {
      yield* dfs(n.id);
    }
  }

  yield {
    type: 'SET_RESULT_DATA',
    data: {
      type: 'ap',
      points: [...ap],
      originalGraph: { nodes, edges },
    },
  };

  yield { type: 'LOG', message: `AP Discovery Completed. Found ${ap.size} points.` };
  yield { type: 'SET_LINE', lineIndex: -1 };
}
