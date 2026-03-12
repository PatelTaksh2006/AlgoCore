import React, { useMemo, useState } from 'react';
import { useGraph } from '../context/GraphContext';
import useGraphStore from '../store/useGraphStore';
import { calculateTreeLayout } from '../utils/treeLayout';
import { calculateSCCLayout } from '../utils/sccLayout';
import { useAlgorithm } from '../context/AlgorithmContext';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const ResultTree = () => {
    const { nodes, edges } = useGraph();
    const { backEdges } = useGraphStore();
    const { selectedAlgorithm, components } = useAlgorithm();

    const [manualPositions, setManualPositions] = useState({});

    const handleDrag = (id, deltaX, deltaY, pos) => {
        setManualPositions(prev => {
            const current = prev[id] || pos;
            return {
                ...prev,
                [id]: {
                    x: current.x + deltaX,
                    y: current.y + deltaY
                }
            };
        });
    };

    // Filter nodes and edges involved in the tree
    const treeEdges = edges.filter(e => e.classification === 'tree' || e.classification === 'solution');

    const solutionNodeIds = useMemo(() => {
        const set = new Set();
        treeEdges.forEach(e => {
            if (e.classification === 'solution') {
                set.add(e.source);
                set.add(e.target);
            }
        });
        return set;
    }, [treeEdges]);

    const { positions, labels } = useMemo(() => {
        if (selectedAlgorithm === 'scc') {
            return calculateSCCLayout(components, nodes);
        }
        return { positions: calculateTreeLayout(nodes, edges), labels: [] };
    }, [nodes, edges, selectedAlgorithm, components]);

    // For SCC, show full graph edges and mark whether each edge is inside an SCC or between SCCs.
    const sccEdges = useMemo(() => {
        if (selectedAlgorithm !== 'scc' || !components) return [];

        const nodeToComponentMap = {};
        components.forEach((comp, index) => {
            comp.forEach(nodeId => {
                nodeToComponentMap[nodeId] = index;
            });
        });

        return edges
            .filter(e => nodeToComponentMap[e.source] !== undefined && nodeToComponentMap[e.target] !== undefined)
            .map(e => {
                const srcIdx = nodeToComponentMap[e.source];
                const tgtIdx = nodeToComponentMap[e.target];
                return {
                    ...e,
                    sccRelation: srcIdx === tgtIdx ? 'intra' : 'inter'
                };
            });
    }, [edges, selectedAlgorithm, components]);

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
                    <marker id="solution-arrow" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
                    </marker>
                    <marker id="scc-intra-arrow" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#7c3aed" />
                    </marker>
                    <marker id="scc-inter-arrow" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
                    </marker>
                </defs>
                {edgesToRender.map(edge => {
                    const sourcePos = manualPositions[edge.source] || positions[edge.source];
                    const targetPos = manualPositions[edge.target] || positions[edge.target];
                    if (!sourcePos || !targetPos) return null;

                    let strokeColor = "#2563eb";
                    let markerEnd = "url(#tree-arrow)";
                    let strokeDasharray = undefined;
                    let strokeWidth = 2;
                    if (selectedAlgorithm === 'scc') {
                        if (edge.sccRelation === 'intra') {
                            strokeColor = '#7c3aed';
                            markerEnd = 'url(#scc-intra-arrow)';
                            strokeWidth = 3;
                        } else {
                            strokeColor = '#9ca3af';
                            markerEnd = 'url(#scc-inter-arrow)';
                            strokeDasharray = '5,4';
                            strokeWidth = 2;
                        }
                    } else if (edge.classification === 'solution') {
                        strokeColor = '#22c55e';
                        markerEnd = "url(#solution-arrow)";
                    }

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
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={strokeDasharray}
                            markerEnd={markerEnd}
                        />
                    );
                })}
                {/* Back Edges - Only show if not SCC (or maybe show them differently?) */}
                {selectedAlgorithm !== 'scc' && backEdges.map((edge, i) => {
                    const sourcePos = manualPositions[edge.source] || positions[edge.source];
                    const targetPos = manualPositions[edge.target] || positions[edge.target];
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
                    const basePos = positions[node.id];
                    const pos = manualPositions[node.id] || basePos;
                    if (!basePos) return null;

                    let borderColor = 'border-blue-500';
                    if (selectedAlgorithm === 'scc') borderColor = 'border-purple-500';
                    else if (solutionNodeIds.has(node.id)) borderColor = 'border-green-500';

                    return (
                        <motion.div
                            key={node.id}
                            drag
                            dragMomentum={false}
                            onDrag={(e, info) => handleDrag(node.id, info.delta.x, info.delta.y, basePos)}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1, x: pos.x, y: pos.y }}
                            transition={{ duration: 0.1 }} // Smooth entry but fast enough for drag
                            className={`absolute w-10 h-10 rounded-full bg-white border-2 flex items-center justify-center shadow-sm z-10 cursor-grab active:cursor-grabbing ${borderColor}`}
                            style={{ marginLeft: -20, marginTop: -20 }}
                        >
                            <span className="text-xs font-bold text-gray-700 pointer-events-none">{node.label}</span>
                        </motion.div>
                    );
                })
            }
        </div >
    );
};

export default ResultTree;
