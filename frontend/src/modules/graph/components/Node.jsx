import React, { memo, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { useGraph } from '../context/GraphContext';
import { useAlgorithm } from '../../algorithm/context/AlgorithmContext';
import InteractionModal from './InteractionModal';

const Node = ({ node, updatePos, isPathNode = false, zoom = 1 }) => {
    const { selectedNodeForEdge, setSelectedNodeForEdge, addEdge, updateNodeLabel, removeNode } = useGraph();
    const { isPlaying } = useAlgorithm();
    const [showEditModal, setShowEditModal] = useState(false);
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);
    const dragStateRef = useRef(null);
    
    // Check if this node is selected for edge creation
    const isSelectedForEdge = selectedNodeForEdge === node.id;

    const handleClick = (e) => {
        if (isPlaying) {
            return;
        }

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
        if (isPlaying) {
            return;
        }

        e.stopPropagation();
        // Open edit modal
        setModalPosition({ x: e.clientX, y: e.clientY });
        setShowEditModal(true);
        setSelectedNodeForEdge(null); // Cancel any edge selection
    };

    const handleDragStart = () => {
        isDraggingRef.current = true;
    };

    const handlePointerDown = (event) => {
        if (isPlaying) {
            return;
        }

        if (event.button !== 0) return;
        event.stopPropagation();

        handleDragStart();
        dragStateRef.current = {
            startClientX: event.clientX,
            startClientY: event.clientY,
            startNodeX: node.x,
            startNodeY: node.y,
            hasMoved: false,
        };

        const handlePointerMove = (moveEvent) => {
            const dragState = dragStateRef.current;
            if (!dragState) return;

            const dx = moveEvent.clientX - dragState.startClientX;
            const dy = moveEvent.clientY - dragState.startClientY;

            if (!dragState.hasMoved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
                dragState.hasMoved = true;
            }

            updatePos(node.id, dragState.startNodeX + dx / zoom, dragState.startNodeY + dy / zoom);
        };

        const handlePointerUp = () => {
            const dragState = dragStateRef.current;
            dragStateRef.current = null;

            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);

            if (dragState?.hasMoved) {
                // Keep one click ignored immediately after drag to avoid accidental edge creation.
                setTimeout(() => {
                    isDraggingRef.current = false;
                }, 0);
                return;
            }

            isDraggingRef.current = false;
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    const handleSave = (data) => {
        if (isPlaying) {
            return;
        }

        if (data.label !== undefined) {
            updateNodeLabel(node.id, data.label);
        }
    };

    const handleDelete = () => {
        if (isPlaying) {
            return;
        }

        removeNode(node.id);
    };

    return (
        <>
            <motion.div
                data-pan-block="true"
                onPointerDown={handlePointerDown}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                initial={false}
                animate={{
                    scale: isSelectedForEdge ? 1.1 : 1,
                    borderColor: isSelectedForEdge ? '#8b5cf6' : '#e5e7eb',
                    backgroundColor: isSelectedForEdge ? '#ede9fe' : '#ffffff',
                    borderWidth: isSelectedForEdge ? 4 : 2,
                    boxShadow: isSelectedForEdge ? '0 0 12px rgba(139, 92, 246, 0.5)' : undefined
                }}
                transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.35 }}
                className={cn(
                    "absolute w-12 h-12 rounded-full border flex items-center justify-center shadow-md select-none z-10",
                    isPlaying ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
                )}
                style={{
                    left: node.x,
                    top: node.y,
                    marginLeft: -24,
                    marginTop: -24,
                    touchAction: 'none',
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

export default memo(Node);
