import React, { useMemo, useEffect, useRef } from 'react';
import { useGraph } from '../../../graph/context/GraphContext';
import useSimulationStore from '../../../../store/useSimulationStore';
import { ArrowRight } from 'lucide-react'; // Assuming we can use icons or just text

const RoutingTable = () => {
    const { nodes } = useGraph();
    const { routingTable, activeTableNodeId } = useSimulationStore();
    const scrollContainerRef = useRef(null);

    // Flatten data for display: [ { nodeId, destinations: [ { destId, dist, nextHop } ] } ]
    const tableData = useMemo(() => {
        return nodes.map(node => {
            const table = routingTable[node.id] || {};
            const destinations = nodes.map(dest => ({
                destId: dest.id,
                destLabel: dest.label,
                ...table[dest.id] || { dist: Infinity, nextHop: null }
            }));
            return {
                nodeId: node.id,
                label: node.label,
                destinations
            };
        });
    }, [nodes, routingTable]);

    useEffect(() => {
        if (activeTableNodeId !== null && scrollContainerRef.current) {
            const el = document.getElementById(`routing-table-${activeTableNodeId}`);
            if (el) {
                // Scroll the element into view within its container
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [activeTableNodeId]);

    if (!nodes.length) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400">
                No active simulation
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white font-sans text-sm">
            <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Routing Tables</h3>
                <p className="text-xs text-gray-400 mt-1">Distance Vector Updates</p>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-auto p-4 space-y-6">
                {tableData.map(nodeData => {
                    const isActive = nodeData.nodeId === activeTableNodeId;
                    return (
                        <div
                            key={nodeData.nodeId}
                            id={`routing-table-${nodeData.nodeId}`}
                            className={`border rounded-lg overflow-hidden shadow-sm transition-all duration-300 ${isActive
                                    ? 'border-blue-400 ring-2 ring-blue-200 bg-blue-50/10 scale-[1.02]'
                                    : 'border-gray-200'
                                }`}
                        >
                            <div className={`px-4 py-2 border-b flex justify-between items-center ${isActive ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'
                                }`}>
                                <span className={`font-medium ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                                    Node {nodeData.label}
                                </span>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-2">Dest</th>
                                        <th className="px-4 py-2">Cost</th>
                                        <th className="px-4 py-2">Next Hop</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {nodeData.destinations.map(dest => (
                                        <tr key={dest.destId} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-2 text-gray-600">{dest.destLabel}</td>
                                            <td className="px-4 py-2 font-mono text-gray-800">
                                                {dest.dist === Infinity ? '∞' : dest.dist}
                                            </td>
                                            <td className="px-4 py-2 text-gray-600">
                                                {dest.nextHop ? nodes.find(n => n.id === dest.nextHop)?.label : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default RoutingTable;
