export const buildShortestPathTrees = ({ matrix, nextNode, nodes, startNodeId, getEdgeWeight }) => {
  if (!matrix || !nextNode) {
    return [];
  }

  const orderedNodes = startNodeId
    ? [
      ...nodes.filter((node) => node.id === startNodeId),
      ...nodes.filter((node) => node.id !== startNodeId),
    ]
    : nodes;

  const trees = [];

  for (const u of orderedNodes) {
    const treeEdges = [];
    const treeNodes = new Set([u.id]);

    const matrixRow = matrix[u.id];
    if (!matrixRow) {
      trees.push({
        sourceId: u.id,
        sourceLabel: u.label,
        nodes: Array.from(treeNodes),
        edges: [],
        depths: { [u.id]: 0 },
        maxDepth: 0,
        matrixRow: {},
      });
      continue;
    }

    for (const v of nodes) {
      if (u.id === v.id) {
        continue;
      }

      if (matrixRow[v.id] !== undefined && matrixRow[v.id] !== Infinity) {
        let curr = u.id;
        while (curr !== v.id && curr !== null) {
          if (!nextNode[curr] || !nextNode[curr][v.id]) {
            break;
          }
          const nxt = nextNode[curr][v.id];
          if (nxt === null) {
            break;
          }

          const weight = getEdgeWeight(curr, nxt);
          treeEdges.push({ source: curr, target: nxt, weight });
          treeNodes.add(nxt);
          curr = nxt;
        }
      }
    }

    const uniqueEdges = [];
    const edgeSet = new Set();
    for (const e of treeEdges) {
      const key = `${e.source}->${e.target}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        uniqueEdges.push(e);
      }
    }

    const depths = { [u.id]: 0 };
    const q = [u.id];
    let maxD = 0;

    while (q.length > 0) {
      const curr = q.shift();
      const children = uniqueEdges.filter((e) => e.source === curr).map((e) => e.target);
      for (const child of children) {
        if (depths[child] === undefined) {
          depths[child] = depths[curr] + 1;
          maxD = Math.max(maxD, depths[child]);
          q.push(child);
        }
      }
    }

    trees.push({
      sourceId: u.id,
      sourceLabel: u.label,
      nodes: Array.from(treeNodes),
      edges: uniqueEdges,
      depths,
      maxDepth: maxD,
      matrixRow,
    });
  }

  return trees;
};
