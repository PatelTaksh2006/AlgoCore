import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSimulationStore from '../../../store/useSimulationStore';
import { useGraph } from '../../graph/context/GraphContext';
import { useAlgorithm } from '../../algorithm/context/AlgorithmContext';
import { buildShortestPathTrees } from './apspResult/buildShortestPathTrees';
import TreeCard from './apspResult/TreeCard';

const APSPResult = () => {
  const { internalState } = useSimulationStore();
  const { nodes, edges, isDirected } = useGraph();
  const { startNodeId } = useAlgorithm();
  const [treeOffsets, setTreeOffsets] = useState({});

  const matrix = internalState?.matrix;
  const nextNode = internalState?.next;
  const activeNodes = internalState?.activeNodes || {};
  const fwComparison = internalState?.fwComparison;
  const fwStatus = internalState?.fwStatus || 'init';

  const orderedNodeIds = useMemo(() => nodes.map((n) => n.id), [nodes]);

  const orderedRootIds = useMemo(() => {
    return startNodeId
      ? [
        ...nodes.filter((node) => node.id === startNodeId).map((node) => node.id),
        ...nodes.filter((node) => node.id !== startNodeId).map((node) => node.id),
      ]
      : nodes.map((node) => node.id);
  }, [nodes, startNodeId]);

  const nodeLabelMap = useMemo(() => {
    const map = {};
    nodes.forEach((n) => {
      map[n.id] = n.label;
    });
    return map;
  }, [nodes]);

  const getEdgeWeight = (sourceId, targetId) => {
    const direct = edges.find((edge) => edge.source === sourceId && edge.target === targetId);
    if (direct) {
      return Number(direct.weight ?? 1);
    }

    if (!isDirected) {
      const reverse = edges.find((edge) => edge.source === targetId && edge.target === sourceId);
      if (reverse) {
        return Number(reverse.weight ?? 1);
      }
    }

    return null;
  };

  const shortestPathTrees = useMemo(() => buildShortestPathTrees({
    matrix,
    nextNode,
    nodes,
    startNodeId,
    getEdgeWeight,
  }), [matrix, nextNode, nodes, startNodeId]);

  const visibleRootCount = useMemo(() => {
    if (fwStatus === 'completed') {
      return shortestPathTrees.length;
    }
    if (fwStatus === 'running' && activeNodes.k) {
      const kIndex = orderedRootIds.indexOf(activeNodes.k);
      if (kIndex >= 0) {
        return Math.min(shortestPathTrees.length, kIndex + 1);
      }
      return Math.min(shortestPathTrees.length, 1);
    }
    return 0;
  }, [fwStatus, activeNodes.k, orderedRootIds, shortestPathTrees.length]);

  const animatedTrees = useMemo(() => shortestPathTrees.slice(0, visibleRootCount), [shortestPathTrees, visibleRootCount]);

  if (!matrix) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm p-4 text-center">
        Processing All-Pairs Shortest Path...
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white shrink-0 flex justify-between items-center shadow-sm z-10 relative">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          Floyd-Warshall Animation + Shortest Path Trees
        </h3>
        <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-600 rounded-md">
          {nodes.length} Roots
        </span>
      </div>

      <div className="shrink-0 border-b border-gray-200 bg-white/95 px-4 py-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 mb-2">
          Floyd-Warshall Step Animation
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="flex items-start gap-3 min-w-[980px]">
            <motion.div
              key={fwComparison?.id ?? 'fw-idle'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-[320px] shrink-0 rounded-lg border border-blue-200 bg-blue-50/70 p-3"
            >
              {!fwComparison ? (
                <div className="text-xs text-gray-500">Waiting for comparison step...</div>
              ) : (
                <>
                  <div className="text-xs font-semibold text-blue-700 mb-1">
                    Compare for ({fwComparison.i}, {fwComparison.j}) via {fwComparison.k}
                  </div>
                  <div className="text-[12px] font-mono text-gray-700">
                    {fwComparison.lhs} {fwComparison.operator} {fwComparison.rhsValue}
                  </div>
                  <div className="text-[11px] font-mono text-gray-500 mt-1">
                    via expression: {fwComparison.rhs}
                  </div>
                  <div className={`mt-2 inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${fwComparison.result ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {fwComparison.result ? 'UPDATE' : 'NO UPDATE'}
                  </div>
                </>
              )}
            </motion.div>

            <div className="flex-1 min-w-[620px] rounded-lg border border-blue-100 overflow-hidden">
              <table className="text-[11px] border-collapse w-full min-w-[620px]">
                <thead>
                  <tr>
                    <th className="border border-blue-100 bg-blue-50 px-2 py-1">-</th>
                    {orderedNodeIds.map((id) => (
                      <th key={`fw-col-${id}`} className={`border border-blue-100 px-2 py-1 ${activeNodes.j === id ? 'bg-yellow-100' : 'bg-blue-50'}`}>
                        {nodeLabelMap[id] || id}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orderedNodeIds.map((iId) => (
                    <tr key={`fw-row-${iId}`}>
                      <th className={`border border-blue-100 px-2 py-1 ${activeNodes.i === iId ? 'bg-yellow-100' : 'bg-blue-50'}`}>
                        {nodeLabelMap[iId] || iId}
                      </th>
                      {orderedNodeIds.map((jId) => {
                        const value = matrix?.[iId]?.[jId];
                        const isActiveCell = activeNodes.i === iId && activeNodes.j === jId;
                        return (
                          <td
                            key={`fw-cell-${iId}-${jId}`}
                            className={`border border-blue-100 px-2 py-1 text-center font-mono ${isActiveCell ? 'bg-emerald-100 font-semibold' : 'bg-white'}`}
                          >
                            {value === Infinity ? 'INF' : value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {animatedTrees.length === 0 && (
          <div className="rounded-lg border border-blue-100 bg-white p-4 text-sm text-gray-500">
            Shortest path trees will appear progressively as matrix updates run.
          </div>
        )}

        <AnimatePresence>
          {animatedTrees.map((tree, i) => (
            <TreeCard
              key={`tree-${tree.sourceId}`}
              tree={tree}
              nodes={nodes}
              treeOffset={{
                x: treeOffsets[tree.sourceId]?.x || 0,
                y: treeOffsets[tree.sourceId]?.y || 0,
              }}
              onDragTree={(event, info) => {
                setTreeOffsets((prev) => {
                  const current = prev[tree.sourceId] || { x: 0, y: 0 };
                  return {
                    ...prev,
                    [tree.sourceId]: {
                      x: current.x + info.delta.x,
                      y: current.y + info.delta.y,
                    },
                  };
                });
              }}
              delay={i * 0.1}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default APSPResult;
