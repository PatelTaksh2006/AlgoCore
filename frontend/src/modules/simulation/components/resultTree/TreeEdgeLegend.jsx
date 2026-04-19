import React from 'react';

const getTreeLegendConfig = (selectedAlgorithm) => {
  switch (selectedAlgorithm) {
    case 'dfs':
      return [
        { label: 'Traversal tree edge', color: '#2563eb' },
        { label: 'Back edge', color: '#ef4444', dashed: true },
        { label: 'Forward edge', color: '#16a34a', dashed: true },
        { label: 'Cross edge', color: '#111827', dashed: true },
      ];
    case 'bfs':
      return [
        { label: 'BFS tree edge', color: '#2563eb' },
        { label: 'Back edge to an ancestor', color: '#ef4444', dashed: true },
        { label: 'Cross edge', color: '#111827', dashed: true },
      ];
    case 'dijkstra':
      return [
        { label: 'Explored shortest-path tree edge', color: '#2563eb' },
        { label: 'Final shortest path to target', color: '#22c55e' },
      ];
    case 'distanceVector':
      return [
        { label: 'Final forwarding tree edge', color: '#22c55e' },
        { label: 'Single-source final cost labels', color: '#8b5cf6' },
      ];
    case 'prim':
    case 'kruskal':
      return [{ label: 'Edge chosen for MST', color: '#2563eb' }];
    case 'scc':
      return [
        { label: 'Pass 1 edge (original graph)', color: '#2563eb' },
        { label: 'Reversed edge view', color: '#f59e0b', dashed: true },
        { label: 'Pass 2 edge on G^T', color: '#ea580c' },
      ];
    case 'articulationPoints':
      return [
        { label: 'DFS tree edge', color: '#2563eb' },
        { label: 'Back edge', color: '#ef4444', dashed: true },
        { label: 'Articulation point node', color: '#f97316' },
      ];
    default:
      return [];
  }
};

const TreeEdgeLegend = ({ selectedAlgorithm }) => {
  const items = getTreeLegendConfig(selectedAlgorithm);
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-20 w-72 max-w-[calc(100%-2rem)] rounded-xl border border-gray-200 bg-white/92 px-4 py-3 shadow-lg backdrop-blur-md">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Edge Legend</div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3 text-xs text-gray-600">
            <span className="block w-10 shrink-0">
              <span
                className="block w-full rounded-full"
                style={{
                  backgroundColor: item.dashed ? 'transparent' : item.color,
                  borderTop: item.dashed ? `2px dashed ${item.color}` : undefined,
                  height: item.dashed ? 0 : 2,
                }}
              />
            </span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TreeEdgeLegend;
