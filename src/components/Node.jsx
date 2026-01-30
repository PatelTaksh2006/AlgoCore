import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const Node = ({ node, updatePos, isHighlighted }) => {
    return (
        <motion.div
            drag
            dragMomentum={false}
            onDragEnd={() => {
                // We need to calculate new position relative to parent
                // For simplicity, we might just use the visual delta or ref.
                // But better: update state with new x,y.
                // Framer motion modifies the transform, but we need to update state for edges to follow.
                // We'll trust the parent handles the coordinate space or passing a handler that reads the DOM.
                // Actually, easiest is to use onDrag to update state continuously for smooth edges.
            }}
            onDrag={(_, info) => {
                updatePos(node.id, node.x + info.delta.x, node.y + info.delta.y);
            }}
            initial={{ x: node.x, y: node.y }}
            animate={{
                x: node.x,
                y: node.y,
                scale: node.color ? 1.1 : 1,
                borderColor: node.color || '#e5e7eb',
                backgroundColor: node.color ? '#eff6ff' : '#ffffff' // Light blue tint if colored, else white
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
                "absolute w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing select-none z-10",
                // Remove dynamic classes that clash with inline styles or just keep base
            )}
            style={{
                // Center the node on x,y
                marginLeft: -24,
                marginTop: -24
            }}
        >
            <span className="font-semibold text-gray-700">{node.label}</span>
        </motion.div>
    );
};

export default Node;
