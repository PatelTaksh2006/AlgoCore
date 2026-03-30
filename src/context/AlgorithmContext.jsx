import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useGraph } from './GraphContext';
import * as algorithms from '../algorithms';
import useGraphStore from '../store/useGraphStore';

const AlgorithmContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAlgorithm = () => useContext(AlgorithmContext);

export const AlgorithmProvider = ({ children }) => {
    const { nodes, edges, isDirected, clearClassification, setEdgeClassification, setNodeColor } = useGraph();
    const [selectedAlgorithm, setSelectedAlgorithm] = useState('dfs');
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1000); // ms
    const [currentStep, setCurrentStep] = useState(0);
    const [startNodeId, setStartNodeId] = useState(null); // Added startNodeId state
    const [targetNodeId, setTargetNodeId] = useState(null); // Added targetNodeId state
    const [history, setHistory] = useState([]);
    const [logs, setLogs] = useState([]);
    const [currentLine, setCurrentLine] = useState(-1);
    const [visited, setVisited] = useState([]); // Array of node IDs
    const [parent, setParent] = useState({}); // Map childId -> parentId
    const [components, setComponents] = useState([]); // Added components state

    const generatorRef = useRef(null);
    const timerRef = useRef(null);

    // Store actions
    const { updateDS, addBackEdge, resetDS } = useGraphStore();

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

        const evaluatedStartNode = selectedAlgorithm === 'kruskal' || selectedAlgorithm === 'scc'
            ? null
            : (startNodeId || nodes[0]?.id);
        let evaluatedTargetNode = targetNodeId;

        // Dijkstra needs a concrete destination to show one final shortest path in green.
        if (selectedAlgorithm === 'dijkstra' && !evaluatedTargetNode) {
            evaluatedTargetNode = nodes.find(n => n.id !== evaluatedStartNode)?.id || null;
        }

        console.log("Algorithm: Starting", {
            selectedAlgorithm,
            startNodeId: evaluatedStartNode,
            targetNodeId: evaluatedTargetNode,
            nodesCount: nodes.length
        });

        const algoFunc = algorithms[selectedAlgorithm];
        if (algoFunc) {
            const normalizedEdges = edges.map(edge => ({
                ...edge,
                directed: isDirected,
            }));
            generatorRef.current = algoFunc(nodes, normalizedEdges, evaluatedStartNode, evaluatedTargetNode);
            console.log("Algorithm: Generator created");
        } else {
            console.error("Algorithm: Function not found for", selectedAlgorithm);
        }
    }, [nodes, edges, isDirected, selectedAlgorithm, startNodeId, targetNodeId, resetAlgorithm]);

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
        }

        if (done) {
            console.log("Algorithm: Finished");
            setIsPlaying(false);
        }
    }, [applyStep]);

    const prevStep = useCallback(() => {
        if (currentStep <= 0) return;
        setIsPlaying(false);

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
            runAlgorithm, nextStep, prevStep, resetAlgorithm
        }}>
            {children}
        </AlgorithmContext.Provider>
    );
};
