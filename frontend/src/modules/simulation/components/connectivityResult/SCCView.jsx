import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const SCCView = ({ data }) => {
  const { sccs, originalGraph } = data;
  const [resultLayout, setResultLayout] = useState({});

  const updateResultNodePos = (id, x, y) => {
    setResultLayout((prev) => ({
      ...prev,
      [id]: { x, y },
    }));
  };

  const sccLayout = useMemo(() => {
    const count = sccs.length;
    const radius = 200;
    const centerX = 400;
    const centerY = 350;

    return sccs.map((scc, i) => {
      const id = `scc-${i}`;
      const storedPos = resultLayout[id];
      const angle = count === 1 ? 0 : (i / count) * 2 * Math.PI - Math.PI / 2;
      const defaultCx = count === 1 ? centerX : centerX + radius * Math.cos(angle);
      const defaultCy = count === 1 ? centerY : centerY + radius * Math.sin(angle);

      return {
        id,
        index: i,
        cx: storedPos ? storedPos.x : defaultCx,
        cy: storedPos ? storedPos.y : defaultCy,
        nodes: scc,
        label: `SCC ${i + 1}`,
      };
    });
  }, [sccs, resultLayout]);

  useEffect(() => {
    const newLayout = {};
    let needsUpdate = false;

    sccLayout.forEach((cluster) => {
      if (!resultLayout[cluster.id]) {
        newLayout[cluster.id] = { x: cluster.cx, y: cluster.cy };
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      setResultLayout((prev) => ({ ...prev, ...newLayout }));
    }
  }, [sccs, sccLayout]);

  const nodePositions = useMemo(() => {
    const positions = {};

    sccLayout.forEach((cluster) => {
      const nodeCount = cluster.nodes.length;
      const internalRadius = Math.min(60, 20 + nodeCount * 10);

      cluster.nodes.forEach((nodeId, idx) => {
        if (nodeCount === 1) {
          positions[nodeId] = { x: cluster.cx, y: cluster.cy };
        } else {
          const angle = (idx / nodeCount) * 2 * Math.PI - Math.PI / 2;
          positions[nodeId] = {
            x: cluster.cx + internalRadius * Math.cos(angle),
            y: cluster.cy + internalRadius * Math.sin(angle),
          };
        }
      });
    });

    return positions;
  }, [sccLayout]);

  const renderedEdges = useMemo(() => {
    const nodeToSCC = {};
    sccs.forEach((scc, idx) => scc.forEach((id) => {
      nodeToSCC[id] = idx;
    }));

    return originalGraph.edges
      .map((edge) => {
        const sourcePos = nodePositions[edge.source];
        const targetPos = nodePositions[edge.target];
        if (!sourcePos || !targetPos) {
          return null;
        }

        const isInterSCC = nodeToSCC[edge.source] !== nodeToSCC[edge.target];

        return {
          id: edge.id,
          sourcePos,
          targetPos,
          isInterSCC,
          key: `edge-${edge.id}`,
        };
      })
      .filter(Boolean);
  }, [originalGraph.edges, nodePositions, sccs]);

  return (
    <div className="w-full h-full relative bg-gray-50 overflow-auto">
      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-blue-600 shadow-sm z-10">
        CONDENSATION GRAPH (DETAILED)
      </div>
      <svg className="w-full h-full min-h-[700px] min-w-[800px]">
        <defs>
          <marker id="arrow-intra" markerWidth="8" markerHeight="6" refX="18" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
          </marker>
          <marker id="arrow-inter" markerWidth="10" markerHeight="7" refX="18" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
          </marker>
        </defs>

        {sccLayout.map((cluster) => {
          const handlePointerDown = (e) => {
            e.stopPropagation();
            if (e.button !== 0) {
              return;
            }

            const startX = e.clientX;
            const startY = e.clientY;
            const initialX = cluster.cx;
            const initialY = cluster.cy;

            const handlePointerMove = (moveEvent) => {
              const dx = moveEvent.clientX - startX;
              const dy = moveEvent.clientY - startY;
              updateResultNodePos(cluster.id, initialX + dx, initialY + dy);
            };

            const handlePointerUp = () => {
              window.removeEventListener('pointermove', handlePointerMove);
              window.removeEventListener('pointerup', handlePointerUp);
            };

            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
          };

          return (
            <motion.g key={cluster.id} onPointerDown={handlePointerDown} style={{ x: cluster.cx, y: cluster.cy }}>
              <motion.circle
                initial={{ opacity: 0, r: 0 }}
                animate={{ opacity: 1, r: Math.max(50, 30 + cluster.nodes.length * 15) }}
                fill="#f0f9ff"
                stroke="#bae6fd"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="cursor-move"
                cx={0}
                cy={0}
              />
              <text
                y={Math.max(50, 30 + cluster.nodes.length * 15) + 15}
                textAnchor="middle"
                className="text-xs font-bold fill-blue-300 uppercase tracking-widest pointer-events-none select-none"
              >
                {cluster.label}
              </text>
            </motion.g>
          );
        })}

        {renderedEdges.map((edge) => (
          <motion.line
            key={edge.key}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            x1={edge.sourcePos.x}
            y1={edge.sourcePos.y}
            x2={edge.targetPos.x}
            y2={edge.targetPos.y}
            stroke={edge.isInterSCC ? '#ef4444' : '#cbd5e1'}
            strokeWidth={edge.isInterSCC ? '2' : '1.5'}
            markerEnd={edge.isInterSCC ? 'url(#arrow-inter)' : 'url(#arrow-intra)'}
            className="pointer-events-none"
          />
        ))}

        {Object.entries(nodePositions).map(([nodeId, pos]) => {
          const node = originalGraph.nodes.find((n) => n.id === parseInt(nodeId, 10) || n.id === nodeId);
          const label = node?.label || nodeId;
          return (
            <motion.g
              key={`node-${nodeId}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1, x: pos.x, y: pos.y }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="pointer-events-none"
            >
              <circle r="12" fill="white" stroke="#3b82f6" strokeWidth="2" />
              <text dy=".3em" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1e40af" className="select-none">
                {label}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
};

export default SCCView;
