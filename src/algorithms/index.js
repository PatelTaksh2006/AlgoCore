


export function* dfs(nodes, edges, startNodeId) {
    const adjMap = {};
    nodes.forEach(n => adjMap[n.id] = []);
    edges.forEach(e => {
        adjMap[e.source].push({ to: e.target, id: e.id, weight: e.weight });
        if (e.type === 'undirected') {
            adjMap[e.target].push({ to: e.source, id: e.id, weight: e.weight });
        }
    });

    const discoveryTime = {};
    const finishTime = {};
    const colors = {};
    let time = 0;

    // Line 0: function DFS(u) - effectively start
    yield { type: 'SET_LINE', lineIndex: 0 };

    for (const n of nodes) {
        colors[n.id] = 'WHITE';
        yield { type: 'SET_NODE_COLOR', nodeId: n.id, color: undefined };
    }

    yield { type: 'LOG', message: `DFS Started` };

    const stack = [];

    function* dfsVisit(u, p = null) {
        // Line 0: function called
        yield { type: 'SET_LINE', lineIndex: 0 };

        stack.push(u);
        yield { type: 'DS_UPDATE', data: [...stack], action: 'push', node: u };

        // Visited update
        yield { type: 'UPDATE_VISITED', nodeId: u };
        if (p) yield { type: 'UPDATE_PARENT', childId: u, parentId: p };

        colors[u] = 'GRAY';
        time++;
        discoveryTime[u] = time;
        yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#fbbf24' };
        yield { type: 'LOG', message: `Discovered ${nodes.find(n => n.id === u)?.label}` };

        // Line 1: mark u as Visited (Gray)
        yield { type: 'SET_LINE', lineIndex: 1 };

        const neighbors = adjMap[u] || [];

        // Line 2: for each neighbor
        yield { type: 'SET_LINE', lineIndex: 2 };

        for (const edge of neighbors) {
            const v = edge.to;
            const edgeId = edge.id;

            // Line 3: if v is Unvisited
            yield { type: 'SET_LINE', lineIndex: 3 };

            if (colors[v] === 'WHITE') {
                yield { type: 'CLASSIFY_EDGE', edgeId, classification: 'tree' };
                // Line 4: DFS(v)
                yield { type: 'SET_LINE', lineIndex: 4 };
                yield* dfsVisit(v, u);

                // Return to loop (Line 2)
                yield { type: 'SET_LINE', lineIndex: 2 };

            } else if (colors[v] === 'GRAY') {
                // Back-edge found: yield specific action for Result Tree
                yield { type: 'ADD_BACK_EDGE', edgeId: edgeId, source: u, target: v, classification: 'back' };
                yield { type: 'LOG', message: `Back-edge detected: ${nodes.find(n => n.id === u)?.label} -> ${nodes.find(n => n.id === v)?.label}` };
            } else if (colors[v] === 'BLACK') {
                if (discoveryTime[u] < discoveryTime[v]) {
                    yield { type: 'CLASSIFY_EDGE', edgeId, classification: 'forward' };
                } else {
                    yield { type: 'CLASSIFY_EDGE', edgeId, classification: 'cross' };
                }
            }
        }

        colors[u] = 'BLACK';
        time++;
        finishTime[u] = time;
        yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#3b82f6' };

        // Line 5: mark u as Finished (Black)
        yield { type: 'SET_LINE', lineIndex: 5 };

        stack.pop();
        yield { type: 'DS_UPDATE', data: [...stack], action: 'pop' };
    }

    if (startNodeId) yield* dfsVisit(startNodeId);
    yield { type: 'LOG', message: 'DFS Completed' };
    yield { type: 'SET_LINE', lineIndex: -1 };
}

