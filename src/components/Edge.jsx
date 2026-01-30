import React from 'react';

const Edge = ({ edge, sourceNode, targetNode, isDirected }) => {
    if (!sourceNode || !targetNode) return null;

    // Calculate distinct colors/styles based on classification
    let strokeColor = '#9ca3af'; // gray-400
    let strokeDasharray = '0';
    let strokeWidth = 2;

    if (edge.classification === 'tree') {
        strokeColor = '#2563eb'; // blue-600
        strokeWidth = 3;
    } else if (edge.classification === 'back') {
        strokeColor = '#dc2626'; // red-600
        strokeDasharray = '5,5';
    } else if (edge.classification === 'forward') {
        strokeColor = '#16a34a'; // green-600
        strokeDasharray = '4,2';
    } else if (edge.classification === 'cross') {
        strokeColor = '#d97706'; // amber-600
        strokeDasharray = '2,2';
    }

    // Calculate control point for curvature if needed (e.g. bidirectional edges overlapping)
    // For basic v1, straight lines.

    return (
        <g>
            <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                markerEnd={isDirected ? "url(#arrowhead)" : undefined}
            />
            {edge.weight !== 1 && (
                <text
                    x={(sourceNode.x + targetNode.x) / 2}
                    y={(sourceNode.y + targetNode.y) / 2}
                    fill="#4b5563"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                    dy="-5"
                    className="bg-white" // This doesn't work in SVG text, usually need a filter or rect background
                >
                    {edge.weight}
                </text>
            )}
        </g>
    );
};

export default Edge;
