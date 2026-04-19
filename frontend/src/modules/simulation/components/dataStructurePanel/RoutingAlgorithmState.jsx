import React from 'react';
import { motion } from 'framer-motion';

const RoutingAlgorithmState = ({ routingTable, activeTableNodeId, nodeLabelMap, selectedAlgorithm, internalState }) => {
  const isLinkState = selectedAlgorithm === 'linkState';
  const comparison = internalState?.routingComparison;

  return (
    <div className="relative w-full border-t border-blue-100 pt-2 mt-2">
      <div className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">
        {isLinkState ? 'Link State Routing' : 'Distance Vector Routing'}
        {activeTableNodeId && (
          <span className="ml-2 text-green-600 font-normal">
            (Processing: {nodeLabelMap[activeTableNodeId]})
          </span>
        )}
      </div>

      <div className="mb-2 rounded-lg border border-sky-200 bg-sky-50/80 p-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-sky-700 mb-1">
          Comparison Animation
        </div>

        {!comparison && (
          <div className="text-[10px] text-gray-500">
            Waiting for first relaxation comparison...
          </div>
        )}

        {comparison && (
          <motion.div
            key={comparison.id}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="rounded-md border border-sky-200 bg-white px-2 py-1"
          >
            <div className="text-[10px] text-sky-700 font-semibold">
              {comparison.algorithm === 'linkState' ? 'Link State SPF' : 'Distance Vector'}
            </div>
            <div className="text-[10px] text-sky-700 font-semibold">
              Via {comparison.via}, Dest {comparison.destination}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-mono text-gray-700">
              <span>{comparison.lhs}</span>
              <span>{comparison.operator}</span>
              <span>{comparison.rhs}</span>
              <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold ${comparison.result ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {comparison.result ? 'UPDATE' : 'NO UPDATE'}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {routingTable && Object.keys(routingTable).length > 0 && (
        <div className="text-[10px] text-gray-500">
          Tables Updated: {Object.keys(routingTable).length} nodes
        </div>
      )}
    </div>
  );
};

export default RoutingAlgorithmState;
