import React, { useMemo } from 'react';
import useGraphStore from '../store/useGraphStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlgorithm } from '../context/AlgorithmContext';
import { useGraph } from '../context/GraphContext';

const DataStructurePanel = ({ constraintsRef }) => {
    const { activeDS } = useGraphStore();
    const { selectedAlgorithm, visited, parent, components } = useAlgorithm(); // Added components
    const { nodes } = useGraph();

    // Determine type for label
    const getTypeLabel = () => {
        if (selectedAlgorithm === 'dfs') return 'Stack';
        if (selectedAlgorithm === 'bfs') return 'Queue';
        if (selectedAlgorithm === 'dijkstra' || selectedAlgorithm === 'prim') return 'Priority Queue';
        return 'Data Structure';
    };

    // Memoize node lookup
    const nodeLabelMap = useMemo(() => {
        const map = {};
        nodes.forEach(n => map[n.id] = n.label);
        return map;
    }, [nodes]);

    return (
        <motion.div
            drag
            dragConstraints={constraintsRef}
            dragMomentum={false}
            initial={{ x: "-50%", y: 0 }}
            style={{ left: "50%", bottom: "1rem" }}
            className="absolute bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 p-4 w-[600px] flex flex-col gap-4 z-20 cursor-move"
        >

            {/* Primary Data Structure (Stack/Queue) */}
            <div className="relative h-16 w-full">
                <div className="absolute -top-1 left-0 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {getTypeLabel()} {activeDS.length > 0 && `(${activeDS.length})`}
                </div>
                <div className="flex items-center gap-2 w-full mt-4 overflow-x-auto px-2 scrollbar-hide h-full">
                    <AnimatePresence mode='popLayout'>
                        {activeDS.map((item, index) => {
                            const id = typeof item === 'object' ? item.id : item;
                            const priority = typeof item === 'object' ? (item.d ?? item.k ?? '') : '';
                            const label = nodeLabelMap[id] || id.toString().replace('node-', '');

                            return (
                                <motion.div
                                    key={`${id}-${index}`}
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

            {/* Parent Array */}
            <div className="relative h-16 w-full border-t border-gray-100 pt-2">
                <div className="absolute top-1 left-0 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Parent Array
                </div>
                <div className="flex items-center gap-2 w-full mt-5 overflow-x-auto px-2 scrollbar-hide">
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

            {/* Visited Array */}
            <div className="relative h-12 w-full border-t border-gray-100 pt-2">
                <div className="absolute top-1 left-0 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Visited Order
                </div>
                <div className="flex items-center gap-1 w-full mt-4 overflow-x-auto px-2 scrollbar-hide">
                    {visited.map((nodeId, i) => {
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

            {/* Components Array (for SCC) */}
            {selectedAlgorithm === 'scc' && (
                <div className="relative h-16 w-full border-t border-gray-100 pt-2">
                    <div className="absolute top-1 left-0 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Components ({components?.length || 0})
                    </div>
                    <div className="flex items-center gap-2 w-full mt-5 overflow-x-auto px-2 scrollbar-hide">
                        <AnimatePresence>
                            {components?.map((comp, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex-shrink-0 px-2 py-1 rounded bg-purple-100 border border-purple-300 flex items-center gap-1"
                                >
                                    <span className="text-xs font-bold text-purple-700 mr-1">C{index + 1}:</span>
                                    {comp.map(nodeId => (
                                        <span key={nodeId} className="text-xs font-medium text-purple-900">
                                            {nodeLabelMap[nodeId] || nodeId}
                                        </span>
                                    ))}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {(!components || components.length === 0) && <div className="text-gray-400 text-sm italic w-full text-center mt-2">No components found</div>}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default DataStructurePanel;
