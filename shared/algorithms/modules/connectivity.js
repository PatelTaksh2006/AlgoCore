import {
  edgeIsUndirected,
  orderNodesFromStart,
  buildAdjacencyMap,
  findTraversableEdge,
  comparePrimitive,
  compareEdgesDeterministically,
} from '../core/helpers.js';

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
