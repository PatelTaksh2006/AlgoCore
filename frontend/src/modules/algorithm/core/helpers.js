export const edgeIsUndirected = (edge) => edge.directed === false || edge.type === 'undirected';

export const orderNodesFromStart = (nodes, startNodeId) => {
    if (!startNodeId) {
        return nodes;
    }

    const startNode = nodes.find((node) => node.id === startNodeId);
    if (!startNode) {
        return nodes;
    }

    return [startNode, ...nodes.filter((node) => node.id !== startNodeId)];
};

export const buildAdjacencyMap = (nodes, edges, { forceUndirected = false } = {}) => {
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

export const findTraversableEdge = (edges, source, target, { forceUndirected = false } = {}) => (
    edges.find((edge) => (
        (edge.source === source && edge.target === target) ||
        ((forceUndirected || edgeIsUndirected(edge)) && edge.source === target && edge.target === source)
    ))
);

export const comparePrimitive = (left, right) => {
    if (typeof left === 'number' && typeof right === 'number') {
        return left - right;
    }

    return String(left).localeCompare(String(right));
};

export const compareEdgesDeterministically = (leftEdge, rightEdge) => {
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

