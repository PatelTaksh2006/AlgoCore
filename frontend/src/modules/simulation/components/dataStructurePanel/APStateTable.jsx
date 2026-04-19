import React from 'react';
import { motion } from 'framer-motion';

const APStateTable = ({ internalState, nodeLabelMap }) => {
  if (!internalState?.discovery) {
    return null;
  }

  const discovery = internalState.discovery || {};
  const lowLink = internalState.lowLink || {};
  const apList = internalState.ap || [];
  const nodeIds = Object.keys(discovery).filter((id) => discovery[id] !== -1);

  if (nodeIds.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full border-t border-orange-100 pt-2 mt-2">
      <div className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2">
        Articulation Points Algorithm State
      </div>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-orange-50">
            <th className="border border-orange-200 px-2 py-1 text-left">Node</th>
            <th className="border border-orange-200 px-2 py-1 text-center">Discovery</th>
            <th className="border border-orange-200 px-2 py-1 text-center">Low-Link</th>
            <th className="border border-orange-200 px-2 py-1 text-center">Is AP?</th>
          </tr>
        </thead>
        <tbody>
          {nodeIds.map((nodeId) => {
            const label = nodeLabelMap[nodeId] || nodeId;
            const disc = discovery[nodeId];
            const low = lowLink[nodeId];
            const isAP = apList.includes(nodeId);

            return (
              <motion.tr
                key={nodeId}
                initial={{ opacity: 0, backgroundColor: '#fef3c7' }}
                animate={{ opacity: 1, backgroundColor: isAP ? '#fed7aa' : '#fff' }}
                className={isAP ? 'bg-orange-100' : ''}
              >
                <td className={`border border-orange-200 px-2 py-1 font-bold ${isAP ? 'text-orange-700' : 'text-gray-700'}`}>
                  {label}
                </td>
                <td className="border border-orange-200 px-2 py-1 text-center font-mono">{disc}</td>
                <td className="border border-orange-200 px-2 py-1 text-center font-mono">{low}</td>
                <td className="border border-orange-200 px-2 py-1 text-center">
                  {isAP ? <span className="text-orange-600 font-bold">✓</span> : '-'}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
      {apList.length > 0 && (
        <div className="mt-2 text-[10px] text-orange-600 font-semibold">
          Articulation Points Found: {apList.map((id) => nodeLabelMap[id] || id).join(', ')}
        </div>
      )}
    </div>
  );
};

export default APStateTable;
