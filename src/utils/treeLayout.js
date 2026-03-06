export function calculateTreeLayout(nodes, edges, rootId) {
    // Filter only tree edges
    const treeEdges = edges.filter(e => e.classification === 'tree');
    if (treeEdges.length === 0 && !rootId) return {};

    // Build adjacency for tree
    const adj = {};
    nodes.forEach(n => adj[n.id] = []);
    treeEdges.forEach(e => {
        adj[e.source].push(e.target);
        // Tree is directed from root in our traversal usually
    });

    // Find root if not provided (node with no incoming tree edges, but source of some?)
    // Or just use the Algorithm's start node if we knew it. 
    // For now, assume rootId is passed or we find a node with 0 incoming tree edges.
    if (!rootId) {
        const hasIncoming = new Set(treeEdges.map(e => e.target));
        const roots = nodes.filter(n => !hasIncoming.has(n.id) && (adj[n.id]?.length > 0 || treeEdges.length === 0));
        rootId = roots[0]?.id || nodes[0]?.id; // Fallback
    }

    // Assign levels using BFS
    const queue = [{ id: rootId, level: 0 }];
    const visited = new Set([rootId]);
    const levelNodes = { 0: [rootId] };

    while (queue.length > 0) {
        const { id, level } = queue.shift();

        const children = adj[id] || [];
        if (children.length > 0) {
            if (!levelNodes[level + 1]) levelNodes[level + 1] = [];
            children.forEach(childId => {
                if (!visited.has(childId)) {
                    visited.add(childId);
                    levelNodes[level + 1].push(childId);
                    queue.push({ id: childId, level: level + 1 });
                }
            });
        }
    }

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
