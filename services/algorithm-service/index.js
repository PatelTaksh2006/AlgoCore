import express from 'express';
import cors from 'cors';
import {
  algorithms,
  dfs,
  bfs,
  dijkstra,
  prim,
  kruskal,
  scc,
  distanceVector,
  linkState,
  floydWarshall,
  articulationPoints,
} from '../../shared/algorithms/index.js';

const app = express();
const PORT = Number(process.env.PORT || 4002);

app.use(cors());
app.use(express.json({ limit: '4mb' }));

const availableAlgorithms = Object.keys(algorithms);

function runGenerator(algoName, nodes, edges, startNodeId = null, targetNodeId = null, stepLimit = 50000) {
  const fn = algorithms[algoName];
  if (!fn) {
    throw new Error(`Unknown algorithm: ${algoName}`);
  }

  const generator = fn(nodes, edges, startNodeId, targetNodeId);
  const steps = [];
  let done = false;

  while (!done && steps.length < stepLimit) {
    const next = generator.next();
    done = next.done;
    if (!done && next.value) {
      steps.push(next.value);
    }
  }

  return {
    done,
    truncated: !done,
    steps,
    count: steps.length,
  };
}

app.get('/health', (_req, res) => {
  res.json({
    service: 'algorithm-service',
    status: 'ok',
    algorithms: availableAlgorithms,
  });
});

app.get('/algorithms', (_req, res) => {
  res.json({
    algorithms: availableAlgorithms,
    exports: {
      dfs: typeof dfs,
      bfs: typeof bfs,
      dijkstra: typeof dijkstra,
      prim: typeof prim,
      kruskal: typeof kruskal,
      scc: typeof scc,
      distanceVector: typeof distanceVector,
      linkState: typeof linkState,
      floydWarshall: typeof floydWarshall,
      articulationPoints: typeof articulationPoints,
    },
  });
});

app.post('/run', (req, res) => {
  try {
    const {
      algorithm,
      nodes = [],
      edges = [],
      startNodeId = null,
      targetNodeId = null,
      stepLimit = 50000,
    } = req.body || {};

    if (!algorithm) {
      return res.status(400).json({ error: 'algorithm is required' });
    }

    const result = runGenerator(
      algorithm,
      Array.isArray(nodes) ? nodes : [],
      Array.isArray(edges) ? edges : [],
      startNodeId,
      targetNodeId,
      Number(stepLimit) || 50000,
    );

    return res.json({
      ok: true,
      algorithm,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/run-from-graph', async (req, res) => {
  try {
    const {
      algorithm,
      startNodeId = null,
      targetNodeId = null,
      stepLimit = 50000,
      graphServiceUrl = process.env.GRAPH_SERVICE_URL || 'http://localhost:4001',
    } = req.body || {};

    if (!algorithm) {
      return res.status(400).json({ error: 'algorithm is required' });
    }

    const graphRes = await fetch(`${graphServiceUrl}/graph`);
    if (!graphRes.ok) {
      return res.status(502).json({
        error: `graph-service returned ${graphRes.status}`,
      });
    }

    const graph = await graphRes.json();
    const result = runGenerator(
      algorithm,
      graph.nodes || [],
      graph.edges || [],
      startNodeId,
      targetNodeId,
      Number(stepLimit) || 50000,
    );

    return res.json({
      ok: true,
      source: 'graph-service',
      algorithm,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`algorithm-service listening on http://localhost:${PORT}`);
});
