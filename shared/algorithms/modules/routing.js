import {
  edgeIsUndirected,
  orderNodesFromStart,
  buildAdjacencyMap,
  findTraversableEdge,
  comparePrimitive,
  compareEdgesDeterministically,
} from '../core/helpers.js';

export function* distanceVector(nodes, edges, startNodeId) {
    // Distance Vector / Bellman-Ford Simulation
    // Since we want to visualize the *table* updates, we'll iterate through all nodes.
    // Let N = nodes.length. We run N-1 iterations.

    const orderedNodes = orderNodesFromStart(nodes, startNodeId || nodes[0]?.id);
    const sourceId = orderedNodes[0]?.id;
    const dist = {}; // { nodeId: { destId: { dist: number, nextHop: nodeId } } }
    const nodeLabelMap = {};
    nodes.forEach((n) => {
        nodeLabelMap[n.id] = n.label;
    });
    let compareStep = 0;

    const toDisplayDistance = (value) => (value === Infinity ? 'INF' : value);

    // Initialize
    orderedNodes.forEach(u => {
        dist[u.id] = {};
        orderedNodes.forEach(v => {
            if (u.id === v.id) {
                dist[u.id][v.id] = { dist: 0, nextHop: u.id };
            } else {
                dist[u.id][v.id] = { dist: Infinity, nextHop: null };
            }
        });
    });

    // Helper to emit table update
    function* emitTableUpdate() {
        // We need to clone the structure for state immutability in store
        const tableCopy = JSON.parse(JSON.stringify(dist));
        yield { type: 'DS_UPDATE_ROUTING_TABLE', table: tableCopy };
    }

    // Line 0: Initialization
    yield { type: 'SET_LINE', lineIndex: 0 };
    yield* emitTableUpdate();
    yield { type: 'LOG', message: "Initialized Routing Tables" };

    let changed = true;
    let iterations = 0;
    const MAX_ITERATIONS = nodes.length + 2; // Safety + negative cycle check space

    // Line 1: Loop until no changes or max iterations
    yield { type: 'SET_LINE', lineIndex: 1 };

    while (changed && iterations < MAX_ITERATIONS) {
        // Line 1: iteration loop
        yield { type: 'SET_LINE', lineIndex: 1 };

        changed = false;
        iterations++;
        yield { type: 'LOG', message: `Iteration ${iterations} Started` };

        // For each node u (Parallel simulate by processing all edges relative to u)
        // Actually, DVR is usually: each node sends vector to neighbors. Neighbors update.
        // Let's iterate edges: for each edge (u, v) with weight w:
        //    if dist(u, dest) > w + dist(v, dest), update.
        // We do this for ALL destinations.

        // Line 2: Relax all edges
        yield { type: 'SET_LINE', lineIndex: 2 };

        for (const edge of edges) {
            const u = edge.source;
            const v = edge.target;
            const w = Number(edge.weight);

            // Check updates from u -> v and v -> u (if undirected)

            // 1. Update u's table based on v's table
            for (const dest of orderedNodes) {
                const destId = dest.id;
                // If v has a path to dest
                if (dist[v][destId].dist !== Infinity) {
                    const newDist = w + dist[v][destId].dist;
                    const currentDist = dist[u][destId].dist;
                    compareStep += 1;

                    // Line 3: relaxation check
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
                        // Line 4: update distance
                        yield { type: 'SET_LINE', lineIndex: 4 };

                        dist[u][destId] = { dist: newDist, nextHop: v };
                        changed = true;
                        yield { type: 'SET_ACTIVE_TABLE_NODE', nodeId: u };
                        yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#fbbf24' }; // Highlight updating node
                        yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' }; // Highlight used edge

                        // Line 5: notify neighbors (table update broadcast)
                        yield { type: 'SET_LINE', lineIndex: 5 };

                        yield { type: 'LOG', message: `Node ${nodes.find(n => n.id === u)?.label} updates dist to ${dest.label}: ${newDist} (via ${nodes.find(n => n.id === v)?.label})` };
                        yield* emitTableUpdate();
                    }
                }
            }

            // 2. If undirected, update v's table based on u's table
            if (edgeIsUndirected(edge)) {
                for (const dest of orderedNodes) {
                    const destId = dest.id;
                    if (dist[u][destId].dist !== Infinity) {
                        const newDist = w + dist[u][destId].dist;
                        const currentDist = dist[v][destId].dist;
                        compareStep += 1;

                        // Line 3: relaxation check
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
                            // Line 4: update distance
                            yield { type: 'SET_LINE', lineIndex: 4 };

                            dist[v][destId] = { dist: newDist, nextHop: u };
                            changed = true;
                            yield { type: 'SET_ACTIVE_TABLE_NODE', nodeId: v };
                            yield { type: 'SET_NODE_COLOR', nodeId: v, color: '#fbbf24' };
                            yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' };

                            // Line 5: notify neighbors (table update broadcast)
                            yield { type: 'SET_LINE', lineIndex: 5 };

                            yield { type: 'LOG', message: `Node ${nodes.find(n => n.id === v)?.label} updates dist to ${dest.label}: ${newDist} (via ${nodes.find(n => n.id === u)?.label})` };
                            yield* emitTableUpdate();
                        }
                    }
                }
            }

            // Yield after each edge processing to show animation step-by-step?
            // Or maybe after a batch?
            yield { type: 'SET_LINE', lineIndex: 2 };
        }

        // Clear highlights after iteration
        // Clear highlights after iteration
        for (const n of nodes) {
            yield { type: 'SET_NODE_COLOR', nodeId: n.id, color: undefined };
        }
        for (const e of edges) {
            yield { type: 'CLASSIFY_EDGE', edgeId: e.id, classification: undefined };
        }
    }


    if (iterations >= 6) { // Using constant for now or use nodes.length + 2 if available
        yield { type: 'LOG', message: "Negative Cycle Detected or Max Iterations Reached!" };
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
            }
        };

        yield {
            type: 'LOG',
            message: `Final costs from ${nodes.find((n) => n.id === sourceId)?.label ?? sourceId}: ${orderedNodes
                .map((node) => `${nodes.find((n) => n.id === node.id)?.label ?? node.id}=${finalCosts[node.id] === Infinity ? 'INF' : finalCosts[node.id]}`)
                .join(', ')}`
        };
    }

    yield { type: 'SET_ACTIVE_TABLE_NODE', nodeId: null };
    yield { type: 'SET_LINE', lineIndex: -1 };
}

