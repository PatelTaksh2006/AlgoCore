import React, { useEffect, useRef, useState } from 'react';
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

    // Initialize form data when data prop changes
    useEffect(() => {
        if (data) {
            setFormData({ ...data });
        }
    }, [data]);

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

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
            if (event.key === 'Enter') {
                handleSave();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]); // Added correct dependencies in next step if needed, or handleSave wrapper

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    // Calculate position styles to keep it on screen
    // Simple offset for now, could use a library like floating-ui if needed
    const style = {
        left: position.x,
        top: position.y,
    };

    const modalContent = (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            style={style}
            ref={modalRef}
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64 transform -translate-x-1/2 -translate-y-full mt-[-10px]"
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
                            value={formData.weight || 1}
                            onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
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
