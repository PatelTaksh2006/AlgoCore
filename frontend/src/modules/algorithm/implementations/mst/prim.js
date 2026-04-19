import { buildAdjacencyMap, orderNodesFromStart } from '../../core/helpers.js';

export function* prim(nodes, edges, startNodeId) {
  const adjMap = buildAdjacencyMap(nodes, edges, { forceUndirected: true });
  const orderedNodes = orderNodesFromStart(nodes, startNodeId || nodes[0]?.id);

  const key = {};
  const parent = {};
  const inMST = {};
  const pq = [];

  yield { type: 'SET_LINE', lineIndex: 0 };

  for (const n of nodes) {
    key[n.id] = Infinity;
    inMST[n.id] = false;
    yield { type: 'SET_NODE_COLOR', nodeId: n.id, color: undefined };
  }

  let seeded = false;

  for (const root of orderedNodes) {
    if (inMST[root.id]) {
      continue;
    }

    if (!seeded) {
      yield { type: 'SET_LINE', lineIndex: 1 };
      seeded = true;
    }

    key[root.id] = 0;
    pq.push({ id: root.id, k: 0 });
    yield { type: 'DS_UPDATE', data: [...pq], action: 'push' };
    yield { type: 'UPDATE_VISITED', nodeId: root.id };
    yield { type: 'SET_LINE', lineIndex: 2 };

    while (pq.length > 0) {
      pq.sort((a, b) => a.k - b.k);
      yield { type: 'DS_UPDATE', data: [...pq], action: 'update' };

      const { id: u } = pq.shift();
      yield { type: 'DS_UPDATE', data: [...pq], action: 'pop' };
      yield { type: 'SET_LINE', lineIndex: 3 };

      if (inMST[u]) continue;
      inMST[u] = true;

      yield { type: 'SET_LINE', lineIndex: 4 };
      yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#3b82f6' };

      if (parent[u]) {
        const p = parent[u];
        const edge = adjMap[p].find((e) => e.to === u);
        if (edge) yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' };
      }

      const neighbors = adjMap[u] || [];
      yield { type: 'SET_LINE', lineIndex: 5 };

      for (const edge of neighbors) {
        const v = edge.to;
        const weight = Number(edge.weight);

        yield { type: 'SET_LINE', lineIndex: 6 };

        if (!inMST[v] && weight < key[v]) {
          key[v] = weight;
          parent[v] = u;

          yield { type: 'SET_LINE', lineIndex: 7 };
          yield { type: 'SET_LINE', lineIndex: 8 };

          pq.push({ id: v, k: weight });
          yield { type: 'UPDATE_VISITED', nodeId: v };
          yield { type: 'UPDATE_PARENT', childId: v, parentId: u };

          yield { type: 'DS_UPDATE', data: [...pq], action: 'push' };
          yield { type: 'SET_NODE_COLOR', nodeId: v, color: '#fbbf24' };

          yield { type: 'SET_LINE', lineIndex: 9 };
        }

        yield { type: 'SET_LINE', lineIndex: 5 };
      }

      yield { type: 'SET_LINE', lineIndex: 2 };
    }
  }

  yield { type: 'SET_LINE', lineIndex: -1 };
}
