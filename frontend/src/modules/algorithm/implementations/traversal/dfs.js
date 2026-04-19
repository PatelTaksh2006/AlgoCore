import { orderNodesFromStart, buildAdjacencyMap } from '../../core/helpers.js';

export function* dfs(nodes, edges, startNodeId) {
  const adjMap = buildAdjacencyMap(nodes, edges);
  const orderedNodes = orderNodesFromStart(nodes, startNodeId || nodes[0]?.id);

  const discoveryTime = {};
  const finishTime = {};
  const colors = {};
  let time = 0;

  yield { type: 'SET_LINE', lineIndex: 0 };

  for (const n of nodes) {
    colors[n.id] = 'WHITE';
    yield { type: 'SET_NODE_COLOR', nodeId: n.id, color: undefined };
  }

  yield { type: 'LOG', message: 'DFS Started' };

  const stack = [];

  function* dfsVisit(u, p = null, incomingEdgeId = null) {
    yield { type: 'SET_LINE', lineIndex: 0 };

    stack.push(u);
    yield { type: 'DS_UPDATE', data: [...stack], action: 'push', node: u };

    yield { type: 'UPDATE_VISITED', nodeId: u };
    if (p) yield { type: 'UPDATE_PARENT', childId: u, parentId: p };

    colors[u] = 'GRAY';
    time += 1;
    discoveryTime[u] = time;
    yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#fbbf24' };
    yield { type: 'LOG', message: `Discovered ${nodes.find((n) => n.id === u)?.label}` };

    yield { type: 'SET_LINE', lineIndex: 1 };

    const neighbors = adjMap[u] || [];

    yield { type: 'SET_LINE', lineIndex: 2 };

    for (const edge of neighbors) {
      if (edge.undirected && edge.id === incomingEdgeId) {
        continue;
      }

      const v = edge.to;
      const edgeId = edge.id;

      yield { type: 'SET_LINE', lineIndex: 3 };

      if (colors[v] === 'WHITE') {
        yield { type: 'CLASSIFY_EDGE', edgeId, classification: 'tree' };
        yield { type: 'SET_LINE', lineIndex: 4 };
        yield* dfsVisit(v, u, edgeId);
        yield { type: 'SET_LINE', lineIndex: 2 };
      } else if (colors[v] === 'GRAY') {
        yield { type: 'ADD_BACK_EDGE', edgeId, source: u, target: v, classification: 'back' };
        yield {
          type: 'LOG',
          message: `Back-edge detected: ${nodes.find((n) => n.id === u)?.label} -> ${nodes.find((n) => n.id === v)?.label}`,
        };
      } else if (!edge.undirected && colors[v] === 'BLACK') {
        if (discoveryTime[u] < discoveryTime[v]) {
          yield { type: 'CLASSIFY_EDGE', edgeId, classification: 'forward' };
        } else {
          yield { type: 'CLASSIFY_EDGE', edgeId, classification: 'cross' };
        }
      }
    }

    colors[u] = 'BLACK';
    time += 1;
    finishTime[u] = time;
    yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#3b82f6' };
    yield { type: 'SET_LINE', lineIndex: 5 };

    stack.pop();
    yield { type: 'DS_UPDATE', data: [...stack], action: 'pop' };
  }

  for (const node of orderedNodes) {
    if (colors[node.id] === 'WHITE') {
      yield* dfsVisit(node.id);
    }
  }

  yield { type: 'LOG', message: 'DFS Completed' };
  yield { type: 'SET_LINE', lineIndex: -1 };
}
