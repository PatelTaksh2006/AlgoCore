import express from 'express';
import cors from 'cors';

const app = express();
const PORT = Number(process.env.PORT || 4001);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const graphState = {
  nodes: [],
  edges: [],
  isDirected: false,
  updatedAt: new Date().toISOString(),
};

function touch() {
  graphState.updatedAt = new Date().toISOString();
}

app.get('/health', (_req, res) => {
  res.json({
    service: 'graph-service',
    status: 'ok',
    nodes: graphState.nodes.length,
    edges: graphState.edges.length,
    updatedAt: graphState.updatedAt,
  });
});

app.get('/graph', (_req, res) => {
  res.json(graphState);
});

app.put('/graph', (req, res) => {
  const { nodes, edges, isDirected } = req.body || {};
  graphState.nodes = Array.isArray(nodes) ? nodes : [];
  graphState.edges = Array.isArray(edges) ? edges : [];
  graphState.isDirected = Boolean(isDirected);
  touch();
  res.json({ ok: true, graph: graphState });
});

app.delete('/graph', (_req, res) => {
  graphState.nodes = [];
  graphState.edges = [];
  graphState.isDirected = false;
  touch();
  res.json({ ok: true, graph: graphState });
});

app.post('/nodes', (req, res) => {
  const node = req.body;
  if (!node?.id) {
    return res.status(400).json({ error: 'Node id is required.' });
  }

  const exists = graphState.nodes.some((n) => n.id === node.id);
  if (exists) {
    return res.status(409).json({ error: `Node ${node.id} already exists.` });
  }

  graphState.nodes.push(node);
  touch();
  return res.status(201).json({ ok: true, node });
});

app.post('/edges', (req, res) => {
  const edge = req.body;
  if (!edge?.id || !edge?.source || !edge?.target) {
    return res.status(400).json({ error: 'Edge id, source, and target are required.' });
  }

  const exists = graphState.edges.some((e) => e.id === edge.id);
  if (exists) {
    return res.status(409).json({ error: `Edge ${edge.id} already exists.` });
  }

  graphState.edges.push(edge);
  touch();
  return res.status(201).json({ ok: true, edge });
});

app.listen(PORT, () => {
  console.log(`graph-service listening on http://localhost:${PORT}`);
});
