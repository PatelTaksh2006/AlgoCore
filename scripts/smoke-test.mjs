const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const response = await fetch(`${gatewayUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`${path} failed (${response.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

async function main() {
  console.log('1) Checking gateway health...');
  const health = await request('/health');
  console.log('Gateway health OK:', {
    gateway: health.status,
    graph: health.graph?.status,
    algorithm: health.algorithm?.status,
  });

  console.log('2) Sending graph to graph-service through gateway...');
  const graphPayload = {
    nodes: [
      { id: 'a', label: 'A', x: 10, y: 10 },
      { id: 'b', label: 'B', x: 50, y: 50 },
      { id: 'c', label: 'C', x: 90, y: 90 },
    ],
    edges: [
      { id: 'e1', source: 'a', target: 'b', weight: 2 },
      { id: 'e2', source: 'b', target: 'c', weight: 1 },
    ],
    isDirected: true,
  };

  await request('/api/graph', {
    method: 'PUT',
    body: JSON.stringify(graphPayload),
  });
  console.log('Graph state updated.');

  console.log('3) Running dijkstra in algorithm-service using graph-service data...');
  const runResult = await request('/api/algorithm/run-from-graph', {
    method: 'POST',
    body: JSON.stringify({
      algorithm: 'dijkstra',
      startNodeId: 'a',
      targetNodeId: 'c',
      stepLimit: 5000,
    }),
  });

  console.log('Run result:', {
    ok: runResult.ok,
    source: runResult.source,
    count: runResult.count,
    done: runResult.done,
    truncated: runResult.truncated,
  });

  console.log('Smoke test completed successfully.');
}

main().catch((error) => {
  console.error('Smoke test failed:', error.message);
  process.exitCode = 1;
});
