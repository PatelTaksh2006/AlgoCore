import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Check, ArrowRight } from 'lucide-react';
import { createPortal } from 'react-dom';

const InteractionModal = ({
    isOpen,
    onClose,
    position,
    type, // 'node', 'edge', 'new-edge'
    data, // { id, label } for node, { id, weight } for edge, { source, target } for new-edge
    onSave, // (data) => void
    onDelete, // () => void
}) => {
    const modalRef = useRef(null);
    const [formData, setFormData] = useState({});
    const [adjustedPos, setAdjustedPos] = useState({ x: 0, y: 0 });

    // Initialize form data when data prop changes
    useEffect(() => {
        if (data) {
            setFormData({ ...data });
        }
    }, [data]);

    // Adjust position to stay within viewport
    useLayoutEffect(() => {
        if (!isOpen || !modalRef.current) {
            setAdjustedPos(position);
            return;
        }

        // Wait a frame for the modal to render so we can measure it
        requestAnimationFrame(() => {
            if (!modalRef.current) return;

            const rect = modalRef.current.getBoundingClientRect();
            const modalWidth = rect.width;
            const modalHeight = rect.height;
            const padding = 12;

            let x = position.x;
            let y = position.y;

            // Default: center horizontally, position above click point
            let finalX = x;
            let finalY = y - modalHeight - 10;

            // If it goes above viewport, flip to below
            if (finalY < padding) {
                finalY = y + 20;
            }

            // If it goes below viewport, clamp
            if (finalY + modalHeight > window.innerHeight - padding) {
                finalY = window.innerHeight - modalHeight - padding;
            }

            // Keep within horizontal bounds (modal is centered with -translate-x-1/2)
            const halfWidth = modalWidth / 2;
            if (finalX - halfWidth < padding) {
                finalX = halfWidth + padding;
            }
            if (finalX + halfWidth > window.innerWidth - padding) {
                finalX = window.innerWidth - halfWidth - padding;
            }

            setAdjustedPos({ x: finalX, y: finalY });
        });
    }, [isOpen, position]);

    const handleSave = useCallback(() => {
        onSave(formData);
        onClose();
    }, [formData, onSave, onClose]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Handle Escape + Enter keys
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
            if (event.key === 'Enter') {
                event.preventDefault();
                handleSave();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, handleSave]);

    if (!isOpen) return null;

    const style = {
        left: adjustedPos.x,
        top: adjustedPos.y,
    };

    const modalContent = (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            style={style}
            ref={modalRef}
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64 transform -translate-x-1/2"
            onClick={(e) => e.stopPropagation()} // Prevent click through
        >
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase">
                    {type === 'node' ? 'Edit Node' : type === 'edge' ? 'Edit Edge' : 'New Edge'}
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-3">
                {type === 'node' && (
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500">Label</label>
                        <input
                            type="text"
                            value={formData.label || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                            className="w-full p-2 border rounded text-sm focus:border-blue-500 outline-none"
                            autoFocus
                        />
                    </div>
                )}

                {(type === 'edge' || type === 'new-edge') && (
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500">Weight</label>
                        <input
                            type="number"
                            value={formData.weight ?? ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                            onBlur={(e) => {
                                // If empty or invalid on blur, default to 1
                                const val = parseInt(e.target.value);
                                if (isNaN(val) || e.target.value === '') {
                                    setFormData(prev => ({ ...prev, weight: 1 }));
                                }
                            }}
                            className="w-full p-2 border rounded text-sm focus:border-blue-500 outline-none"
                            autoFocus
                        />
                    </div>
                )}

                {/* For New Edge, maybe Direction? The prompt asks for Direction in the modal. */}


                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleSave}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-sm font-medium flex items-center justify-center gap-1"
                    >
                        <Check className="w-3 h-3" /> Save
                    </button>
                    {type !== 'new-edge' && (
                        <button
                            onClick={() => { onDelete(); onClose(); }}
                            className="px-3 bg-red-100 hover:bg-red-200 text-red-600 rounded text-sm font-medium flex items-center justify-center"
                            title="Delete"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );

    return createPortal(
        <AnimatePresence>
            {isOpen && modalContent}
        </AnimatePresence>,
        document.body
    );
};

export default InteractionModal;
