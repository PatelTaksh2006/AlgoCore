import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import useSimulationStore from '../../../store/useSimulationStore';
import { useGraph } from '../../graph/context/GraphContext';
import { useAlgorithm } from '../../algorithm/context/AlgorithmContext';

const APSPResult = () => {
  const { internalState } = useSimulationStore();
  const { nodes } = useGraph();
  const { logs } = useAlgorithm();

  const matrix = internalState?.matrix;
  const activeNodes = internalState?.activeNodes || {};
  const fwComparison = internalState?.fwComparison;
  const negativeCycleLog = useMemo(() => {
    if (!Array.isArray(logs)) {
      return null;
    }
    for (let i = logs.length - 1; i >= 0; i -= 1) {
      const entry = logs[i];
      if (typeof entry === 'string' && entry.includes('NEGATIVE WEIGHT CYCLE DETECTED')) {
        return entry;
      }
    }
    return null;
  }, [logs]);

  const negativeCyclePairs = useMemo(() => {
    if (!negativeCycleLog) {
      return '';
    }
    const pairsMatch = negativeCycleLog.match(/Pairs:\s*([^|]+)/);
    return pairsMatch?.[1]?.trim() || '';
  }, [negativeCycleLog]);

  const negativeCyclePath = useMemo(() => {
    if (!negativeCycleLog) {
      return '';
    }
    const cycleMatch = negativeCycleLog.match(/Cycle:\s*(.+)$/);
    return cycleMatch?.[1]?.trim() || '';
  }, [negativeCycleLog]);

  const orderedNodeIds = useMemo(() => nodes.map((n) => n.id), [nodes]);

  const nodeLabelMap = useMemo(() => {
    const map = {};
    nodes.forEach((n) => {
      map[n.id] = n.label;
    });
    return map;
  }, [nodes]);

  if (!matrix) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm p-4 text-center">
        Processing All-Pairs Shortest Path...
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white shrink-0 shadow-sm z-10 relative">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          Floyd-Warshall Distance Matrix
        </h3>
        {negativeCycleLog && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            <div>Negative weight cycle found in graph.</div>
            {negativeCyclePairs && (
              <div className="mt-1 font-mono">Detected pairs: {negativeCyclePairs}</div>
            )}
            {negativeCyclePath && (
              <div className="mt-1 font-mono">Cycle path: {negativeCyclePath}</div>
            )}
          </div>
        )}
      </div>

      {/* Comparison Step (above matrix) */}
      <div className="shrink-0 border-b border-gray-200 bg-blue-50 px-6 py-4">
        <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-blue-600 mb-3">
          Current Comparison Step
        </div>

        <motion.div
          key={fwComparison?.id ?? 'fw-idle'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-blue-200 bg-white p-4 max-w-2xl"
        >
          {!fwComparison ? (
            <div className="text-sm text-gray-500">Waiting for comparison step...</div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-blue-700">
                Processing: distance[{fwComparison.i}][{fwComparison.j}] via intermediate node {fwComparison.k}
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-mono text-gray-600">Current: </span>
                  <span className="font-mono font-semibold text-gray-800">{fwComparison.lhs}</span>
                </div>
                <div>
                  <span className="font-mono text-gray-600">Compare: </span>
                  <span className="font-mono font-semibold text-gray-800">{fwComparison.rhsValue}</span>
                </div>
                <div>
                  <span className="font-mono text-gray-600">Result: </span>
                  <span className={`font-mono font-semibold ${fwComparison.result ? 'text-emerald-700' : 'text-gray-600'}`}>
                    {fwComparison.result ? 'UPDATE' : 'NO CHANGE'}
                  </span>
                </div>
              </div>
              <div className="text-xs font-mono text-gray-500 bg-gray-50 p-2 rounded">
                {fwComparison.rhs}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Large Distance Matrix */}
      <div className="flex-1 overflow-auto p-6 flex justify-center items-start">
        <div className="rounded-lg border border-blue-200 bg-white shadow-md overflow-hidden">
          <table className="text-sm border-collapse">
            <thead>
              <tr>
                <th className="border border-blue-200 bg-gray-100 px-4 py-3 font-semibold text-gray-700 w-16 text-center">
                  From\To
                </th>
                {orderedNodeIds.map((id) => {
                  const isJActive = activeNodes.j === id;
                  return (
                    <motion.th
                      key={`fw-col-${id}`}
                      animate={{
                        backgroundColor: isJActive ? '#fbcfe8' : '#f3f4f6',
                        color: isJActive ? '#831843' : '#374151',
                      }}
                      transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.35 }}
                      className={`border border-blue-200 px-4 py-3 font-semibold text-center`}
                    >
                      {nodeLabelMap[id] || id}
                    </motion.th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {orderedNodeIds.map((iId) => {
                const isIActive = activeNodes.i === iId;
                return (
                  <tr key={`fw-row-${iId}`}>
                    <motion.th
                      animate={{
                        backgroundColor: isIActive ? '#fef08a' : '#f3f4f6',
                        color: isIActive ? '#854d0e' : '#374151',
                      }}
                      transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.35 }}
                      className={`border border-blue-200 px-4 py-3 font-semibold text-center`}
                    >
                      {nodeLabelMap[iId] || iId}
                    </motion.th>
                    {orderedNodeIds.map((jId) => {
                      const value = matrix?.[iId]?.[jId];
                      const isActiveCell = isIActive && activeNodes.j === jId;

                      let bgColor = '#ffffff';
                      let textColor = '#374151';
                      if (isActiveCell) {
                        // Active cell (i,j intersection) - green
                        bgColor = '#86efac';
                        textColor = '#166534';
                      } else if (isIActive) {
                        // i-row highlight - light yellow
                        bgColor = '#fef3c7';
                        textColor = '#78350f';
                      } else if (activeNodes.j === jId) {
                        // j-column highlight - light pink
                        bgColor = '#fbf1f6';
                        textColor = '#831843';
                      }

                      return (
                        <motion.td
                          key={`fw-cell-${iId}-${jId}`}
                          animate={{
                            backgroundColor: bgColor,
                            color: textColor,
                          }}
                          transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.35 }}
                          className={`border border-blue-200 px-4 py-3 text-center font-mono font-medium`}
                        >
                          {value === Infinity ? '∞' : value}
                        </motion.td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default APSPResult;
