
const edgeIsUndirected = (edge) => edge.directed === false || edge.type === 'undirected';

const orderNodesFromStart = (nodes, startNodeId) => {
    if (!startNodeId) {
        return nodes;
    }

    const startNode = nodes.find((node) => node.id === startNodeId);
    if (!startNode) {
        return nodes;
    }

    return [startNode, ...nodes.filter((node) => node.id !== startNodeId)];
};

const buildAdjacencyMap = (nodes, edges, { forceUndirected = false } = {}) => {
    const adjMap = {};
    nodes.forEach((node) => {
        adjMap[node.id] = [];
    });

    edges.forEach((edge) => {
        const undirected = forceUndirected || edgeIsUndirected(edge);
        adjMap[edge.source]?.push({
            to: edge.target,
            id: edge.id,
            weight: Number(edge.weight ?? 1),
            undirected,
        });

        if (undirected) {
            adjMap[edge.target]?.push({
                to: edge.source,
                id: edge.id,
                weight: Number(edge.weight ?? 1),
                undirected: true,
            });
        }
    });

    return adjMap;
};

const findTraversableEdge = (edges, source, target, { forceUndirected = false } = {}) => (
    edges.find((edge) => (
        (edge.source === source && edge.target === target) ||
        ((forceUndirected || edgeIsUndirected(edge)) && edge.source === target && edge.target === source)
    ))
);

const comparePrimitive = (left, right) => {
    if (typeof left === 'number' && typeof right === 'number') {
        return left - right;
    }

    return String(left).localeCompare(String(right));
};

const compareEdgesDeterministically = (leftEdge, rightEdge) => {
    const sourceCompare = comparePrimitive(leftEdge.source, rightEdge.source);
    if (sourceCompare !== 0) {
        return sourceCompare;
    }

    const targetCompare = comparePrimitive(leftEdge.target, rightEdge.target);
    if (targetCompare !== 0) {
        return targetCompare;
    }

    return comparePrimitive(leftEdge.id, rightEdge.id);
};

