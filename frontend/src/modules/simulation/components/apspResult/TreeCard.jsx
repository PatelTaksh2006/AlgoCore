import React from 'react';
import { motion } from 'framer-motion';

const TreeCard = ({ tree, nodes, treeOffset, onDragTree }) => {
  return (
    <motion.div
      key={`tree-${tree.sourceId}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col"
    >
      <div className="bg-gradient-to-r from-blue-50 to-white p-3 border-b border-gray-100 shrink-0">
        <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2">
          Source:
          <span className="bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs shadow-sm">
            {tree.sourceLabel}
          </span>
        </h4>
      </div>

      <div className="p-4 overflow-x-auto relative flex items-center min-h-[120px]">
        {tree.nodes.length === 1 && (
          <span className="text-xs text-gray-400 italic">No reachable destinations</span>
        )}

        {tree.nodes.length > 1 && (
          <motion.div
            drag
            dragMomentum={false}
            onDrag={onDragTree}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            style={treeOffset}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: (tree.maxDepth + 1) * 80 + 40 }}>
              <defs>
                <marker id={`arrow-${tree.sourceId}`} markerWidth="8" markerHeight="6" refX="16" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" opacity="0.6" />
                </marker>
              </defs>

              {tree.edges.map((e, idx) => {
                const sDepth = tree.depths[e.source];
                const tDepth = tree.depths[e.target];

                const sGroup = tree.nodes.filter((n) => tree.depths[n] === sDepth);
                const tGroup = tree.nodes.filter((n) => tree.depths[n] === tDepth);

                const sIndex = sGroup.indexOf(e.source);
                const tIndex = tGroup.indexOf(e.target);

                const startX = 40 + sDepth * 80;
                const startY = 60 + (sIndex - (sGroup.length - 1) / 2) * 40;
                const endX = 40 + tDepth * 80;
                const endY = 60 + (tIndex - (tGroup.length - 1) / 2) * 40;

                return (
                  <g key={`${e.source}-${e.target}-${idx}`}>
                    <motion.line
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      opacity="0.4"
                      markerEnd={`url(#arrow-${tree.sourceId})`}
                    />
                    <text
                      x={(startX + endX) / 2}
                      y={(startY + endY) / 2 - 6}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill="#1d4ed8"
                    >
                      {e.weight ?? '?'}
                    </text>
                  </g>
                );
              })}
            </svg>

            {tree.nodes.map((nId) => {
              const depth = tree.depths[nId];
              const group = tree.nodes.filter((n) => tree.depths[n] === depth);
              const idx = group.indexOf(nId);

              const x = 40 + depth * 80;
              const y = 60 + (idx - (group.length - 1) / 2) * 40;
              const isSource = nId === tree.sourceId;
              const label = nodes.find((n) => n.id === nId)?.label;

              return (
                <div
                  key={nId}
                  className={`absolute w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shadow-sm z-10 transition-colors ${
                    isSource ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-700 border-blue-300'
                  }`}
                  style={{ left: x - 16, top: y - 16 }}
                  title={`Node ${label}`}
                >
                  {label}
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-white/90 border border-blue-200 px-1.5 py-0.5 text-[9px] font-medium text-blue-700">
                    d={tree.matrixRow?.[nId] === Infinity ? 'INF' : tree.matrixRow?.[nId] ?? 'INF'}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        <div style={{ minWidth: (tree.maxDepth + 1) * 80 + 40, height: '1px' }} />
      </div>
    </motion.div>
  );
};

export default TreeCard;
