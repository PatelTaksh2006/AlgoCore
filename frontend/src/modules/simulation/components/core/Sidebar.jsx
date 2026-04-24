import React from 'react';
import { useGraph } from '../../../graph/context/GraphContext';
import { useAlgorithm } from '../../../algorithm/context/AlgorithmContext';
import { Play, Pause, Settings, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../../utils/cn';

import { SAMPLES } from '../../../graph/sampleData';
import { PSEUDOCODE } from '../../../algorithm/registry/pseudocode';

const Sidebar = () => {
    const {
        nodes, edges, isDirected, setIsDirected,
        addNode, resetGraph, loadGraphData
    } = useGraph();

    const {
        selectedAlgorithm, setSelectedAlgorithm,
        runAlgorithm, resumeAlgorithm, isPlaying, setIsPlaying,
        speed, setSpeed, resetAlgorithm,
        startNodeId, setStartNodeId,
        targetNodeId, setTargetNodeId,
        nextStep, prevStep, currentStep, currentLine,
        isCompleted, hasStartedRun
    } = useAlgorithm();

    const handleRunClick = () => {
        const hasProgress = currentStep > 0;

        if ((hasStartedRun || hasProgress) && !isCompleted) {
            resumeAlgorithm();
            return;
        }

        runAlgorithm();
        setIsPlaying(true);
    };

    const handleRestartClick = () => {
        runAlgorithm();
        setIsPlaying(true);
    };

    const handleLoadSample = () => {
        const sample = SAMPLES[selectedAlgorithm];
        if (sample) {
            resetAlgorithm(); // Stop any running algo
            loadGraphData(sample.nodes, sample.edges, sample.isDirected);
            // Initialize source/destination with first and last nodes
            if (sample.nodes.length > 0) {
                setStartNodeId(sample.nodes[0].id);
                if (sample.nodes.length > 1) {
                    setTargetNodeId(sample.nodes[sample.nodes.length - 1].id);
                }
            }
        } else {
            console.warn("No sample for", selectedAlgorithm);
            const defaultSample = SAMPLES['dfs'];
            if (defaultSample) {
                resetAlgorithm();
                loadGraphData(defaultSample.nodes, defaultSample.edges, defaultSample.isDirected);
                if (defaultSample.nodes.length > 0) {
                    setStartNodeId(defaultSample.nodes[0].id);
                    if (defaultSample.nodes.length > 1) {
                        setTargetNodeId(defaultSample.nodes[defaultSample.nodes.length - 1].id);
                    }
                }
            }
        }
    };

    return (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shadow-lg z-20">
            <div className="p-4 border-b border-gray-100">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    Graph Sim
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Graph Settings */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Graph Config</h3>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Directed Graph</span>
                        <button
                            onClick={() => setIsDirected(!isDirected)}
                            disabled={isPlaying}
                            className={cn(
                                "w-10 h-5 rounded-full relative transition-colors duration-200",
                                isDirected ? "bg-blue-600" : "bg-gray-300",
                                isPlaying && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <div className={cn(
                                "w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-200 shadow-sm",
                                isDirected ? "left-5.5" : "left-0.5"
                            )} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={handleLoadSample}
                            disabled={isPlaying}
                            className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Load Sample
                        </button>
                        <button
                            onClick={resetGraph}
                            disabled={isPlaying}
                            className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            title="Clear Graph"
                        >
                            <Trash2 className="w-4 h-4" /> Clear
                        </button>
                    </div>
                    <button
                        onClick={() => addNode(Math.random() * 300 + 50, Math.random() * 300 + 50)}
                        disabled={isPlaying}
                        className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" /> Add Random Node
                    </button>
                    {/* Edge Count */}
                    <div className="text-xs text-gray-400 text-center mt-2">
                        {edges.length} edges | {nodes.length} nodes
                    </div>
                    <div className="text-[10px] text-gray-400 text-center italic">
                        Click node → click another to add edge
                    </div>
                </div>

                {/* Algorithms */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Algorithm</h3>
                    <select
                        value={selectedAlgorithm}
                        onChange={e => {
                            resetAlgorithm();
                            resetGraph();
                            setStartNodeId(null);
                            setTargetNodeId(null);
                            setSelectedAlgorithm(e.target.value);
                        }}
                        disabled={isPlaying}
                        className="w-full p-2 border rounded-md text-sm bg-gray-50 outline-none focus:border-blue-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="dfs">Depth First Search (DFS)</option>
                        <option value="bfs">Breadth First Search (BFS)</option>
                        <option value="dijkstra">Dijkstra's Shortest Path</option>
                        <option value="prim">Prim's MST</option>
                        <option value="kruskal">Kruskal's MST</option>
                        <option value="scc">Strongly Connected Components</option>
                        <option value="articulationPoints">Articulation Points</option>
                        <option value="distanceVector">Distance Vector Routing</option>
                        <option value="linkState">Link State Routing</option>
                        <option value="floydWarshall">Floyd-Warshall (APSP)</option>
                    </select>
                    
                    {selectedAlgorithm !== 'kruskal' && selectedAlgorithm !== 'scc' && selectedAlgorithm !== 'floydWarshall' && (
                        <div className="mt-2 text-sm text-gray-600">
                            Source Node (Optional):
                            <select
                                value={startNodeId || ''}
                                onChange={e => setStartNodeId(e.target.value || null)}
                                disabled={isPlaying}
                                className="mt-1 w-full p-2 border rounded-md bg-gray-50 outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Auto (First Node)</option>
                                {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                            </select>
                        </div>
                    )}
                    
                    {selectedAlgorithm === 'dijkstra' && (
                        <div className="mt-2 text-sm text-gray-600">
                            Destination Node (Optional):
                            <select
                                value={targetNodeId || ''}
                                onChange={e => setTargetNodeId(e.target.value || null)}
                                disabled={isPlaying}
                                className="mt-1 w-full p-2 border rounded-md bg-gray-50 outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">None</option>
                                {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {/* Code Visualization */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Code Execution</h3>
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200 font-mono text-xs max-h-40 overflow-y-auto">
                        {(() => {
                            const codeLines = PSEUDOCODE[selectedAlgorithm] || [];
                            const line = currentLine;

                            // We want nicely centered 3 lines: prev, curr, next
                            // If line is -1 (start), show first few? Or just empty?
                            // User request: "curr executing, next line, previous line"
                            // If not running (line = -1), maybe show just start of code or empty?

                            if (line === -1) {
                                return <div className="text-gray-400 italic text-center">Ready to run...</div>;
                            }

                            const prev = codeLines[line - 1] || '\u00A0'; // Non-breaking space for empty
                            const curr = codeLines[line] || 'Done';
                            const next = codeLines[line + 1] || '\u00A0';

                            return (
                                <div className="space-y-1">
                                    <div className="text-gray-400 whitespace-pre-wrap break-words">{prev}</div>
                                    <div className="text-blue-600 font-bold whitespace-pre-wrap break-words bg-blue-50 -mx-2 px-2 py-0.5 rounded-sm">{curr}</div>
                                    <div className="text-gray-400 whitespace-pre-wrap break-words">{next}</div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* Playback Controls */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Speed</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-green-600 font-medium">Fast</span>
                        <input
                            type="range"
                            min="100"
                            max="2000"
                            step="100"
                            value={speed}
                            onChange={e => setSpeed(Number(e.target.value))}
                            disabled={nodes.length === 0}
                            className="flex-1 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                        />
                        <span className="text-[10px] text-orange-600 font-medium">Slow</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 0 || isPlaying || nodes.length === 0}
                        className="px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Previous Step"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    {!isPlaying ? (
                        <button
                            onClick={handleRunClick}
                            disabled={nodes.length === 0}
                            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Play className="w-4 h-4" /> {(hasStartedRun || currentStep > 0) && !isCompleted ? 'Resume' : 'Run'}
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsPlaying(false)}
                            className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md flex items-center justify-center gap-2 font-medium transition-colors"
                        >
                            <Pause className="w-4 h-4" /> Pause
                        </button>
                    )}

                    <button
                        onClick={() => {
                            setIsPlaying(false);
                            nextStep();
                        }}
                        disabled={isPlaying || nodes.length === 0}
                        className="px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Next Step"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <button
                    onClick={resetAlgorithm}
                    disabled={nodes.length === 0}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Clear current progress"
                >
                    Reset Progress
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
