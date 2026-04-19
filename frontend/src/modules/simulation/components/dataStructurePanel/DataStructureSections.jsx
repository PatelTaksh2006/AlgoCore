import React from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import APStateTable from './APStateTable';
import FloydWarshallState from './FloydWarshallState';
import RoutingAlgorithmState from './RoutingAlgorithmState';

const DataStructureSections = ({
  orderedVisibleSectionIds,
  handleSectionReorder,
  getTypeLabel,
  activeDS,
  parent,
  visited,
  components,
  nodeLabelMap,
  selectedAlgorithm,
  internalState,
  nodes,
  routingTable,
  activeTableNodeId,
}) => {
  return (
    <Reorder.Group
      axis="y"
      values={orderedVisibleSectionIds}
      onReorder={handleSectionReorder}
      className="flex-1 min-w-0 overflow-y-auto pr-2 pb-8 space-y-3"
    >
      {orderedVisibleSectionIds.map((sectionId) => (
        <Reorder.Item
          key={sectionId}
          value={sectionId}
          whileDrag={{ scale: 1.01, boxShadow: '0 10px 24px rgba(15, 23, 42, 0.14)' }}
          className="relative min-w-0 rounded-lg border border-gray-100 bg-white/80 p-2"
        >
          {sectionId === 'primaryDS' && (
            <div className="w-full">
              <div className="mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                {getTypeLabel()} {activeDS.length > 0 && `(${activeDS.length})`}
              </div>
              <div className="flex items-center gap-2 w-full overflow-x-auto px-1 scrollbar-hide min-h-[44px]">
                <AnimatePresence mode="popLayout">
                  {activeDS.map((item, index) => {
                    const id = typeof item === 'object' ? item.id : item;
                    const priority = typeof item === 'object' ? (item.d ?? item.k ?? '') : '';
                    const label = nodeLabelMap[id] || id.toString().replace('node-', '');
                    const isSccToken = selectedAlgorithm === 'scc';
                    const tokenKey = isSccToken ? String(id) : `${id}-${index}`;
                    const tokenLayoutId = isSccToken ? `scc-token-${id}` : undefined;

                    return (
                      <motion.div
                        key={tokenKey}
                        layoutId={tokenLayoutId}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        layout
                        className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 border border-blue-300 flex items-center justify-center text-sm font-bold text-blue-700 relative"
                      >
                        {label}
                        {priority !== '' && (
                          <span className="absolute -top-2 -right-2 bg-yellow-400 text-[10px] text-white px-1 rounded-full border border-white">
                            {priority}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {activeDS.length === 0 && <div className="text-gray-400 text-sm italic w-full text-center">Empty</div>}
              </div>
            </div>
          )}

          {sectionId === 'parent' && (
            <div className="w-full">
              <div className="mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Parent Array</div>
              <div className="flex items-center gap-2 w-full overflow-x-auto px-1 scrollbar-hide min-h-[44px]">
                <AnimatePresence>
                  {Object.entries(parent).map(([childId, parentId]) => {
                    const childLabel = nodeLabelMap[childId] || childId;
                    const parentLabel = nodeLabelMap[parentId] || parentId;
                    return (
                      <motion.div
                        key={childId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-shrink-0 px-2 h-9 rounded bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-medium text-indigo-700 whitespace-nowrap"
                      >
                        {childLabel} → {parentLabel}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {Object.keys(parent).length === 0 && <div className="text-gray-400 text-sm italic w-full text-center mt-2">No parents recorded</div>}
              </div>
            </div>
          )}

          {sectionId === 'visited' && (
            <div className="w-full">
              <div className="mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Visited Order</div>
              <div className="flex items-center gap-1 w-full overflow-x-auto px-1 scrollbar-hide min-h-[36px]">
                {visited.map((nodeId) => {
                  const label = nodeLabelMap[nodeId] || nodeId;
                  return (
                    <motion.div
                      key={nodeId}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex-shrink-0 w-8 h-8 rounded bg-gray-100 border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-600"
                    >
                      {label}
                    </motion.div>
                  );
                })}
                {visited.length === 0 && <div className="text-gray-400 text-sm italic w-full text-center">No nodes visited</div>}
              </div>
            </div>
          )}

          {sectionId === 'scc' && (
            <div className="w-full">
              <div className="mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Components ({components?.length || 0})
              </div>
              <div className="flex items-center gap-2 w-full overflow-x-auto px-1 scrollbar-hide min-h-[44px]">
                <AnimatePresence>
                  {components?.map((comp, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex-shrink-0 px-2 py-1 rounded bg-purple-100 border border-purple-300 flex items-center gap-1"
                    >
                      <span className="text-xs font-bold text-purple-700 mr-1">C{index + 1}:</span>
                      {comp.map((nodeId) => (
                        <motion.div
                          key={nodeId}
                          layoutId={`scc-token-${nodeId}`}
                          className="text-xs font-medium text-purple-900 px-1.5 py-0.5 rounded bg-white/80 border border-purple-200"
                        >
                          {nodeLabelMap[nodeId] || nodeId}
                        </motion.div>
                      ))}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {(!components || components.length === 0) && <div className="text-gray-400 text-sm italic w-full text-center mt-2">No components found</div>}
              </div>
            </div>
          )}

          {sectionId === 'ap' && (
            <APStateTable internalState={internalState} nodeLabelMap={nodeLabelMap} />
          )}

          {sectionId === 'floyd' && (
            <FloydWarshallState internalState={internalState} nodeLabelMap={nodeLabelMap} nodes={nodes} />
          )}

          {sectionId === 'routing' && (
            <RoutingAlgorithmState
              routingTable={routingTable}
              activeTableNodeId={activeTableNodeId}
              nodeLabelMap={nodeLabelMap}
              selectedAlgorithm={selectedAlgorithm}
              internalState={internalState}
            />
          )}
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
};

export default DataStructureSections;