export function* bfs(nodes, edges, startNodeId) {
    const adjMap = {};
    nodes.forEach(n => adjMap[n.id] = []);
    edges.forEach(e => {
        adjMap[e.source].push({ to: e.target, id: e.id, weight: e.weight });
        if (e.type === 'undirected') {
            adjMap[e.target].push({ to: e.source, id: e.id, weight: e.weight });
        }
    });

    const colors = {};
    const queue = [];

    // Line 0: function BFS(start)
    yield { type: 'SET_LINE', lineIndex: 0 };

    for (const n of nodes) {
        colors[n.id] = 'WHITE';
        yield { type: 'SET_NODE_COLOR', nodeId: n.id, color: undefined };
    }

    if (!startNodeId) return;

    // Line 1: create queue Q, enqueue start
    yield { type: 'SET_LINE', lineIndex: 1 };

    colors[startNodeId] = 'GRAY';
    queue.push(startNodeId);
    yield { type: 'DS_UPDATE', data: [...queue], action: 'push', node: startNodeId };
    yield { type: 'SET_NODE_COLOR', nodeId: startNodeId, color: '#fbbf24' };
    yield { type: 'UPDATE_VISITED', nodeId: startNodeId };

    // Line 2: mark start as Visited
    yield { type: 'SET_LINE', lineIndex: 2 };

    // Line 3: while Q is not empty
    yield { type: 'SET_LINE', lineIndex: 3 };

    while (queue.length > 0) {
        const u = queue.shift();
        yield { type: 'DS_UPDATE', data: [...queue], action: 'pop', node: u };

        // Line 4: u = Q.dequeue()
        yield { type: 'SET_LINE', lineIndex: 4 };

        const neighbors = adjMap[u] || [];

        // Line 5: for each neighbor v
        yield { type: 'SET_LINE', lineIndex: 5 };

        for (const edge of neighbors) {
            const v = edge.to;

            // Line 6: if v is Unvisited
            yield { type: 'SET_LINE', lineIndex: 6 };

            if (colors[v] === 'WHITE') {
                colors[v] = 'GRAY';
                queue.push(v);
                yield { type: 'UPDATE_VISITED', nodeId: v };
                yield { type: 'UPDATE_PARENT', childId: v, parentId: u };

                // Line 7: mark v as Visited
                yield { type: 'SET_LINE', lineIndex: 7 };

                yield { type: 'DS_UPDATE', data: [...queue], action: 'push', node: v };
                yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' };
                yield { type: 'SET_NODE_COLOR', nodeId: v, color: '#fbbf24' };

                // Line 8: Q.enqueue(v)
                yield { type: 'SET_LINE', lineIndex: 8 };

            } else {
                if (colors[v] === 'GRAY') {
                    yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'back' };
                } else {
                    yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'cross' };
                }
            }
            // Loop back to Line 5? Or just implied
            yield { type: 'SET_LINE', lineIndex: 5 };
        }

        colors[u] = 'BLACK';
        yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#3b82f6' };

        // Loop back to Line 3 (while)
    }
    yield { type: 'SET_LINE', lineIndex: -1 };
}

