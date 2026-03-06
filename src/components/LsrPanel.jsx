import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useGraph } from '../context/GraphContext';
import useGraphStore from '../store/useGraphStore';
import { useAlgorithm } from '../context/AlgorithmContext';
import Node from './Node';
import Edge from './Edge';

const LsrPanel = () => {
    const { nodes, edges, isDirected } = useGraph();
    const { lsdb, activeTableNodeId } = useGraphStore();
    const { history, currentStep, selectedAlgorithm } = useAlgorithm();

    // The LsrPanel shows the map built from LSDB.
    // Node presence: a node is in the map if it has sent an LSA OR if it was listed in someone's LSA.
    // Edge presence: an edge is in the map if it was reported in an LSA.

    const knownNodeIds = useMemo(() => {
        const set = new Set();
        lsdb.forEach(lsa => {
            set.add(lsa.sourceId);
            lsa.links.forEach(link => set.add(link.to));
        });
        return set;
    }, [lsdb]);

    const knownEdges = useMemo(() => {
        // Find edges that match LSDB reports
        // To be safe and draw exactly what's on the main graph, we can just intersect `edges` with `lsdb`
        // But edge matching might be tricky if undirected vs directed.
        // Actually, if we just use the original `edges` and check if both endpoints are in `knownNodeIds`, that's a good approximation of the reconstructed map!
        // Alternatively, a stricter check: the edge was explicitly reported in an LSA.
        const reportedPaths = new Set();
        lsdb.forEach(lsa => {
            lsa.links.forEach(link => {
                reportedPaths.add(`${lsa.sourceId}-${link.to}`);
                reportedPaths.add(`${link.to}-${lsa.sourceId}`); // undirected proxy
            });
        });

        return edges.filter(e =>
            reportedPaths.has(`${e.source}-${e.target}`) ||
            reportedPaths.has(`${e.target}-${e.source}`)
        );
    }, [edges, lsdb]);

    const displayNodes = nodes.filter(n => knownNodeIds.has(n.id));

    return (
        <div className="flex flex-col h-full bg-white font-sans text-sm relative">
            <div className="p-4 border-b border-gray-100 z-10 bg-white">
                <h3 className="font-semibold text-gray-800">
                    {activeTableNodeId ? `Node ${nodes.find(n => n.id === activeTableNodeId)?.label}'s Shortest Path Tree` : 'Reconstructed Network Map (LSDB)'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                    {activeTableNodeId ? 'Executing Dijkstra on internal map' : 'Nodes map building via Flooding'}
                </p>
            </div>

            <div className="flex-1 relative overflow-hidden bg-slate-50/50">
                {displayNodes.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">
                        Waiting for LSAs...
                    </div>
                ) : (
                    // We use an SVG and standard nodes just like GraphCanvas, but we'll scale it down to fit.
                    <div className="w-full h-full relative" style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}>
                        {/* SVG Layer for Edges */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            <defs>
                                <marker
                                    id="lsr-arrowhead"
                                    markerWidth="10"
                                    markerHeight="7"
                                    refX="28"
                                    refY="3.5"
                                    orient="auto"
                                >
                                    <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
                                </marker>
                            </defs>
                            {knownEdges.map(edge => (
                                <Edge
                                    key={edge.id}
                                    edge={edge}
                                    sourceNode={displayNodes.find(n => n.id === edge.source)}
                                    targetNode={displayNodes.find(n => n.id === edge.target)}
                                    isDirected={isDirected}
                                />
                            ))}
                        </svg>

                        {/* HTML Layer for Nodes */}
                        {displayNodes.map(node => (
                            <Node
                                key={node.id}
                                node={node}
                                updatePos={() => { }} // Read-only
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LsrPanel;
