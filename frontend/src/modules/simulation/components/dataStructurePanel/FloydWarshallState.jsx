import React from 'react';

const FloydWarshallState = ({ internalState, nodeLabelMap, nodes }) => {
  if (!internalState?.matrix) {
    return null;
  }

  const matrix = internalState.matrix;
  const activeNodes = internalState.activeNodes || {};
  const nodeIds = nodes.map((n) => n.id);

  return (
    <div className="relative w-full border-t border-purple-100 pt-2 mt-2">
      <div className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-2">
        Floyd-Warshall Distance Matrix
        {activeNodes.k && (
          <span className="ml-2 text-yellow-600 font-normal">
            (k = {nodeLabelMap[activeNodes.k]})
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="text-[10px] border-collapse">
          <thead>
            <tr>
              <th className="border border-purple-200 px-1 py-0.5 bg-purple-50"></th>
              {nodeIds.map((id) => (
                <th
                  key={id}
                  className={`border border-purple-200 px-1 py-0.5 ${activeNodes.j === id ? 'bg-yellow-200' : 'bg-purple-50'}`}
                >
                  {nodeLabelMap[id]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nodeIds.map((i) => (
              <tr key={i}>
                <td className={`border border-purple-200 px-1 py-0.5 font-bold ${activeNodes.i === i ? 'bg-yellow-200' : 'bg-purple-50'}`}>
                  {nodeLabelMap[i]}
                </td>
                {nodeIds.map((j) => {
                  const val = matrix[i]?.[j];
                  const isActive = activeNodes.i === i && activeNodes.j === j;
                  const isViaK = activeNodes.k && (i === activeNodes.k || j === activeNodes.k);
                  return (
                    <td
                      key={j}
                      className={`border border-purple-200 px-1 py-0.5 text-center font-mono ${
                        isActive ? 'bg-green-200 font-bold' : isViaK ? 'bg-yellow-100' : ''
                      }`}
                    >
                      {val === Infinity ? '∞' : val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FloydWarshallState;
