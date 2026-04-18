import React, { useMemo, useRef } from 'react';
import { useGraph } from '../context/GraphContext';
import Node from './Node';
import Edge from './Edge';
import useGraphStore from '../store/useGraphStore';

const GraphCanvas = () => {
    const { nodes, edges, updateNodePos, isDirected, addNode, selectedNodeForEdge, setSelectedNodeForEdge } = useGraph();
    const resultData = useGraphStore((state) => state.resultData);
    const canvasRef = useRef(null);

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

    const handleDoubleClick = (e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
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

    return (
        <div
            ref={canvasRef}
            className="w-full h-full relative overflow-hidden bg-dot-pattern"
            onDoubleClick={handleDoubleClick}
            onClick={handleCanvasClick}
            style={{
                backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}
        >
            {/* SVG Layer for Edges */}
            <svg className="absolute inset-0 w-full h-full">
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

                    // Calculate path exactly like Edge.jsx does (ignoring curvature for straight simple path)
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
                            strokeWidth="5" // Thicker than everything else
                            markerEnd={isDirected ? "url(#arrowhead-solution)" : undefined}
                            // Added glow/shadow to overlay for maximum visibility
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
                />
            ))}

            <div className="absolute bottom-4 left-4 text-sm text-gray-400 pointer-events-none">
                {selectedNodeForEdge 
                    ? <span className="text-purple-500">Click another node to connect</span>
                    : 'Double-click canvas: add node | Click node: start edge | Double-click node: edit | Click edge: edit'
                }
            </div>
        </div>
    );
};

export default GraphCanvas;
