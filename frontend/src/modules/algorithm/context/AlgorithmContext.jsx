import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGraph } from '../../graph/context/GraphContext';
import { createAlgorithmGenerator } from '../engine/algorithmEngine.js';
import { createStepInterpreter } from '../../simulation/interpreter/createStepInterpreter.js';
import { useSimulationController } from '../../simulation/controller/useSimulationController.js';
import { saveAlgorithmState, loadAlgorithmState } from '../../../utils/persistenceUtils';

const AlgorithmContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAlgorithm = () => useContext(AlgorithmContext);

export const AlgorithmProvider = ({ children }) => {
    const { nodes, edges, isDirected, clearClassification, setEdgeClassification, setNodeColor, setIsTransposedView } = useGraph();
    
    // Initialize from localStorage if available
    const initialStateRef = useRef(loadAlgorithmState());
    const initialState = initialStateRef.current;

    const [selectedAlgorithm, setSelectedAlgorithm] = useState(initialState?.selectedAlgorithm ?? 'dfs');
    const [speed, setSpeed] = useState(initialState?.speed ?? 1000); // ms
    const [startNodeId, setStartNodeId] = useState(initialState?.startNodeId ?? null);
    const [targetNodeId, setTargetNodeId] = useState(initialState?.targetNodeId ?? null);
    const [logs, setLogs] = useState(initialState?.logs ?? []);
    const [currentLine, setCurrentLine] = useState(initialState?.currentLine ?? -1);
    const [visited, setVisited] = useState(initialState?.visited ?? []);
    const [parent, setParent] = useState(initialState?.parent ?? {});
    const [components, setComponents] = useState(initialState?.components ?? []);

    const createGenerator = useCallback(() => {
        if (nodes.length === 0) {
            return null;
        }

        return createAlgorithmGenerator({
            selectedAlgorithm,
            nodes,
            edges,
            isDirected,
            startNodeId,
            targetNodeId,
        });
    }, [selectedAlgorithm, nodes, edges, isDirected, startNodeId, targetNodeId]);

    const stepInterpreter = useMemo(() => createStepInterpreter({
        clearClassification,
        setEdgeClassification,
        setNodeColor,
        setIsTransposedView,
        setCurrentLine,
        setVisited,
        setParent,
        setComponents,
        setLogs,
    }), [clearClassification, setEdgeClassification, setNodeColor, setIsTransposedView]);

    const {
        isPlaying,
        setIsPlaying,
        currentStep,
        history,
        isCompleted,
        hasStartedRun,
        runAlgorithm: runAlgorithmController,
        resumeAlgorithm,
        nextStep,
        prevStep,
        resetAlgorithm,
    } = useSimulationController({
        createGenerator,
        applyStep: stepInterpreter.applyStep,
        resetVisualState: () => stepInterpreter.resetVisualState(nodes),
        speed,
        initialState,
    });

    // Save algorithm state to localStorage whenever it changes
    useEffect(() => {
        saveAlgorithmState({
            selectedAlgorithm,
            startNodeId,
            targetNodeId,
            currentStep,
            history,
            logs,
            visited,
            parent,
            components,
            speed,
            isPlaying,
            currentLine,
            isCompleted,
            hasStartedRun,
        });
    }, [selectedAlgorithm, startNodeId, targetNodeId, currentStep, history, logs, visited, parent, components, speed, isPlaying, currentLine, isCompleted, hasStartedRun]);

    const runAlgorithm = useCallback(() => {
        if (nodes.length === 0) {
            return;
        }
        runAlgorithmController();
    }, [nodes.length, runAlgorithmController]);

    return (
        <AlgorithmContext.Provider value={{
            selectedAlgorithm, setSelectedAlgorithm,
            isPlaying, setIsPlaying,
            speed, setSpeed,
            startNodeId, setStartNodeId,
            targetNodeId, setTargetNodeId,
            currentStep, history, logs,
            currentLine, visited, parent, components,
            isCompleted, hasStartedRun,
            runAlgorithm, resumeAlgorithm, nextStep, prevStep, resetAlgorithm
        }}>
            {children}
        </AlgorithmContext.Provider>
    );
};
