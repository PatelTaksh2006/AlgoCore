import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGraph } from '../context/GraphContext';
import useGraphStore from '../store/useGraphStore';
import { calculateTreeLayout } from '../utils/treeLayout';
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
        case 'distanceVector':
            return [
                { label: 'Final forwarding tree edge', color: '#22c55e' },
                { label: 'Single-source final cost labels', color: '#8b5cf6' },
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
        case 'scc':
            return [
                { label: 'DFS1 tree edge (original graph)', color: '#2563eb' },
                { label: 'Transposed edge view (reversed)', color: '#f59e0b', dashed: true },
                { label: 'DFS2 tree edge on G^T', color: '#ea580c' },
                { label: 'Intra-component edge', color: '#7c3aed' },
            ];
        case 'articulationPoints':
            return [
                { label: 'DFS tree edge', color: '#2563eb' },
                { label: 'Back edge', color: '#ef4444', dashed: true },
                { label: 'Articulation point node', color: '#f97316' },
            ];
        default:
            return [];
    }
};

const formatSccPhase = (phase) => {
    if (phase === 'first-pass') return 'KOSARAJU: FIRST DFS (G)';
    if (phase === 'second-pass') return 'KOSARAJU: SECOND DFS (G^T)';
    if (phase === 'completed') return 'KOSARAJU: SCC COMPLETE';
    return 'KOSARAJU: READY';
};

const buildBoundaryGeometry = (nodeIds, positionMap) => {
    if (!nodeIds || nodeIds.length === 0) {
        return null;
    }

    const points = nodeIds
        .map((id) => positionMap[id])
        .filter(Boolean);

    if (points.length === 0) {
        return null;
    }

    const centerX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const centerY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    const maxDistance = points.reduce((max, point) => (
        Math.max(max, Math.hypot(point.x - centerX, point.y - centerY))
    ), 0);

    return {
        x: centerX,
        y: centerY,
        radius: Math.max(48, maxDistance + 34),
    };
};

