import { edgeIsUndirected, orderNodesFromStart } from '../../core/helpers.js';

export function* floydWarshall(nodes, edges, startNodeId) {
  const orderedNodes = orderNodesFromStart(nodes, startNodeId || nodes[0]?.id);
  const dist = {};
  const next = {};
  let compareStep = 0;
  const SNAPSHOT_INTERVAL = 200;

  const toDisplayDistance = (value) => (value === Infinity ? 'INF' : value);
  const buildFwState = (activeNodes, fwComparison = null, fwStatus = 'running', includeMatrices = false) => {
    const state = {
      startNodeId,
      activeNodes,
      fwComparison,
      fwStatus,
    };

    if (includeMatrices) {
      state.matrix = JSON.parse(JSON.stringify(dist));
      state.next = JSON.parse(JSON.stringify(next));
    }

    return state;
  };

  for (const u of orderedNodes) {
    dist[u.id] = {};
    next[u.id] = {};
    for (const v of orderedNodes) {
      if (u.id === v.id) {
        dist[u.id][v.id] = 0;
        next[u.id][v.id] = u.id;
      } else {
        dist[u.id][v.id] = Infinity;
        next[u.id][v.id] = null;
      }
    }
  }

  for (const e of edges) {
    const w = Number(e.weight) || 1;
    dist[e.source][e.target] = Math.min(dist[e.source][e.target], w);
    next[e.source][e.target] = e.target;
    if (edgeIsUndirected(e)) {
      dist[e.target][e.source] = Math.min(dist[e.target][e.source], w);
      next[e.target][e.source] = e.source;
    }
  }

  yield { type: 'LOG', message: 'Floyd-Warshall Initialization Complete', internalState: buildFwState({ k: null, i: null, j: null }, null, 'init', true) };
  yield { type: 'SET_LINE', lineIndex: 0 };

  for (const k of orderedNodes) {
    let updatedInK = false;

    yield { type: 'SET_NODE_COLOR', nodeId: k.id, color: '#fbbf24', internalState: buildFwState({ k: k.id, i: null, j: null }, null, 'running') };

    for (const i of orderedNodes) {
      for (const j of orderedNodes) {
        const current = dist[i.id][j.id];
        const candidate = dist[i.id][k.id] !== Infinity && dist[k.id][j.id] !== Infinity
          ? dist[i.id][k.id] + dist[k.id][j.id]
          : Infinity;
        const shouldUpdate = current > candidate;

        compareStep += 1;
        const includeSnapshot = compareStep % SNAPSHOT_INTERVAL === 0;
        yield {
          type: 'SET_LINE',
          lineIndex: 1,
          internalState: buildFwState(
            { k: k.id, i: i.id, j: j.id },
            {
              id: compareStep,
              algorithm: 'floydWarshall',
              i: i.label,
              j: j.label,
              k: k.label,
              lhs: toDisplayDistance(current),
              rhs: `${toDisplayDistance(dist[i.id][k.id])} + ${toDisplayDistance(dist[k.id][j.id])}`,
              rhsValue: toDisplayDistance(candidate),
              operator: '>',
              result: shouldUpdate,
            },
            'running',
            includeSnapshot,
          ),
        };

        if (shouldUpdate) {
          dist[i.id][j.id] = dist[i.id][k.id] + dist[k.id][j.id];
          next[i.id][j.id] = next[i.id][k.id];
          updatedInK = true;

          yield {
            type: 'LOG',
            message: `Updated path: ${i.label} -> ${j.label} via ${k.label} (dist: ${dist[i.id][j.id]})`,
            internalState: buildFwState(
              { k: k.id, i: i.id, j: j.id },
              {
                id: compareStep,
                algorithm: 'floydWarshall',
                i: i.label,
                j: j.label,
                k: k.label,
                lhs: toDisplayDistance(current),
                rhs: `${toDisplayDistance(dist[i.id][k.id])} + ${toDisplayDistance(dist[k.id][j.id])}`,
                rhsValue: toDisplayDistance(candidate),
                operator: '>',
                result: true,
              },
              'running',
              false,
            ),
          };
        }
      }
    }

    if (!updatedInK) {
      yield {
        type: 'LOG',
        message: `Checked intermediate node ${k.label} (no shorter paths found)`,
        internalState: buildFwState({ k: k.id, i: null, j: null }, null, 'running', false),
      };
    }

    yield { type: 'SET_NODE_COLOR', nodeId: k.id, color: '#3b82f6', internalState: buildFwState({ k: null, i: null, j: null }, null, 'running', true) };
    yield { type: 'SET_LINE', lineIndex: 1 };
  }

  yield { type: 'LOG', message: 'Floyd-Warshall Completed', internalState: buildFwState({ k: null, i: null, j: null }, null, 'completed', true) };
  yield { type: 'SET_LINE', lineIndex: -1 };
}
