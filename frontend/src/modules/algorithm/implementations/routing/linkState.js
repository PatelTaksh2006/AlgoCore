import { edgeIsUndirected, orderNodesFromStart, findTraversableEdge } from '../../core/helpers.js';

export function* linkState(nodes, edges, startNodeId) {
  const orderedNodes = orderNodesFromStart(nodes, startNodeId || nodes[0]?.id);
  const sourceId = orderedNodes[0]?.id;
  if (!sourceId) {
    return;
  }

  const nodeLabelMap = {};
  nodes.forEach((n) => {
    nodeLabelMap[n.id] = n.label;
  });

  let compareStep = 0;
  const toDisplayDistance = (value) => (value === Infinity ? 'INF' : value);

  const dist = {};

  orderedNodes.forEach((u) => {
    dist[u.id] = {};
    orderedNodes.forEach((v) => {
      dist[u.id][v.id] = { dist: Infinity, nextHop: null };
      if (u.id === v.id) {
        dist[u.id][v.id] = { dist: 0, nextHop: u.id };
      }
    });
  });

  function* emitTableUpdate() {
    const tableCopy = JSON.parse(JSON.stringify(dist));
    yield { type: 'DS_UPDATE_ROUTING_TABLE', table: tableCopy };
  }

  const getOutgoingNeighbors = (nodeId) => {
    const neighbors = [];
    edges.forEach((edge) => {
      const weight = Number(edge.weight ?? 1);
      if (edge.source === nodeId) {
        neighbors.push({ to: edge.target, weight, edgeId: edge.id });
      } else if (edge.target === nodeId && edgeIsUndirected(edge)) {
        neighbors.push({ to: edge.source, weight, edgeId: edge.id });
      }
    });
    return neighbors;
  };

  const getWeight = (u, v) => {
    const edge = findTraversableEdge(edges, u, v);
    return edge ? Number(edge.weight) : Infinity;
  };

  yield { type: 'SET_LINE', lineIndex: 0 };
  yield* emitTableUpdate();
  yield { type: 'LOG', message: 'Initialized Link State Routing' };

  yield {
    type: 'SET_LINE',
    lineIndex: 1,
    internalState: { routingPhase: 'neighbor-discovery' },
  };
  yield { type: 'LOG', message: 'Phase 1: Each node learns direct neighbors and fills local table' };

  for (const node of orderedNodes) {
    const neighbors = getOutgoingNeighbors(node.id);
    yield { type: 'SET_ACTIVE_TABLE_NODE', nodeId: node.id };

    yield { type: 'SET_NODE_COLOR', nodeId: node.id, color: '#fbbf24' };
    yield {
      type: 'LOG',
      message: `Node ${node.label} visualizing direct neighbors on graph`,
    };

    for (const neighbor of neighbors) {
      yield { type: 'CLASSIFY_EDGE', edgeId: neighbor.edgeId, classification: 'tree' };
    }

    // Keep this as a separate step so edge highlighting is visible before table mutation.
    yield { type: 'SET_LINE', lineIndex: 1 };

    for (const neighbor of neighbors) {
      dist[node.id][neighbor.to] = {
        dist: neighbor.weight,
        nextHop: neighbor.to,
      };
    }

    yield* emitTableUpdate();
    yield {
      type: 'LOG',
      message: `Node ${node.label} table updated with neighbors: ${neighbors.length > 0 ? neighbors.map((n) => nodeLabelMap[n.to] || n.to).join(', ') : 'none'}`,
    };

    // Keep table update visible before clearing temporary graph highlights.
    yield { type: 'SET_LINE', lineIndex: 1 };

    yield { type: 'SET_NODE_COLOR', nodeId: node.id, color: undefined };
    for (const neighbor of neighbors) {
      yield { type: 'CLASSIFY_EDGE', edgeId: neighbor.edgeId, classification: undefined };
    }
  }

  yield { type: 'SET_ACTIVE_TABLE_NODE', nodeId: null };

  yield {
    type: 'SET_LINE',
    lineIndex: 2,
    internalState: { routingPhase: 'flooding' },
  };
  yield { type: 'LOG', message: 'Phase 2: All nodes flood LSAs across the network' };

  for (const node of orderedNodes) {
    yield { type: 'SET_NODE_COLOR', nodeId: node.id, color: '#fbbf24' };
    yield { type: 'LOG', message: `Node ${node.label} floods LSA` };

    const outgoing = getOutgoingNeighbors(node.id);
    for (const neighbor of outgoing) {
      yield { type: 'CLASSIFY_EDGE', edgeId: neighbor.edgeId, classification: 'tree' };
    }

    yield { type: 'SET_LINE', lineIndex: 2 };

    yield {
      type: 'ADD_LSA',
      lsa: {
        sourceId: node.id,
        links: outgoing.map((neighbor) => ({
          to: neighbor.to,
          weight: neighbor.weight,
        })),
      },
    };

    yield { type: 'SET_NODE_COLOR', nodeId: node.id, color: undefined };
    for (const neighbor of outgoing) {
      yield { type: 'CLASSIFY_EDGE', edgeId: neighbor.edgeId, classification: undefined };
    }
  }

  yield { type: 'LOG', message: 'LSDB synchronized across all nodes' };

  yield {
    type: 'SET_LINE',
    lineIndex: 3,
    internalState: { routingPhase: 'spf' },
  };
  yield {
    type: 'LOG',
    message: `Phase 3: Route node ${nodeLabelMap[sourceId] || sourceId} runs Dijkstra on LSDB`,
  };

  yield { type: 'SET_ACTIVE_TABLE_NODE', nodeId: sourceId };
  for (const n of nodes) {
    yield { type: 'SET_NODE_COLOR', nodeId: n.id, color: undefined };
  }
  for (const e of edges) {
    yield { type: 'CLASSIFY_EDGE', edgeId: e.id, classification: undefined };
  }

  yield { type: 'SET_NODE_COLOR', nodeId: sourceId, color: '#8b5cf6' };

  const d = {};
  const next = {};
  const parent = {};
  const pq = [];

  orderedNodes.forEach((n) => {
    d[n.id] = Infinity;
    next[n.id] = null;
    parent[n.id] = null;
  });
  d[sourceId] = 0;
  next[sourceId] = sourceId;
  pq.push({ id: sourceId, cost: 0 });
  yield { type: 'DS_UPDATE', data: [...pq], action: 'push' };

  while (pq.length > 0) {
    pq.sort((a, b) => a.cost - b.cost);
    const { id: u, cost: uCost } = pq.shift();
    yield { type: 'DS_UPDATE', data: [...pq], action: 'pop' };

    if (uCost > d[u]) {
      continue;
    }

    if (u !== sourceId) {
      yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#3b82f6' };
      if (parent[u]) {
        const edge = findTraversableEdge(edges, parent[u], u);
        if (edge) {
          yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' };
        }
      }
    }

    const neighbors = getOutgoingNeighbors(u);
    for (const neighbor of neighbors) {
      const v = neighbor.to;
      const weight = getWeight(u, v);
      const candidate = d[u] + weight;
      const current = d[v];
      compareStep += 1;

      yield {
        type: 'SET_LINE',
        lineIndex: 4,
        internalState: {
          routingComparison: {
            id: compareStep,
            algorithm: 'linkState',
            edgeId: `${u}-${v}`,
            via: `${nodeLabelMap[sourceId] || sourceId} SPF`,
            destination: nodeLabelMap[v] || v,
            lhs: toDisplayDistance(current),
            rhs: toDisplayDistance(candidate),
            operator: '>',
            result: current > candidate,
          },
        }
      };

      if (candidate < d[v]) {
        d[v] = candidate;
        next[v] = u === sourceId ? v : next[u];
        parent[v] = u;

        pq.push({ id: v, cost: d[v] });
        yield { type: 'DS_UPDATE', data: [...pq], action: 'push' };

        yield { type: 'SET_NODE_COLOR', nodeId: v, color: '#fbbf24' };
      }
    }
  }

  orderedNodes.forEach((dest) => {
    dist[sourceId][dest.id] = {
      dist: d[dest.id],
      nextHop: next[dest.id],
    };
  });

  yield* emitTableUpdate();
  yield { type: 'SET_LINE', lineIndex: 3 };
  yield {
    type: 'LOG',
    message: `Route node ${nodeLabelMap[sourceId] || sourceId} completed Dijkstra and updated forwarding table`,
  };

  yield { type: 'SET_ACTIVE_TABLE_NODE', nodeId: null };
  yield { type: 'LOG', message: 'Link State Routing Converged' };
  yield {
    type: 'SET_LINE',
    lineIndex: -1,
    internalState: { routingPhase: 'completed' },
  };
}