const AP_COMPONENT_COLORS = ['#0ea5e9', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6'];

const computeComponentsWithoutNode = (nodes, edges, removedNodeId) => {
    const activeNodeIds = nodes
        .map((node) => node.id)
        .filter((id) => id !== removedNodeId);

    const adj = {};
    activeNodeIds.forEach((id) => {
        adj[id] = [];
    });

    edges.forEach((edge) => {
        if (edge.source === removedNodeId || edge.target === removedNodeId) {
            return;
        }
        if (!adj[edge.source] || !adj[edge.target]) {
            return;
        }
        // Treat edges as undirected for articulation point separation view.
        adj[edge.source].push(edge.target);
        adj[edge.target].push(edge.source);
    });

    const visited = new Set();
    const components = [];

    activeNodeIds.forEach((start) => {
        if (visited.has(start)) {
            return;
        }
        const queue = [start];
        visited.add(start);
        const component = [];

        while (queue.length > 0) {
            const u = queue.shift();
            component.push(u);
            (adj[u] || []).forEach((v) => {
                if (!visited.has(v)) {
                    visited.add(v);
                    queue.push(v);
                }
            });
        }

        const componentNodeSet = new Set(component);
        const componentEdges = edges.filter((edge) => {
            if (edge.source === removedNodeId || edge.target === removedNodeId) {
                return false;
            }
            return componentNodeSet.has(edge.source) && componentNodeSet.has(edge.target);
        });

        components.push({
            nodeIds: component,
            edges: componentEdges,
        });
    });

    return components;
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
    const { backEdges, resultData, internalState } = useGraphStore();
    const { selectedAlgorithm, startNodeId, components } = useAlgorithm();
    const panelRef = useRef(null);
    const lastPackedComponentCountRef = useRef(0);

    const sccResultData = selectedAlgorithm === 'scc' && resultData?.type === 'sccKosaraju'
        ? resultData
        : null;
    const dvFinalResult = selectedAlgorithm === 'distanceVector' && resultData?.type === 'distanceVectorFinal'
        ? resultData
        : null;
    const isArticulationMode = selectedAlgorithm === 'articulationPoints';

    const [manualPositions, setManualPositions] = useState({});
    const [panelSize, setPanelSize] = useState({ width: 900, height: 600 });
    const [apClusterOffsets, setApClusterOffsets] = useState({});

    useEffect(() => {
        if (!panelRef.current) {
            return undefined;
        }

        const syncSize = () => {
            if (!panelRef.current) {
                return;
            }
            setPanelSize({
                width: panelRef.current.clientWidth,
                height: panelRef.current.clientHeight,
            });
        };

        syncSize();
        const observer = new ResizeObserver(syncSize);
        observer.observe(panelRef.current);
        return () => observer.disconnect();
    }, []);

    const moveNodeGroup = (nodeIds, deltaX, deltaY) => {
        if (!nodeIds || nodeIds.length === 0) {
            return;
        }

        const uniqueNodeIds = Array.from(new Set(nodeIds));
        setManualPositions((prev) => {
            const next = { ...prev };
            uniqueNodeIds.forEach((nodeId) => {
                const fallback = positions[nodeId];
                const current = prev[nodeId] || fallback;
                if (!current) {
                    return;
                }
                next[nodeId] = {
                    x: current.x + deltaX,
                    y: current.y + deltaY,
                };
            });
            return next;
        });
    };

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

    const moveApCluster = (apId, clusterIndex, deltaX, deltaY) => {
        const key = `${String(apId)}-${clusterIndex}`;
        setApClusterOffsets((prev) => {
            const current = prev[key] || { x: 0, y: 0 };
            return {
                ...prev,
                [key]: {
                    x: current.x + deltaX,
                    y: current.y + deltaY,
                },
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
        if (selectedAlgorithm === 'scc' || selectedAlgorithm === 'articulationPoints') {
            const graphPositions = {};
            nodes.forEach((node) => {
                graphPositions[node.id] = { x: node.x, y: node.y };
            });
            return { positions: graphPositions, labels: [] };
        }
        const layoutRoot = selectedAlgorithm === 'kruskal' ? undefined : (startNodeId || undefined);
        return { positions: calculateTreeLayout(nodes, edges, layoutRoot), labels: [] };
    }, [nodes, edges, selectedAlgorithm, startNodeId]);

    const visibleNodes = nodes.filter(n => positions[n.id]);
    const hasTree = selectedAlgorithm === 'scc' || selectedAlgorithm === 'articulationPoints'
        ? nodes.length > 0
        : Object.keys(positions).length > 0;
    const showDirectedArrows = selectedAlgorithm === 'scc'
        ? true
        : (selectedAlgorithm === 'articulationPoints' ? false : isDirected);

    const edgesToRender = selectedAlgorithm === 'scc' || selectedAlgorithm === 'articulationPoints'
        ? edges
        : classifiedTreeEdges;
    const isSccReversedView = selectedAlgorithm === 'scc' && Boolean(sccResultData?.isReversed);
    const sccPhaseLabel = formatSccPhase(sccResultData?.phase);

    const nodeLabelMap = useMemo(() => {
        const map = {};
        nodes.forEach((node) => {
            map[node.id] = node.label;
        });
        return map;
    }, [nodes]);

    const liveArticulationPoints = useMemo(() => {
        if (!isArticulationMode) {
            return [];
        }
        return Array.isArray(internalState?.ap) ? internalState.ap : [];
    }, [internalState?.ap, isArticulationMode]);

    const articulationSeparationData = useMemo(() => {
        if (!isArticulationMode) {
            return [];
        }
        return liveArticulationPoints.map((apId) => ({
            apId,
            components: computeComponentsWithoutNode(nodes, edges, apId),
        }));
    }, [edges, isArticulationMode, liveArticulationPoints, nodes]);

    const effectivePositions = useMemo(() => {
        const map = {};
        visibleNodes.forEach((node) => {
            map[node.id] = manualPositions[node.id] || positions[node.id];
        });
        return map;
    }, [visibleNodes, manualPositions, positions]);

    const sccBoundaries = useMemo(() => {
        if (selectedAlgorithm !== 'scc') {
            return [];
        }

        const discoveredComponents = Array.isArray(components) ? components : [];
        const assigned = new Set();
        discoveredComponents.forEach((component) => {
            component.forEach((id) => assigned.add(id));
        });

        const boundaries = [];
        const unassignedNodeIds = nodes
            .map((node) => node.id)
            .filter((id) => !assigned.has(id));

        if (unassignedNodeIds.length > 0) {
            const globalGeometry = buildBoundaryGeometry(unassignedNodeIds, effectivePositions);
            if (globalGeometry) {
                boundaries.push({
                    id: 'scc-global',
                    label: 'Unassigned',
                    nodeIds: unassignedNodeIds,
                    geometry: globalGeometry,
                    strokeColor: '#9ca3af',
                    fillColor: 'rgba(156, 163, 175, 0.05)',
                });
            }
        }

        discoveredComponents.forEach((component, index) => {
            const geometry = buildBoundaryGeometry(component, effectivePositions);
            if (!geometry) {
                return;
            }

            boundaries.push({
                id: `scc-component-${index}`,
                label: `SCC ${index + 1}`,
                nodeIds: component,
                geometry,
                strokeColor: '#7c3aed',
                fillColor: 'rgba(124, 58, 237, 0.08)',
            });
        });

        return boundaries;
    }, [selectedAlgorithm, components, nodes, effectivePositions]);

    useEffect(() => {
        if (selectedAlgorithm !== 'scc') {
            lastPackedComponentCountRef.current = 0;
            return;
        }

        const discoveredComponents = Array.isArray(components) ? components : [];
        if (discoveredComponents.length === 0) {
            lastPackedComponentCountRef.current = 0;
            return;
        }

        // Re-pack only when a new SCC is discovered, so drag interactions remain stable.
        if (discoveredComponents.length <= lastPackedComponentCountRef.current) {
            return;
        }

        const count = discoveredComponents.length;
        const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
        const rows = Math.max(1, Math.ceil(count / cols));
        const slotWidth = Math.max(150, (panelSize.width - 80) / cols);
        const slotHeight = Math.max(150, (panelSize.height - 120) / rows);

        setManualPositions((prev) => {
            const next = { ...prev };

            discoveredComponents.forEach((component, index) => {
                const row = Math.floor(index / cols);
                const col = index % cols;

                const centerX = 40 + (col + 0.5) * slotWidth;
                const centerY = 70 + (row + 0.5) * slotHeight;
                const ringRadius = Math.max(24, Math.min(56, 18 + component.length * 8));

                component.forEach((nodeId, nodeIndex) => {
                    if (component.length === 1) {
                        next[nodeId] = { x: centerX, y: centerY };
                        return;
                    }

                    const angle = (2 * Math.PI * nodeIndex) / component.length - Math.PI / 2;
                    next[nodeId] = {
                        x: centerX + Math.cos(angle) * ringRadius,
                        y: centerY + Math.sin(angle) * ringRadius,
                    };
                });
            });

            return next;
        });

        lastPackedComponentCountRef.current = discoveredComponents.length;
    }, [components, panelSize.height, panelSize.width, selectedAlgorithm]);

    return (
        <div ref={panelRef} className={`w-full h-full bg-gray-50 border-l border-gray-200 ${isArticulationMode ? 'flex flex-col' : 'relative overflow-hidden'}`}>
            <div className={isArticulationMode ? 'relative flex-1 overflow-hidden' : 'w-full h-full relative overflow-hidden'}>
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm z-10">
                RESULT TREE
            </div>

            {selectedAlgorithm === 'scc' && (
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-purple-600 shadow-sm z-10 border border-purple-100">
                    {sccPhaseLabel}
                </div>
            )}

            <TreeEdgeLegend selectedAlgorithm={selectedAlgorithm} />

            {selectedAlgorithm === 'scc' && sccBoundaries.map((boundary) => {
                const { geometry } = boundary;

                const handleBoundaryPointerDown = (event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    const startX = event.clientX;
                    const startY = event.clientY;
                    let lastX = startX;
                    let lastY = startY;

                    const handleMove = (moveEvent) => {
                        const deltaX = moveEvent.clientX - lastX;
                        const deltaY = moveEvent.clientY - lastY;
                        lastX = moveEvent.clientX;
                        lastY = moveEvent.clientY;
                        moveNodeGroup(boundary.nodeIds, deltaX, deltaY);
                    };

                    const handleUp = () => {
                        window.removeEventListener('pointermove', handleMove);
                        window.removeEventListener('pointerup', handleUp);
                    };

                    window.addEventListener('pointermove', handleMove);
                    window.addEventListener('pointerup', handleUp);
                };

                return (
                    <motion.div
                        key={boundary.id}
                        onPointerDown={handleBoundaryPointerDown}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute z-[6] cursor-grab active:cursor-grabbing rounded-full border-2 border-dashed"
                        style={{
                            left: geometry.x - geometry.radius,
                            top: geometry.y - geometry.radius,
                            width: geometry.radius * 2,
                            height: geometry.radius * 2,
                            borderColor: boundary.strokeColor,
                            backgroundColor: boundary.fillColor,
                        }}
                    >
                        <div
                            className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide"
                            style={{
                                borderColor: boundary.strokeColor,
                                color: boundary.strokeColor,
                                backgroundColor: '#ffffff',
                            }}
                        >
                            {boundary.label}
                        </div>
                    </motion.div>
                );
            })}

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
                    <marker id="scc-default-arrow" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                    </marker>
                    <marker id="scc-pass1-arrow" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb" />
                    </marker>
                    <marker id="scc-pass2-arrow" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#ea580c" />
                    </marker>
                    <marker id="scc-component-arrow" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#7c3aed" />
                    </marker>
                </defs>
                {edgesToRender.map(edge => {
                    const renderedSourceId = selectedAlgorithm === 'scc' && isSccReversedView
                        ? edge.target
                        : edge.source;
                    const renderedTargetId = selectedAlgorithm === 'scc' && isSccReversedView
                        ? edge.source
                        : edge.target;

                    const sourcePos = effectivePositions[renderedSourceId] || positions[renderedSourceId];
                    const targetPos = effectivePositions[renderedTargetId] || positions[renderedTargetId];
                    if (!sourcePos || !targetPos) return null;

                    let strokeColor = "#2563eb";
                    let markerEnd = showDirectedArrows ? "url(#tree-arrow)" : undefined;
                    let strokeDasharray = undefined;
                    let strokeWidth = 2;
                    if (selectedAlgorithm === 'scc') {
                        strokeColor = '#94a3b8';
                        markerEnd = showDirectedArrows ? 'url(#scc-default-arrow)' : undefined;
                        strokeDasharray = undefined;
                        strokeWidth = 2;

                        if (edge.classification === 'scc-pass1') {
                            strokeColor = '#2563eb';
                            markerEnd = showDirectedArrows ? 'url(#scc-pass1-arrow)' : undefined;
                            strokeWidth = 3;
                        } else if (edge.classification === 'scc-reversed') {
                            strokeColor = '#f59e0b';
                            markerEnd = showDirectedArrows ? 'url(#scc-default-arrow)' : undefined;
                            strokeDasharray = '5,4';
                        } else if (edge.classification === 'scc-pass2') {
                            strokeColor = '#ea580c';
                            markerEnd = showDirectedArrows ? 'url(#scc-pass2-arrow)' : undefined;
                            strokeWidth = 3;
                        } else if (edge.classification === 'scc-component') {
                            strokeColor = '#7c3aed';
                            markerEnd = showDirectedArrows ? 'url(#scc-component-arrow)' : undefined;
                            strokeWidth = 3;
                        }
                    } else if (selectedAlgorithm === 'articulationPoints') {
                        strokeColor = '#cbd5e1';
                        strokeWidth = 2;
                        markerEnd = undefined;
                        if (edge.classification === 'tree') {
                            strokeColor = '#2563eb';
                            strokeWidth = 3;
                        } else if (edge.classification === 'back') {
                            strokeColor = '#ef4444';
                            strokeDasharray = '5,5';
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
                    const sourcePos = effectivePositions[edge.source] || positions[edge.source];
                    const targetPos = effectivePositions[edge.target] || positions[edge.target];
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
                    const pos = effectivePositions[node.id] || basePos;
                    if (!basePos) return null;

                    let borderColor = 'border-blue-500';
                    if (selectedAlgorithm === 'scc') {
                        borderColor = node.color ? 'border-transparent' : 'border-purple-500';
                    }
                    else if (solutionNodeIds.has(node.id)) borderColor = 'border-green-500';

                    return (
                        <motion.div
                            key={node.id}
                            drag
                            dragMomentum={false}
                            onDrag={(e, info) => handleDrag(node.id, info.delta.x, info.delta.y, basePos)}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1, x: pos.x, y: pos.y }}
                            transition={selectedAlgorithm === 'scc' ? { duration: 0 } : { duration: 0.1 }}
                            className={`absolute w-10 h-10 rounded-full bg-white border-2 flex items-center justify-center shadow-sm z-10 cursor-grab active:cursor-grabbing ${borderColor}`}
                            style={{ marginLeft: -20, marginTop: -20, backgroundColor: node.color || '#ffffff' }}
                        >
                            <span className="text-xs font-bold text-gray-700 pointer-events-none">{node.label}</span>

                            {dvFinalResult?.finalCosts && dvFinalResult.finalCosts[node.id] !== undefined && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-purple-200 bg-white/95 px-1.5 py-0.5 text-[9px] font-semibold text-purple-700"
                                >
                                    d={dvFinalResult.finalCosts[node.id] === Infinity ? 'INF' : dvFinalResult.finalCosts[node.id]}
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })
            }
            </div>

            {selectedAlgorithm === 'distanceVector' && dvFinalResult && (
                <div className="absolute left-4 top-14 z-20 rounded-lg border border-purple-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm">
                    <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-purple-600 mb-1">
                        Final Cost From {nodeLabelMap[dvFinalResult.sourceId] || dvFinalResult.sourceId}
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {nodes.map((node) => (
                            <span
                                key={`dv-final-cost-${node.id}`}
                                className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700"
                            >
                                {node.label}:{dvFinalResult.finalCosts[node.id] === Infinity ? 'INF' : dvFinalResult.finalCosts[node.id]}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {isArticulationMode && (
                <div className="h-56 border-t border-gray-200 bg-white/85 backdrop-blur-sm px-4 py-3 overflow-y-auto">
                    <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-500">
                        Live AP Separation View
                    </div>

                    {articulationSeparationData.length === 0 && (
                        <div className="h-full flex items-center justify-center text-sm text-gray-400">
                            As articulation points are discovered, separated components will appear here.
                        </div>
                    )}

                    <div className="space-y-2">
                        {articulationSeparationData.map((entry) => (
                            <motion.div
                                key={String(entry.apId)}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-xl border border-orange-200 bg-orange-50/70 px-3 py-2"
                            >
                                <div className="mb-2 flex items-center justify-between text-xs">
                                    <span className="font-bold text-orange-700">
                                        AP {nodeLabelMap[entry.apId] || entry.apId}
                                    </span>
                                    <span className="text-orange-600 font-medium">
                                        {entry.components.length} separated components
                                    </span>
                                </div>

                                <div className="relative h-64 overflow-hidden rounded-lg border border-orange-100 bg-white/80">
                                    <svg className="w-full h-full" viewBox="0 0 620 250" preserveAspectRatio="xMidYMid meet">
                                        {(() => {
                                            const center = { x: 310, y: 125 };
                                            const componentCount = Math.max(1, entry.components.length);
                                            const orbitRadius = componentCount <= 2 ? 120 : 92;
                                            const clusterPlacements = [];
                                            const nodeGlobalPos = {};
                                            const clusterBridgeLines = [];

                                            entry.components.forEach((component, componentIndex) => {
                                                const color = AP_COMPONENT_COLORS[componentIndex % AP_COMPONENT_COLORS.length];
                                                const clusterKey = `${String(entry.apId)}-${componentIndex}`;
                                                const clusterOffset = apClusterOffsets[clusterKey] || { x: 0, y: 0 };

                                                const angle = componentCount === 1
                                                    ? 0
                                                    : (2 * Math.PI * componentIndex) / componentCount - Math.PI / 2;

                                                const clusterCenter = {
                                                    x: center.x + Math.cos(angle) * orbitRadius + clusterOffset.x,
                                                    y: center.y + Math.sin(angle) * orbitRadius + clusterOffset.y,
                                                };

                                                const clusterRadius = Math.max(34, Math.min(58, 24 + component.nodeIds.length * 5));
                                                const nodeRingRadius = Math.max(0, clusterRadius - 16);

                                                const localNodes = [];
                                                component.nodeIds.forEach((nodeId, nodeIndex) => {
                                                    let nodePoint;
                                                    if (component.nodeIds.length === 1) {
                                                        nodePoint = { x: clusterCenter.x, y: clusterCenter.y };
                                                    } else {
                                                        const nodeAngle = (2 * Math.PI * nodeIndex) / component.nodeIds.length - Math.PI / 2;
                                                        nodePoint = {
                                                            x: clusterCenter.x + Math.cos(nodeAngle) * nodeRingRadius,
                                                            y: clusterCenter.y + Math.sin(nodeAngle) * nodeRingRadius,
                                                        };
                                                    }
                                                    nodeGlobalPos[nodeId] = nodePoint;
                                                    localNodes.push({ nodeId, point: nodePoint });
                                                });

                                                const bridgeEdges = edges.filter((edge) => (
                                                    (edge.source === entry.apId && component.nodeIds.includes(edge.target)) ||
                                                    (edge.target === entry.apId && component.nodeIds.includes(edge.source))
                                                ));

                                                bridgeEdges.forEach((edge, idx) => {
                                                    const otherId = edge.source === entry.apId ? edge.target : edge.source;
                                                    clusterBridgeLines.push({
                                                        key: `${clusterKey}-bridge-${edge.id}-${idx}`,
                                                        toNodeId: otherId,
                                                        color,
                                                    });
                                                });

                                                clusterPlacements.push({
                                                    key: clusterKey,
                                                    componentIndex,
                                                    color,
                                                    clusterCenter,
                                                    clusterRadius,
                                                    nodes: localNodes,
                                                    edges: component.edges,
                                                });
                                            });

                                            return (
                                                <>
                                                    {clusterBridgeLines.map((line) => {
                                                        const target = nodeGlobalPos[line.toNodeId];
                                                        if (!target) {
                                                            return null;
                                                        }
                                                        return (
                                                            <line
                                                                key={line.key}
                                                                x1={center.x}
                                                                y1={center.y}
                                                                x2={target.x}
                                                                y2={target.y}
                                                                stroke={line.color}
                                                                strokeWidth="2"
                                                                strokeDasharray="4 3"
                                                                opacity="0.85"
                                                            />
                                                        );
                                                    })}

                                                    {clusterPlacements.map((cluster) => (
                                                        <g
                                                            key={cluster.key}
                                                            style={{ cursor: 'grab' }}
                                                            onMouseDown={(event) => {
                                                                event.preventDefault();
                                                                const startX = event.clientX;
                                                                const startY = event.clientY;
                                                                const key = cluster.key;
                                                                const initialOffset = apClusterOffsets[key] || { x: 0, y: 0 };

                                                                const onMove = (moveEvent) => {
                                                                    const dx = moveEvent.clientX - startX;
                                                                    const dy = moveEvent.clientY - startY;
                                                                    setApClusterOffsets((prev) => ({
                                                                        ...prev,
                                                                        [key]: {
                                                                            x: initialOffset.x + dx,
                                                                            y: initialOffset.y + dy,
                                                                        },
                                                                    }));
                                                                };

                                                                const onUp = () => {
                                                                    window.removeEventListener('mousemove', onMove);
                                                                    window.removeEventListener('mouseup', onUp);
                                                                };

                                                                window.addEventListener('mousemove', onMove);
                                                                window.addEventListener('mouseup', onUp);
                                                            }}
                                                        >
                                                            <circle
                                                                cx={cluster.clusterCenter.x}
                                                                cy={cluster.clusterCenter.y}
                                                                r={cluster.clusterRadius}
                                                                fill={`${cluster.color}14`}
                                                                stroke={cluster.color}
                                                                strokeWidth="2"
                                                                strokeDasharray="5 4"
                                                            />

                                                            <text
                                                                x={cluster.clusterCenter.x}
                                                                y={cluster.clusterCenter.y - cluster.clusterRadius - 8}
                                                                textAnchor="middle"
                                                                fontSize="10"
                                                                fontWeight="700"
                                                                fill={cluster.color}
                                                            >
                                                                C{cluster.componentIndex + 1}
                                                            </text>

                                                            {cluster.edges.map((edge) => {
                                                                const source = nodeGlobalPos[edge.source];
                                                                const target = nodeGlobalPos[edge.target];
                                                                if (!source || !target) {
                                                                    return null;
                                                                }
                                                                return (
                                                                    <line
                                                                        key={`${cluster.key}-${edge.id}`}
                                                                        x1={source.x}
                                                                        y1={source.y}
                                                                        x2={target.x}
                                                                        y2={target.y}
                                                                        stroke={cluster.color}
                                                                        strokeWidth="1.8"
                                                                        opacity="0.7"
                                                                    />
                                                                );
                                                            })}

                                                            {cluster.nodes.map((node) => (
                                                                <g key={`${cluster.key}-${String(node.nodeId)}`}>
                                                                    <circle
                                                                        cx={node.point.x}
                                                                        cy={node.point.y}
                                                                        r="10"
                                                                        fill="#ffffff"
                                                                        stroke={cluster.color}
                                                                        strokeWidth="2"
                                                                    />
                                                                    <text
                                                                        x={node.point.x}
                                                                        y={node.point.y + 3.5}
                                                                        textAnchor="middle"
                                                                        fontSize="9"
                                                                        fontWeight="700"
                                                                        fill={cluster.color}
                                                                    >
                                                                        {nodeLabelMap[node.nodeId] || node.nodeId}
                                                                    </text>
                                                                </g>
                                                            ))}
                                                        </g>
                                                    ))}

                                                    <circle
                                                        cx={center.x}
                                                        cy={center.y}
                                                        r="13"
                                                        fill="#fff7ed"
                                                        stroke="#ea580c"
                                                        strokeWidth="2.5"
                                                    />
                                                    <text
                                                        x={center.x}
                                                        y={center.y + 4}
                                                        textAnchor="middle"
                                                        fontSize="10"
                                                        fontWeight="800"
                                                        fill="#c2410c"
                                                    >
                                                        {nodeLabelMap[entry.apId] || entry.apId}
                                                    </text>
                                                </>
                                            );
                                        })()}
                                    </svg>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultTree;
