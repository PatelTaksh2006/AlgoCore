import { edgeIsUndirected, orderNodesFromStart, findTraversableEdge } from '../../core/helpers.js';

export function* linkState(nodes, edges, startNodeId) {
  const orderedNodes = orderNodesFromStart(nodes, startNodeId || nodes[0]?.id);
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

  yield { type: 'SET_LINE', lineIndex: 0 };
  yield* emitTableUpdate();
  yield { type: 'LOG', message: 'Initialized Link State Routing' };

  yield { type: 'SET_LINE', lineIndex: 1 };
  yield { type: 'LOG', message: 'Phase 1: Flooding Link State Advertisements (LSAs)' };

  for (const node of orderedNodes) {
    yield { type: 'SET_NODE_COLOR', nodeId: node.id, color: '#fbbf24' };
    yield { type: 'LOG', message: `Node ${node.label} floods LSA to neighbors` };

    const outgoing = edges.filter((e) => e.source === node.id || (edgeIsUndirected(e) && e.target === node.id));
    for (const edge of outgoing) {
      yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' };
    }

    yield { type: 'SET_LINE', lineIndex: 1 };

    yield {
      type: 'ADD_LSA',
      lsa: {
        sourceId: node.id,
        links: outgoing.map((e) => ({
          to: e.source === node.id ? e.target : e.source,
          weight: e.weight || 1,
        })),
      },
    };

    yield { type: 'SET_NODE_COLOR', nodeId: node.id, color: undefined };
    for (const edge of outgoing) {
      yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: undefined };
    }
  }

  yield { type: 'LOG', message: 'All nodes have full Link State Database (LSDB)' };

  yield { type: 'SET_LINE', lineIndex: 2 };

  for (const source of orderedNodes) {
    yield { type: 'LOG', message: `Node ${source.label} running Dijkstra (SPF)...` };
    yield { type: 'SET_ACTIVE_TABLE_NODE', nodeId: source.id };
    for (const n of nodes) {
      yield { type: 'SET_NODE_COLOR', nodeId: n.id, color: undefined };
    }
    for (const e of edges) {
      yield { type: 'CLASSIFY_EDGE', edgeId: e.id, classification: undefined };
    }

    yield { type: 'SET_NODE_COLOR', nodeId: source.id, color: '#8b5cf6' };

    const d = {};
    const next = {};
    const parent = {};
    const pq = [];

    orderedNodes.forEach((n) => {
      d[n.id] = Infinity;
      next[n.id] = null;
      parent[n.id] = null;
    });
    d[source.id] = 0;
    pq.push({ id: source.id, cost: 0 });
    yield { type: 'DS_UPDATE', data: [...pq], action: 'push' };

    const getWeight = (u, v) => {
      const edge = findTraversableEdge(edges, u, v);
      return edge ? Number(edge.weight) : Infinity;
    };

    const getNeighbors = (u) => {
      const nbrs = [];
      edges.forEach((e) => {
        if (e.source === u) {
          nbrs.push(e.target);
        } else if (e.target === u && edgeIsUndirected(e)) {
          nbrs.push(e.source);
        }
      });
      return nbrs;
    };

    while (pq.length > 0) {
      pq.sort((a, b) => a.cost - b.cost);
      const { id: u, cost: uCost } = pq.shift();
      yield { type: 'DS_UPDATE', data: [...pq], action: 'pop' };

      if (uCost > d[u]) {
        continue;
      }

      if (u !== source.id) {
        yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#3b82f6' };
        if (parent[u]) {
          const edge = findTraversableEdge(edges, parent[u], u);
          if (edge) {
            yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' };
          }
        }
      }

      const neighbors = getNeighbors(u);
      for (const v of neighbors) {
        const weight = getWeight(u, v);
        const candidate = d[u] + weight;
        const current = d[v];
        compareStep += 1;

        yield {
          type: 'SET_LINE',
          lineIndex: 3,
          internalState: {
            routingComparison: {
              id: compareStep,
              algorithm: 'linkState',
              edgeId: `${u}-${v}`,
              via: `${nodeLabelMap[source.id] || source.id} SPF`,
              destination: nodeLabelMap[v] || v,
              lhs: toDisplayDistance(current),
              rhs: toDisplayDistance(candidate),
              operator: '>',
              result: current > candidate,
            },
          },
        };

        if (d[u] + weight < d[v]) {
          d[v] = d[u] + weight;

          if (u === source.id) {
            next[v] = v;
          } else {
            next[v] = next[u];
          }
          parent[v] = u;

          pq.push({ id: v, cost: d[v] });
          yield { type: 'DS_UPDATE', data: [...pq], action: 'push' };

          yield { type: 'SET_NODE_COLOR', nodeId: v, color: '#fbbf24' };
        }
      }
    }

    orderedNodes.forEach((dest) => {
      dist[source.id][dest.id] = {
        dist: d[dest.id],
        nextHop: next[dest.id],
      };
    });

    yield* emitTableUpdate();
    yield { type: 'SET_NODE_COLOR', nodeId: source.id, color: undefined };

    yield { type: 'SET_LINE', lineIndex: 2 };
  }

  yield { type: 'SET_ACTIVE_TABLE_NODE', nodeId: null };
  yield { type: 'LOG', message: 'Link State Routing Converged' };
  yield { type: 'SET_LINE', lineIndex: -1 };
}