export function* linkState(nodes, edges, startNodeId) {
    // Link State Routing: Flooding + Dijkstra (SPF)
    const orderedNodes = orderNodesFromStart(nodes, startNodeId || nodes[0]?.id);
    const nodeLabelMap = {};
    nodes.forEach((n) => {
        nodeLabelMap[n.id] = n.label;
    });
    let compareStep = 0;
    const toDisplayDistance = (value) => (value === Infinity ? 'INF' : value);

    const dist = {}; // Routing table state

    // Initialize Tables
    orderedNodes.forEach(u => {
        dist[u.id] = {};
        orderedNodes.forEach(v => {
            dist[u.id][v.id] = { dist: Infinity, nextHop: null };
            if (u.id === v.id) dist[u.id][v.id] = { dist: 0, nextHop: u.id };
        });
    });

    function* emitTableUpdate() {
        const tableCopy = JSON.parse(JSON.stringify(dist));
        yield { type: 'DS_UPDATE_ROUTING_TABLE', table: tableCopy };
    }

    yield { type: 'SET_LINE', lineIndex: 0 }; // Start
    yield* emitTableUpdate();
    yield { type: 'LOG', message: "Initialized Link State Routing" };

    // Phase 1: Flooding (Simulated)
    // In real LSR, LSAs are flooded. Here we'll simulate each node "discovering" the full topology.
    // Line 1: Flooding LSAs
    yield { type: 'SET_LINE', lineIndex: 1 };
    yield { type: 'LOG', message: "Phase 1: Flooding Link State Advertisements (LSAs)" };

    // Animate "flooding" by highlighting edges in waves? 
    // Or just iterate nodes and show them "broadcasting"

    for (const node of orderedNodes) {
        yield { type: 'SET_NODE_COLOR', nodeId: node.id, color: '#fbbf24' }; // Broadcasting
        yield { type: 'LOG', message: `Node ${node.label} floods LSA to neighbors` };

        // Highlight outgoing edges
        const outgoing = edges.filter(e => e.source === node.id || (edgeIsUndirected(e) && e.target === node.id));
        for (const edge of outgoing) {
            yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' }; // Using 'tree' for highlight color
        }

        // Wait a tick
        yield { type: 'SET_LINE', lineIndex: 1 };

        // Broadcast LSA to store
        yield {
            type: 'ADD_LSA',
            lsa: {
                sourceId: node.id,
                links: outgoing.map(e => ({
                    to: e.source === node.id ? e.target : e.source,
                    weight: e.weight || 1
                }))
            }
        };

        // Reset colors
        yield { type: 'SET_NODE_COLOR', nodeId: node.id, color: undefined };
        for (const edge of outgoing) {
            yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: undefined };
        }
    }

    yield { type: 'LOG', message: "All nodes have full Link State Database (LSDB)" };

    // Phase 2: SPF Calculation (Local Dijkstra for each node)
    // Line 2: Compute SPF for each node
    yield { type: 'SET_LINE', lineIndex: 2 };

    // Re-use Dijkstra logic but locally? 
    // We can just implement plain Dijkstra on the `nodes/edges` data since LSDB = Full Topology.

    for (const source of orderedNodes) {
        yield { type: 'LOG', message: `Node ${source.label} running Dijkstra (SPF)...` };
        yield { type: 'SET_ACTIVE_TABLE_NODE', nodeId: source.id };
        // Clear previous visual state for the new SPF calculation
        for (const n of nodes) yield { type: 'SET_NODE_COLOR', nodeId: n.id, color: undefined };
        for (const e of edges) yield { type: 'CLASSIFY_EDGE', edgeId: e.id, classification: undefined };

        yield { type: 'SET_NODE_COLOR', nodeId: source.id, color: '#8b5cf6' }; // Purple for calculating node

        // Run Dijkstra for `source`
        // Standard Dijkstra implementation
        const d = {};
        const next = {};
        const parent = {};
        const pq = [];

        orderedNodes.forEach(n => { d[n.id] = Infinity; next[n.id] = null; parent[n.id] = null; });
        d[source.id] = 0;
        pq.push({ id: source.id, cost: 0 });
        yield { type: 'DS_UPDATE', data: [...pq], action: 'push' };

        // Helper to find edge weight
        const getWeight = (u, v) => {
            const edge = findTraversableEdge(edges, u, v);
            return edge ? Number(edge.weight) : Infinity;
        };

        // Get Neighbors helper
        const getNeighbors = (u) => {
            const nbrs = [];
            edges.forEach(e => {
                if (e.source === u) nbrs.push(e.target);
                else if (e.target === u && edgeIsUndirected(e)) nbrs.push(e.source);
            });
            return nbrs;
        };

        while (pq.length > 0) {
            pq.sort((a, b) => a.cost - b.cost);
            const { id: u, cost: uCost } = pq.shift();
            yield { type: 'DS_UPDATE', data: [...pq], action: 'pop' };

            if (uCost > d[u]) continue;

            if (u !== source.id) {
                yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#3b82f6' }; // Processed (Blue)
                if (parent[u]) {
                    const edge = findTraversableEdge(edges, parent[u], u);
                    if (edge) yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' };
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
                        }
                    }
                };

                if (d[u] + weight < d[v]) {
                    d[v] = d[u] + weight;

                    // Determine Next Hop
                    // If u is source, then v is a direct neighbor, so next hop to v is v.
                    // If u is not source, next hop to v is same as next hop to u.
                    if (u === source.id) {
                        next[v] = v;
                    } else {
                        next[v] = next[u];
                    }
                    parent[v] = u;

                    pq.push({ id: v, cost: d[v] });
                    yield { type: 'DS_UPDATE', data: [...pq], action: 'push' };

                    yield { type: 'SET_NODE_COLOR', nodeId: v, color: '#fbbf24' }; // Enqueued/Discovered (Yellow)
                }
            }
        }

        // Update Global Table with Local Results
        // dist[source.id][dest.id]
        orderedNodes.forEach(dest => {
            dist[source.id][dest.id] = {
                dist: d[dest.id],
                nextHop: next[dest.id]
            };
        });

        yield* emitTableUpdate();
        yield { type: 'SET_NODE_COLOR', nodeId: source.id, color: undefined };

        // Small pause between nodes?
        yield { type: 'SET_LINE', lineIndex: 2 };
    }

    yield { type: 'SET_ACTIVE_TABLE_NODE', nodeId: null };
    yield { type: 'LOG', message: "Link State Routing Converged" };
    yield { type: 'SET_LINE', lineIndex: -1 };
}
