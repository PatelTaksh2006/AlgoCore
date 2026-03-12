import React, { useState, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import useGraphStore from '../store/useGraphStore';
import { useGraph } from '../context/GraphContext';
import InteractionModal from './InteractionModal';

const Node = ({ node, updatePos, isHighlighted }) => {
    const { internalState, resultData } = useGraphStore();
    const { selectedNodeForEdge, setSelectedNodeForEdge, addEdge, updateNodeLabel, removeNode } = useGraph();
    const [showEditModal, setShowEditModal] = useState(false);
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);

    // Determine if this node is part of the final shortest path overlay
    const isPathNode = resultData?.type === 'dijkstraPath' && resultData.pathNodes.includes(node.id);
    
    // Check if this node is selected for edge creation
    const isSelectedForEdge = selectedNodeForEdge === node.id;

    const handleClick = (e) => {
        // Don't handle click if we were dragging
        if (isDraggingRef.current) {
            isDraggingRef.current = false;
            return;
        }
        
        e.stopPropagation();
        
        // Handle edge creation on single click
        if (selectedNodeForEdge === null) {
            // First node selection
            setSelectedNodeForEdge(node.id);
        } else if (selectedNodeForEdge !== node.id) {
            // Second node selection - create edge
            addEdge(selectedNodeForEdge, node.id, 1);
            setSelectedNodeForEdge(null);
        } else {
            // Clicked same node - deselect
            setSelectedNodeForEdge(null);
        }
    };

    const handleDoubleClick = (e) => {
        e.stopPropagation();
        // Open edit modal
        setModalPosition({ x: e.clientX, y: e.clientY });
        setShowEditModal(true);
        setSelectedNodeForEdge(null); // Cancel any edge selection
    };

    const handleDragStart = () => {
        isDraggingRef.current = true;
    };

    const handleSave = (data) => {
        if (data.label !== undefined) {
            updateNodeLabel(node.id, data.label);
        }
    };

    const handleDelete = () => {
        removeNode(node.id);
    };

    return (
        <>
            <motion.div
                drag
                dragMomentum={false}
                onDragStart={handleDragStart}
                onDragEnd={() => {
                    // Reset dragging flag after a short delay to allow click to be ignored
                    setTimeout(() => { isDraggingRef.current = false; }, 50);
                }}
                onDrag={(_, info) => {
                    isDraggingRef.current = true;
                    updatePos(node.id, node.x + info.delta.x, node.y + info.delta.y);
                }}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                initial={{ x: node.x, y: node.y }}
                animate={{
                    x: node.x,
                    y: node.y,
                    scale: (node.color || isPathNode || isSelectedForEdge) ? 1.1 : 1,
                    borderColor: isSelectedForEdge ? '#8b5cf6' : isPathNode ? '#22c55e' : (node.color || '#e5e7eb'),
                    backgroundColor: isSelectedForEdge ? '#ede9fe' : isPathNode ? '#dcfce7' : (node.color ? '#eff6ff' : '#ffffff'),
                    borderWidth: isSelectedForEdge ? 4 : isPathNode ? 4 : 2,
                    boxShadow: isSelectedForEdge ? '0 0 12px rgba(139, 92, 246, 0.5)' : undefined
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={cn(
                    "absolute w-12 h-12 rounded-full border flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing select-none z-10"
                )}
                style={{
                    // Center the node on x,y
                    marginLeft: -24,
                    marginTop: -24
                }}
            >
                <span className="font-semibold text-gray-700">{node.label}</span>
            </motion.div>
            
            <InteractionModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                position={modalPosition}
                type="node"
                data={{ label: node.label }}
                onSave={handleSave}
                onDelete={handleDelete}
            />
        </>
    );
};

export default Node;
