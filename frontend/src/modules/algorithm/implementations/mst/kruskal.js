import { compareEdgesDeterministically } from '../../core/helpers.js';

export function* kruskal(nodes, edges, startNodeId) {
  const sortedEdges = [...edges].sort((a, b) => {
    const weightDiff = Number(a.weight) - Number(b.weight);
    if (weightDiff !== 0) {
      return weightDiff;
    }

    if (startNodeId) {
      const aTouchesStart = a.source === startNodeId || a.target === startNodeId;
      const bTouchesStart = b.source === startNodeId || b.target === startNodeId;

      if (aTouchesStart !== bTouchesStart) {
        return aTouchesStart ? -1 : 1;
      }
    }

    return compareEdgesDeterministically(a, b);
  });

  const parent = {};
  nodes.forEach((n) => {
    parent[n.id] = n.id;
  });

  function find(i) {
    if (parent[i] === i) return i;
    parent[i] = find(parent[i]);
    return parent[i];
  }

  function union(i, j) {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
      return true;
    }
    return false;
  }

  yield { type: 'SET_LINE', lineIndex: 0 };

  for (const n of nodes) {
    yield { type: 'SET_NODE_COLOR', nodeId: n.id, color: undefined };
  }

  yield { type: 'SET_LINE', lineIndex: 1 };
  yield { type: 'SET_LINE', lineIndex: 2 };

  for (const edge of sortedEdges) {
    yield { type: 'LOG', message: `Checking edge (${edge.weight})` };
    yield { type: 'SET_LINE', lineIndex: 3 };

    if (union(edge.source, edge.target)) {
      yield { type: 'SET_LINE', lineIndex: 4 };
      yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' };
      yield { type: 'SET_NODE_COLOR', nodeId: edge.source, color: '#3b82f6' };
      yield { type: 'SET_NODE_COLOR', nodeId: edge.target, color: '#3b82f6' };
      yield { type: 'LOG', message: 'Added to MST' };
      yield { type: 'UPDATE_VISITED', nodeId: edge.source };
      yield { type: 'UPDATE_VISITED', nodeId: edge.target };
      yield { type: 'SET_LINE', lineIndex: 5 };
    } else {
      yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'cycle' };
      yield { type: 'LOG', message: 'Cycle detected - Discarded' };
    }

    yield { type: 'SET_LINE', lineIndex: 2 };
  }

  yield { type: 'SET_LINE', lineIndex: -1 };
}
