import express from 'express';
import cors from 'cors';

const app = express();
const PORT = Number(process.env.PORT || 4000);
const GRAPH_SERVICE_URL = process.env.GRAPH_SERVICE_URL || 'http://localhost:4001';
const ALGORITHM_SERVICE_URL = process.env.ALGORITHM_SERVICE_URL || 'http://localhost:4002';

app.use(cors());
app.use(express.json({ limit: '4mb' }));

async function forwardJson(url, method, body) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

app.get('/health', async (_req, res) => {
  try {
    const [graph, algorithm] = await Promise.all([
      fetch(`${GRAPH_SERVICE_URL}/health`).then((r) => r.json()),
      fetch(`${ALGORITHM_SERVICE_URL}/health`).then((r) => r.json()),
    ]);

    res.json({
      service: 'gateway-service',
      status: 'ok',
      graph,
      algorithm,
    });
  } catch (error) {
    res.status(503).json({
      service: 'gateway-service',
      status: 'degraded',
      error: error.message,
    });
  }
});

app.get('/api/graph', async (_req, res) => {
  const result = await forwardJson(`${GRAPH_SERVICE_URL}/graph`, 'GET');
  return res.status(result.status).json(result.data);
});

app.put('/api/graph', async (req, res) => {
  const result = await forwardJson(`${GRAPH_SERVICE_URL}/graph`, 'PUT', req.body);
  return res.status(result.status).json(result.data);
});

app.delete('/api/graph', async (_req, res) => {
  const result = await forwardJson(`${GRAPH_SERVICE_URL}/graph`, 'DELETE');
  return res.status(result.status).json(result.data);
});

app.post('/api/algorithm/run', async (req, res) => {
  const result = await forwardJson(`${ALGORITHM_SERVICE_URL}/run`, 'POST', req.body);
  return res.status(result.status).json(result.data);
});

app.post('/api/algorithm/run-from-graph', async (req, res) => {
  const payload = {
    ...req.body,
    graphServiceUrl: GRAPH_SERVICE_URL,
  };
  const result = await forwardJson(`${ALGORITHM_SERVICE_URL}/run-from-graph`, 'POST', payload);
  return res.status(result.status).json(result.data);
});

app.listen(PORT, () => {
  console.log(`gateway-service listening on http://localhost:${PORT}`);
  console.log(`Forwarding graph to ${GRAPH_SERVICE_URL}`);
  console.log(`Forwarding algorithm to ${ALGORITHM_SERVICE_URL}`);
});
