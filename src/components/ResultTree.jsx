import React, { useMemo, useState } from 'react';
import { useGraph } from '../context/GraphContext';
import useGraphStore from '../store/useGraphStore';
import { calculateTreeLayout } from '../utils/treeLayout';
import { calculateSCCLayout } from '../utils/sccLayout';
import { useAlgorithm } from '../context/AlgorithmContext';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const getTreeLegendConfig = (selectedAlgorithm) => {
    switch (selectedAlgorithm) {
        case 'dfs':
            return [
                { label: 'Traversal tree edge', color: '#2563eb' },
                { label: 'Back edge', color: '#ef4444', dashed: true },
                { label: 'Forward edge', color: '#16a34a', dashed: true },
                { label: 'Cross edge', color: '#111827', dashed: true },
            ];
        case 'bfs':
            return [
                { label: 'BFS tree edge', color: '#2563eb' },
                { label: 'Back edge to an ancestor', color: '#ef4444', dashed: true },
                { label: 'Cross edge', color: '#111827', dashed: true },
            ];
        case 'dijkstra':
            return [
                { label: 'Explored shortest-path tree edge', color: '#2563eb' },
                { label: 'Final shortest path to target', color: '#22c55e' },
                { label: 'Back relation if present', color: '#ef4444', dashed: true },
            ];
        case 'prim':
            return [
                { label: 'Edge chosen for MST', color: '#2563eb' },
            ];
        case 'kruskal':
            return [
                { label: 'Edge added to MST', color: '#2563eb' },
                { label: 'Rejected cycle edge', color: '#b91c1c', dashed: true },
            ];
        default:
            return [];
    }
};

const TreeEdgeLegend = ({ selectedAlgorithm }) => {
    const items = getTreeLegendConfig(selectedAlgorithm);

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="pointer-events-none absolute bottom-4 right-4 z-20 w-72 max-w-[calc(100%-2rem)] rounded-xl border border-gray-200 bg-white/92 px-4 py-3 shadow-lg backdrop-blur-md">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                Edge Legend
            </div>
            <div className="space-y-2">
                {items.map((item) => (
                    <div key={item.label} className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="block w-10 shrink-0">
                            <span
                                className="block w-full rounded-full"
                                style={{
                                    backgroundColor: item.dashed ? 'transparent' : item.color,
                                    borderTop: item.dashed ? `2px dashed ${item.color}` : undefined,
                                    height: item.dashed ? 0 : 2,
                                }}
                            />
                        </span>
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ResultTree = () => {
    const { nodes, edges, isDirected } = useGraph();
    const { backEdges } = useGraphStore();
    const { selectedAlgorithm, components, startNodeId } = useAlgorithm();

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

    const classifiedTreeEdges = useMemo(() => (
        edges.filter(e => ['tree', 'solution', 'back', 'forward', 'cross', 'cycle'].includes(e.classification))
    ), [edges]);

    const solutionNodeIds = useMemo(() => {
        const set = new Set();
        classifiedTreeEdges.forEach(e => {
            if (e.classification === 'solution') {
                set.add(e.source);
                set.add(e.target);
            }
        });
        return set;
    }, [classifiedTreeEdges]);

    const { positions, labels } = useMemo(() => {
        if (selectedAlgorithm === 'scc') {
            return calculateSCCLayout(components, nodes);
        }
        const layoutRoot = selectedAlgorithm === 'kruskal' ? undefined : (startNodeId || undefined);
        return { positions: calculateTreeLayout(nodes, edges, layoutRoot), labels: [] };
    }, [nodes, edges, selectedAlgorithm, components, startNodeId]);

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
    const showDirectedArrows = selectedAlgorithm === 'scc' ? true : isDirected;

    const edgesToRender = selectedAlgorithm === 'scc' ? sccEdges : classifiedTreeEdges;

    return (
        <div className="w-full h-full relative bg-gray-50 border-l border-gray-200 overflow-hidden">
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm z-10">
                RESULT TREE
            </div>

            <TreeEdgeLegend selectedAlgorithm={selectedAlgorithm} />

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
                    <marker id="forward-arrow" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#16a34a" />
                    </marker>
                    <marker id="cross-arrow" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#111827" />
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
                    let markerEnd = showDirectedArrows ? "url(#tree-arrow)" : undefined;
                    let strokeDasharray = undefined;
                    let strokeWidth = 2;
                    if (selectedAlgorithm === 'scc') {
                        if (edge.sccRelation === 'intra') {
                            strokeColor = '#7c3aed';
                            markerEnd = showDirectedArrows ? 'url(#scc-intra-arrow)' : undefined;
                            strokeWidth = 3;
                        } else {
                            strokeColor = '#9ca3af';
                            markerEnd = showDirectedArrows ? 'url(#scc-inter-arrow)' : undefined;
                            strokeDasharray = '5,4';
                            strokeWidth = 2;
                        }
                    } else if (edge.classification === 'solution') {
                        strokeColor = '#22c55e';
                        markerEnd = showDirectedArrows ? 'url(#solution-arrow)' : undefined;
                        strokeWidth = 3;
                    } else if (edge.classification === 'back') {
                        strokeColor = '#ef4444';
                        markerEnd = showDirectedArrows ? 'url(#back-arrow)' : undefined;
                        strokeDasharray = '5,5';
                    } else if (edge.classification === 'forward') {
                        strokeColor = '#16a34a';
                        markerEnd = showDirectedArrows ? 'url(#forward-arrow)' : undefined;
                        strokeDasharray = '4,2';
                    } else if (edge.classification === 'cross') {
                        strokeColor = '#111827';
                        markerEnd = showDirectedArrows ? 'url(#cross-arrow)' : undefined;
                        strokeDasharray = '2,2';
                    } else if (edge.classification === 'cycle') {
                        strokeColor = '#b91c1c';
                        markerEnd = showDirectedArrows ? 'url(#back-arrow)' : undefined;
                        strokeDasharray = '6,4';
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
                {/* DFS-specific back edges are stored separately and shown as curved arcs. */}
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
                            markerEnd={showDirectedArrows ? 'url(#back-arrow)' : undefined}
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
