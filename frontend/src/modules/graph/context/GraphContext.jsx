import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { saveGraphState, loadGraphState } from '../../../utils/persistenceUtils';
import { createNode, createEdge } from '../model/graphModel.ts';
import { edgeExists, normalizeNodesForLoad, normalizeEdgesForLoad } from '../model/graphUtils.ts';

const GraphContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useGraph = () => useContext(GraphContext);

export const GraphProvider = ({ children }) => {
    // Initialize from localStorage if available
    const initialState = loadGraphState();
    const [nodes, setNodes] = useState(initialState?.nodes ?? []);
    const [edges, setEdges] = useState(initialState?.edges ?? []);
    const [isDirected, setIsDirected] = useState(initialState?.isDirected ?? false);
    const [selectedNodeForEdge, setSelectedNodeForEdge] = useState(null); // For two-click edge creation
    const persistTimeoutRef = useRef(null);

    // Save graph state to localStorage whenever it changes
    useEffect(() => {
        if (persistTimeoutRef.current) {
            clearTimeout(persistTimeoutRef.current);
        }

        persistTimeoutRef.current = setTimeout(() => {
            saveGraphState(nodes, edges, isDirected);
        }, 150);

        return () => {
            if (persistTimeoutRef.current) {
                clearTimeout(persistTimeoutRef.current);
            }
        };
    }, [nodes, edges, isDirected]);

    const addNode = useCallback((x, y) => {
        setNodes((prev) => {
            const newNode = createNode(`node-${Date.now()}`, `${prev.length}`, x, y);
            return [...prev, newNode];
        });
    }, []);

    const updateNodePos = useCallback((id, x, y) => {
        setNodes((prev) => {
            const nodeIndex = prev.findIndex((node) => node.id === id);
            if (nodeIndex === -1) {
                return prev;
            }

            const existingNode = prev[nodeIndex];
            if (existingNode.x === x && existingNode.y === y) {
                return prev;
            }

            const nextNodes = [...prev];
            nextNodes[nodeIndex] = { ...existingNode, x, y };
            return nextNodes;
        });
    }, []);

    const addEdge = useCallback((sourceId, targetId, weight = 1) => {
        if (sourceId === targetId) return;

        setEdges((prev) => {
            const exists = edgeExists(prev, sourceId, targetId, isDirected);
            if (exists) return prev;

            const newEdge = createEdge(
                `edge-${Date.now()}`,
                sourceId,
                targetId,
                parseInt(weight, 10) || 1
            );
            return [...prev, newEdge];
        });
    }, [isDirected]);

    const updateEdgeWeight = useCallback((id, weight) => {
        setEdges(prev => prev.map(e => e.id === id ? { ...e, weight: parseInt(weight) || 1 } : e));
    }, []);

    const updateNodeLabel = useCallback((id, label) => {
        setNodes(prev => prev.map(n => n.id === id ? { ...n, label } : n));
    }, []);

    const removeEdge = useCallback((edgeId) => {
        setEdges(prev => prev.filter(e => e.id !== edgeId));
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
        setNodes(normalizeNodesForLoad(newNodes));
        setEdges(normalizeEdgesForLoad(newEdges));
        setIsDirected(newIsDirected);
    }, []);

    return (
        <GraphContext.Provider value={{
            nodes, edges, isDirected, setIsDirected,
            addNode, updateNodePos, removeNode,
            addEdge, updateEdgeWeight, updateNodeLabel, removeEdge, resetGraph, clearClassification,
            setEdgeClassification, setNodeColor, loadGraphData,
            setNodes, setEdges,
            selectedNodeForEdge, setSelectedNodeForEdge
        }}>
            {children}
        </GraphContext.Provider>
    );
};
