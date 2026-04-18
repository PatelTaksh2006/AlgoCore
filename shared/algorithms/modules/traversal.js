import {
  edgeIsUndirected,
  orderNodesFromStart,
  buildAdjacencyMap,
  findTraversableEdge,
  comparePrimitive,
  compareEdgesDeterministically,
} from '../core/helpers.js';

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
