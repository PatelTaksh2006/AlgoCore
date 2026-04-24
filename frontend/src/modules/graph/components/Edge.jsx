import React, { useState } from 'react';
import { useGraph } from '../context/GraphContext';
import { useAlgorithm } from '../../algorithm/context/AlgorithmContext';
import InteractionModal from './InteractionModal';

const Edge = ({ edge, sourceNode, targetNode, isDirected }) => {
    const { updateEdgeWeight, removeEdge, isTransposedView } = useGraph();
    const { isPlaying } = useAlgorithm();
    const [showEditModal, setShowEditModal] = useState(false);
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
    
    if (!sourceNode || !targetNode) return null;

    const renderedSource = isTransposedView ? targetNode : sourceNode;
    const renderedTarget = isTransposedView ? sourceNode : targetNode;

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
        strokeColor = '#111827'; // gray-900
        strokeDasharray = '2,2';
        markerId = "url(#arrowhead-cross)";
    } else if (edge.classification === 'cycle') {
        strokeColor = '#b91c1c'; // red-700
        strokeDasharray = '6,4';
        markerId = "url(#arrowhead-back)";
    }

    const midX = (renderedSource.x + renderedTarget.x) / 2;
    const midY = (renderedSource.y + renderedTarget.y) / 2;

    const handleClick = (e) => {
        if (isPlaying) {
            return;
        }

        e.stopPropagation();
        // Single click opens edit modal
        setModalPosition({ x: e.clientX, y: e.clientY });
        setShowEditModal(true);
    };

    const handleSave = (data) => {
        if (isPlaying) {
            return;
        }

        if (data.weight !== undefined) {
            updateEdgeWeight(edge.id, data.weight);
        }
    };

    const handleDelete = () => {
        if (isPlaying) {
            return;
        }

        removeEdge(edge.id);
    };

    return (
        <>
            <g data-pan-block="true" style={{ pointerEvents: 'stroke', cursor: isPlaying ? 'not-allowed' : 'pointer' }} onClick={handleClick}>
                {/* Invisible wider line for easier clicking */}
                <line
                    x1={renderedSource.x}
                    y1={renderedSource.y}
                    x2={renderedTarget.x}
                    y2={renderedTarget.y}
                    stroke="transparent"
                    strokeWidth={15}
                />
                <line
                    x1={renderedSource.x}
                    y1={renderedSource.y}
                    x2={renderedTarget.x}
                    y2={renderedTarget.y}
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
