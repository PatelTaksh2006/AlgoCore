import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useGraph } from './GraphContext';
import * as algorithms from '../algorithms';
import useGraphStore from '../store/useGraphStore';
import { saveAlgorithmState, loadAlgorithmState } from '../utils/persistenceUtils';

const AlgorithmContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAlgorithm = () => useContext(AlgorithmContext);

export const AlgorithmProvider = ({ children }) => {
    const { nodes, edges, isDirected, clearClassification, setEdgeClassification, setNodeColor } = useGraph();
    
    // Initialize from localStorage if available
    const initialState = loadAlgorithmState();
    const [selectedAlgorithm, setSelectedAlgorithm] = useState(initialState?.selectedAlgorithm ?? 'dfs');
    const [isPlaying, setIsPlaying] = useState(initialState?.isPlaying ?? false);
    const [speed, setSpeed] = useState(initialState?.speed ?? 1000); // ms
    const [currentStep, setCurrentStep] = useState(initialState?.currentStep ?? 0);
    const [startNodeId, setStartNodeId] = useState(initialState?.startNodeId ?? null);
    const [targetNodeId, setTargetNodeId] = useState(initialState?.targetNodeId ?? null);
    const [history, setHistory] = useState(initialState?.history ?? []);
    const [logs, setLogs] = useState(initialState?.logs ?? []);
    const [currentLine, setCurrentLine] = useState(initialState?.currentLine ?? -1);
    const [visited, setVisited] = useState(initialState?.visited ?? []);
    const [parent, setParent] = useState(initialState?.parent ?? {});
    const [components, setComponents] = useState(initialState?.components ?? []);
    const [isCompleted, setIsCompleted] = useState(initialState?.isCompleted ?? false);
    const [hasStartedRun, setHasStartedRun] = useState(
        initialState?.hasStartedRun ?? ((initialState?.currentStep ?? 0) > 0 && !(initialState?.isCompleted ?? false))
    );

    const generatorRef = useRef(null);
    const timerRef = useRef(null);

    // Store actions
    const { updateDS, addBackEdge, resetDS } = useGraphStore();

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

    const createGenerator = useCallback(() => {
        if (nodes.length === 0) {
            return null;
        }

        const evaluatedStartNode = selectedAlgorithm === 'kruskal' || selectedAlgorithm === 'scc'
            ? null
            : (startNodeId || nodes[0]?.id);
        let evaluatedTargetNode = targetNodeId;

        if (selectedAlgorithm === 'dijkstra' && !evaluatedTargetNode) {
            evaluatedTargetNode = nodes.find(n => n.id !== evaluatedStartNode)?.id || null;
        }

        const algoFunc = algorithms[selectedAlgorithm];
        if (!algoFunc) {
            console.error('Algorithm: Function not found for', selectedAlgorithm);
            return null;
        }

        const normalizedEdges = edges.map(edge => ({
            ...edge,
            directed: isDirected,
        }));

        return algoFunc(nodes, normalizedEdges, evaluatedStartNode, evaluatedTargetNode);
    }, [nodes, edges, isDirected, selectedAlgorithm, startNodeId, targetNodeId]);

    const resetVisuals = useCallback(() => {
        clearClassification();
        resetDS();
        nodes.forEach(n => setNodeColor(n.id, undefined));
        setCurrentLine(-1);
        setVisited([]);
        setParent({});
        setComponents([]);
    }, [clearClassification, resetDS, nodes, setNodeColor, setCurrentLine]);

    const resetAlgorithm = useCallback(() => {
        setIsPlaying(false);
        setCurrentStep(0);
        setHistory([]);
        setLogs([]);
        setIsCompleted(false);
        setHasStartedRun(false);
        resetVisuals();
        generatorRef.current = null;
        if (timerRef.current) clearInterval(timerRef.current);
    }, [resetVisuals]);

    const runAlgorithm = useCallback(() => {
        resetAlgorithm(); // Clear previous run
        if (nodes.length === 0) {
            console.warn("Algorithm: No nodes to run on.");
            return;
        }

        console.log("Algorithm: Starting", {
            selectedAlgorithm,
            startNodeId,
            targetNodeId,
            nodesCount: nodes.length
        });

        const nextGenerator = createGenerator();
        if (nextGenerator) {
            generatorRef.current = nextGenerator;
            setIsCompleted(false);
            setHasStartedRun(true);
            console.log("Algorithm: Generator created");
        } else {
            console.error("Algorithm: Function not found for", selectedAlgorithm);
        }
    }, [nodes.length, selectedAlgorithm, startNodeId, targetNodeId, resetAlgorithm, createGenerator]);

    const resumeAlgorithm = useCallback(() => {
        if (isCompleted) {
            return;
        }

        if (!generatorRef.current) {
            const resumedGenerator = createGenerator();
            if (!resumedGenerator) {
                return;
            }

            let completedEarly = false;

            for (let stepIdx = 0; stepIdx < currentStep; stepIdx += 1) {
                while (true) {
                    const { value, done: isDone } = resumedGenerator.next();
                    if (isDone) {
                        completedEarly = true;
                        break;
                    }
                    if (value?.type === 'SET_LINE') {
                        break;
                    }
                }

                if (completedEarly) {
                    break;
                }
            }

            generatorRef.current = resumedGenerator;

            if (completedEarly) {
                setIsCompleted(true);
                setHasStartedRun(false);
                setIsPlaying(false);
                return;
            }
        }

        setHasStartedRun(true);
        setIsPlaying(true);
    }, [isCompleted, createGenerator, currentStep]);

    const applyStep = useCallback((stepData) => {
        if (!stepData) return;

        if (stepData.type === 'LOG') {
            // Logs are handled nicely by state append usually, but for replay we might need to be careful
            // For single step forward, we append outside. For replay, we might need a different approach?
            // Actually, let's keep log handling separate or pass a "replaying" flag?
            // To be safe, let's just use the visual setters here.
        } else if (stepData.type === 'CLASSIFY_EDGE') {
            setEdgeClassification(stepData.edgeId, stepData.classification);
        } else if (stepData.type === 'SET_NODE_COLOR') {
            setNodeColor(stepData.nodeId, stepData.color);
        } else if (stepData.type === 'DS_UPDATE') {
            updateDS(stepData.data, stepData.action);
        } else if (stepData.type === 'ADD_BACK_EDGE') {
            addBackEdge({
                id: stepData.edgeId,
                source: stepData.source,
                target: stepData.target,
                classification: stepData.classification
            });
        } else if (stepData.type === 'SET_LINE') {
            setCurrentLine(stepData.lineIndex);
        } else if (stepData.type === 'UPDATE_VISITED') {
            setVisited(prev => {
                if (prev.includes(stepData.nodeId)) return prev;
                return [...prev, stepData.nodeId];
            });
        } else if (stepData.type === 'UPDATE_PARENT') {
            setParent(prev => ({
                ...prev,
                [stepData.childId]: stepData.parentId
            }));
        } else if (stepData.type === 'RESET_VISITED') {
            setVisited([]);
        } else if (stepData.type === 'RESET_PARENT') {
            setParent({});
        } else if (stepData.type === 'RESET_COMPONENTS') {
            setComponents([]);
        } else if (stepData.type === 'FOUND_COMPONENT') {
            setComponents(prev => [...prev, stepData.component]);
        } else if (stepData.type === 'DS_UPDATE_ROUTING_TABLE') {
            useGraphStore.getState().updateRoutingTable(stepData.table);
        } else if (stepData.type === 'SET_ACTIVE_TABLE_NODE') {
            useGraphStore.getState().setActiveTableNodeId(stepData.nodeId);
        } else if (stepData.type === 'ADD_LSA') {
            useGraphStore.getState().addLsa(stepData.lsa);
        } else if (stepData.type === 'SET_RESULT_DATA') {
            useGraphStore.getState().setResultData(stepData.data);
        }
    }, [setEdgeClassification, setNodeColor, updateDS, addBackEdge, setCurrentLine, setVisited, setParent, setComponents]);

    const nextStep = useCallback(() => {
        if (!generatorRef.current) {
            console.warn("Algorithm: No generator ref during nextStep");
            return;
        }

        const batch = [];
        let done = false;

        while (true) {
            const { value, done: isDone } = generatorRef.current.next();
            if (isDone) {
                done = true;
                break;
            }
            if (value) {
                batch.push(value);
                // Apply log/visuals immediately
                if (value.type === 'LOG') {
                    setLogs(prev => [...prev, value.message]);
                }
                if (value.internalState) {
                    useGraphStore.getState().setInternalState(value.internalState);
                }
                applyStep(value);

                // If we hit a new line marker, we treat this as the completion of the current logical step
                if (value.type === 'SET_LINE') {
                    break;
                }
            }
        }

        if (batch.length > 0) {
            setHistory(prev => [...prev, batch]);
            setCurrentStep(prev => prev + 1);
            setIsCompleted(false);
        }

        if (done) {
            console.log("Algorithm: Finished");
            setIsPlaying(false);
            setIsCompleted(true);
            setHasStartedRun(false);
        }
    }, [applyStep]);

    const prevStep = useCallback(() => {
        if (currentStep <= 0) return;
        setIsPlaying(false);
        setIsCompleted(false);

        const newStepCount = currentStep - 1;
        resetVisuals();

        // Flatten history up to newStepCount
        // history is now Array<Array<Event>>.
        // We want history[0] ... history[newStepCount - 1].

        const stepsToReplay = history.slice(0, newStepCount);
        const flattenedEvents = stepsToReplay.flat();

        const newLogs = [];
        flattenedEvents.forEach(step => {
            if (step.type === 'LOG') newLogs.push(step.message);
            applyStep(step);
        });

        setLogs(newLogs);
        setCurrentStep(newStepCount);
    }, [currentStep, history, resetVisuals, applyStep]);

    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(() => {
                nextStep();
            }, speed);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, speed, nextStep]);

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