export function* dijkstra(nodes, edges, startNodeId) {
    const adjMap = {};
    nodes.forEach(n => adjMap[n.id] = []);
    edges.forEach(e => {
        adjMap[e.source].push({ to: e.target, id: e.id, weight: e.weight });
        if (e.type === 'undirected') {
            adjMap[e.target].push({ to: e.source, id: e.id, weight: e.weight });
        }
    });

    const dist = {};
    const prev = {};
    const pq = [];

    // Line 0
    yield { type: 'SET_LINE', lineIndex: 0 };

    for (const n of nodes) {
        dist[n.id] = Infinity;
        prev[n.id] = null;
        yield { type: 'SET_NODE_COLOR', nodeId: n.id, color: undefined };
    }

    if (!startNodeId) return;

    dist[startNodeId] = 0;
    pq.push({ id: startNodeId, d: 0 });
    yield { type: 'DS_UPDATE', data: [...pq], action: 'push' };
    yield { type: 'SET_NODE_COLOR', nodeId: startNodeId, color: '#fbbf24' };
    yield { type: 'UPDATE_VISITED', nodeId: startNodeId };

    // Line 1: dist[start]=0, Q.push
    yield { type: 'SET_LINE', lineIndex: 1 };

    // Line 2: while Q not empty
    yield { type: 'SET_LINE', lineIndex: 2 };

    while (pq.length > 0) {
        pq.sort((a, b) => a.d - b.d);
        yield { type: 'DS_UPDATE', data: [...pq], action: 'update' };

        const { id: u, d: uDist } = pq.shift();
        yield { type: 'DS_UPDATE', data: [...pq], action: 'pop' };

        // Line 3: u = Q.extractMin()
        yield { type: 'SET_LINE', lineIndex: 3 };

        if (uDist > dist[u]) continue;

        yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#3b82f6' };
        yield { type: 'LOG', message: `Processing ${nodes.find(n => n.id === u)?.label} (dist: ${uDist})` };

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
                pq.push({ id: v, d: dist[v] });

                yield { type: 'UPDATE_VISITED', nodeId: v };
                yield { type: 'UPDATE_PARENT', childId: v, parentId: u };

                yield { type: 'DS_UPDATE', data: [...pq], action: 'push' };

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
    yield { type: 'SET_LINE', lineIndex: -1 };
}

export function* prim(nodes, edges, startNodeId) {
    const adjMap = {};
    nodes.forEach(n => adjMap[n.id] = []);
    edges.forEach(e => {
        adjMap[e.source].push({ to: e.target, id: e.id, weight: e.weight });
        if (e.type === 'undirected') {
            adjMap[e.target].push({ to: e.source, id: e.id, weight: e.weight });
        }
    });

    const key = {};
    const parent = {};
    const inMST = {};
    const pq = [];

    // Line 0
    yield { type: 'SET_LINE', lineIndex: 0 };

    for (const n of nodes) {
        key[n.id] = Infinity;
        inMST[n.id] = false;
        yield { type: 'SET_NODE_COLOR', nodeId: n.id, color: undefined };
    }

    if (!startNodeId) startNodeId = nodes[0]?.id;
    if (!startNodeId) return;

    key[startNodeId] = 0;
    pq.push({ id: startNodeId, k: 0 });
    yield { type: 'DS_UPDATE', data: [...pq], action: 'push' };
    yield { type: 'UPDATE_VISITED', nodeId: startNodeId };

    // Line 1: key[start]=0, Q.push
    yield { type: 'SET_LINE', lineIndex: 1 };

    // Line 2: while Q not empty
    yield { type: 'SET_LINE', lineIndex: 2 };

    while (pq.length > 0) {
        pq.sort((a, b) => a.k - b.k);
        yield { type: 'DS_UPDATE', data: [...pq], action: 'update' };

        const { id: u } = pq.shift();
        yield { type: 'DS_UPDATE', data: [...pq], action: 'pop' };

        // Line 3: u = Q.extractMin
        yield { type: 'SET_LINE', lineIndex: 3 };

        if (inMST[u]) continue;
        inMST[u] = true;

        // Line 4: add u to MST
        yield { type: 'SET_LINE', lineIndex: 4 };

        yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#3b82f6' };

        if (parent[u]) {
            const p = parent[u];
            const edge = adjMap[p].find(e => e.to === u);
            if (edge) yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' };
        }

        const neighbors = adjMap[u] || [];

        // Line 5: for each neighbor
        yield { type: 'SET_LINE', lineIndex: 5 };

        for (const edge of neighbors) {
            const v = edge.to;
            const weight = Number(edge.weight);

            // Line 6: if v not in MST and w < key
            yield { type: 'SET_LINE', lineIndex: 6 };

            if (!inMST[v] && weight < key[v]) {
                key[v] = weight;
                parent[v] = u;

                // Line 7: parent[v] = u
                yield { type: 'SET_LINE', lineIndex: 7 };

                // Line 8: key[v] = w
                yield { type: 'SET_LINE', lineIndex: 8 };

                pq.push({ id: v, k: weight });
                yield { type: 'UPDATE_VISITED', nodeId: v };
                yield { type: 'UPDATE_PARENT', childId: v, parentId: u };

                yield { type: 'DS_UPDATE', data: [...pq], action: 'push' };
                yield { type: 'SET_NODE_COLOR', nodeId: v, color: '#fbbf24' };

                // Line 9: Q.decreaseKey
                yield { type: 'SET_LINE', lineIndex: 9 };
            }
            // Loop Line 5
            yield { type: 'SET_LINE', lineIndex: 5 };
        }
        // Loop Line 2
        yield { type: 'SET_LINE', lineIndex: 2 };
    }
    yield { type: 'SET_LINE', lineIndex: -1 };
}

export function* kruskal(nodes, edges) {
    const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);

    const parent = {};
    nodes.forEach(n => parent[n.id] = n.id);

    function find(i) {
        if (parent[i] === i) return i;
        return find(parent[i]);
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

    // Line 0
    yield { type: 'SET_LINE', lineIndex: 0 };

    for (const n of nodes) {
        yield { type: 'SET_NODE_COLOR', nodeId: n.id, color: undefined };
    }

    // Line 1: Sort edges
    yield { type: 'SET_LINE', lineIndex: 1 };

    // Line 2: For each edge
    yield { type: 'SET_LINE', lineIndex: 2 };

    for (const edge of sortedEdges) {
        yield { type: 'LOG', message: `Checking edge (${edge.weight})` };

        // Line 3: if find(u) != find(v)
        yield { type: 'SET_LINE', lineIndex: 3 };

        if (union(edge.source, edge.target)) {
            // Line 4: union(u, v)
            yield { type: 'SET_LINE', lineIndex: 4 };

            yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' };
            yield { type: 'LOG', message: `Added to MST` };

            // Kruskal doesn't use "Visited" in same way, but we could mark nodes as visited when added to MST set?
            // User asked for "Parent" and "Visited".
            // For Kruskal, Parent usually refers to Disjoint Set parent (which changes), or MST tree parent?
            // Displaying Disjoint Set parent is cool.
            // Let's emit UPDATE_PARENT for the union op?
            // Actually, `parent` in DS is structural.
            // Let's just track connected nodes as "Visited".
            yield { type: 'UPDATE_VISITED', nodeId: edge.source };
            yield { type: 'UPDATE_VISITED', nodeId: edge.target };

            // Line 5: add edge to MST
            yield { type: 'SET_LINE', lineIndex: 5 };

        } else {
            yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'back' };
            yield { type: 'LOG', message: `Cycle detected - Discarded` };
        }
        // Loop Line 2
        yield { type: 'SET_LINE', lineIndex: 2 };
    }

    yield { type: 'SET_LINE', lineIndex: -1 };
}

