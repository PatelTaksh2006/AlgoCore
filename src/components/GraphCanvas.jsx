import React, { useRef } from 'react';
import { useGraph } from '../context/GraphContext';
import Node from './Node';
import Edge from './Edge';

const GraphCanvas = () => {
    const { nodes, edges, updateNodePos, isDirected, addNode } = useGraph();
    const canvasRef = useRef(null);

    const handleDoubleClick = (e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        addNode(x, y);
    };

    return (
        <div
            ref={canvasRef}
            className="w-full h-full relative overflow-hidden bg-dot-pattern"
            onDoubleClick={handleDoubleClick}
            // Could add grid background via css
            style={{
                backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}
        >
            {/* SVG Layer for Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="28" // Offset to clear node radius (approx)
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
                    </marker>
                    {/* Dynamic markers could be added for different edge colors */}
                </defs>
                {edges.map(edge => (
                    <Edge
                        key={edge.id}
                        edge={edge}
                        sourceNode={nodes.find(n => n.id === edge.source)}
                        targetNode={nodes.find(n => n.id === edge.target)}
                        isDirected={isDirected}
                    />
                ))}
            </svg>

            {/* HTML Layer for Nodes */}
            {nodes.map(node => (
                <Node
                    key={node.id}
                    node={node}
                    updatePos={updateNodePos}
                />
            ))}

            <div className="absolute bottom-4 left-4 text-sm text-gray-400 pointer-events-none">
                Double click to add node. Drag to move.
            </div>
        </div>
    );
};

export default GraphCanvas;
