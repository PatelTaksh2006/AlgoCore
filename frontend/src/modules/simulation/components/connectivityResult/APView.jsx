import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import APCanvas from './APCanvas';

const APView = ({ data }) => {
  const { points, originalGraph } = data;
  const [resultLayout, setResultLayout] = useState({});

  const updateResultNodePos = (id, x, y) => {
    setResultLayout((prev) => ({
      ...prev,
      [id]: { x, y },
    }));
  };

  const getComponents = useMemo(() => (removedNodeId) => {
    const components = [];
    const visited = new Set();
    const nodes = originalGraph.nodes.filter((n) => n.id !== removedNodeId);
    const activeEdges = originalGraph.edges.filter((e) => e.source !== removedNodeId && e.target !== removedNodeId);

    const adj = {};
    nodes.forEach((n) => {
      adj[n.id] = [];
    });

    activeEdges.forEach((e) => {
      adj[e.source].push(e.target);
      adj[e.target].push(e.source);
    });

    const bfs = (startId) => {
      const comp = [];
      const queue = [startId];
      visited.add(startId);

      while (queue.length) {
        const u = queue.shift();
        comp.push(u);
        (adj[u] || []).forEach((v) => {
          if (!visited.has(v)) {
            visited.add(v);
            queue.push(v);
          }
        });
      }

      return comp;
    };

    nodes.forEach((n) => {
      if (!visited.has(n.id)) {
        components.push(bfs(n.id));
      }
    });

    return components;
  }, [originalGraph]);

  const views = useMemo(() => points.map((apId) => {
    const components = getComponents(apId);
    const width = 600;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;

    const initialPositions = { [apId]: { x: centerX, y: centerY } };

    components.forEach((comp, cIdx) => {
      const angleStep = (2 * Math.PI) / components.length;
      const sectorAngle = cIdx * angleStep;
      const distFromCenter = 120;
      const compCX = centerX + distFromCenter * Math.cos(sectorAngle);
      const compCY = centerY + distFromCenter * Math.sin(sectorAngle);

      comp.forEach((nodeId, nIdx) => {
        const nodeCount = comp.length;
        if (nodeCount === 1) {
          initialPositions[nodeId] = { x: compCX, y: compCY };
        } else {
          const subRadius = 40;
          const subAngle = (nIdx / nodeCount) * 2 * Math.PI;
          initialPositions[nodeId] = {
            x: compCX + subRadius * Math.cos(subAngle),
            y: compCY + subRadius * Math.sin(subAngle),
          };
        }
      });
    });

    return { apId, components, initialPositions };
  }), [points, getComponents]);

  useEffect(() => {
    const newLayout = {};
    let needsUpdate = false;

    views.forEach(({ apId, initialPositions }) => {
      Object.keys(initialPositions).forEach((nodeId) => {
        const layoutKey = `ap-${apId}-node-${nodeId}`;
        if (!resultLayout[layoutKey]) {
          newLayout[layoutKey] = initialPositions[nodeId];
          needsUpdate = true;
        }
      });
    });

    if (needsUpdate) {
      setResultLayout((prev) => ({ ...prev, ...newLayout }));
    }
  }, [points, views]);

  return (
    <div className="w-full h-full p-4 overflow-y-auto bg-gray-50 pb-20">
      <div className="sticky top-0 right-0 flex justify-end mb-4 pointer-events-none">
        <span className="bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold text-orange-600 shadow-sm border border-orange-100 z-10 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          ARTICULATION POINTS ({points.length})
        </span>
      </div>

      <div className="flex flex-col gap-12">
        {points.length === 0 && <p className="text-center text-gray-400 mt-10">No Articulation Points found.</p>}

        {views.map(({ apId, components, initialPositions }, index) => {
          const apNode = originalGraph.nodes.find((n) => n.id === apId);

          return (
            <motion.div
              key={apId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden relative"
            >
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-orange-50 text-orange-700 font-bold px-3 py-1 rounded text-xs border border-orange-100">
                  AP: {apNode?.label}
                </span>
                <p className="text-[10px] text-gray-400 mt-1 ml-1">{components.length} Split Components</p>
              </div>

              <APCanvas
                apId={apId}
                components={components}
                initialPositions={initialPositions}
                originalGraph={originalGraph}
                resultLayout={resultLayout}
                updateResultNodePos={updateResultNodePos}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default APView;
