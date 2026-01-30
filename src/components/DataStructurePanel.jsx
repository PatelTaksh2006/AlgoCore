import React, { useMemo } from 'react';
import useGraphStore from '../store/useGraphStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlgorithm } from '../context/AlgorithmContext';
import { useGraph } from '../context/GraphContext';

const DataStructurePanel = () => {
    const { activeDS } = useGraphStore();
    const { selectedAlgorithm } = useAlgorithm();
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
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 p-4 w-[600px] h-24 overflow-hidden flex items-center z-20">
            <div className="absolute top-2 left-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                {getTypeLabel()} {activeDS.length > 0 && `(${activeDS.length})`}
            </div>

            <div className="flex items-center gap-2 w-full mt-4 overflow-x-auto px-2 scrollbar-hide">
                <AnimatePresence mode='popLayout'>
                    {activeDS.map((item, index) => {
                        // Handle different item structures (simple ID or object)
                        const id = typeof item === 'object' ? item.id : item;
                        // For PQ, maybe show priority?
                        const priority = typeof item === 'object' ? (item.d ?? item.k ?? '') : '';

                        // Lookup label
                        const label = nodeLabelMap[id] || id.toString().replace('node-', '');

                        return (
                            <motion.div
                                key={`${id}-${index}`}
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5, y: -20 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
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

                {activeDS.length === 0 && (
                    <div className="text-gray-400 text-sm italic w-full text-center">
                        Empty
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataStructurePanel;
