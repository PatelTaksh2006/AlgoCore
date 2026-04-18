import React, { useMemo, useRef, useState, useCallback } from 'react';
import { useGraph } from '../context/GraphContext';
import Node from './Node';
import Edge from './Edge';
import useGraphStore from '../store/useGraphStore';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.15;

const GraphCanvas = () => {
    const { nodes, edges, updateNodePos, isDirected, addNode, selectedNodeForEdge, setSelectedNodeForEdge } = useGraph();
    const resultData = useGraphStore((state) => state.resultData);
    const canvasRef = useRef(null);

    // Zoom & pan state
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const isPanningRef = useRef(false);
    const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

    const nodeById = useMemo(() => {
        const map = new Map();
        for (const node of nodes) {
            map.set(node.id, node);
        }
        return map;
    }, [nodes]);

    const pathNodeSet = useMemo(() => {
        if (resultData?.type !== 'dijkstraPath' || !Array.isArray(resultData.pathNodes)) {
            return new Set();
        }
        return new Set(resultData.pathNodes);
    }, [resultData]);

    // Convert screen coords to canvas coords (accounting for zoom + pan)
    const screenToCanvas = useCallback((clientX, clientY) => {
        if (!canvasRef.current) return { x: clientX, y: clientY };
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (clientX - rect.left - pan.x) / zoom;
        const y = (clientY - rect.top - pan.y) / zoom;
        return { x, y };
    }, [zoom, pan]);

    const handleDoubleClick = (e) => {
        if (!canvasRef.current) return;
        const { x, y } = screenToCanvas(e.clientX, e.clientY);
        addNode(x, y);
    };

    const handleCanvasClick = (e) => {
        // Only clear selection if clicking directly on canvas (not on nodes)
        if (e.target === canvasRef.current || e.target.closest('svg')) {
            if (selectedNodeForEdge) {
                setSelectedNodeForEdge(null);
            }
        }
    };

    // Zoom with mouse wheel
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        setZoom(prev => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
    }, []);

    // Pan with middle mouse or Ctrl+click
    const handleMouseDown = useCallback((e) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            e.preventDefault();
            isPanningRef.current = true;
            panStartRef.current = {
                x: e.clientX,
                y: e.clientY,
                panX: pan.x,
                panY: pan.y,
            };

            const handleMouseMove = (moveE) => {
                if (!isPanningRef.current) return;
                const dx = moveE.clientX - panStartRef.current.x;
                const dy = moveE.clientY - panStartRef.current.y;
                setPan({
                    x: panStartRef.current.panX + dx,
                    y: panStartRef.current.panY + dy,
                });
            };

            const handleMouseUp = () => {
                isPanningRef.current = false;
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };

            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
    }, [pan]);

    const handleZoomIn = () => setZoom(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
    const handleZoomOut = () => setZoom(prev => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
    const handleResetView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    return (
        <div
            ref={canvasRef}
            className="w-full h-full relative overflow-hidden bg-dot-pattern"
            onDoubleClick={handleDoubleClick}
            onClick={handleCanvasClick}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            style={{
                backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                backgroundPosition: `${pan.x}px ${pan.y}px`,
            }}
        >
            {/* Zoom Controls */}
            <div className="absolute top-3 right-3 z-30 flex flex-col gap-1">
                <button
                    onClick={handleZoomIn}
                    className="w-8 h-8 bg-white/90 hover:bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors backdrop-blur-sm"
                    title="Zoom In"
                >
                    <ZoomIn className="w-4 h-4" />
                </button>
                <button
                    onClick={handleZoomOut}
                    className="w-8 h-8 bg-white/90 hover:bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors backdrop-blur-sm"
                    title="Zoom Out"
                >
                    <ZoomOut className="w-4 h-4" />
                </button>
                <button
                    onClick={handleResetView}
                    className="w-8 h-8 bg-white/90 hover:bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors backdrop-blur-sm"
                    title="Reset View"
                >
                    <Maximize2 className="w-4 h-4" />
                </button>
                <div className="text-[9px] text-gray-400 text-center font-mono mt-0.5">
                    {Math.round(zoom * 100)}%
                </div>
            </div>

            {/* Zoomable + Pannable layer */}
            <div
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                }}
            >
                {/* SVG Layer for Edges */}
                <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                    <defs>
                        <marker id="arrowhead-default" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
                        </marker>
                        <marker id="arrowhead-tree" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb" />
                        </marker>
                        <marker id="arrowhead-solution" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
                        </marker>
                        <marker id="arrowhead-back" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#dc2626" />
                        </marker>
                        <marker id="arrowhead-forward" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#16a34a" />
                        </marker>
                        <marker id="arrowhead-cross" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#111827" />
                        </marker>
                    </defs>
                    {edges.map(edge => (
                        <Edge
                            key={edge.id}
                            edge={edge}
                            sourceNode={nodeById.get(edge.source)}
                            targetNode={nodeById.get(edge.target)}
                            isDirected={isDirected}
                        />
                    ))}
                    
                    {/* Highlighted Dijkstra Path Overlay */}
                    {resultData?.type === 'dijkstraPath' && resultData.pathEdges.map((edge, idx) => {
                        const sourceNode = nodeById.get(edge.source);
                        const targetNode = nodeById.get(edge.target);
                        if (!sourceNode || !targetNode) return null;

                        const dx = targetNode.x - sourceNode.x;
                        const dy = targetNode.y - sourceNode.y;
                        const len = Math.sqrt(dx * dx + dy * dy);
                        if (len === 0) return null;
                        const nx = dx / len;
                        const ny = dy / len;
                        const startX = sourceNode.x + nx * 24;
                        const startY = sourceNode.y + ny * 24;
                        const endX = targetNode.x - nx * 24;
                        const endY = targetNode.y - ny * 24;

                        return (
                            <path
                                key={`path-overlay-${idx}`}
                                d={`M ${startX} ${startY} L ${endX} ${endY}`}
                                fill="transparent"
                                stroke="#22c55e"
                                strokeWidth="5"
                                markerEnd={isDirected ? "url(#arrowhead-solution)" : undefined}
                                style={{ filter: "drop-shadow(0px 0px 4px rgba(34,197,94,0.6))" }}
                            />
                        );
                    })}
                </svg>

                {/* HTML Layer for Nodes */}
                {nodes.map(node => (
                    <Node
                        key={node.id}
                        node={node}
                        updatePos={updateNodePos}
                        isPathNode={pathNodeSet.has(node.id)}
                        zoom={zoom}
                    />
                ))}
            </div>

            <div className="absolute bottom-4 left-4 text-sm text-gray-400 pointer-events-none z-20">
                {selectedNodeForEdge 
                    ? <span className="text-purple-500">Click another node to connect</span>
                    : 'Double-click: add node | Click node: start edge | Scroll: zoom | Alt+drag: pan'
                }
            </div>
        </div>
    );
};

export default GraphCanvas;
