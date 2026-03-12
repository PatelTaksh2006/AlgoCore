import React, { useMemo } from 'react';
import useGraphStore from '../store/useGraphStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlgorithm } from '../context/AlgorithmContext';
import { useGraph } from '../context/GraphContext';

// Helper sub-component for AP algorithm state
const APStateTable = ({ internalState, nodeLabelMap }) => {
    if (!internalState?.discovery) return null;

    const discovery = internalState.discovery || {};
    const lowLink = internalState.lowLink || {};
    const apList = internalState.ap || [];

    const nodeIds = Object.keys(discovery).filter(id => discovery[id] !== -1);

    if (nodeIds.length === 0) return null;

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
                    {nodeIds.map(nodeId => {
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
                    Articulation Points Found: {apList.map(id => nodeLabelMap[id] || id).join(', ')}
                </div>
            )}
        </div>
    );
};

// Floyd-Warshall Matrix Visualization
const FloydWarshallState = ({ internalState, nodeLabelMap, nodes }) => {
    if (!internalState?.matrix) return null;

    const matrix = internalState.matrix;
    const activeNodes = internalState.activeNodes || {};
    const nodeIds = nodes.map(n => n.id);

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
                            {nodeIds.map(id => (
                                <th 
                                    key={id} 
                                    className={`border border-purple-200 px-1 py-0.5 ${
                                        activeNodes.j === id ? 'bg-yellow-200' : 'bg-purple-50'
                                    }`}
                                >
                                    {nodeLabelMap[id]}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {nodeIds.map(i => (
                            <tr key={i}>
                                <td className={`border border-purple-200 px-1 py-0.5 font-bold ${
                                    activeNodes.i === i ? 'bg-yellow-200' : 'bg-purple-50'
                                }`}>
                                    {nodeLabelMap[i]}
                                </td>
                                {nodeIds.map(j => {
                                    const val = matrix[i]?.[j];
                                    const isActive = activeNodes.i === i && activeNodes.j === j;
                                    const isViaK = activeNodes.k && (i === activeNodes.k || j === activeNodes.k);
                                    return (
                                        <td 
                                            key={j}
                                            className={`border border-purple-200 px-1 py-0.5 text-center font-mono ${
                                                isActive ? 'bg-green-200 font-bold' : 
                                                isViaK ? 'bg-yellow-100' : ''
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

// Distance Vector / Link State State
const RoutingAlgorithmState = ({ lsdb, routingTable, activeTableNodeId, nodeLabelMap, selectedAlgorithm }) => {
    const isLinkState = selectedAlgorithm === 'linkState';
    
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
            
            {/* LSDB for Link State */}
            {isLinkState && lsdb && lsdb.length > 0 && (
                <div className="mb-2">
                    <div className="text-[10px] font-semibold text-gray-500 mb-1">LSDB Entries: {lsdb.length}</div>
                    <div className="flex flex-wrap gap-1">
                        {lsdb.map((lsa, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-[9px] px-1.5 py-0.5 bg-blue-100 border border-blue-300 rounded"
                            >
                                <span className="font-bold">{nodeLabelMap[lsa.sourceId]}</span>
                                {' → '}
                                {lsa.links.map(l => nodeLabelMap[l.to]).join(', ')}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Routing Table Summary */}
            {routingTable && Object.keys(routingTable).length > 0 && (
                <div className="text-[10px] text-gray-500">
                    Tables Updated: {Object.keys(routingTable).length} nodes
                </div>
            )}
        </div>
    );
};

const DataStructurePanel = ({ constraintsRef }) => {
    const { activeDS, internalState, lsdb, routingTable, activeTableNodeId } = useGraphStore();
    const { selectedAlgorithm, visited, parent, components } = useAlgorithm();
    const { nodes } = useGraph();

    // Determine type for label
    const getTypeLabel = () => {
        if (selectedAlgorithm === 'dfs') return 'Stack';
        if (selectedAlgorithm === 'bfs') return 'Queue';
        if (selectedAlgorithm === 'dijkstra' || selectedAlgorithm === 'prim') return 'Priority Queue';
        if (selectedAlgorithm === 'linkState') return 'Priority Queue (SPF)';
        return 'Data Structure';
    };

    // Check if this is a routing algorithm
    const isRoutingAlgorithm = ['distanceVector', 'linkState'].includes(selectedAlgorithm);
    const isFloydWarshall = selectedAlgorithm === 'floydWarshall';

    // Memoize node lookup
    const nodeLabelMap = useMemo(() => {
        const map = {};
        nodes.forEach(n => map[n.id] = n.label);
        return map;
    }, [nodes]);

    // Determine panel width based on algorithm
    const panelWidth = isFloydWarshall ? 'w-[700px]' : 'w-[600px]';

    return (
        <motion.div
            drag
            dragConstraints={constraintsRef}
            dragMomentum={false}
            initial={{ x: "-50%", y: 0 }}
            style={{ left: "50%", bottom: "1rem" }}
            className={`absolute bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 p-4 ${panelWidth} flex flex-col gap-4 z-20 cursor-move max-h-[60vh] overflow-y-auto`}
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

            {/* AP Algorithm State (Discovery / Low-Link) */}
            {selectedAlgorithm === 'articulationPoints' && (
                <APStateTable internalState={internalState} nodeLabelMap={nodeLabelMap} />
            )}

            {/* Floyd-Warshall Matrix */}
            {isFloydWarshall && (
                <FloydWarshallState internalState={internalState} nodeLabelMap={nodeLabelMap} nodes={nodes} />
            )}

            {/* Distance Vector / Link State Routing */}
            {isRoutingAlgorithm && (
                <RoutingAlgorithmState 
                    lsdb={lsdb} 
                    routingTable={routingTable} 
                    activeTableNodeId={activeTableNodeId}
                    nodeLabelMap={nodeLabelMap}
                    selectedAlgorithm={selectedAlgorithm}
                />
            )}
        </motion.div>
    );
};

export default DataStructurePanel;
