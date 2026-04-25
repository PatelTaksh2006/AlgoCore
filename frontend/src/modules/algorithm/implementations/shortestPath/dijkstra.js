import { buildAdjacencyMap, findTraversableEdge } from '../../core/helpers.js';

export function* dijkstra(nodes, edges, startNodeId, targetNodeId) {
  const adjMap = buildAdjacencyMap(nodes, edges);

  const dist = {};
  const prev = {};
  const pq = [];

  const heapPush = (item) => {
    pq.push(item);
    let index = pq.length - 1;

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (pq[parentIndex].d <= pq[index].d) {
        break;
      }

      [pq[parentIndex], pq[index]] = [pq[index], pq[parentIndex]];
      index = parentIndex;
    }
  };

  const heapPop = () => {
    if (pq.length === 0) {
      return null;
    }

    const min = pq[0];
    const last = pq.pop();

    if (pq.length > 0) {
      pq[0] = last;

      let index = 0;
      while (true) {
        const left = 2 * index + 1;
        const right = left + 1;
        let smallest = index;

        if (left < pq.length && pq[left].d < pq[smallest].d) {
          smallest = left;
        }

        if (right < pq.length && pq[right].d < pq[smallest].d) {
          smallest = right;
        }

        if (smallest === index) {
          break;
        }

        [pq[index], pq[smallest]] = [pq[smallest], pq[index]];
        index = smallest;
      }
    }

    return min;
  };

  const getQueueSnapshot = () => [...pq].sort((a, b) => a.d - b.d);

  yield { type: 'SET_LINE', lineIndex: 0 };

  for (const n of nodes) {
    dist[n.id] = Infinity;
    prev[n.id] = null;
    yield { type: 'SET_NODE_COLOR', nodeId: n.id, color: undefined };
  }

  if (!startNodeId) return;

  dist[startNodeId] = 0;
  heapPush({ id: startNodeId, d: 0 });
  yield { type: 'DS_UPDATE', data: getQueueSnapshot(), action: 'push' };
  yield { type: 'SET_NODE_COLOR', nodeId: startNodeId, color: '#fbbf24' };
  yield { type: 'UPDATE_VISITED', nodeId: startNodeId };

  yield { type: 'SET_LINE', lineIndex: 1 };
  yield { type: 'SET_LINE', lineIndex: 2 };

  while (pq.length > 0) {
    const minItem = heapPop();
    if (!minItem) {
      break;
    }

    const { id: u, d: uDist } = minItem;
    yield { type: 'DS_UPDATE', data: getQueueSnapshot(), action: 'pop' };
    yield { type: 'SET_LINE', lineIndex: 3 };

    if (uDist > dist[u]) continue;

    yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#3b82f6' };
    yield { type: 'LOG', message: `Processing ${nodes.find((n) => n.id === u)?.label} (dist: ${uDist})` };

    if (targetNodeId && u === targetNodeId) {
      yield { type: 'LOG', message: `Target Reached! Distance: ${uDist}` };

      const pathNodes = [];
      const pathEdges = [];

      let curr = targetNodeId;
      while (curr !== startNodeId && curr !== null) {
        pathNodes.push(curr);
        const p = prev[curr];
        if (p !== null) {
          const edge = findTraversableEdge(edges, p, curr);
          if (edge) {
            pathEdges.push(edge);
          }
        }
        curr = p;
      }
      if (curr === startNodeId) {
        pathNodes.push(startNodeId);
      }

      pathNodes.reverse();
      pathEdges.reverse();

      for (const n of nodes) {
        yield { type: 'SET_NODE_COLOR', nodeId: n.id, color: undefined };
      }

      for (const pe of pathEdges) {
        yield { type: 'CLASSIFY_EDGE', edgeId: pe.id, classification: 'solution' };
      }
      for (const pn of pathNodes) {
        yield { type: 'SET_NODE_COLOR', nodeId: pn, color: '#22c55e' };
      }

      const distLabels = {};
      for (const n of nodes) {
        distLabels[n.id] = dist[n.id] === Infinity ? Infinity : dist[n.id];
      }

      yield { type: 'SET_RESULT_DATA', data: { type: 'dijkstraPath', pathNodes, pathEdges, dist: distLabels, startNodeId } };
      yield { type: 'LOG', message: `Shortest path: ${pathNodes.map((id) => nodes.find((n) => n.id === id)?.label).join(' → ')}` };
      yield { type: 'SET_LINE', lineIndex: -1 };
      return;
    }

    if (prev[u]) {
      const parent = prev[u];
      const edge = adjMap[parent].find((e) => e.to === u);
      if (edge) {
        yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' };
      }
    }

    const neighbors = adjMap[u] || [];
    yield { type: 'SET_LINE', lineIndex: 4 };

    for (const edge of neighbors) {
      const v = edge.to;
      const weight = Number(edge.weight);

      yield { type: 'SET_ACTIVE_EDGE', edgeId: edge.id };
      yield { type: 'SET_LINE', lineIndex: 5 };
      yield { type: 'SET_LINE', lineIndex: 6 };

      if (dist[u] + weight < dist[v]) {
        dist[v] = dist[u] + weight;
        yield { type: 'SET_LINE', lineIndex: 7 };

        prev[v] = u;
        heapPush({ id: v, d: dist[v] });

        yield { type: 'UPDATE_VISITED', nodeId: v };
        yield { type: 'UPDATE_PARENT', childId: v, parentId: u };

        yield { type: 'DS_UPDATE', data: getQueueSnapshot(), action: 'push' };
        yield { type: 'SET_NODE_COLOR', nodeId: v, color: '#fbbf24' };
        yield { type: 'LOG', message: `Relaxed ${nodes.find((n) => n.id === v)?.label} : ${dist[v]}` };

        yield { type: 'SET_LINE', lineIndex: 8 };
      }

      yield { type: 'SET_ACTIVE_EDGE', edgeId: null };
      yield { type: 'SET_LINE', lineIndex: 4 };
    }

    yield { type: 'SET_LINE', lineIndex: 2 };
  }

  const finalDistLabels = {};
  for (const n of nodes) {
    finalDistLabels[n.id] = dist[n.id] === Infinity ? Infinity : dist[n.id];
  }

  yield { type: 'SET_RESULT_DATA', data: { type: 'dijkstraPath', pathNodes: [], pathEdges: [], dist: finalDistLabels, startNodeId } };
  yield { type: 'LOG', message: 'Dijkstra Completed' };
  yield { type: 'SET_LINE', lineIndex: -1 };
}
