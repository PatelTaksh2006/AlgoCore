import { edgeIsUndirected, orderNodesFromStart, buildAdjacencyMap } from '../../core/helpers.js';

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

    transposedAdj[edge.target]?.push({ to: edge.source, id: edge.id, weight, undirected: false });
  });

  const visitedFirstPass = {};
  const visitedSecondPass = {};
  const finishStack = [];
  const components = [];

  const componentPalette = ['#7c3aed', '#0ea5e9', '#16a34a', '#f97316', '#dc2626', '#0d9488', '#db2777', '#4f46e5'];

  function* dfsFirst(nodeId, parentId = null) {
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
