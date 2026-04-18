import React, { useMemo, useEffect } from 'react';
import useGraphStore from '../store/useGraphStore';
import { motion } from 'framer-motion';

const ConnectivityResult = () => {
    const { resultData } = useGraphStore();

    if (!resultData) {
        return (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                Run SCC or Articulation Points to see results.
            </div>
        );
    }

    if (resultData.type === 'scc') {
        return <SCCView data={resultData} />;
    } else if (resultData.type === 'ap') {
        return <APView data={resultData} />;
    }

    return null;
};

const SCCView = ({ data }) => {
    const { sccs, originalGraph } = data;
    const { resultLayout, setResultLayout, updateResultNodePos } = useGraphStore();

    // 1. Calculate SCC Center Positions (Super Nodes Layout)
    const sccLayout = useMemo(() => {
        const count = sccs.length;
        const radius = 200; // Radius of the main circle of SCCs
        const centerX = 400;
        const centerY = 350;

        return sccs.map((scc, i) => {
            const id = `scc-${i}`;
            const storedPos = resultLayout[id];

            // Default position calculation
            const angle = count === 1 ? 0 : (i / count) * 2 * Math.PI - Math.PI / 2;
            const defaultCx = count === 1 ? centerX : centerX + radius * Math.cos(angle);
            const defaultCy = count === 1 ? centerY : centerY + radius * Math.sin(angle);

            return {
                id: id,
                index: i,
                cx: storedPos ? storedPos.x : defaultCx,
                cy: storedPos ? storedPos.y : defaultCy,
                nodes: scc,
                label: `SCC ${i + 1}`
            };
        });
    }, [sccs, resultLayout]);

    // Initial Layout Persistence
    useEffect(() => {
        const newLayout = {};
        let needsUpdate = false;
        sccLayout.forEach(cluster => {
            if (!resultLayout[cluster.id]) {
                newLayout[cluster.id] = { x: cluster.cx, y: cluster.cy };
                needsUpdate = true;
            }
        });
        if (needsUpdate) {
            setResultLayout({ ...resultLayout, ...newLayout });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sccs]); // Only check on data change, not everyday layout update to avoid loop

    // 2. Calculate Individual Node Positions
    const nodePositions = useMemo(() => {
        const positions = {}; // nodeId -> { x, y }

        sccLayout.forEach(cluster => {
            const nodeCount = cluster.nodes.length;
            const internalRadius = Math.min(60, 20 + nodeCount * 10); // Grow slightly with more nodes

            cluster.nodes.forEach((nodeId, idx) => {
                // If single node, place in center of cluster
                if (nodeCount === 1) {
                    positions[nodeId] = { x: cluster.cx, y: cluster.cy };
                } else {
                    const angle = (idx / nodeCount) * 2 * Math.PI - Math.PI / 2;
                    positions[nodeId] = {
                        x: cluster.cx + internalRadius * Math.cos(angle),
                        y: cluster.cy + internalRadius * Math.sin(angle)
                    };
                }
            });
        });
        return positions;
    }, [sccLayout]);

    // 3. Classify Edges
    const renderedEdges = useMemo(() => {
        // Map nodeId -> sccIndex
        const nodeToSCC = {};
        sccs.forEach((scc, idx) => scc.forEach(id => nodeToSCC[id] = idx));

        return originalGraph.edges.map(edge => {
            const sourcePos = nodePositions[edge.source];
            const targetPos = nodePositions[edge.target];
            if (!sourcePos || !targetPos) return null;

            const isInterSCC = nodeToSCC[edge.source] !== nodeToSCC[edge.target];

            return {
                id: edge.id,
                sourcePos,
                targetPos,
                isInterSCC,
                key: `edge-${edge.id}`
            };
        }).filter(Boolean);
    }, [originalGraph.edges, nodePositions, sccs]);

    return (
        <div className="w-full h-full relative bg-gray-50 overflow-auto">
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-blue-600 shadow-sm z-10">
                CONDENSATION GRAPH (DETAILED)
            </div>
            <svg className="w-full h-full min-h-[700px] min-w-[800px]">
                <defs>
                    <marker id="arrow-intra" markerWidth="8" markerHeight="6" refX="18" refY="3" orient="auto">
                        <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                    </marker>
                    <marker id="arrow-inter" markerWidth="10" markerHeight="7" refX="18" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                    </marker>
                </defs>

                {/* Draw Cluster Boundaries (Draggable Super Nodes) */}
                {sccLayout.map(cluster => {
                    const handlePointerDown = (e) => {
                        e.stopPropagation();
                        if (e.button !== 0) return;

                        const startX = e.clientX;
                        const startY = e.clientY;
                        const initialX = cluster.cx;
                        const initialY = cluster.cy;

                        const handlePointerMove = (moveEvent) => {
                            const dx = moveEvent.clientX - startX;
                            const dy = moveEvent.clientY - startY;
                            updateResultNodePos(cluster.id, initialX + dx, initialY + dy);
                        };

                        const handlePointerUp = () => {
                            window.removeEventListener('pointermove', handlePointerMove);
                            window.removeEventListener('pointerup', handlePointerUp);
                        };

                        window.addEventListener('pointermove', handlePointerMove);
                        window.addEventListener('pointerup', handlePointerUp);
                    };

                    return (
                        <motion.g
                            key={cluster.id}
                            onPointerDown={handlePointerDown}
                            style={{ x: cluster.cx, y: cluster.cy }} // Controlling position via style, but updating raw coordinate in store
                        >
                            {/* Visual Circle for Cluster */}
                            <motion.circle
                                initial={{ opacity: 0, r: 0 }}
                                animate={{ opacity: 1, r: Math.max(50, 30 + cluster.nodes.length * 15) }}
                                fill="#f0f9ff"
                                stroke="#bae6fd"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                                className="cursor-move"
                                cx={0} cy={0} // Centered in the group
                            />
                            {/* Cluster Label - Centered on bottom */}
                            <text
                                y={Math.max(50, 30 + cluster.nodes.length * 15) + 15}
                                textAnchor="middle"
                                className="text-xs font-bold fill-blue-300 uppercase tracking-widest pointer-events-none select-none"
                            >
                                {cluster.label}
                            </text>
                        </motion.g>
                    )
                })}

                {/* Draw Edges */}
                {renderedEdges.map(edge => (
                    <motion.line
                        key={edge.key}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        x1={edge.sourcePos.x}
                        y1={edge.sourcePos.y}
                        x2={edge.targetPos.x}
                        y2={edge.targetPos.y}
                        stroke={edge.isInterSCC ? "#ef4444" : "#cbd5e1"}
                        strokeWidth={edge.isInterSCC ? "2" : "1.5"}
                        markerEnd={edge.isInterSCC ? "url(#arrow-inter)" : "url(#arrow-intra)"}
                        className="pointer-events-none"
                    />
                ))}

                {/* Draw Nodes */}
                {Object.entries(nodePositions).map(([nodeId, pos]) => {
                    const node = originalGraph.nodes.find(n => n.id === parseInt(nodeId) || n.id === nodeId);
                    const label = node?.label || nodeId;
                    return (
                        <motion.g
                            key={`node-${nodeId}`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1, x: pos.x, y: pos.y }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                            className="pointer-events-none" // Nodes inside move with cluster, not individually interactive yet
                        >
                            <circle
                                r="12"
                                fill="white"
                                stroke="#3b82f6"
                                strokeWidth="2"
                            />
                            <text
                                dy=".3em"
                                textAnchor="middle"
                                fontSize="10"
                                fontWeight="bold"
                                fill="#1e40af"
                                className="select-none"
                            >
                                {label}
                            </text>
                        </motion.g>
                    );
                })}

            </svg>
        </div>
    );
};

const APView = ({ data }) => {
    const { points, originalGraph } = data;
    const { resultLayout, setResultLayout, updateResultNodePos } = useGraphStore();
    const componentColors = ['#0ea5e9', '#10b981', '#a855f7', '#f59e0b', '#ec4899', '#22c55e', '#6366f1', '#06b6d4'];

    // Helper to find components if node `removedNodeId` is removed
    const getComponents = useMemo(() => (removedNodeId) => {
        const components = [];
        const visited = new Set();
        const nodes = originalGraph.nodes.filter(n => n.id !== removedNodeId);
        // Edges that don't touch removedNodeId
        const activeEdges = originalGraph.edges.filter(e => e.source !== removedNodeId && e.target !== removedNodeId);

        const adj = {};
        nodes.forEach(n => adj[n.id] = []);
        activeEdges.forEach(e => {
            adj[e.source].push(e.target);
            adj[e.target].push(e.source);
        });

        const bfs = (startId) => {
            const comp = [];
            const queue = [startId];
            visited.add(startId);
            while (queue.length) {
                const u = queue.shift();
                comp.push(u);
                (adj[u] || []).forEach(v => {
                    if (!visited.has(v)) {
                        visited.add(v);
                        queue.push(v);
                    }
                });
            }
            return comp;
        };

        nodes.forEach(n => {
            if (!visited.has(n.id)) {
                components.push(bfs(n.id));
            }
        });

        return components;
    }, [originalGraph]);

    // Calculate layout for all AP views
    const views = useMemo(() => {
        return points.map(apId => {
            const components = getComponents(apId);
            const width = 600;
            const height = 400;
            const centerX = width / 2;
            const centerY = height / 2;

            const initialPositions = {};
            // Central AP
            initialPositions[apId] = { x: centerX, y: centerY };

            components.forEach((comp, cIdx) => {
                const angleStep = (2 * Math.PI) / components.length;
                const sectorAngle = cIdx * angleStep;
                const distFromCenter = 120;
                const compCX = centerX + distFromCenter * Math.cos(sectorAngle);
                const compCY = centerY + distFromCenter * Math.sin(sectorAngle);

                comp.forEach((nodeId, nIdx) => {
                    const nodeCount = comp.length;
                    if (nodeCount === 1) {
                        initialPositions[nodeId] = { x: compCX, y: compCY };
                    } else {
                        const subRadius = 40;
                        const subAngle = (nIdx / nodeCount) * 2 * Math.PI;
                        initialPositions[nodeId] = {
                            x: compCX + subRadius * Math.cos(subAngle),
                            y: compCY + subRadius * Math.sin(subAngle)
                        };
                    }
                });
            });

            return { apId, components, initialPositions };
        });
    }, [points, getComponents]);

    // Initial Layout Persistence for AP Nodes
    useEffect(() => {
        const newLayout = {};
        let needsUpdate = false;

        views.forEach(({ apId, initialPositions }) => {
            Object.keys(initialPositions).forEach(nodeId => {
                const layoutKey = `ap-${apId}-node-${nodeId}`;
                if (!resultLayout[layoutKey]) {
                    newLayout[layoutKey] = initialPositions[nodeId];
                    needsUpdate = true;
                }
            });
        });

        if (needsUpdate) {
            setResultLayout({ ...resultLayout, ...newLayout });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [points]); // Only on points change

    return (
        <div className="w-full h-full p-4 overflow-y-auto bg-gray-50 pb-20">
            <div className="sticky top-0 right-0 flex justify-end mb-4 pointer-events-none">
                <span className="bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold text-orange-600 shadow-sm border border-orange-100 z-10 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    ARTICULATION POINTS ({points.length})
                </span>
            </div>

            <div className="flex flex-col gap-12">
                {points.length === 0 && <p className="text-center text-gray-400 mt-10">No Articulation Points found.</p>}

                {views.map(({ apId, components, initialPositions }, index) => {
                    const apNode = originalGraph.nodes.find(n => n.id === apId);
                    const nodeToComponent = {};
                    components.forEach((comp, cIdx) => {
                        comp.forEach(nodeId => {
                            nodeToComponent[nodeId] = cIdx;
                        });
                    });

                    const componentRegions = components.map((comp, cIdx) => {
                        const pts = comp
                            .map(nodeId => {
                                const layoutKey = `ap-${apId}-node-${nodeId}`;
                                return resultLayout[layoutKey] || initialPositions[nodeId];
                            })
                            .filter(Boolean);

                        if (pts.length === 0) {
                            return null;
                        }

                        const cx = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
                        const cy = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
                        const maxDist = Math.max(
                            ...pts.map(p => Math.hypot(p.x - cx, p.y - cy)),
                            16
                        );

                        return {
                            idx: cIdx,
                            cx,
                            cy,
                            r: maxDist + 24,
                            color: componentColors[cIdx % componentColors.length],
                            count: comp.length
                        };
                    }).filter(Boolean);

                    // Edges
                    const relevantNodes = new Set([apId, ...components.flat()]);
                    const viewEdges = originalGraph.edges.filter(e =>
                        relevantNodes.has(e.source) && relevantNodes.has(e.target)
                    );

                    return (
                        <motion.div
                            key={apId}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden relative"
                        >
                            <div className="absolute top-4 left-4 z-10">
                                <span className="bg-orange-50 text-orange-700 font-bold px-3 py-1 rounded text-xs border border-orange-100">
                                    AP: {apNode?.label}
                                </span>
                                <p className="text-[10px] text-gray-400 mt-1 ml-1">{components.length} Split Components</p>
                            </div>

                            <div className="w-full h-[400px] bg-dot-pattern">
                                <svg className="w-full h-full" viewBox="0 0 600 400">
                                    <defs>
                                        <marker id={`ap-arrow-${apId}`} markerWidth="10" markerHeight="7" refX="24" refY="3.5" orient="auto">
                                            <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
                                        </marker>
                                    </defs>

                                    {/* Colored regions show each component after AP removal */}
                                    {componentRegions.map(region => (
                                        <g key={`region-${apId}-${region.idx}`}>
                                            <circle
                                                cx={region.cx}
                                                cy={region.cy}
                                                r={region.r}
                                                fill={region.color}
                                                fillOpacity="0.10"
                                                stroke={region.color}
                                                strokeOpacity="0.35"
                                                strokeWidth="1.2"
                                                strokeDasharray="6 4"
                                            />
                                            <text
                                                x={region.cx}
                                                y={region.cy - region.r - 6}
                                                textAnchor="middle"
                                                fontSize="10"
                                                fontWeight="700"
                                                fill={region.color}
                                                className="select-none"
                                            >
                                                C{region.idx + 1} ({region.count})
                                            </text>
                                        </g>
                                    ))}

                                    {/* Edges */}
                                    {viewEdges.map(edge => {
                                        const keySrc = `ap-${apId}-node-${edge.source}`;
                                        const keyTgt = `ap-${apId}-node-${edge.target}`;
                                        const src = resultLayout[keySrc] || initialPositions[edge.source];
                                        const tgt = resultLayout[keyTgt] || initialPositions[edge.target];

                                        if (!src || !tgt) return null;
                                        const isAPEdge = edge.source === apId || edge.target === apId;
                                        const srcComp = nodeToComponent[edge.source];
                                        const tgtComp = nodeToComponent[edge.target];

                                        let stroke = '#e2e8f0';
                                        let strokeWidth = 1.5;
                                        let strokeOpacity = 0.5;
                                        let strokeDasharray;

                                        if (isAPEdge) {
                                            const otherNode = edge.source === apId ? edge.target : edge.source;
                                            const compIdx = nodeToComponent[otherNode] ?? 0;
                                            stroke = componentColors[compIdx % componentColors.length];
                                            strokeWidth = 2.6;
                                            strokeOpacity = 0.95;
                                        } else if (srcComp !== undefined && srcComp === tgtComp) {
                                            stroke = componentColors[srcComp % componentColors.length];
                                            strokeWidth = 1.9;
                                            strokeOpacity = 0.55;
                                        } else {
                                            // Cross-component non-AP edge (rare): emphasize as warning relation.
                                            stroke = '#ef4444';
                                            strokeWidth = 1.8;
                                            strokeOpacity = 0.8;
                                            strokeDasharray = '5 4';
                                        }

                                        return (
                                            <motion.line
                                                key={edge.id}
                                                // animate x1/y1 to follow nodes (though line itself isn't dragged)
                                                x1={src.x} y1={src.y}
                                                x2={tgt.x} y2={tgt.y}
                                                stroke={stroke}
                                                strokeWidth={strokeWidth}
                                                strokeOpacity={strokeOpacity}
                                                strokeDasharray={strokeDasharray}
                                            />
                                        );
                                    })}

                                    {/* Nodes */}
                                    {Object.entries(initialPositions).map(([nId, defaultPos]) => {
                                        const isAP = nId == apId;
                                        const node = originalGraph.nodes.find(n => n.id == nId);
                                        const layoutKey = `ap-${apId}-node-${nId}`;
                                        const pos = resultLayout[layoutKey] || defaultPos;
                                        const compIdx = nodeToComponent[nId];
                                        const compColor = compIdx !== undefined
                                            ? componentColors[compIdx % componentColors.length]
                                            : '#94a3b8';

                                        const handlePointerDown = (e) => {
                                            e.stopPropagation();
                                            if (e.button !== 0) return;

                                            const startX = e.clientX;
                                            const startY = e.clientY;
                                            const initialX = pos.x;
                                            const initialY = pos.y;

                                            const handlePointerMove = (moveEvent) => {
                                                const dx = moveEvent.clientX - startX;
                                                const dy = moveEvent.clientY - startY;
                                                updateResultNodePos(layoutKey, initialX + dx, initialY + dy);
                                            };

                                            const handlePointerUp = () => {
                                                window.removeEventListener('pointermove', handlePointerMove);
                                                window.removeEventListener('pointerup', handlePointerUp);
                                            };

                                            window.addEventListener('pointermove', handlePointerMove);
                                            window.addEventListener('pointerup', handlePointerUp);
                                        };

                                        return (
                                            <motion.g
                                                key={nId}
                                                onPointerDown={handlePointerDown}
                                                style={{ x: pos.x, y: pos.y }}
                                                className="cursor-move"
                                            >
                                                <circle
                                                    r={isAP ? 18 : 12}
                                                    fill={isAP ? "#fff7ed" : "white"}
                                                    stroke={isAP ? "#f97316" : compColor}
                                                    strokeWidth={isAP ? 3 : 1}
                                                    cx={0} cy={0}
                                                />
                                                {isAP && (
                                                    <line x1="-8" y1="-8" x2="8" y2="8" stroke="#ea580c" strokeWidth="2" />
                                                )}
                                                <text
                                                    dy=".3em"
                                                    textAnchor="middle"
                                                    fontSize={isAP ? "12" : "10"}
                                                    fontWeight="bold"
                                                    fill={isAP ? "#c2410c" : compColor}
                                                    className="select-none pointer-events-none"
                                                >
                                                    {node?.label}
                                                </text>
                                            </motion.g>
                                        );
                                    })}

                                </svg>
                                <div className="absolute bottom-2 left-3 right-3 text-[9px] text-gray-400 bg-white/80 backdrop-blur px-2 py-1 rounded">
                                    Remove orange AP node to split into {components.length} colored components. Same-color = same component.
                                </div>
                            </div>


                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default ConnectivityResult;
