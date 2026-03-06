import React, { createContext, useContext, useState, useCallback } from 'react';

const GraphContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useGraph = () => useContext(GraphContext);

export const GraphProvider = ({ children }) => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [isDirected, setIsDirected] = useState(false);

    const addNode = useCallback((x, y) => {
        setNodes((prev) => {
            const newNode = {
                id: `node-${Date.now()}`,
                label: `${prev.length}`, // 0-indexed labels are often easier
                x,
                y,
                originalPos: { x, y },
                treePos: null,
            };
            return [...prev, newNode];
        });
    }, []);

    const updateNodePos = useCallback((id, x, y) => {
        setNodes((prev) => prev.map(n => n.id === id ? { ...n, x, y } : n));
    }, []);

    const addEdge = useCallback((sourceId, targetId, weight = 1) => {
        if (sourceId === targetId) return;

        setEdges((prev) => {
            const exists = prev.some(e =>
                (e.source === sourceId && e.target === targetId) ||
                (!isDirected && e.source === targetId && e.target === sourceId)
            );
            if (exists) return prev;

            const newEdge = {
                id: `edge-${Date.now()}`,
                source: sourceId,
                target: targetId,
                weight: parseInt(weight) || 1,
                classification: null, // 'tree', 'back', 'forward', 'cross'
            };
            return [...prev, newEdge];
        });
    }, [isDirected]);

    const updateEdgeWeight = useCallback((id, weight) => {
        setEdges(prev => prev.map(e => e.id === id ? { ...e, weight: parseInt(weight) || 1 } : e));
    }, []);

    const setEdgeClassification = useCallback((edgeId, classification) => {
        setEdges(prev => prev.map(e => e.id === edgeId ? { ...e, classification } : e));
    }, []);

    const setNodeColor = useCallback((nodeId, color) => {
        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, color } : n));
    }, []);

    const removeNode = useCallback((nodeId) => {
        setNodes(prev => prev.filter(n => n.id !== nodeId));
        setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
    }, []);

    const resetGraph = useCallback(() => {
        setNodes([]);
        setEdges([]);
    }, []);

    const clearClassification = useCallback(() => {
        setEdges((prev) => prev.map(e => ({ ...e, classification: null })));
    }, []);

    const loadGraphData = useCallback((newNodes, newEdges, newIsDirected) => {
        setNodes(newNodes.map(n => ({
            ...n,
            originalPos: { x: n.x, y: n.y },
            treePos: null
        })));
        setEdges(newEdges.map(e => ({
            ...e,
            classification: null
        })));
        setIsDirected(newIsDirected);
    }, []);

    return (
        <GraphContext.Provider value={{
            nodes, edges, isDirected, setIsDirected,
            addNode, updateNodePos, removeNode,
            addEdge, updateEdgeWeight, resetGraph, clearClassification,
            setEdgeClassification, setNodeColor, loadGraphData,
            setNodes, setEdges
        }}>
            {children}
        </GraphContext.Provider>
    );
};