export function* dfs(nodes, edges, startNodeId) {
    const adjMap = buildAdjacencyMap(nodes, edges);
    const orderedNodes = orderNodesFromStart(nodes, startNodeId || nodes[0]?.id);

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

    function* dfsVisit(u, p = null, incomingEdgeId = null) {
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
            if (edge.undirected && edge.id === incomingEdgeId) {
                continue;
            }

            const v = edge.to;
            const edgeId = edge.id;

            // Line 3: if v is Unvisited
            yield { type: 'SET_LINE', lineIndex: 3 };

            if (colors[v] === 'WHITE') {
                yield { type: 'CLASSIFY_EDGE', edgeId, classification: 'tree' };
                // Line 4: DFS(v)
                yield { type: 'SET_LINE', lineIndex: 4 };
                yield* dfsVisit(v, u, edgeId);

                // Return to loop (Line 2)
                yield { type: 'SET_LINE', lineIndex: 2 };

            } else if (colors[v] === 'GRAY') {
                // Back-edge found: yield specific action for Result Tree
                yield { type: 'ADD_BACK_EDGE', edgeId: edgeId, source: u, target: v, classification: 'back' };
                yield { type: 'LOG', message: `Back-edge detected: ${nodes.find(n => n.id === u)?.label} -> ${nodes.find(n => n.id === v)?.label}` };
            } else if (!edge.undirected && colors[v] === 'BLACK') {
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

    for (const node of orderedNodes) {
        if (colors[node.id] === 'WHITE') {
            yield* dfsVisit(node.id);
        }
    }
    yield { type: 'LOG', message: 'DFS Completed' };
    yield { type: 'SET_LINE', lineIndex: -1 };
}

export function* bfs(nodes, edges, startNodeId) {
    const adjMap = buildAdjacencyMap(nodes, edges);
    const orderedNodes = orderNodesFromStart(nodes, startNodeId || nodes[0]?.id);

    const colors = {};
    const parent = {};
    const parentEdge = {};
    const queue = [];

    const isAncestor = (candidateAncestor, nodeId) => {
        let current = parent[nodeId] ?? null;

        while (current !== null && current !== undefined) {
            if (current === candidateAncestor) {
                return true;
            }
            current = parent[current] ?? null;
        }

        return false;
    };

    // Line 0: function BFS(start)
    yield { type: 'SET_LINE', lineIndex: 0 };

    for (const n of nodes) {
        colors[n.id] = 'WHITE';
        parent[n.id] = null;
        parentEdge[n.id] = null;
        yield { type: 'SET_NODE_COLOR', nodeId: n.id, color: undefined };
    }

    for (const root of orderedNodes) {
        if (colors[root.id] !== 'WHITE') {
            continue;
        }

        // Line 1: create queue Q, enqueue start
        yield { type: 'SET_LINE', lineIndex: 1 };

        colors[root.id] = 'GRAY';
        queue.push(root.id);
        yield { type: 'DS_UPDATE', data: [...queue], action: 'push', node: root.id };
        yield { type: 'SET_NODE_COLOR', nodeId: root.id, color: '#fbbf24' };
        yield { type: 'UPDATE_VISITED', nodeId: root.id };

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
                if (edge.undirected && edge.id === parentEdge[u]) {
                    continue;
                }

                const v = edge.to;

                // Line 6: if v is Unvisited
                yield { type: 'SET_LINE', lineIndex: 6 };

                if (colors[v] === 'WHITE') {
                    colors[v] = 'GRAY';
                    parent[v] = u;
                    parentEdge[v] = edge.id;
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
                    if (isAncestor(v, u)) {
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
        }
    }
    yield { type: 'SET_LINE', lineIndex: -1 };
}

export function* dijkstra(nodes, edges, startNodeId, targetNodeId) {
    const adjMap = buildAdjacencyMap(nodes, edges);

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

            yield { 
                type: 'SET_RESULT_DATA', 
                data: { type: 'dijkstraPath', pathNodes, pathEdges } 
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

    yield { type: 'LOG', message: 'Dijkstra Completed' };
    yield { type: 'SET_LINE', lineIndex: -1 };
}

export function* prim(nodes, edges, startNodeId) {
    const adjMap = buildAdjacencyMap(nodes, edges, { forceUndirected: true });
    const orderedNodes = orderNodesFromStart(nodes, startNodeId || nodes[0]?.id);

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

    let seeded = false;

    for (const root of orderedNodes) {
        if (inMST[root.id]) {
            continue;
        }

        if (!seeded) {
            // Line 1: key[start]=0, Q.push
            yield { type: 'SET_LINE', lineIndex: 1 };
            seeded = true;
        }

        key[root.id] = 0;
        pq.push({ id: root.id, k: 0 });
        yield { type: 'DS_UPDATE', data: [...pq], action: 'push' };
        yield { type: 'UPDATE_VISITED', nodeId: root.id };

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
    }
    yield { type: 'SET_LINE', lineIndex: -1 };
}

export function* kruskal(nodes, edges, startNodeId) {
    const sortedEdges = [...edges].sort((a, b) => {
        const weightDiff = Number(a.weight) - Number(b.weight);
        if (weightDiff !== 0) {
            return weightDiff;
        }

        if (startNodeId) {
            const aTouchesStart = a.source === startNodeId || a.target === startNodeId;
            const bTouchesStart = b.source === startNodeId || b.target === startNodeId;

            if (aTouchesStart !== bTouchesStart) {
                return aTouchesStart ? -1 : 1;
            }
        }

        return compareEdgesDeterministically(a, b);
    });

    const parent = {};
    nodes.forEach(n => parent[n.id] = n.id);

    function find(i) {
        if (parent[i] === i) return i;
        parent[i] = find(parent[i]);
        return parent[i];
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
            yield { type: 'SET_NODE_COLOR', nodeId: edge.source, color: '#3b82f6' };
            yield { type: 'SET_NODE_COLOR', nodeId: edge.target, color: '#3b82f6' };
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
            yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'cycle' };
            yield { type: 'LOG', message: `Cycle detected - Discarded` };
        }
        // Loop Line 2
        yield { type: 'SET_LINE', lineIndex: 2 };
    }

    yield { type: 'SET_LINE', lineIndex: -1 };
}

export function* scc(nodes, edges, startNodeId) {
    const orderedNodes = orderNodesFromStart(nodes, startNodeId || nodes[0]?.id);
    const firstPassAdj = buildAdjacencyMap(nodes, edges);

    const transposedAdj = {};
    nodes.forEach((node) => {
        transposedAdj[node.id] = [];
    });

    edges.forEach((edge) => {
        const undirected = edgeIsUndirected(edge);
        const weight = Number(edge.weight ?? 1);

        if (undirected) {
            transposedAdj[edge.source]?.push({ to: edge.target, id: edge.id, weight, undirected: true });
            transposedAdj[edge.target]?.push({ to: edge.source, id: edge.id, weight, undirected: true });
            return;
        }

        // Reverse directed edges for the second pass traversal.
        transposedAdj[edge.target]?.push({ to: edge.source, id: edge.id, weight, undirected: false });
    });

    const visitedFirstPass = {};
    const visitedSecondPass = {};
    const finishStack = [];
    const components = [];

    const componentPalette = ['#7c3aed', '#0ea5e9', '#16a34a', '#f97316', '#dc2626', '#0d9488', '#db2777', '#4f46e5'];

    function* dfsFirst(nodeId, parentId = null) {
        // Keep stepping granular during DFS1 so users can see finish stack filling progressively.
        yield { type: 'SET_LINE', lineIndex: 2 };

        visitedFirstPass[nodeId] = true;
        yield { type: 'UPDATE_VISITED', nodeId };
        if (parentId !== null) {
            yield { type: 'UPDATE_PARENT', childId: nodeId, parentId };
        }
        yield { type: 'SET_NODE_COLOR', nodeId, color: '#fbbf24' };
        yield { type: 'LOG', message: `DFS1 visit: ${nodes.find((n) => n.id === nodeId)?.label ?? nodeId}` };

        const neighbors = firstPassAdj[nodeId] || [];
        for (const edge of neighbors) {
            yield { type: 'SET_LINE', lineIndex: 2 };
            const nextNodeId = edge.to;
            if (!visitedFirstPass[nextNodeId]) {
                yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'scc-pass1' };
                yield* dfsFirst(nextNodeId, nodeId);
            }
        }

        yield { type: 'SET_LINE', lineIndex: 2 };
        finishStack.push(nodeId);
        yield { type: 'SET_NODE_COLOR', nodeId, color: '#3b82f6' };
        yield { type: 'DS_UPDATE', data: [...finishStack], action: 'push', node: nodeId };
        yield { type: 'LOG', message: `Finish push: ${nodes.find((n) => n.id === nodeId)?.label ?? nodeId}` };
    }

    function* dfsSecond(nodeId, component, componentColor, parentId = null) {
        visitedSecondPass[nodeId] = true;
        component.push(nodeId);

        yield { type: 'UPDATE_VISITED', nodeId };
        if (parentId !== null) {
            yield { type: 'UPDATE_PARENT', childId: nodeId, parentId };
        }
        yield { type: 'SET_NODE_COLOR', nodeId, color: componentColor };

        const neighbors = transposedAdj[nodeId] || [];
        for (const edge of neighbors) {
            const nextNodeId = edge.to;
            if (!visitedSecondPass[nextNodeId]) {
                yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'scc-pass2' };
                yield* dfsSecond(nextNodeId, component, componentColor, nodeId);
            }
        }
    }

    yield { type: 'SET_LINE', lineIndex: 0 };
    yield { type: 'LOG', message: 'Kosaraju SCC Started' };
    yield {
        type: 'SET_RESULT_DATA',
        data: {
            type: 'sccKosaraju',
            phase: 'first-pass',
            isReversed: false,
            sccs: [],
            finishStack: [],
            originalGraph: { nodes, edges },
        },
    };

    yield { type: 'SET_LINE', lineIndex: 1 };
    for (const node of orderedNodes) {
        yield { type: 'SET_LINE', lineIndex: 2 };
        if (!visitedFirstPass[node.id]) {
            yield { type: 'LOG', message: `DFS1 from ${node.label}` };
            yield* dfsFirst(node.id);
        }
    }

    yield { type: 'SET_LINE', lineIndex: 3 };
    for (const edge of edges) {
        yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'scc-reversed' };
    }
    for (const node of nodes) {
        yield { type: 'SET_NODE_COLOR', nodeId: node.id, color: undefined };
    }
    yield { type: 'RESET_VISITED' };
    yield { type: 'RESET_PARENT' };
    yield { type: 'RESET_COMPONENTS' };
    yield {
        type: 'SET_RESULT_DATA',
        data: {
            type: 'sccKosaraju',
            phase: 'second-pass',
            isReversed: true,
            sccs: [],
            finishStack: [...finishStack],
            originalGraph: { nodes, edges },
        },
    };
    yield { type: 'LOG', message: 'Graph transposed. Running DFS2 on G^T using finish-time stack.' };

    const processStack = [...finishStack];
    yield { type: 'SET_LINE', lineIndex: 4 };
    yield { type: 'DS_UPDATE', data: [...processStack], action: 'update' };

    while (processStack.length > 0) {
        yield { type: 'SET_LINE', lineIndex: 5 };
        const nodeId = processStack.pop();
        yield { type: 'SET_LINE', lineIndex: 6 };
        yield { type: 'DS_UPDATE', data: [...processStack], action: 'pop', node: nodeId };

        yield { type: 'SET_LINE', lineIndex: 7 };
        if (visitedSecondPass[nodeId]) {
            continue;
        }

        const component = [];
        const componentColor = componentPalette[components.length % componentPalette.length];

        yield { type: 'SET_LINE', lineIndex: 8 };
        yield { type: 'SET_LINE', lineIndex: 9 };
        yield* dfsSecond(nodeId, component, componentColor);

        const componentSet = new Set(component);
        for (const edge of edges) {
            if (componentSet.has(edge.source) && componentSet.has(edge.target)) {
                yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'scc-component' };
            }
        }

        // Remove all nodes of this SCC from remaining finish-order stack so they visually
        // transfer out of the stack once the SCC is identified.
        const remainingAfterExtract = processStack.filter((id) => !componentSet.has(id));
        if (remainingAfterExtract.length !== processStack.length) {
            processStack.length = 0;
            processStack.push(...remainingAfterExtract);
            yield { type: 'DS_UPDATE', data: [...processStack], action: 'update' };
        }

        components.push(component);
        yield { type: 'SET_LINE', lineIndex: 10 };
        yield { type: 'FOUND_COMPONENT', component };
        yield {
            type: 'SET_RESULT_DATA',
            data: {
                type: 'sccKosaraju',
                phase: 'second-pass',
                isReversed: true,
                sccs: [...components],
                finishStack: [...processStack],
                originalGraph: { nodes, edges },
            },
        };
        yield { type: 'LOG', message: `Found SCC: ${component.map((id) => nodes.find((n) => n.id === id)?.label ?? id).join(', ')}` };
    }

    yield {
        type: 'SET_RESULT_DATA',
        data: {
            type: 'sccKosaraju',
            phase: 'completed',
            isReversed: true,
            sccs: [...components],
            finishStack: [],
            originalGraph: { nodes, edges },
        },
    };
    yield { type: 'SET_LINE', lineIndex: -1 };
    yield { type: 'LOG', message: 'Kosaraju SCC Completed' };
}

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

