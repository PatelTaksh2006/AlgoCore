import React, { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useGraph } from '../../graph/context/GraphContext';
import useSimulationStore from '../../../store/useSimulationStore';
import { calculateTreeLayout } from '../../../utils/treeLayout';
import { useAlgorithm } from '../../algorithm/context/AlgorithmContext';
import TreeEdgeLegend from './resultTree/TreeEdgeLegend';

const ResultTree = () => {
  const { nodes, edges, isDirected, isTransposedView } = useGraph();
  const { backEdges, resultData } = useSimulationStore();
  const { selectedAlgorithm, startNodeId, components } = useAlgorithm();
  const panelRef = useRef(null);
  const showAnimatedBackEdges = selectedAlgorithm === 'dfs' && backEdges.length > 0;

  const [manualPositions, setManualPositions] = useState({});
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

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

  const isMSTAlgo = selectedAlgorithm === 'prim' || selectedAlgorithm === 'kruskal';

  const mstTotalWeight = useMemo(() => {
    if (!isMSTAlgo) return null;
    const treeEdges = classifiedTreeEdges.filter(e => e.classification === 'tree');
    if (treeEdges.length === 0) return null;
    return treeEdges.reduce((sum, e) => sum + Number(e.weight || 0), 0);
  }, [isMSTAlgo, classifiedTreeEdges]);

  const isDijkstraResult = selectedAlgorithm === 'dijkstra' && resultData?.type === 'dijkstraPath' && resultData.dist;
  const dvFinalResult = selectedAlgorithm === 'distanceVector' && resultData?.type === 'distanceVectorFinal' ? resultData : null;

  const nodeLabelMap = useMemo(() => {
    const map = {};
    nodes.forEach((node) => {
      map[node.id] = node.label;
    });
    return map;
  }, [nodes]);

  const sccClusterBoundaries = useMemo(() => {
    if (selectedAlgorithm !== 'scc' || !Array.isArray(components) || components.length === 0) {
      return [];
    }

    return components
      .filter((component) => Array.isArray(component) && component.length >= 2)
      .map((component, index) => {
        const points = component
          .map((nodeId) => manualPositions[nodeId] || positions[nodeId])
          .filter(Boolean);

        if (points.length < 2) {
          return null;
        }

        const center = points.reduce((acc, point) => ({
          x: acc.x + point.x,
          y: acc.y + point.y,
        }), { x: 0, y: 0 });

        const cx = center.x / points.length;
        const cy = center.y / points.length;

        const maxDistance = points.reduce((max, point) => {
          const dist = Math.hypot(point.x - cx, point.y - cy);
          return Math.max(max, dist);
        }, 0);

        return {
          id: `scc-cluster-${index}`,
          label: `SCC ${index + 1}`,
          nodeIds: component,
          cx,
          cy,
          r: Math.max(40, maxDistance + 28),
        };
      })
      .filter(Boolean);
  }, [components, manualPositions, positions, selectedAlgorithm]);

  const handleClusterPointerDown = useCallback((event, nodeIds) => {
    event.stopPropagation();
    event.preventDefault();

    if (event.button !== 0) {
      return;
    }

    const startX = event.clientX;
    const startY = event.clientY;
    const initialPositions = {};

    nodeIds.forEach((nodeId) => {
      const basePos = manualPositions[nodeId] || positions[nodeId];
      if (basePos) {
        initialPositions[nodeId] = { x: basePos.x, y: basePos.y };
      }
    });

    const handlePointerMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      setManualPositions((prev) => {
        const next = { ...prev };
        Object.entries(initialPositions).forEach(([nodeId, pos]) => {
          next[nodeId] = {
            x: pos.x + dx,
            y: pos.y + dy,
          };
        });
        return next;
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [manualPositions, positions]);

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

  const handlePanelMouseDown = (event) => {
    if (event.button !== 0) {
      return;
    }

    const isOnInteractiveElement = event.target.closest('[data-pan-block="true"]');
    if (isOnInteractiveElement) {
      return;
    }

    event.preventDefault();
    isPanningRef.current = true;
    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };

    const handleMouseMove = (moveEvent) => {
      if (!isPanningRef.current) {
        return;
      }

      const dx = moveEvent.clientX - panStartRef.current.x;
      const dy = moveEvent.clientY - panStartRef.current.y;
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
    };

    const handleMouseUp = () => {
      isPanningRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
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
    <div ref={panelRef} className="w-full h-full bg-gray-50 border-l border-gray-200 relative overflow-hidden" onMouseDown={handlePanelMouseDown}>
      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm z-10">
        RESULT TREE
      </div>

      <TreeEdgeLegend selectedAlgorithm={selectedAlgorithm} />

      {!hasTree && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
          No tree generated yet.
        </div>
      )}

      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: '0 0',
        }}
      >
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <marker id="tree-arrow" markerWidth="10" markerHeight="7" refX="18" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
          <marker id="tree-arrow-back" markerWidth="10" markerHeight="7" refX="18" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
          </marker>
        </defs>

        {sccClusterBoundaries.map((cluster) => (
          <g
            key={cluster.id}
            onPointerDown={(event) => handleClusterPointerDown(event, cluster.nodeIds)}
            className="pointer-events-auto cursor-move"
          >
            <motion.circle
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              cx={cluster.cx}
              cy={cluster.cy}
              r={cluster.r}
              fill="transparent"
              stroke="#7c3aed"
              strokeWidth={2}
              strokeDasharray="7 5"
              fillOpacity={0.02}
            />
            <text
              x={cluster.cx}
              y={cluster.cy - cluster.r - 8}
              textAnchor="middle"
              className="fill-violet-600 text-[10px] font-bold tracking-wide pointer-events-none select-none"
            >
              {cluster.label}
            </text>
          </g>
        ))}

        {edgesToRender.map((edge) => {
          const fromId = isTransposedView ? edge.target : edge.source;
          const toId = isTransposedView ? edge.source : edge.target;

          const sourcePos = manualPositions[fromId] || positions[fromId];
          const targetPos = manualPositions[toId] || positions[toId];
          if (!sourcePos || !targetPos) {
            return null;
          }

          const { strokeColor, strokeDasharray, strokeWidth } = resolveEdgeStyle(edge);
          const edgeMidX = (sourcePos.x + targetPos.x) / 2;
          const edgeMidY = (sourcePos.y + targetPos.y) / 2;
          return (
            <g key={edge.id}>
              <motion.line
                data-pan-block="true"
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
                markerEnd={isMSTAlgo ? undefined : "url(#tree-arrow)"}
              />
              {isMSTAlgo && edge.classification === 'tree' && (
                <g>
                  <rect
                    x={edgeMidX - 12}
                    y={edgeMidY - 9}
                    width={24}
                    height={16}
                    rx={4}
                    fill="white"
                    stroke="#bfdbfe"
                    strokeWidth={1}
                  />
                  <text
                    x={edgeMidX}
                    y={edgeMidY + 4}
                    fill="#2563eb"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {edge.weight}
                  </text>
                </g>
              )}
            </g>
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
              data-pan-block="true"
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
            data-pan-block="true"
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
      </div>

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
      {isMSTAlgo && mstTotalWeight !== null && (
        <div className="absolute bottom-0 left-0 right-0 border-t border-blue-200 bg-white px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 mb-1">
            Minimum Spanning Tree
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
              Total Weight: {mstTotalWeight}
            </span>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
              Edges: {classifiedTreeEdges.filter(e => e.classification === 'tree').length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultTree;