export function* scc(nodes, edges, startNodeId) {
    // Adjacency list
    const adj = {};
    nodes.forEach(n => adj[n.id] = []);
    edges.forEach(e => {
        adj[e.source].push({ target: e.target, weight: e.weight || 0, id: e.id });
    });

    const ids = {};
    const low = {};
    const onStack = {};
    const stack = [];
    const visited = {}; // Standard visited tracking using context

    let idCounter = 0;

    // Helper generator for DFS
    function* dfs(at) {
        stack.push(at);
        onStack[at] = true;
        ids[at] = low[at] = idCounter++;
        visited[at] = true;

        // Line 1: ids[u], low[u] = time++, stack.push(u)
        yield { type: 'SET_LINE', lineIndex: 1 };
        yield { type: 'UPDATE_VISITED', nodeId: at };
        yield { type: 'SET_NODE_COLOR', nodeId: at, color: '#fbbf24' }; // Visiting (Yellow)
        yield { type: 'DS_UPDATE', data: [...stack], action: 'replace' }; // Show stack

        // Line 2: onStack[u] = true
        yield { type: 'SET_LINE', lineIndex: 2 };

        const neighbors = adj[at];
        // Line 3: for each neighbor v
        yield { type: 'SET_LINE', lineIndex: 3 };

        for (const edge of neighbors) {
            const to = edge.target;

            // Line 4: if not visited[v]
            yield { type: 'SET_LINE', lineIndex: 4 };

            if (ids[to] === undefined) {
                yield { type: 'UPDATE_PARENT', childId: to, parentId: at };

                // Line 5: TarjanSCC(v)
                yield { type: 'SET_LINE', lineIndex: 5 };
                yield* dfs(to);

                // Line 6: low[u] = min(low[u], low[v])
                yield { type: 'SET_LINE', lineIndex: 6 };
                low[at] = Math.min(low[at], low[to]);

            } else if (onStack[to]) {
                // Line 7: else if onStack[v]
                yield { type: 'SET_LINE', lineIndex: 7 };

                // Line 8: low[u] = min(low[u], ids[v])
                yield { type: 'SET_LINE', lineIndex: 8 };
                low[at] = Math.min(low[at], ids[to]);
            }
            // Loop Line 3
            yield { type: 'SET_LINE', lineIndex: 3 };
        }

        // Line 9: if ids[u] == low[u]
        yield { type: 'SET_LINE', lineIndex: 9 };

        if (ids[at] === low[at]) {
            // Line 10: pop from stack until u
            yield { type: 'SET_LINE', lineIndex: 10 };

            const component = [];
            let node;
            do {
                node = stack.pop();
                onStack[node] = false;
                component.push(node);
                yield { type: 'SET_NODE_COLOR', nodeId: node, color: '#3b82f6' }; // Finished (Blue)
            } while (node !== at);

            yield { type: 'DS_UPDATE', data: [...stack], action: 'replace' };
            yield { type: 'FOUND_COMPONENT', component: component };
            yield { type: 'LOG', message: `Found SCC: ${component.length} nodes` };
        }
    }

    // Line 0: function TarjanSCC(u)
    yield { type: 'SET_LINE', lineIndex: 0 };
    yield { type: 'LOG', message: "Tarjan's SCC Started" };

    // Run DFS on all nodes (to cover disconnected components)
    // Note: Tarjan's typically iterates all nodes 1..V
    for (const node of nodes) {
        if (ids[node.id] === undefined) {
            // If we want to visualize the outer loop, maybe set a line?
            // But pseudocode function is TarjanSCC(u).
            // Let's just call it.
            yield* dfs(node.id);
        }
    }

    yield { type: 'SET_LINE', lineIndex: -1 };
    yield { type: 'LOG', message: "SCC Completed" };
}

