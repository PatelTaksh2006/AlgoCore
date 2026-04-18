import {
  edgeIsUndirected,
  orderNodesFromStart,
  buildAdjacencyMap,
  findTraversableEdge,
  comparePrimitive,
  compareEdgesDeterministically,
} from '../core/helpers.js';

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

    // Line 0
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

    // Line 1: dist[start]=0, Q.push
    yield { type: 'SET_LINE', lineIndex: 1 };

    // Line 2: while Q not empty
    yield { type: 'SET_LINE', lineIndex: 2 };

    while (pq.length > 0) {
        const minItem = heapPop();
        if (!minItem) {
            break;
        }

        const { id: u, d: uDist } = minItem;
        yield { type: 'DS_UPDATE', data: getQueueSnapshot(), action: 'pop' };

        // Line 3: u = Q.extractMin()
        yield { type: 'SET_LINE', lineIndex: 3 };

        if (uDist > dist[u]) continue;

        yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#3b82f6' };
        yield { type: 'LOG', message: `Processing ${nodes.find(n => n.id === u)?.label} (dist: ${uDist})` };

        // Check for Target
        if (targetNodeId && u === targetNodeId) {
            yield { type: 'LOG', message: `Target Reached! Distance: ${uDist}` };

            // Backtrack to build explicit path data
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
            
            // Reverse so it reads from start -> target
            pathNodes.reverse();
            pathEdges.reverse();

            console.log("DIJKSTRA_TRACE: Final Path Extracted", {
                startNodeId, targetNodeId, 
                pathNodesCount: pathNodes.length, 
                pathEdgesCount: pathEdges.length,
                pathNodes, pathEdges
            });

            // Keep explored tree edges visible; only reset node colors for clear final emphasis.
            for (const n of nodes) {
                yield { type: 'SET_NODE_COLOR', nodeId: n.id, color: undefined };
            }

            // Highlight path edges in green
            for (const pe of pathEdges) {
                yield { type: 'CLASSIFY_EDGE', edgeId: pe.id, classification: 'solution' };
            }
            // Highlight path nodes in green
            for (const pn of pathNodes) {
                yield { type: 'SET_NODE_COLOR', nodeId: pn, color: '#22c55e' };
            }

            // Build dist labels for display
            const distLabels = {};
            for (const n of nodes) {
                distLabels[n.id] = dist[n.id] === Infinity ? Infinity : dist[n.id];
            }

            yield { 
                type: 'SET_RESULT_DATA', 
                data: { type: 'dijkstraPath', pathNodes, pathEdges, dist: distLabels, startNodeId } 
            };

            yield { type: 'LOG', message: `Shortest path: ${pathNodes.map(id => nodes.find(n => n.id === id)?.label).join(' → ')}` };
            yield { type: 'SET_LINE', lineIndex: -1 };
            return; // Stop algorithm
        }

        if (prev[u]) {
            const parent = prev[u];
            const edge = adjMap[parent].find(e => e.to === u);
            if (edge) {
                yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' };
            }
        }

        const neighbors = adjMap[u] || [];

        // Line 4: for each neighbor
        yield { type: 'SET_LINE', lineIndex: 4 };

        for (const edge of neighbors) {
            const v = edge.to;
            const weight = Number(edge.weight); // Ensure number

            // Line 5: alt = dist + w
            yield { type: 'SET_LINE', lineIndex: 5 };

            // Line 6: if alt < dist[v]
            yield { type: 'SET_LINE', lineIndex: 6 };

            if (dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;

                // Line 7: dist[v] = alt
                yield { type: 'SET_LINE', lineIndex: 7 };

                prev[v] = u;
                heapPush({ id: v, d: dist[v] });

                yield { type: 'UPDATE_VISITED', nodeId: v };
                yield { type: 'UPDATE_PARENT', childId: v, parentId: u };

                yield { type: 'DS_UPDATE', data: getQueueSnapshot(), action: 'push' };

                yield { type: 'SET_NODE_COLOR', nodeId: v, color: '#fbbf24' };
                yield { type: 'LOG', message: `Relaxed ${nodes.find(n => n.id === v)?.label} : ${dist[v]}` };

                // Line 8: Q.decreaseKey
                yield { type: 'SET_LINE', lineIndex: 8 };
            }
            // Loop Line 4
            yield { type: 'SET_LINE', lineIndex: 4 };
        }
        // Loop Line 2
        yield { type: 'SET_LINE', lineIndex: 2 };
    }

    // Emit final dist array when no target or target not reached
    const finalDistLabels = {};
    for (const n of nodes) {
        finalDistLabels[n.id] = dist[n.id] === Infinity ? Infinity : dist[n.id];
    }
    yield {
        type: 'SET_RESULT_DATA',
        data: { type: 'dijkstraPath', pathNodes: [], pathEdges: [], dist: finalDistLabels, startNodeId }
    };

    yield { type: 'LOG', message: 'Dijkstra Completed' };
    yield { type: 'SET_LINE', lineIndex: -1 };
}

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

    // Initialize matrices
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

    // Add edges
    for (const e of edges) {
        const w = Number(e.weight) || 1;
        dist[e.source][e.target] = Math.min(dist[e.source][e.target], w);
        next[e.source][e.target] = e.target;
        if (edgeIsUndirected(e)) {
            dist[e.target][e.source] = Math.min(dist[e.target][e.source], w);
            next[e.target][e.source] = e.source;
        }
    }

    yield { type: 'LOG', message: `Floyd-Warshall Initialization Complete`, internalState: buildFwState({ k: null, i: null, j: null }, null, 'init', true) };
    yield { type: 'SET_LINE', lineIndex: 0 };

    for (const k of orderedNodes) {
        let updatedInK = false;

        yield { type: 'SET_NODE_COLOR', nodeId: k.id, color: '#fbbf24', internalState: buildFwState({ k: k.id, i: null, j: null }, null, 'running') };

        for (const i of orderedNodes) {
            for (const j of orderedNodes) {
                const current = dist[i.id][j.id];
                const candidate = (dist[i.id][k.id] !== Infinity && dist[k.id][j.id] !== Infinity)
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
                        includeSnapshot
                    )
                };

                if (shouldUpdate) {
                    dist[i.id][j.id] = dist[i.id][k.id] + dist[k.id][j.id];
                    next[i.id][j.id] = next[i.id][k.id];
                    updatedInK = true;
                    yield {
                        type: 'LOG',
                        message: `Updated path: ${i.label} -> ${j.label} via ${k.label} (dist: ${dist[i.id][j.id]})`,
                        internalState: buildFwState({ k: k.id, i: i.id, j: j.id }, {
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
                        }, 'running', false)
                    };
                }
            }
        }
        if (!updatedInK) {
            yield {
                type: 'LOG',
                message: `Checked intermediate node ${k.label} (no shorter paths found)`,
                internalState: buildFwState({ k: k.id, i: null, j: null }, null, 'running', false)
            };
        }

        yield { type: 'SET_NODE_COLOR', nodeId: k.id, color: '#3b82f6', internalState: buildFwState({ k: null, i: null, j: null }, null, 'running', true) };
        yield { type: 'SET_LINE', lineIndex: 1 };
    }

    yield { type: 'LOG', message: `Floyd-Warshall Completed`, internalState: buildFwState({ k: null, i: null, j: null }, null, 'completed', true) };
    yield { type: 'SET_LINE', lineIndex: -1 };
}
