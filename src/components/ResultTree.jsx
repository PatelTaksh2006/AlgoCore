import React, { useMemo } from 'react';
import { useGraph } from '../context/GraphContext';
import useGraphStore from '../store/useGraphStore';
import { calculateTreeLayout } from '../utils/treeLayout';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const ResultTree = () => {
    const { nodes, edges } = useGraph();
    const { backEdges } = useGraphStore();

    // Filter nodes and edges involved in the tree
    const treeEdges = edges.filter(e => e.classification === 'tree');

    // Debug log
    if (treeEdges.length > 0 || edges.length > 0) {
        console.log('ResultTree Render:', {
            totalEdges: edges.length,
            treeEdges: treeEdges.length,
            edgeClassifications: edges.map(e => e.classification)
        });
    }

    // Nodes involved are those in treeEdges (source or target) plus potentially the root
    // To be safe, we just consider all nodes but map them to tree positions.
    // If a node is not in the tree, we might skip rendering or render it unconnected?
    // Prompt says: "As a 'Tree Edge' is confirmed... node must appear".
    // So filter nodes.

    const relevantNodeIds = new Set();
    treeEdges.forEach(e => {
        relevantNodeIds.add(e.source);
        relevantNodeIds.add(e.target);
    });
    // Add start node if we have one? 
    // Usually the first node involved in a tree edge is the start.
    // If no edges, empty tree.

    const treePositions = useMemo(() => calculateTreeLayout(nodes, edges), [nodes, edges]);

    const visibleNodes = nodes.filter(n => relevantNodeIds.has(n.id) || (treeEdges.length > 0 && n.id === edges.find(e => e.classification === 'tree')?.source));
    // The filtering logic in `calculateTreeLayout` handles root finding better. 
    // Let's just render nodes that have a position in `treePositions`.

    const hasTree = Object.keys(treePositions).length > 0;

    return (
        <div className="w-full h-full relative bg-gray-50 border-l border-gray-200 overflow-hidden">
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm z-10">
                RESULT TREE
            </div>

            {!hasTree && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                    No tree generated yet.
                </div>
            )}

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <marker id="tree-arrow" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb" />
                    </marker>
                    <marker id="back-arrow" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                    </marker>
                </defs>
                {treeEdges.map(edge => {
                    const sourcePos = treePositions[edge.source];
                    const targetPos = treePositions[edge.target];
                    if (!sourcePos || !targetPos) return null;

                    return (
                        <motion.line
                            key={edge.id}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            x1={sourcePos.x}
                            y1={sourcePos.y}
                            x2={targetPos.x}
                            y2={targetPos.y}
                            stroke="#2563eb"
                            strokeWidth="2"
                            markerEnd="url(#tree-arrow)"
                        />
                    );
                })}
                {backEdges.map((edge, i) => {
                    const sourcePos = treePositions[edge.source];
                    const targetPos = treePositions[edge.target];
                    if (!sourcePos || !targetPos) return null;

                    // Curved path for back edges to distinguish them
                    const midX = (sourcePos.x + targetPos.x) / 2;
                    const midY = (sourcePos.y + targetPos.y) / 2;
                    // Offset control point to curve it
                    const controlX = midX + 40;
                    const controlY = midY - 40;

                    return (
                        <motion.path
                            key={`back-${edge.id}-${i}`}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            d={`M ${sourcePos.x} ${sourcePos.y} Q ${controlX} ${controlY} ${targetPos.x} ${targetPos.y}`}
                            stroke="#ef4444"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                            fill="none"
                            markerEnd="url(#back-arrow)"
                        />
                    );
                })}
            </svg>

            {visibleNodes.map(node => {
                const pos = treePositions[node.id];
                if (!pos) return null;

                return (
                    <motion.div
                        key={node.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1, x: pos.x, y: pos.y }}
                        transition={{ duration: 0.4 }} // Smooth entry
                        className="absolute w-10 h-10 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center shadow-sm z-10"
                        style={{ marginLeft: -20, marginTop: -20 }}
                    >
                        <span className="text-xs font-bold text-gray-700">{node.label}</span>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default ResultTree;
