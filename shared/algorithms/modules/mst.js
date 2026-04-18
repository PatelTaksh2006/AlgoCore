import {
  edgeIsUndirected,
  orderNodesFromStart,
  buildAdjacencyMap,
  findTraversableEdge,
  comparePrimitive,
  compareEdgesDeterministically,
} from '../core/helpers.js';

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
