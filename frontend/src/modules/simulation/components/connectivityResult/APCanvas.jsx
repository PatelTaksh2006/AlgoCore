import React from 'react';
import { motion } from 'framer-motion';

const COMPONENT_COLORS = ['#0ea5e9', '#10b981', '#a855f7', '#f59e0b', '#ec4899', '#22c55e', '#6366f1', '#06b6d4'];

const APCanvas = ({ apId, components, initialPositions, originalGraph, resultLayout, updateResultNodePos }) => {
  const nodeToComponent = {};
  components.forEach((comp, cIdx) => {
    comp.forEach((nodeId) => {
      nodeToComponent[nodeId] = cIdx;
    });
  });

  const componentRegions = components
    .map((comp, cIdx) => {
      const pts = comp
        .map((nodeId) => {
          const layoutKey = `ap-${apId}-node-${nodeId}`;
          return resultLayout[layoutKey] || initialPositions[nodeId];
        })
        .filter(Boolean);

      if (pts.length === 0) {
        return null;
      }

      const cx = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
      const cy = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
      const maxDist = Math.max(...pts.map((p) => Math.hypot(p.x - cx, p.y - cy)), 16);

      return {
        idx: cIdx,
        cx,
        cy,
        r: maxDist + 24,
        color: COMPONENT_COLORS[cIdx % COMPONENT_COLORS.length],
        count: comp.length,
      };
    })
    .filter(Boolean);

  const relevantNodes = new Set([apId, ...components.flat()]);
  const viewEdges = originalGraph.edges.filter((e) => relevantNodes.has(e.source) && relevantNodes.has(e.target));

  return (
    <div className="w-full h-[400px] bg-dot-pattern">
      <svg className="w-full h-full" viewBox="0 0 600 400">
        <defs>
          <marker id={`ap-arrow-${apId}`} markerWidth="10" markerHeight="7" refX="24" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
          </marker>
        </defs>

        {componentRegions.map((region) => (
          <g key={`region-${apId}-${region.idx}`}>
            <circle
              cx={region.cx}
              cy={region.cy}
              r={region.r}
              fill={region.color}
              fillOpacity="0.10"
              stroke={region.color}
              strokeOpacity="0.35"
              strokeWidth="1.2"
              strokeDasharray="6 4"
            />
            <text
              x={region.cx}
              y={region.cy - region.r - 6}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill={region.color}
              className="select-none"
            >
              C{region.idx + 1} ({region.count})
            </text>
          </g>
        ))}

        {viewEdges.map((edge) => {
          const keySrc = `ap-${apId}-node-${edge.source}`;
          const keyTgt = `ap-${apId}-node-${edge.target}`;
          const src = resultLayout[keySrc] || initialPositions[edge.source];
          const tgt = resultLayout[keyTgt] || initialPositions[edge.target];

          if (!src || !tgt) {
            return null;
          }

          const isAPEdge = edge.source === apId || edge.target === apId;
          const srcComp = nodeToComponent[edge.source];
          const tgtComp = nodeToComponent[edge.target];

          let stroke = '#e2e8f0';
          let strokeWidth = 1.5;
          let strokeOpacity = 0.5;
          let strokeDasharray;

          if (isAPEdge) {
            const otherNode = edge.source === apId ? edge.target : edge.source;
            const compIdx = nodeToComponent[otherNode] ?? 0;
            stroke = COMPONENT_COLORS[compIdx % COMPONENT_COLORS.length];
            strokeWidth = 2.6;
            strokeOpacity = 0.95;
          } else if (srcComp !== undefined && srcComp === tgtComp) {
            stroke = COMPONENT_COLORS[srcComp % COMPONENT_COLORS.length];
            strokeWidth = 1.9;
            strokeOpacity = 0.55;
          } else {
            stroke = '#ef4444';
            strokeWidth = 1.8;
            strokeOpacity = 0.8;
            strokeDasharray = '5 4';
          }

          return (
            <motion.line
              key={edge.id}
              x1={src.x}
              y1={src.y}
              x2={tgt.x}
              y2={tgt.y}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeOpacity={strokeOpacity}
              strokeDasharray={strokeDasharray}
            />
          );
        })}

        {Object.entries(initialPositions).map(([nId, defaultPos]) => {
          const isAP = nId == apId;
          const node = originalGraph.nodes.find((n) => n.id == nId);
          const layoutKey = `ap-${apId}-node-${nId}`;
          const pos = resultLayout[layoutKey] || defaultPos;
          const compIdx = nodeToComponent[nId];
          const compColor = compIdx !== undefined ? COMPONENT_COLORS[compIdx % COMPONENT_COLORS.length] : '#94a3b8';

          const handlePointerDown = (e) => {
            e.stopPropagation();
            if (e.button !== 0) {
              return;
            }

            const startX = e.clientX;
            const startY = e.clientY;
            const initialX = pos.x;
            const initialY = pos.y;

            const handlePointerMove = (moveEvent) => {
              const dx = moveEvent.clientX - startX;
              const dy = moveEvent.clientY - startY;
              updateResultNodePos(layoutKey, initialX + dx, initialY + dy);
            };

            const handlePointerUp = () => {
              window.removeEventListener('pointermove', handlePointerMove);
              window.removeEventListener('pointerup', handlePointerUp);
            };

            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
          };

          return (
            <motion.g key={nId} onPointerDown={handlePointerDown} style={{ x: pos.x, y: pos.y }} className="cursor-move">
              <circle r={isAP ? 18 : 12} fill={isAP ? '#fff7ed' : 'white'} stroke={isAP ? '#f97316' : compColor} strokeWidth={isAP ? 3 : 1} cx={0} cy={0} />
              {isAP && <line x1="-8" y1="-8" x2="8" y2="8" stroke="#ea580c" strokeWidth="2" />}
              <text
                dy=".3em"
                textAnchor="middle"
                fontSize={isAP ? '12' : '10'}
                fontWeight="bold"
                fill={isAP ? '#c2410c' : compColor}
                className="select-none pointer-events-none"
              >
                {node?.label}
              </text>
            </motion.g>
          );
        })}
      </svg>
      <div className="absolute bottom-2 left-3 right-3 text-[9px] text-gray-400 bg-white/80 backdrop-blur px-2 py-1 rounded">
        Remove orange AP node to split into {components.length} colored components. Same-color = same component.
      </div>
    </div>
  );
};

export default APCanvas;
