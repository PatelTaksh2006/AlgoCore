import { edgeIsUndirected, orderNodesFromStart } from '../../core/helpers.js';

export function* floydWarshall(nodes, edges, startNodeId) {
  const orderedNodes = orderNodesFromStart(nodes, startNodeId || nodes[0]?.id);
  const dist = {};
  const next = {};
  let compareStep = 0;
  const SNAPSHOT_INTERVAL = 200;

  const toDisplayDistance = (value) => (value === Infinity ? 'INF' : value);
  const nodeLabelById = orderedNodes.reduce((acc, node) => {
    acc[node.id] = node.label;
    return acc;
  }, {});
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

  yield { type: 'SET_LINE', lineIndex: 0 };
  yield {
    type: 'SET_LINE',
    lineIndex: 1,
    internalState: buildFwState({ k: null, i: null, j: null }, null, 'init', true),
  };
  yield { type: 'LOG', message: 'Floyd-Warshall Initialization Complete' };

  for (const k of orderedNodes) {
    let updatedInK = false;
    yield { type: 'SET_LINE', lineIndex: 2 };

    for (const node of orderedNodes) {
      yield { type: 'SET_NODE_COLOR', nodeId: node.id, color: undefined };
    }
    yield { type: 'SET_NODE_COLOR', nodeId: k.id, color: '#fbbf24', internalState: buildFwState({ k: k.id, i: null, j: null }, null, 'running') };

    for (const i of orderedNodes) {
      yield { type: 'SET_LINE', lineIndex: 3 };
      // Highlight the current source-row node i while preserving intermediate node k highlight.
      for (const node of orderedNodes) {
        if (node.id === k.id) {
          continue;
        }
        yield { type: 'SET_NODE_COLOR', nodeId: node.id, color: undefined };
      }
      if (i.id !== k.id) {
        yield { type: 'SET_NODE_COLOR', nodeId: i.id, color: '#8b5cf6' };
      }

      for (const j of orderedNodes) {
        yield { type: 'SET_LINE', lineIndex: 4 };
        const current = dist[i.id][j.id];
        const candidate = dist[i.id][k.id] !== Infinity && dist[k.id][j.id] !== Infinity
          ? dist[i.id][k.id] + dist[k.id][j.id]
          : Infinity;
        const shouldUpdate = current > candidate;

        compareStep += 1;
        const includeSnapshot = compareStep % SNAPSHOT_INTERVAL === 0;
        yield {
          type: 'SET_LINE',
          lineIndex: 5,
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
          yield { type: 'SET_LINE', lineIndex: 6 };
          dist[i.id][j.id] = dist[i.id][k.id] + dist[k.id][j.id];
          yield { type: 'SET_LINE', lineIndex: 7 };
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
              true,
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

    for (const node of orderedNodes) {
      if (node.id === k.id) {
        continue;
      }
      yield { type: 'SET_NODE_COLOR', nodeId: node.id, color: undefined };
    }
    yield { type: 'SET_NODE_COLOR', nodeId: k.id, color: '#3b82f6', internalState: buildFwState({ k: null, i: null, j: null }, null, 'running', true) };
    yield { type: 'SET_LINE', lineIndex: 2 };
  }

  for (const node of orderedNodes) {
    yield { type: 'SET_NODE_COLOR', nodeId: node.id, color: undefined };
  }

  const reconstructNegativeCycle = (anchorId) => {
    let walker = anchorId;

    // Move inside the cycle.
    for (let step = 0; step < orderedNodes.length; step += 1) {
      walker = next[walker]?.[anchorId];
      if (!walker) {
        return null;
      }
    }

    const cycle = [walker];
    let current = next[walker]?.[anchorId];
    let guard = 0;
    while (current && current !== walker && guard <= orderedNodes.length + 1) {
      cycle.push(current);
      current = next[current]?.[anchorId];
      guard += 1;
    }

    if (!current) {
      return null;
    }

    cycle.push(walker);
    return cycle;
  };
  
  // Check for negative weight cycles
  let hasNegativeCycle = false;
  const negativeCycleNodeIds = [];
  for (const i of orderedNodes) {
    if (dist[i.id][i.id] < 0) {
      hasNegativeCycle = true;
      negativeCycleNodeIds.push(i.id);
    }
  }
  
  if (hasNegativeCycle) {
    let cyclePath = null;
    for (const nodeId of negativeCycleNodeIds) {
      const maybeCycle = reconstructNegativeCycle(nodeId);
      if (maybeCycle && maybeCycle.length > 2) {
        cyclePath = maybeCycle;
        break;
      }
    }

    const negativeCycleNodes = negativeCycleNodeIds.map((nodeId) => nodeLabelById[nodeId] ?? nodeId);
    const detectedPairs = negativeCycleNodeIds
      .map((nodeId) => {
        const label = nodeLabelById[nodeId] ?? nodeId;
        return `${label}->${label}`;
      })
      .join(', ');

    const cyclePathText = cyclePath
      ? cyclePath.map((nodeId) => nodeLabelById[nodeId] ?? nodeId).join(' -> ')
      : 'Unable to reconstruct exact cycle path';

    yield {
      type: 'LOG',
      message: `⚠️ NEGATIVE WEIGHT CYCLE DETECTED! Pairs: ${detectedPairs} | Involved nodes: ${negativeCycleNodes.join(', ')} | Cycle: ${cyclePathText}`,
      internalState: buildFwState({ k: null, i: null, j: null }, null, 'completed', true),
    };
  }
  
  yield { type: 'LOG', message: 'Floyd-Warshall Completed', internalState: buildFwState({ k: null, i: null, j: null }, null, 'completed', true) };
  yield { type: 'SET_LINE', lineIndex: -1 };
}
