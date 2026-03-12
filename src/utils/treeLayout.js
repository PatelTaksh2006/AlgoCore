export function calculateTreeLayout(nodes, edges, rootId) {
    // Filter tree edges and explicit solution path edges.
    const treeEdges = edges.filter(e => e.classification === 'tree' || e.classification === 'solution');
    if (treeEdges.length === 0 && !rootId) return {};

    // Build adjacency for tree
    const adj = {};
    nodes.forEach(n => adj[n.id] = []);
    treeEdges.forEach(e => {
        adj[e.source].push(e.target);
        adj[e.target].push(e.source); // Treat as undirected for layout
    });

    // Find root if not provided
    if (!rootId) {
        const treeNodes = new Set();
        treeEdges.forEach(e => { treeNodes.add(e.source); treeNodes.add(e.target); });
        rootId = nodes.find(n => treeNodes.has(n.id))?.id || nodes[0]?.id;
    }

    // Assign levels using BFS
    const queue = [{ id: rootId, level: 0 }];
    const visited = new Set([rootId]);
    const levelNodes = { 0: [rootId] };

    while (queue.length > 0) {
        const { id, level } = queue.shift();

        const children = adj[id] || [];
        children.forEach(childId => {
            if (!visited.has(childId)) {
                visited.add(childId);
                if (!levelNodes[level + 1]) levelNodes[level + 1] = [];
                levelNodes[level + 1].push(childId);
                queue.push({ id: childId, level: level + 1 });
            }
        });
    }

    // Add any unvisited nodes to level 0 (disconnected components)
    nodes.forEach(n => {
        if (!visited.has(n.id)) {
            levelNodes[0].push(n.id);
            visited.add(n.id);
        }
    });

    // Assign positions
    // Simple approach: Center at Width/2.
    // Width ~ 300px (Sidebar width matches? No, ResultTree is flex-1 or so).
    // Let's assume a canvas width of 600 for calc.
    const canvasWidth = 600;
    const levelHeight = 80;
    const startY = 50;

    const positions = {};

    Object.keys(levelNodes).forEach(level => {
        const nodesInLevel = levelNodes[level];
        const count = nodesInLevel.length;
        const totalW = canvasWidth; // Spread across full width
        const gap = totalW / (count + 1);

        nodesInLevel.forEach((nodeId, index) => {
            positions[nodeId] = {
                x: gap * (index + 1),
                y: startY + level * levelHeight
            };
        });
    });

    return positions;
}
