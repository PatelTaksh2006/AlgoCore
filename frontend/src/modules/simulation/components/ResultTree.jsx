import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useGraph } from '../../graph/context/GraphContext';
import useSimulationStore from '../../../store/useSimulationStore';
import { calculateTreeLayout } from '../../../utils/treeLayout';
import { useAlgorithm } from '../../algorithm/context/AlgorithmContext';
import TreeEdgeLegend from './resultTree/TreeEdgeLegend';

const ResultTree = () => {
  const { nodes, edges, isDirected } = useGraph();
  const { backEdges, resultData } = useSimulationStore();
  const { selectedAlgorithm, startNodeId } = useAlgorithm();
  const panelRef = useRef(null);
  const showAnimatedBackEdges = selectedAlgorithm === 'dfs' && backEdges.length > 0;

  const [manualPositions, setManualPositions] = useState({});

  const classifiedTreeEdges = useMemo(() => (
    edges.filter((e) => (
      ['tree', 'solution', 'forward', 'cross', 'cycle', 'scc-pass1', 'scc-pass2', 'scc-reversed', 'scc-component']
        .includes(e.classification)
    ))
  ), [edges]);

  const solutionNodeIds = useMemo(() => {
    const set = new Set();
    classifiedTreeEdges.forEach((e) => {
      if (e.classification === 'solution') {
        set.add(e.source);
        set.add(e.target);
      }
    });
    return set;
  }, [classifiedTreeEdges]);

  const positions = useMemo(() => {
    if (selectedAlgorithm === 'scc' || selectedAlgorithm === 'articulationPoints') {
      const graphPositions = {};
      nodes.forEach((node) => {
        graphPositions[node.id] = { x: node.x, y: node.y };
      });
      return graphPositions;
    }
    const layoutRoot = selectedAlgorithm === 'kruskal' ? undefined : (startNodeId || undefined);
    return calculateTreeLayout(nodes, edges, layoutRoot);
  }, [nodes, edges, selectedAlgorithm, startNodeId]);

  const visibleNodes = nodes.filter((n) => positions[n.id]);
  const hasTree = (selectedAlgorithm === 'scc' || selectedAlgorithm === 'articulationPoints')
    ? nodes.length > 0
    : Object.keys(positions).length > 0;

  const edgesToRender = (selectedAlgorithm === 'scc' || selectedAlgorithm === 'articulationPoints')
    ? edges
    : classifiedTreeEdges;

  const isDijkstraResult = selectedAlgorithm === 'dijkstra' && resultData?.type === 'dijkstraPath' && resultData.dist;
  const dvFinalResult = selectedAlgorithm === 'distanceVector' && resultData?.type === 'distanceVectorFinal' ? resultData : null;

  const nodeLabelMap = useMemo(() => {
    const map = {};
    nodes.forEach((node) => {
      map[node.id] = node.label;
    });
    return map;
  }, [nodes]);

  const handleDrag = (id, deltaX, deltaY, pos) => {
    setManualPositions((prev) => {
      const current = prev[id] || pos;
      return {
        ...prev,
        [id]: {
          x: current.x + deltaX,
          y: current.y + deltaY,
        },
      };
    });
  };

  const resolveEdgeStyle = (edge) => {
    let strokeColor = '#2563eb';
    let strokeDasharray;
    let strokeWidth = 2;

    if (edge.classification === 'solution') {
      strokeColor = '#22c55e';
      strokeWidth = 3;
    } else if (edge.classification === 'back') {
      strokeColor = '#ef4444';
      strokeDasharray = '5,5';
    } else if (edge.classification === 'forward') {
      strokeColor = '#16a34a';
      strokeDasharray = '4,2';
    } else if (edge.classification === 'cross') {
      strokeColor = '#111827';
      strokeDasharray = '2,2';
    } else if (edge.classification === 'cycle') {
      strokeColor = '#b91c1c';
      strokeDasharray = '6,4';
    } else if (edge.classification === 'scc-reversed') {
      strokeColor = '#f59e0b';
      strokeDasharray = '5,4';
    } else if (edge.classification === 'scc-pass2') {
      strokeColor = '#ea580c';
      strokeWidth = 3;
    } else if (edge.classification === 'scc-component') {
      strokeColor = '#7c3aed';
      strokeWidth = 3;
    }

    return { strokeColor, strokeDasharray, strokeWidth };
  };

  return (
    <div ref={panelRef} className="w-full h-full bg-gray-50 border-l border-gray-200 relative overflow-hidden">
      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm z-10">
        RESULT TREE
      </div>

      <TreeEdgeLegend selectedAlgorithm={selectedAlgorithm} />

      {!hasTree && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
          No tree generated yet.
        </div>
      )}

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <marker id="tree-arrow" markerWidth="10" markerHeight="7" refX="18" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
          <marker id="tree-arrow-back" markerWidth="10" markerHeight="7" refX="18" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
          </marker>
        </defs>

        {edgesToRender.map((edge) => {
          const sourcePos = manualPositions[edge.source] || positions[edge.source];
          const targetPos = manualPositions[edge.target] || positions[edge.target];
          if (!sourcePos || !targetPos) {
            return null;
          }

          const { strokeColor, strokeDasharray, strokeWidth } = resolveEdgeStyle(edge);
          return (
            <motion.line
              key={edge.id}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
              x1={sourcePos.x}
              y1={sourcePos.y}
              x2={targetPos.x}
              y2={targetPos.y}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              markerEnd="url(#tree-arrow)"
            />
          );
        })}

        {showAnimatedBackEdges && backEdges.map((edge, i) => {
          const sourcePos = manualPositions[edge.source] || positions[edge.source];
          const targetPos = manualPositions[edge.target] || positions[edge.target];
          if (!sourcePos || !targetPos) {
            return null;
          }

          const midX = (sourcePos.x + targetPos.x) / 2;
          const midY = (sourcePos.y + targetPos.y) / 2;
          const controlX = midX + 40;
          const controlY = midY - 40;
          const vecX = targetPos.x - controlX;
          const vecY = targetPos.y - controlY;
          const vecLen = Math.hypot(vecX, vecY) || 1;
          const targetOffset = 22;
          const endX = targetPos.x - (vecX / vecLen) * targetOffset;
          const endY = targetPos.y - (vecY / vecLen) * targetOffset;

          return (
            <motion.path
              key={`back-${edge.id}-${i}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
              d={`M ${sourcePos.x} ${sourcePos.y} Q ${controlX} ${controlY} ${endX} ${endY}`}
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="5,5"
              markerEnd="url(#tree-arrow-back)"
              fill="none"
            />
          );
        })}
      </svg>

      {visibleNodes.map((node) => {
        const basePos = positions[node.id];
        const pos = manualPositions[node.id] || basePos;
        if (!basePos) {
          return null;
        }

        let borderColor = 'border-blue-500';
        if (selectedAlgorithm === 'scc') borderColor = node.color ? 'border-transparent' : 'border-purple-500';
        else if (solutionNodeIds.has(node.id)) borderColor = 'border-green-500';

        return (
          <motion.div
            key={node.id}
            drag
            dragMomentum={false}
            onDrag={(e, info) => handleDrag(node.id, info.delta.x, info.delta.y, basePos)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, x: pos.x, y: pos.y }}
            transition={{ duration: 0.12 }}
            className={`absolute w-10 h-10 rounded-full bg-white border-2 flex items-center justify-center shadow-sm z-10 cursor-grab active:cursor-grabbing ${borderColor}`}
            style={{ marginLeft: -20, marginTop: -20, backgroundColor: node.color || '#ffffff' }}
          >
            <span className="text-xs font-bold text-gray-700 pointer-events-none">{node.label}</span>

            {dvFinalResult?.finalCosts && dvFinalResult.finalCosts[node.id] !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-purple-200 bg-white/95 px-1.5 py-0.5 text-[9px] font-semibold text-purple-700"
              >
                d={dvFinalResult.finalCosts[node.id] === Infinity ? 'INF' : dvFinalResult.finalCosts[node.id]}
              </motion.div>
            )}
          </motion.div>
        );
      })}

      {selectedAlgorithm === 'distanceVector' && dvFinalResult && (
        <div className="absolute left-4 top-14 z-20 rounded-lg border border-purple-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-purple-600 mb-1">
            Final Cost From {nodeLabelMap[dvFinalResult.sourceId] || dvFinalResult.sourceId}
          </div>
          <div className="flex flex-wrap gap-1">
            {nodes.map((node) => (
              <span key={`dv-final-cost-${node.id}`} className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                {node.label}:{dvFinalResult.finalCosts[node.id] === Infinity ? 'INF' : dvFinalResult.finalCosts[node.id]}
              </span>
            ))}
          </div>
        </div>
      )}

      {isDijkstraResult && (
        <div className="absolute bottom-0 left-0 right-0 border-t border-blue-200 bg-white px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 mb-2">
            Optimal dist[] from {nodeLabelMap[resultData.startNodeId] || resultData.startNodeId}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {nodes.map((node) => {
              const d = resultData.dist[node.id];
              const isSource = node.id === resultData.startNodeId;
              const isOnPath = resultData.pathNodes?.includes(node.id);
              return (
                <span
                  key={`dijkstra-dist-${node.id}`}
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                    isSource
                      ? 'border-green-300 bg-green-50 text-green-700'
                      : isOnPath
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-blue-200 bg-blue-50 text-blue-700'
                  }`}
                >
                  {node.label}: {d === Infinity ? '8' : d}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultTree;
