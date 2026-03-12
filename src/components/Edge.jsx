import React, { useState } from 'react';
import { useGraph } from '../context/GraphContext';
import InteractionModal from './InteractionModal';

const Edge = ({ edge, sourceNode, targetNode, isDirected }) => {
    const { updateEdgeWeight, removeEdge } = useGraph();
    const [showEditModal, setShowEditModal] = useState(false);
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
    
    if (!sourceNode || !targetNode) return null;

    // Calculate distinct colors/styles based on classification
    let strokeColor = '#9ca3af'; // gray-400
    let strokeDasharray = '0';
    let strokeWidth = 2;

    let markerId = "url(#arrowhead-default)";

    if (edge.classification === 'tree') {
        strokeColor = '#2563eb'; // blue-600
        strokeWidth = 3;
        markerId = "url(#arrowhead-tree)";
    } else if (edge.classification === 'solution') {
        strokeColor = '#22c55e'; // green-500
        strokeWidth = 4;
        markerId = "url(#arrowhead-solution)";
    } else if (edge.classification === 'back') {
        strokeColor = '#dc2626'; // red-600
        strokeDasharray = '5,5';
        markerId = "url(#arrowhead-back)";
    } else if (edge.classification === 'forward') {
        strokeColor = '#16a34a'; // green-600
        strokeDasharray = '4,2';
        markerId = "url(#arrowhead-forward)";
    } else if (edge.classification === 'cross') {
        strokeColor = '#d97706'; // amber-600
        strokeDasharray = '2,2';
        markerId = "url(#arrowhead-cross)";
    }

    const midX = (sourceNode.x + targetNode.x) / 2;
    const midY = (sourceNode.y + targetNode.y) / 2;

    const handleClick = (e) => {
        e.stopPropagation();
        // Single click opens edit modal
        setModalPosition({ x: e.clientX, y: e.clientY });
        setShowEditModal(true);
    };

    const handleSave = (data) => {
        if (data.weight !== undefined) {
            updateEdgeWeight(edge.id, data.weight);
        }
    };

    const handleDelete = () => {
        removeEdge(edge.id);
    };

    return (
        <>
            <g style={{ pointerEvents: 'stroke', cursor: 'pointer' }} onClick={handleClick}>
                {/* Invisible wider line for easier clicking */}
                <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke="transparent"
                    strokeWidth={15}
                />
                <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    markerEnd={isDirected ? markerId : undefined}
                />
                {edge.weight !== 1 && (
                    <g>
                        <rect
                            x={midX - 12}
                            y={midY - 10}
                            width={24}
                            height={16}
                            rx={4}
                            fill="white"
                            stroke="#e5e7eb"
                            strokeWidth={1}
                        />
                        <text
                            x={midX}
                            y={midY + 3}
                            fill="#4b5563"
                            fontSize="11"
                            fontWeight="bold"
                            textAnchor="middle"
                        >
                            {edge.weight}
                        </text>
                    </g>
                )}
            </g>
            {showEditModal && (
                <foreignObject x={0} y={0} width={1} height={1} overflow="visible">
                    <InteractionModal
                        isOpen={showEditModal}
                        onClose={() => setShowEditModal(false)}
                        position={modalPosition}
                        type="edge"
                        data={{ weight: edge.weight }}
                        onSave={handleSave}
                        onDelete={handleDelete}
                    />
                </foreignObject>
            )}
        </>
    );
};

export default Edge;