export function* floydWarshall(nodes, edges, startNodeId) {
    const orderedNodes = orderNodesFromStart(nodes, startNodeId || nodes[0]?.id);
    const dist = {};
    const next = {};
    let compareStep = 0;

    const toDisplayDistance = (value) => (value === Infinity ? 'INF' : value);
    const buildFwState = (activeNodes, fwComparison = null, fwStatus = 'running') => ({
        matrix: JSON.parse(JSON.stringify(dist)),
        next: JSON.parse(JSON.stringify(next)),
        startNodeId,
        activeNodes,
        fwComparison,
        fwStatus,
    });

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

    yield { type: 'LOG', message: `Floyd-Warshall Initialization Complete`, internalState: buildFwState({ k: null, i: null, j: null }, null, 'init') };
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
                        'running'
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
                        }, 'running')
                    };
                }
            }
        }
        if (!updatedInK) {
            yield {
                type: 'LOG',
                message: `Checked intermediate node ${k.label} (no shorter paths found)`,
                internalState: buildFwState({ k: k.id, i: null, j: null }, null, 'running')
            };
        }

        yield { type: 'SET_NODE_COLOR', nodeId: k.id, color: '#3b82f6', internalState: buildFwState({ k: null, i: null, j: null }, null, 'running') };
        yield { type: 'SET_LINE', lineIndex: 1 };
    }

    yield { type: 'LOG', message: `Floyd-Warshall Completed`, internalState: buildFwState({ k: null, i: null, j: null }, null, 'completed') };
    yield { type: 'SET_LINE', lineIndex: -1 };
}

