import { edgeIsUndirected, orderNodesFromStart, findTraversableEdge } from '../../core/helpers.js';

export function* distanceVector(nodes, edges, startNodeId) {
  const orderedNodes = orderNodesFromStart(nodes, startNodeId || nodes[0]?.id);
  const sourceId = orderedNodes[0]?.id;
  const dist = {};
  const nodeLabelMap = {};
  nodes.forEach((n) => {
    nodeLabelMap[n.id] = n.label;
  });
  let compareStep = 0;

  const toDisplayDistance = (value) => (value === Infinity ? 'INF' : value);

  orderedNodes.forEach((u) => {
    dist[u.id] = {};
    orderedNodes.forEach((v) => {
      if (u.id === v.id) {
        dist[u.id][v.id] = { dist: 0, nextHop: u.id };
      } else {
        dist[u.id][v.id] = { dist: Infinity, nextHop: null };
      }
    });
  });

  function* emitTableUpdate() {
    const tableCopy = JSON.parse(JSON.stringify(dist));
    yield { type: 'DS_UPDATE_ROUTING_TABLE', table: tableCopy };
  }

  yield { type: 'SET_LINE', lineIndex: 0 };
  yield* emitTableUpdate();
  yield { type: 'LOG', message: 'Initialized Routing Tables' };

  let changed = true;
  let iterations = 0;
  const MAX_ITERATIONS = nodes.length + 2;

  yield { type: 'SET_LINE', lineIndex: 1 };

  while (changed && iterations < MAX_ITERATIONS) {
    yield { type: 'SET_LINE', lineIndex: 1 };

    changed = false;
    iterations += 1;
    yield { type: 'LOG', message: `Iteration ${iterations} Started` };

    yield { type: 'SET_LINE', lineIndex: 2 };

    for (const edge of edges) {
      const u = edge.source;
      const v = edge.target;
      const w = Number(edge.weight);

      for (const dest of orderedNodes) {
        const destId = dest.id;
        if (dist[v][destId].dist !== Infinity) {
          const newDist = w + dist[v][destId].dist;
          const currentDist = dist[u][destId].dist;
          compareStep += 1;

          yield {
            type: 'SET_LINE',
            lineIndex: 3,
            internalState: {
              routingComparison: {
                id: compareStep,
                algorithm: 'distanceVector',
                edgeId: edge.id,
                via: `${nodeLabelMap[u] || u} <- ${nodeLabelMap[v] || v}`,
                destination: nodeLabelMap[destId] || destId,
                lhs: toDisplayDistance(currentDist),
                rhs: toDisplayDistance(newDist),
                operator: '>',
                result: currentDist > newDist,
              },
            },
          };

          if (newDist < dist[u][destId].dist) {
            yield { type: 'SET_LINE', lineIndex: 4 };

            dist[u][destId] = { dist: newDist, nextHop: v };
            changed = true;
            yield { type: 'SET_ACTIVE_TABLE_NODE', nodeId: u };
            yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#fbbf24' };
            yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' };

            yield { type: 'SET_LINE', lineIndex: 5 };

            yield { type: 'LOG', message: `Node ${nodes.find((n) => n.id === u)?.label} updates dist to ${dest.label}: ${newDist} (via ${nodes.find((n) => n.id === v)?.label})` };
            yield* emitTableUpdate();
          }
        }
      }

      if (edgeIsUndirected(edge)) {
        for (const dest of orderedNodes) {
          const destId = dest.id;
          if (dist[u][destId].dist !== Infinity) {
            const newDist = w + dist[u][destId].dist;
            const currentDist = dist[v][destId].dist;
            compareStep += 1;

            yield {
              type: 'SET_LINE',
              lineIndex: 3,
              internalState: {
                routingComparison: {
                  id: compareStep,
                  algorithm: 'distanceVector',
                  edgeId: edge.id,
                  via: `${nodeLabelMap[v] || v} <- ${nodeLabelMap[u] || u}`,
                  destination: nodeLabelMap[destId] || destId,
                  lhs: toDisplayDistance(currentDist),
                  rhs: toDisplayDistance(newDist),
                  operator: '>',
                  result: currentDist > newDist,
                },
              },
            };

            if (newDist < dist[v][destId].dist) {
              yield { type: 'SET_LINE', lineIndex: 4 };

              dist[v][destId] = { dist: newDist, nextHop: u };
              changed = true;
              yield { type: 'SET_ACTIVE_TABLE_NODE', nodeId: v };
              yield { type: 'SET_NODE_COLOR', nodeId: v, color: '#fbbf24' };
              yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' };

              yield { type: 'SET_LINE', lineIndex: 5 };

              yield { type: 'LOG', message: `Node ${nodes.find((n) => n.id === v)?.label} updates dist to ${dest.label}: ${newDist} (via ${nodes.find((n) => n.id === u)?.label})` };
              yield* emitTableUpdate();
            }
          }
        }
      }

      yield { type: 'SET_LINE', lineIndex: 2 };
    }

    for (const n of nodes) {
      yield { type: 'SET_NODE_COLOR', nodeId: n.id, color: undefined };
    }
    for (const e of edges) {
      yield { type: 'CLASSIFY_EDGE', edgeId: e.id, classification: undefined };
    }
  }

  if (iterations >= 6) {
    yield { type: 'LOG', message: 'Negative Cycle Detected or Max Iterations Reached!' };
  } else {
    yield { type: 'LOG', message: `Converged in ${iterations} iterations.` };
  }

  const finalCosts = {};
  const finalTreeEdgeIds = new Set();

  if (sourceId && dist[sourceId]) {
    for (const dest of orderedNodes) {
      finalCosts[dest.id] = dist[sourceId][dest.id]?.dist ?? Infinity;
    }

    for (const dest of orderedNodes) {
      if (dest.id === sourceId) {
        continue;
      }
      if (finalCosts[dest.id] === Infinity) {
        continue;
      }

      let current = sourceId;
      const visitedOnPath = new Set([current]);

      while (current !== dest.id) {
        const nextHop = dist[current]?.[dest.id]?.nextHop ?? null;
        if (!nextHop || visitedOnPath.has(nextHop)) {
          break;
        }

        const traversedEdge = findTraversableEdge(edges, current, nextHop, { forceUndirected: true });
        if (traversedEdge) {
          finalTreeEdgeIds.add(traversedEdge.id);
          yield { type: 'CLASSIFY_EDGE', edgeId: traversedEdge.id, classification: 'solution' };
        }

        visitedOnPath.add(nextHop);
        current = nextHop;
      }
    }

    yield { type: 'SET_NODE_COLOR', nodeId: sourceId, color: '#8b5cf6' };
    for (const node of orderedNodes) {
      if (node.id === sourceId) {
        continue;
      }
      if (finalCosts[node.id] !== Infinity) {
        yield { type: 'SET_NODE_COLOR', nodeId: node.id, color: '#22c55e' };
      }
    }

    yield {
      type: 'SET_RESULT_DATA',
      data: {
        type: 'distanceVectorFinal',
        sourceId,
        finalCosts,
        finalTreeEdgeIds: Array.from(finalTreeEdgeIds),
      },
    };

    yield {
      type: 'LOG',
      message: `Final costs from ${nodes.find((n) => n.id === sourceId)?.label ?? sourceId}: ${orderedNodes
        .map((node) => `${nodes.find((n) => n.id === node.id)?.label ?? node.id}=${finalCosts[node.id] === Infinity ? 'INF' : finalCosts[node.id]}`)
        .join(', ')}`,
    };
  }

  yield { type: 'SET_ACTIVE_TABLE_NODE', nodeId: null };
  yield { type: 'SET_LINE', lineIndex: -1 };
}
