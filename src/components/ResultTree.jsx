import React, { useMemo } from 'react';
import { useGraph } from '../context/GraphContext';
import useGraphStore from '../store/useGraphStore';
import { calculateTreeLayout } from '../utils/treeLayout';
import { calculateSCCLayout } from '../utils/sccLayout'; // New import
import { useAlgorithm } from '../context/AlgorithmContext'; // New import
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const ResultTree = () => {
    const { nodes, edges } = useGraph();
    const { backEdges } = useGraphStore();
    const { selectedAlgorithm, components } = useAlgorithm(); // Get component data

    // Filter nodes and edges involved in the tree
    const treeEdges = edges.filter(e => e.classification === 'tree');

    const { positions, labels } = useMemo(() => {
        if (selectedAlgorithm === 'scc') {
            return calculateSCCLayout(components, nodes);
        }
        return { positions: calculateTreeLayout(nodes, edges), labels: [] };
    }, [nodes, edges, selectedAlgorithm, components]);

    // For SCC, we want to show edges within components
    const sccEdges = useMemo(() => {
        if (selectedAlgorithm !== 'scc' || !components) return [];

        const edgesToShow = [];
        edges.forEach(e => {
            if (positions[e.source] && positions[e.target]) {
                edgesToShow.push(e);
            }
        });
        return edgesToShow;
    }, [edges, positions, selectedAlgorithm, components]);

    const visibleNodes = nodes.filter(n => positions[n.id]);
    const hasTree = Object.keys(positions).length > 0;

    // Determine edges to render: Tree edges OR SCC edges
    const edgesToRender = selectedAlgorithm === 'scc' ? sccEdges : treeEdges;

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
                {edgesToRender.map(edge => {
                    const sourcePos = positions[edge.source];
                    const targetPos = positions[edge.target];
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
                            stroke={selectedAlgorithm === 'scc' ? '#8b5cf6' : "#2563eb"} // Purple for SCC, Blue for Tree
                            strokeWidth="2"
                            markerEnd="url(#tree-arrow)"
                        />
                    );
                })}
                {/* Back Edges - Only show if not SCC (or maybe show them differently?) */}
                {selectedAlgorithm !== 'scc' && backEdges.map((edge, i) => {
                    const sourcePos = positions[edge.source];
                    const targetPos = positions[edge.target];
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

            {labels?.map(label => (
                <div
                    key={label.id}
                    className="absolute text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200 z-0"
                    style={{
                        left: label.x,
                        top: label.y,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    {label.text}
                </div>
            ))}

            {
                visibleNodes.map(node => {
                    const pos = positions[node.id];
                    if (!pos) return null;

                    return (
                        <motion.div
                            key={node.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1, x: pos.x, y: pos.y }}
                            transition={{ duration: 0.4 }} // Smooth entry
                            className={`absolute w-10 h-10 rounded-full bg-white border-2 flex items-center justify-center shadow-sm z-10 ${selectedAlgorithm === 'scc' ? 'border-purple-500' : 'border-blue-500'}`}
                            style={{ marginLeft: -20, marginTop: -20 }}
                        >
                            <span className="text-xs font-bold text-gray-700">{node.label}</span>
                        </motion.div>
                    );
                })
            }
        </div >
    );
};

export default ResultTree;