export function* articulationPoints(nodes, edges, startNodeId) {
    const adjMap = buildAdjacencyMap(nodes, edges, { forceUndirected: true });
    const orderedNodes = orderNodesFromStart(nodes, startNodeId || nodes[0]?.id);

    const discovery = {};
    const low = {};
    const parent = {};
    const ap = new Set();
    const visited = new Set();
    let time = 0;

    // Visualization State
    const internalState = {
        lowLink: {},
        discovery: {},
        visited: [],
        ap: [] // List of current APs
    };

    for (const n of nodes) {
        discovery[n.id] = -1;
        low[n.id] = -1;
        parent[n.id] = null;
        yield { type: 'SET_NODE_COLOR', nodeId: n.id, color: undefined };
    }

    function* dfs(u) {
        let children = 0;
        time++;
        discovery[u] = low[u] = time;
        visited.add(u);

        // Line 1: visit and initialize discovery/low
        yield { type: 'SET_LINE', lineIndex: 1 };

        internalState.discovery = { ...discovery };
        internalState.lowLink = { ...low };
        internalState.visited = [...visited];

        yield { type: 'UPDATE_VISITED', nodeId: u };
        yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#fbbf24', internalState: { ...internalState } };
        yield { type: 'LOG', message: `Visited ${nodes.find(n => n.id === u)?.label}`, internalState: { ...internalState } };

        const neighbors = adjMap[u] || [];
        for (const edge of neighbors) {
            // Line 2: iterate neighbors
            yield { type: 'SET_LINE', lineIndex: 2 };

            const v = edge.to;
            if (v === parent[u]) continue;

            if (visited.has(v)) {
                // Line 3: back-edge case
                yield { type: 'SET_LINE', lineIndex: 3 };
                yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'back' };

                low[u] = Math.min(low[u], discovery[v]);
                internalState.lowLink = { ...low };

                // Line 4: low-link update from back-edge
                yield { type: 'SET_LINE', lineIndex: 4 };
                yield { type: 'LOG', message: `Back-edge to ${nodes.find(n => n.id === v)?.label}. Low: ${low[u]}`, internalState: { ...internalState } };
            } else {
                children++;
                parent[v] = u;
                yield { type: 'UPDATE_PARENT', childId: v, parentId: u };
                yield { type: 'CLASSIFY_EDGE', edgeId: edge.id, classification: 'tree' };

                // Line 5: DFS(v) then update low[u]
                yield { type: 'SET_LINE', lineIndex: 5 };
                yield* dfs(v);

                low[u] = Math.min(low[u], low[v]);
                internalState.lowLink = { ...low };

                if (parent[u] !== null && low[v] >= discovery[u]) {
                    // Line 6: non-root articulation condition
                    yield { type: 'SET_LINE', lineIndex: 6 };

                    ap.add(u);
                    internalState.ap = [...ap];
                    yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#f97316', internalState: { ...internalState } }; // Orange for AP
                    yield { type: 'LOG', message: `Articulation Point found: ${nodes.find(n => n.id === u)?.label}`, internalState: { ...internalState } };
                }
            }
        }

        if (parent[u] === null && children > 1) {
            // Line 7: root articulation condition
            yield { type: 'SET_LINE', lineIndex: 7 };

            ap.add(u);
            internalState.ap = [...ap];
            yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#f97316', internalState: { ...internalState } };
            yield { type: 'LOG', message: `Root Articulation Point: ${nodes.find(n => n.id === u)?.label}`, internalState: { ...internalState } };
        }

        // If not AP, set to processed color
        if (!ap.has(u)) {
            // Line 8: mark processed
            yield { type: 'SET_LINE', lineIndex: 8 };
            yield { type: 'SET_NODE_COLOR', nodeId: u, color: '#3b82f6', internalState: { ...internalState } };
        }
    }

    yield { type: 'SET_LINE', lineIndex: 0 };
    for (const n of orderedNodes) {
        if (!visited.has(n.id)) {
            yield* dfs(n.id);
        }
    }

    yield {
        type: 'SET_RESULT_DATA',
        data: {
            type: 'ap',
            points: [...ap],
            originalGraph: { nodes, edges }
        }
    };

    yield { type: 'LOG', message: `AP Discovery Completed. Found ${ap.size} points.` };
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
    linkState,
    floydWarshall,
    articulationPoints
};
