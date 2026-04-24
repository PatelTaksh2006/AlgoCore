export const SAMPLES = {
    dfs: {
        isDirected: true,
        nodes: [
            { id: 'node-1', label: '0', x: 200, y: 50 },
            { id: 'node-2', label: '1', x: 100, y: 150 },
            { id: 'node-3', label: '2', x: 300, y: 150 },
            { id: 'node-4', label: '3', x: 50, y: 250 },
            { id: 'node-5', label: '4', x: 150, y: 250 },
            { id: 'node-6', label: '5', x: 350, y: 250 }
        ],
        edges: [
            // Tree edges
            { id: 'e1', source: 'node-1', target: 'node-2', weight: 1 },
            { id: 'e2', source: 'node-1', target: 'node-3', weight: 1 },
            { id: 'e3', source: 'node-2', target: 'node-4', weight: 1 },
            { id: 'e4', source: 'node-2', target: 'node-5', weight: 1 },
            { id: 'e5', source: 'node-3', target: 'node-6', weight: 1 },
            // Back edge (Leaf to Ancestor)
            { id: 'e6', source: 'node-5', target: 'node-1', weight: 1 },
            // Cross edge
            { id: 'e7', source: 'node-5', target: 'node-6', weight: 1 },
            // Forward edge
            { id: 'e8', source: 'node-1', target: 'node-5', weight: 1 }
        ]
    },
    bfs: {
        isDirected: false,
        nodes: [
            { id: 'node-1', label: 'Root', x: 250, y: 50 },
            { id: 'node-2', label: 'L1-A', x: 150, y: 150 },
            { id: 'node-3', label: 'L1-B', x: 350, y: 150 },
            { id: 'node-4', label: 'L2-A', x: 100, y: 250 },
            { id: 'node-5', label: 'L2-B', x: 200, y: 250 },
            { id: 'node-6', label: 'L2-C', x: 300, y: 250 },
            { id: 'node-7', label: 'L2-D', x: 400, y: 250 }
        ],
        edges: [
            { id: 'e1', source: 'node-1', target: 'node-2', weight: 1 },
            { id: 'e2', source: 'node-1', target: 'node-3', weight: 1 },
            { id: 'e3', source: 'node-2', target: 'node-4', weight: 1 },
            { id: 'e4', source: 'node-2', target: 'node-5', weight: 1 },
            { id: 'e5', source: 'node-3', target: 'node-6', weight: 1 },
            { id: 'e6', source: 'node-3', target: 'node-7', weight: 1 },
            // Cross connection on same level
            { id: 'e7', source: 'node-4', target: 'node-5', weight: 1 }
        ]
    },
    dijkstra: {
        isDirected: true,
        nodes: [
            { id: 'node-1', label: 'S', x: 50, y: 150 },
            { id: 'node-2', label: 'A', x: 150, y: 50 },
            { id: 'node-3', label: 'B', x: 150, y: 250 },
            { id: 'node-4', label: 'C', x: 250, y: 150 },
            { id: 'node-5', label: 'D', x: 350, y: 50 },
            { id: 'node-6', label: 'E', x: 350, y: 250 },
            { id: 'node-7', label: 'T', x: 450, y: 150 }
        ],
        edges: [
            { id: 'e1', source: 'node-1', target: 'node-2', weight: 4 },
            { id: 'e2', source: 'node-1', target: 'node-3', weight: 2 },
            { id: 'e3', source: 'node-2', target: 'node-3', weight: 1 }, // A->B
            { id: 'e4', source: 'node-2', target: 'node-4', weight: 5 },
            { id: 'e5', source: 'node-3', target: 'node-4', weight: 8 },
            { id: 'e6', source: 'node-3', target: 'node-6', weight: 10 },
            { id: 'e7', source: 'node-4', target: 'node-5', weight: 6 },
            { id: 'e8', source: 'node-6', target: 'node-7', weight: 2 },
            { id: 'e9', source: 'node-5', target: 'node-7', weight: 3 },
            { id: 'e10', source: 'node-4', target: 'node-6', weight: 2 }
        ]
    },
    prim: { // Same as Dijkstra but undirected often better for MST perception
        isDirected: false,
        nodes: [
            { id: 'node-1', label: 'A', x: 200, y: 50 },
            { id: 'node-2', label: 'B', x: 100, y: 150 },
            { id: 'node-3', label: 'C', x: 300, y: 150 },
            { id: 'node-4', label: 'D', x: 200, y: 250 },
            { id: 'node-5', label: 'E', x: 200, y: 150 }
        ],
        edges: [
            { id: 'e1', source: 'node-1', target: 'node-2', weight: 2 },
            { id: 'e2', source: 'node-1', target: 'node-3', weight: 3 },
            { id: 'e3', source: 'node-2', target: 'node-4', weight: 4 },
            { id: 'e4', source: 'node-3', target: 'node-4', weight: 5 },
            { id: 'e5', source: 'node-2', target: 'node-5', weight: 1 },
            { id: 'e6', source: 'node-3', target: 'node-5', weight: 1 },
            { id: 'e7', source: 'node-4', target: 'node-5', weight: 2 }
        ]
    },
    kruskal: {
        isDirected: false,
        nodes: [
            { id: 'node-1', label: 'A', x: 100, y: 100 },
            { id: 'node-2', label: 'B', x: 300, y: 100 },
            { id: 'node-3', label: 'C', x: 100, y: 300 },
            { id: 'node-4', label: 'D', x: 300, y: 300 },
            { id: 'node-5', label: 'E', x: 200, y: 200 }
        ],
        edges: [
            { id: 'e1', source: 'node-1', target: 'node-5', weight: 1 }, // A-E
            { id: 'e2', source: 'node-2', target: 'node-5', weight: 2 }, // B-E
            { id: 'e3', source: 'node-3', target: 'node-5', weight: 3 }, // C-E
            { id: 'e4', source: 'node-4', target: 'node-5', weight: 4 }, // D-E
            { id: 'e5', source: 'node-1', target: 'node-2', weight: 10 },
            { id: 'e6', source: 'node-3', target: 'node-4', weight: 10 }
        ]
    },
    scc: {
        isDirected: true,
        nodes: [
            { id: 'node-0', label: '0', x: 100, y: 100 },
            { id: 'node-1', label: '1', x: 200, y: 100 },
            { id: 'node-2', label: '2', x: 300, y: 100 },
            { id: 'node-3', label: '3', x: 100, y: 200 },
            { id: 'node-4', label: '4', x: 200, y: 200 },
            { id: 'node-5', label: '5', x: 300, y: 200 },
            { id: 'node-6', label: '6', x: 100, y: 300 },
            { id: 'node-7', label: '7', x: 300, y: 300 }
        ],
        edges: [
            { id: 'e1', source: 'node-0', target: 'node-1', weight: 1 },
            { id: 'e2', source: 'node-1', target: 'node-2', weight: 1 },
            { id: 'e3', source: 'node-2', target: 'node-0', weight: 1 }, // cycle 0-1-2
            { id: 'e4', source: 'node-1', target: 'node-3', weight: 1 },
            { id: 'e5', source: 'node-3', target: 'node-4', weight: 1 },
            { id: 'e6', source: 'node-4', target: 'node-5', weight: 1 },
            { id: 'e7', source: 'node-5', target: 'node-3', weight: 1 }, // cycle 3-4-5
            { id: 'e8', source: 'node-6', target: 'node-4', weight: 1 },
            { id: 'e9', source: 'node-5', target: 'node-7', weight: 1 }
        ]
    },
    distanceVector: {
        isDirected: true,
        nodes: [
            { id: 'node-a', label: 'A', x: 200, y: 50 },
            { id: 'node-b', label: 'B', x: 100, y: 150 },
            { id: 'node-c', label: 'C', x: 300, y: 150 },
            { id: 'node-d', label: 'D', x: 200, y: 250 }
        ],
        edges: [
            { id: 'e1', source: 'node-a', target: 'node-b', weight: 2 },
            { id: 'e2', source: 'node-a', target: 'node-c', weight: 7 },
            { id: 'e3', source: 'node-b', target: 'node-c', weight: 1 }, // A->B->C is better (2+1=3) than A->C (7)
            { id: 'e4', source: 'node-b', target: 'node-d', weight: 3 },
            { id: 'e5', source: 'node-c', target: 'node-d', weight: 1 }, // A->B->C->D (2+1+1=4) vs A->B->D (2+3=5)
            { id: 'e6', source: 'node-d', target: 'node-a', weight: 10 }
        ]
    },
    linkState: {
        isDirected: false, // OSPF usually on undirected links (interfaces)
        nodes: [
            { id: 'node-1', label: 'R1', x: 250, y: 50 },
            { id: 'node-2', label: 'R2', x: 100, y: 150 },
            { id: 'node-3', label: 'R3', x: 400, y: 150 },
            { id: 'node-4', label: 'R4', x: 150, y: 300 },
            { id: 'node-5', label: 'R5', x: 350, y: 300 }
        ],
        edges: [
            { id: 'e1', source: 'node-1', target: 'node-2', weight: 10 },
            { id: 'e2', source: 'node-1', target: 'node-3', weight: 5 },
            { id: 'e3', source: 'node-2', target: 'node-4', weight: 2 },
            { id: 'e4', source: 'node-3', target: 'node-5', weight: 2 },
            { id: 'e5', source: 'node-2', target: 'node-3', weight: 15 }, // direct link expensive
            { id: 'e6', source: 'node-4', target: 'node-5', weight: 1 },  // bottom link fast
            // Cross links
            { id: 'e7', source: 'node-2', target: 'node-5', weight: 10 },
            { id: 'e8', source: 'node-3', target: 'node-4', weight: 10 }
        ]
    },
    floydWarshall: {
        isDirected: true,
        nodes: [
            { id: 'node-1', label: 'A', x: 120, y: 80 },
            { id: 'node-2', label: 'B', x: 320, y: 80 },
            { id: 'node-3', label: 'C', x: 120, y: 260 },
            { id: 'node-4', label: 'D', x: 320, y: 260 }
        ],
        edges: [
            { id: 'e1', source: 'node-1', target: 'node-2', weight: 3 },
            { id: 'e2', source: 'node-1', target: 'node-3', weight: 8 },
            { id: 'e3', source: 'node-2', target: 'node-3', weight: 2 },
            { id: 'e4', source: 'node-2', target: 'node-4', weight: 5 },
            { id: 'e5', source: 'node-3', target: 'node-4', weight: 1 },
            { id: 'e6', source: 'node-4', target: 'node-1', weight: -7 }
        ]
    }
};