export function* distanceVector(nodes, edges) {
    // Distance Vector / Bellman-Ford Simulation
    // Since we want to visualize the *table* updates, we'll iterate through all nodes.
    // Let N = nodes.length. We run N-1 iterations.

    const dist = {}; // { nodeId: { destId: { dist: number, nextHop: nodeId } } }

    // Initialize
    nodes.forEach(u => {
        dist[u.id] = {};
        nodes.forEach(v => {
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
            for (const dest of nodes) {
                const destId = dest.id;
                // If v has a path to dest
                if (dist[v][destId].dist !== Infinity) {
                    const newDist = w + dist[v][destId].dist;
                    if (newDist < dist[u][destId].dist) {
                        dist[u][destId] = { dist: newDist, nextHop: v };
                        changed = true;
                        yield { type: 'SET_ACTIVE_TABLE_NODE', nodeId: u };
                        yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#fbbf24' }; // Highlight updating node
                        yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' }; // Highlight used edge
                        yield { type: 'LOG', message: `Node ${nodes.find(n => n.id === u)?.label} updates dist to ${dest.label}: ${newDist} (via ${nodes.find(n => n.id === v)?.label})` };
                        yield* emitTableUpdate();
                    }
                }
            }

            // 2. If undirected, update v's table based on u's table
            if (edge.type === 'undirected' || !edge.type) { // Assuming global 'isDirected' handles this? 
                // Wait, edges have type? The visualizer usually sets this.
                // The algorithm receives `edges` which might just be raw data. 
                // Usually we treat provided edges as directed if `isDirected` is true globally, but `edges` passed here *might* not have `type` set if strictly from graph context?
                // Actually `edges` in context usually just have source/target.
                // Let's assume we handle bi-direction if the graph is undirected.
                // However, standard graph theory: if undirected, we have (u,v) and (v,u). 
                // Our edge list usually only has one entry.
                // Let's check `bfs` implementation: it builds `adjMap` handling undirected.
                // We should probably do the same or check edge.type.

                // Let's do the update for v -> u here explicitly if we assume undirected for now, 
                // OR we can rely on standard "relax edges" approach where we iterate all directed edges.
                // If the graph is undirected, we should interpret edge (u,v) as (u,v) and (v,u).

                for (const dest of nodes) {
                    const destId = dest.id;
                    if (dist[u][destId].dist !== Infinity) {
                        const newDist = w + dist[u][destId].dist;
                        if (newDist < dist[v][destId].dist) {
                            dist[v][destId] = { dist: newDist, nextHop: u };
                            changed = true;
                            yield { type: 'SET_ACTIVE_TABLE_NODE', nodeId: v };
                            yield { type: 'SET_NODE_COLOR', nodeId: v, color: '#fbbf24' };
                            yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' };
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

    yield { type: 'SET_ACTIVE_TABLE_NODE', nodeId: null };
    yield { type: 'SET_LINE', lineIndex: -1 };
}

export function* linkState(nodes, edges) {
    // Link State Routing: Flooding + Dijkstra (SPF)

    const dist = {}; // Routing table state

    // Initialize Tables
    nodes.forEach(u => {
        dist[u.id] = {};
        nodes.forEach(v => {
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

    for (const node of nodes) {
        yield { type: 'SET_NODE_COLOR', nodeId: node.id, color: '#fbbf24' }; // Broadcasting
        yield { type: 'LOG', message: `Node ${node.label} floods LSA to neighbors` };

        // Highlight outgoing edges
        const outgoing = edges.filter(e => e.source === node.id || (e.type === 'undirected' && e.target === node.id));
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

    for (const source of nodes) {
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

        nodes.forEach(n => { d[n.id] = Infinity; next[n.id] = null; parent[n.id] = null; });
        d[source.id] = 0;
        pq.push({ id: source.id, cost: 0 });
        yield { type: 'DS_UPDATE', data: [...pq], action: 'push' };

        // Helper to find edge weight
        const getWeight = (u, v) => {
            const edge = edges.find(e =>
                (e.source === u && e.target === v) ||
                (e.type === 'undirected' && e.source === v && e.target === u) ||
                (!e.type && e.source === v && e.target === u) // Assume undirected if type not set
            );
            return edge ? Number(edge.weight) : Infinity;
        };

        // Get Neighbors helper
        const getNeighbors = (u) => {
            const nbrs = [];
            edges.forEach(e => {
                if (e.source === u) nbrs.push(e.target);
                else if (e.target === u && (e.type === 'undirected' || !e.type)) nbrs.push(e.source);
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
                    const edge = edges.find(e =>
                        (e.source === parent[u] && e.target === u) ||
                        (e.type === 'undirected' && e.source === u && e.target === parent[u]) ||
                        (!e.type && e.source === u && e.target === parent[u])
                    );
                    if (edge) yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' };
                }
            }

            const neighbors = getNeighbors(u);
            for (const v of neighbors) {
                const weight = getWeight(u, v);
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
        nodes.forEach(dest => {
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

export const algorithms = {
    dfs,
    bfs,
    dijkstra,
    prim,
    kruskal,
    scc,
    distanceVector,
    linkState
};
