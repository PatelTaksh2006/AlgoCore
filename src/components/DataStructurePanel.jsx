import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import useGraphStore from '../store/useGraphStore';
import { motion, AnimatePresence, LayoutGroup, Reorder, useDragControls, useMotionValue } from 'framer-motion';
import { useAlgorithm } from '../context/AlgorithmContext';
import { useGraph } from '../context/GraphContext';
import { saveDataStructurePanelState, loadDataStructurePanelState } from '../utils/persistenceUtils';

const PANEL_MARGIN = 16;
const MIN_PANEL_WIDTH = 420;
const MIN_PANEL_HEIGHT = 220;
const DEFAULT_PANEL_HEIGHT = 360;
const DEFAULT_SECTION_ORDER = ['primaryDS', 'parent', 'visited', 'scc', 'ap', 'floyd', 'routing'];

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
const RoutingAlgorithmState = ({ lsdb, routingTable, activeTableNodeId, nodeLabelMap, selectedAlgorithm, internalState }) => {
    const isLinkState = selectedAlgorithm === 'linkState';
    const comparison = internalState?.routingComparison;
    
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

            <div className="mb-2 rounded-lg border border-sky-200 bg-sky-50/80 p-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-sky-700 mb-1">
                        Comparison Animation
                    </div>

                    {!comparison && (
                        <div className="text-[10px] text-gray-500">
                            Waiting for first relaxation comparison...
                        </div>
                    )}

                    {comparison && (
                        <motion.div
                            key={comparison.id}
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="rounded-md border border-sky-200 bg-white px-2 py-1"
                        >
                            <div className="text-[10px] text-sky-700 font-semibold">
                                {comparison.algorithm === 'linkState' ? 'Link State SPF' : 'Distance Vector'}
                            </div>
                            <div className="text-[10px] text-sky-700 font-semibold">
                                Via {comparison.via}, Dest {comparison.destination}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-[11px] font-mono text-gray-700">
                                <span>{comparison.lhs}</span>
                                <span>{comparison.operator}</span>
                                <span>{comparison.rhs}</span>
                                <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold ${comparison.result ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {comparison.result ? 'UPDATE' : 'NO UPDATE'}
                                </span>
                            </div>
                        </motion.div>
                    )}
            </div>
            
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
    const resizeStateRef = useRef(null);
    const hasPositionedRef = useRef(false);
    const hasManualResizeRef = useRef(false);
    const dragControls = useDragControls();
    const persistedPanelStateRef = useRef(loadDataStructurePanelState());

    // Determine type for label
    const getTypeLabel = () => {
        if (selectedAlgorithm === 'dfs') return 'Stack';
        if (selectedAlgorithm === 'scc') return 'Finish Stack';
        if (selectedAlgorithm === 'bfs') return 'Queue';
        if (selectedAlgorithm === 'dijkstra' || selectedAlgorithm === 'prim') return 'Priority Queue';
        if (selectedAlgorithm === 'linkState') return 'Priority Queue (SPF)';
        return 'Data Structure';
    };

    // Check if this is a routing algorithm
    const isRoutingAlgorithm = ['distanceVector', 'linkState'].includes(selectedAlgorithm);
    const isFloydWarshall = selectedAlgorithm === 'floydWarshall';
    const [sectionOrder, setSectionOrder] = useState(
        persistedPanelStateRef.current?.sectionOrder || DEFAULT_SECTION_ORDER
    );

    const visibleSectionIds = useMemo(() => {
        const ids = ['primaryDS', 'parent', 'visited'];
        if (selectedAlgorithm === 'scc') ids.push('scc');
        if (selectedAlgorithm === 'articulationPoints') ids.push('ap');
        if (isFloydWarshall) ids.push('floyd');
        if (isRoutingAlgorithm) ids.push('routing');
        return ids;
    }, [selectedAlgorithm, isFloydWarshall, isRoutingAlgorithm]);

    const orderedVisibleSectionIds = useMemo(() => {
        const visibleSet = new Set(visibleSectionIds);
        const inOrder = sectionOrder.filter(id => visibleSet.has(id));
        const missing = visibleSectionIds.filter(id => !inOrder.includes(id));
        return [...inOrder, ...missing];
    }, [sectionOrder, visibleSectionIds]);

    const handleSectionReorder = useCallback((nextVisibleOrder) => {
        setSectionOrder((prev) => {
            const hidden = prev.filter(id => !visibleSectionIds.includes(id));
            return [...nextVisibleOrder, ...hidden];
        });
    }, [visibleSectionIds]);

    // Memoize node lookup
    const nodeLabelMap = useMemo(() => {
        const map = {};
        nodes.forEach(n => map[n.id] = n.label);
        return map;
    }, [nodes]);

    // Determine panel width based on algorithm
    const defaultPanelWidth = isFloydWarshall ? 700 : 600;
    const [panelSize, setPanelSize] = useState(() => {
        const savedSize = persistedPanelStateRef.current?.panelSize;
        if (savedSize?.width && savedSize?.height) {
            hasManualResizeRef.current = true;
            return savedSize;
        }
        return { width: defaultPanelWidth, height: DEFAULT_PANEL_HEIGHT };
    });
    const x = useMotionValue(persistedPanelStateRef.current?.position?.x ?? PANEL_MARGIN);
    const y = useMotionValue(persistedPanelStateRef.current?.position?.y ?? PANEL_MARGIN);

    if (persistedPanelStateRef.current?.position && !hasPositionedRef.current) {
        hasPositionedRef.current = true;
    }

    const persistPanelState = useCallback(() => {
        saveDataStructurePanelState({
            sectionOrder,
            panelSize,
            position: {
                x: x.get(),
                y: y.get(),
            },
        });
    }, [panelSize, sectionOrder, x, y]);

    useEffect(() => {
        persistPanelState();
    }, [panelSize, sectionOrder, persistPanelState]);

    const clampPosition = useCallback((nextX, nextY, size = panelSize) => {
        const container = constraintsRef?.current;
        if (!container) {
            return { x: nextX, y: nextY };
        }

        const maxX = Math.max(PANEL_MARGIN, container.clientWidth - size.width - PANEL_MARGIN);
        const maxY = Math.max(PANEL_MARGIN, container.clientHeight - size.height - PANEL_MARGIN);

        return {
            x: Math.min(Math.max(PANEL_MARGIN, nextX), maxX),
            y: Math.min(Math.max(PANEL_MARGIN, nextY), maxY),
        };
    }, [constraintsRef, panelSize]);

    const clampSize = useCallback((nextWidth, nextHeight, position = { x: x.get(), y: y.get() }) => {
        const container = constraintsRef?.current;
        if (!container) {
            return {
                width: Math.max(MIN_PANEL_WIDTH, nextWidth),
                height: Math.max(MIN_PANEL_HEIGHT, nextHeight),
            };
        }

        const maxWidth = Math.max(MIN_PANEL_WIDTH, container.clientWidth - position.x - PANEL_MARGIN);
        const maxHeight = Math.max(MIN_PANEL_HEIGHT, container.clientHeight - position.y - PANEL_MARGIN);

        return {
            width: Math.min(Math.max(MIN_PANEL_WIDTH, nextWidth), maxWidth),
            height: Math.min(Math.max(MIN_PANEL_HEIGHT, nextHeight), maxHeight),
        };
    }, [constraintsRef, x, y]);

    const syncPanelWithinViewport = useCallback((size = panelSize) => {
        const boundedSize = clampSize(size.width, size.height);
        const nextSize = boundedSize.width === size.width && boundedSize.height === size.height ? size : boundedSize;

        if (nextSize !== size) {
            setPanelSize(current => (
                current.width === nextSize.width && current.height === nextSize.height ? current : nextSize
            ));
        }

        const boundedPosition = clampPosition(x.get(), y.get(), nextSize);
        x.set(boundedPosition.x);
        y.set(boundedPosition.y);
    }, [clampPosition, clampSize, panelSize, x, y]);

    useLayoutEffect(() => {
        const container = constraintsRef?.current;
        if (!container) {
            return;
        }

        const preferredSize = hasManualResizeRef.current
            ? panelSize
            : clampSize(defaultPanelWidth, DEFAULT_PANEL_HEIGHT);

        if (!hasManualResizeRef.current && (
            preferredSize.width !== panelSize.width ||
            preferredSize.height !== panelSize.height
        )) {
            setPanelSize(preferredSize);
        }

        if (!hasPositionedRef.current) {
            const startX = Math.max(PANEL_MARGIN, (container.clientWidth - preferredSize.width) / 2);
            const startY = Math.max(PANEL_MARGIN, container.clientHeight - preferredSize.height - PANEL_MARGIN);
            x.set(startX);
            y.set(startY);
            hasPositionedRef.current = true;
            return;
        }

        const boundedPosition = clampPosition(x.get(), y.get(), preferredSize);
        x.set(boundedPosition.x);
        y.set(boundedPosition.y);
    }, [clampPosition, clampSize, constraintsRef, defaultPanelWidth, panelSize, x, y]);

    useEffect(() => {
        const container = constraintsRef?.current;
        if (!container) {
            return undefined;
        }

        const observer = new ResizeObserver(() => {
            syncPanelWithinViewport();
        });

        observer.observe(container);

        return () => observer.disconnect();
    }, [constraintsRef, syncPanelWithinViewport]);

    const stopResizing = useCallback(() => {
        resizeStateRef.current = null;
        window.removeEventListener('pointermove', handleResizeMove);
        window.removeEventListener('pointerup', stopResizing);
        persistPanelState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [persistPanelState]);

    const handleResizeMove = useCallback((event) => {
        const resizeState = resizeStateRef.current;
        if (!resizeState) {
            return;
        }

        const nextWidth = resizeState.startWidth + (event.clientX - resizeState.startX);
        const nextHeight = resizeState.startHeight + (event.clientY - resizeState.startY);
        const boundedSize = clampSize(nextWidth, nextHeight, {
            x: resizeState.startPanelX,
            y: resizeState.startPanelY,
        });

        setPanelSize(current => (
            current.width === boundedSize.width && current.height === boundedSize.height ? current : boundedSize
        ));
    }, [clampSize]);

    useEffect(() => {
        return () => {
            window.removeEventListener('pointermove', handleResizeMove);
            window.removeEventListener('pointerup', stopResizing);
        };
    }, [handleResizeMove, stopResizing]);

    const startResizing = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        hasManualResizeRef.current = true;
        resizeStateRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            startWidth: panelSize.width,
            startHeight: panelSize.height,
            startPanelX: x.get(),
            startPanelY: y.get(),
        };

        window.addEventListener('pointermove', handleResizeMove);
        window.addEventListener('pointerup', stopResizing);
    }, [handleResizeMove, panelSize.height, panelSize.width, stopResizing, x, y]);

    return (
        <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={constraintsRef}
            dragMomentum={false}
            dragElastic={0.04}
            whileDrag={{ scale: 1.01, boxShadow: '0 24px 48px rgba(15, 23, 42, 0.18)' }}
            onDragEnd={() => {
                syncPanelWithinViewport();
                persistPanelState();
            }}
            style={{
                x,
                y,
                left: 0,
                top: 0,
                width: panelSize.width,
                height: panelSize.height,
                willChange: 'transform',
            }}
            className="absolute bg-white/92 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 p-3 flex flex-col gap-3 z-20 overflow-hidden touch-none"
        >
            <div
                onPointerDown={(event) => dragControls.start(event)}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 cursor-grab active:cursor-grabbing select-none"
                style={{ touchAction: 'none' }}
            >
                <div>
                    <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gray-500">Data Structure Panel</div>
                    <div className="text-xs text-gray-400">Drag from this bar. Resize from the bottom-right corner.</div>
                </div>
            </div>

            <LayoutGroup>
            <Reorder.Group
                axis="y"
                values={orderedVisibleSectionIds}
                onReorder={handleSectionReorder}
                className="flex-1 overflow-y-auto pr-2 pb-8 space-y-3"
            >

            {orderedVisibleSectionIds.map((sectionId) => (
                <Reorder.Item
                    key={sectionId}
                    value={sectionId}
                    whileDrag={{ scale: 1.01, boxShadow: '0 10px 24px rgba(15, 23, 42, 0.14)' }}
                    className="relative rounded-lg border border-gray-100 bg-white/80 p-2"
                >
            {sectionId === 'primaryDS' && (
            <div className="w-full">
                <div className="mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {getTypeLabel()} {activeDS.length > 0 && `(${activeDS.length})`}
                </div>
                <div className="flex items-center gap-2 w-full overflow-x-auto px-1 scrollbar-hide min-h-[44px]">
                    <AnimatePresence mode='popLayout'>
                        {activeDS.map((item, index) => {
                            const id = typeof item === 'object' ? item.id : item;
                            const priority = typeof item === 'object' ? (item.d ?? item.k ?? '') : '';
                            const label = nodeLabelMap[id] || id.toString().replace('node-', '');
                            const isSccToken = selectedAlgorithm === 'scc';
                            const tokenKey = isSccToken ? String(id) : `${id}-${index}`;
                            const tokenLayoutId = isSccToken ? `scc-token-${id}` : undefined;

                            return (
                                <motion.div
                                    key={tokenKey}
                                    layoutId={tokenLayoutId}
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
            )}

            {sectionId === 'parent' && (
            <div className="w-full">
                <div className="mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Parent Array
                </div>
                <div className="flex items-center gap-2 w-full overflow-x-auto px-1 scrollbar-hide min-h-[44px]">
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
            )}

            {sectionId === 'visited' && (
            <div className="w-full">
                <div className="mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Visited Order
                </div>
                <div className="flex items-center gap-1 w-full overflow-x-auto px-1 scrollbar-hide min-h-[36px]">
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
            )}

            {sectionId === 'scc' && (
                <div className="w-full">
                    <div className="mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Components ({components?.length || 0})
                    </div>
                    <div className="flex items-center gap-2 w-full overflow-x-auto px-1 scrollbar-hide min-h-[44px]">
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
                                        <motion.div
                                            key={nodeId}
                                            layoutId={`scc-token-${nodeId}`}
                                            className="text-xs font-medium text-purple-900 px-1.5 py-0.5 rounded bg-white/80 border border-purple-200"
                                        >
                                            {nodeLabelMap[nodeId] || nodeId}
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {(!components || components.length === 0) && <div className="text-gray-400 text-sm italic w-full text-center mt-2">No components found</div>}
                    </div>
                </div>
                )}

                {sectionId === 'ap' && (
                <APStateTable internalState={internalState} nodeLabelMap={nodeLabelMap} />
                )}

                {sectionId === 'floyd' && (
                <FloydWarshallState internalState={internalState} nodeLabelMap={nodeLabelMap} nodes={nodes} />
                )}

                {sectionId === 'routing' && (
                <RoutingAlgorithmState 
                    lsdb={lsdb} 
                    routingTable={routingTable} 
                    activeTableNodeId={activeTableNodeId}
                    nodeLabelMap={nodeLabelMap}
                    selectedAlgorithm={selectedAlgorithm}
                    internalState={internalState}
                />
                )}

                    </Reorder.Item>
                ))}
                </Reorder.Group>
            </LayoutGroup>

            <button
                type="button"
                aria-label="Resize data structure panel"
                onPointerDown={startResizing}
                className="absolute bottom-2 right-2 h-5 w-5 cursor-se-resize rounded-sm bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400"
            >
                <span className="pointer-events-none absolute bottom-1 right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-white/90" />
            </button>
        </motion.div>
    );
};

export default DataStructurePanel;
