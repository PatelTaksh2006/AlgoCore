import React, { useMemo } from 'react';
import useGraphStore from '../store/useGraphStore';
import { motion, AnimatePresence } from 'framer-motion';

import { useGraph } from '../context/GraphContext';
import { useAlgorithm } from '../context/AlgorithmContext';

const APSPResult = () => {
    const { internalState } = useGraphStore();
    const { nodes } = useGraph();
    const { startNodeId } = useAlgorithm();

    // internalState for FW contains: matrix, next, activeNodes
    const matrix = internalState?.matrix;
    const nextNode = internalState?.next;

    // Helper to extract a distinct shortest path tree from source 'u'
    const shortestPathTrees = useMemo(() => {
        if (!matrix || !nextNode) return [];

        const trees = [];
        const nodeMap = {};
        nodes.forEach(n => { nodeMap[n.id] = n; });

        const orderedNodes = startNodeId
            ? [
                ...nodes.filter(node => node.id === startNodeId),
                ...nodes.filter(node => node.id !== startNodeId),
            ]
            : nodes;

        for (const u of orderedNodes) {
            const treeEdges = [];
            const treeNodes = new Set([u.id]);

            const matrixRow = matrix[u.id];
            if (!matrixRow) {
                trees.push({
                    sourceId: u.id,
                    sourceLabel: u.label,
                    nodes: Array.from(treeNodes),
                    edges: [],
                    depths: { [u.id]: 0 },
                    maxDepth: 0
                });
                continue;
            }

            // Reconstruct paths from u to all other reachable nodes v
            for (const v of nodes) {
                if (u.id === v.id) continue;

                if (matrixRow[v.id] !== undefined && matrixRow[v.id] !== Infinity) {
                    let curr = u.id;
                    while (curr !== v.id && curr !== null) {
                        if (!nextNode[curr] || !nextNode[curr][v.id]) break;
                        const nxt = nextNode[curr][v.id];
                        if (nxt === null) break;

                        // We add this edge to our visualization tree for source `u`
                        treeEdges.push({ source: curr, target: nxt });
                        treeNodes.add(nxt);

                        curr = nxt;
                    }
                }
            }

            // Deduplicate edges just in case
            const uniqueEdges = [];
            const edgeSet = new Set();
            for (const e of treeEdges) {
                const key = `${e.source}->${e.target}`;
                if (!edgeSet.has(key)) {
                    edgeSet.add(key);
                    uniqueEdges.push(e);
                }
            }

            // Simple horizontal tree layout simulation for this sub-graph
            // Group nodes by depth from source `u`
            const depths = { [u.id]: 0 };
            const q = [u.id];
            let maxD = 0;

            // basic BFS over the tree to assign depths
            while (q.length > 0) {
                const curr = q.shift();
                const children = uniqueEdges.filter(e => e.source === curr).map(e => e.target);
                for (const child of children) {
                    if (depths[child] === undefined) {
                        depths[child] = depths[curr] + 1;
                        maxD = Math.max(maxD, depths[child]);
                        q.push(child);
                    }
                }
            }

            trees.push({
                sourceId: u.id,
                sourceLabel: u.label,
                nodes: Array.from(treeNodes),
                edges: uniqueEdges,
                depths,
                maxDepth: maxD
            });
        }

        return trees;
    }, [matrix, nextNode, nodes, startNodeId]);


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
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Shortest Path Trees
                </h3>
                <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-600 rounded-md">
                    {nodes.length} Roots
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <AnimatePresence>
                    {shortestPathTrees.map((tree, i) => (
                        <motion.div
                            key={`tree-${tree.sourceId}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col"
                        >
                            <div className="bg-gradient-to-r from-blue-50 to-white p-3 border-b border-gray-100 shrink-0">
                                <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                                    Source: <span className="bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs shadow-sm">{tree.sourceLabel}</span>
                                </h4>
                            </div>

                            <div className="p-4 overflow-x-auto relative flex items-center min-h-[120px]">
                                {tree.nodes.length === 1 && (
                                    <span className="text-xs text-gray-400 italic">No reachable destinations</span>
                                )}

                                {tree.nodes.length > 1 && (
                                    <>
                                        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: (tree.maxDepth + 1) * 80 + 40 }}>
                                            <defs>
                                                <marker id={`arrow-${tree.sourceId}`} markerWidth="8" markerHeight="6" refX="16" refY="3" orient="auto">
                                                    <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" opacity="0.6" />
                                                </marker>
                                            </defs>

                                            {tree.edges.map((e, idx) => {
                                                const sDepth = tree.depths[e.source];
                                                const tDepth = tree.depths[e.target];

                                                const sGroup = tree.nodes.filter(n => tree.depths[n] === sDepth);
                                                const tGroup = tree.nodes.filter(n => tree.depths[n] === tDepth);

                                                const sIndex = sGroup.indexOf(e.source);
                                                const tIndex = tGroup.indexOf(e.target);

                                                const startX = 40 + sDepth * 80;
                                                const startY = 60 + (sIndex - (sGroup.length - 1) / 2) * 40;

                                                const endX = 40 + tDepth * 80;
                                                const endY = 60 + (tIndex - (tGroup.length - 1) / 2) * 40;

                                                return (
                                                    <motion.line
                                                        key={`${e.source}-${e.target}-${idx}`}
                                                        initial={{ pathLength: 0 }}
                                                        animate={{ pathLength: 1 }}
                                                        x1={startX}
                                                        y1={startY}
                                                        x2={endX}
                                                        y2={endY}
                                                        stroke="#3b82f6"
                                                        strokeWidth="2"
                                                        opacity="0.4"
                                                        markerEnd={`url(#arrow-${tree.sourceId})`}
                                                    />
                                                );
                                            })}
                                        </svg>

                                        {tree.nodes.map(nId => {
                                            const depth = tree.depths[nId];
                                            const group = tree.nodes.filter(n => tree.depths[n] === depth);
                                            const idx = group.indexOf(nId);

                                            const x = 40 + depth * 80;
                                            const y = 60 + (idx - (group.length - 1) / 2) * 40;
                                            const isSource = nId === tree.sourceId;

                                            const label = nodes.find(n => n.id === nId)?.label;

                                            return (
                                                <div
                                                    key={nId}
                                                    className={`absolute w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shadow-sm z-10 transition-colors
                                                        ${isSource ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-700 border-blue-300'}
                                                    `}
                                                    style={{ left: x - 16, top: y - 16 }}
                                                    title={`Node ${label}`}
                                                >
                                                    {label}
                                                </div>
                                            );
                                        })}
                                    </>
                                )}

                                <div style={{ minWidth: (tree.maxDepth + 1) * 80 + 40, height: '1px' }} />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default APSPResult;
