import { create } from 'zustand';

const useGraphStore = create((set) => ({
    // Data Structure Tracking
    activeDS: [],
    dsAction: null, // 'push', 'pop', 'update', or null

    // Resultant Tree Enhancements
    backEdges: [], // Array of edges { source, target, ... }

    // Routing Table (for Distance Vector)
    routingTable: {}, // { nodeId: { destId: { dist: number, nextHop: nodeId } } }
    activeTableNodeId: null, // The ID of the node currently processing its routing table

    // Link State Database (for LSR)
    lsdb: [], // Array of LSAs

    // Actions
    pushDS: (item) => set((state) => ({
        activeDS: [...state.activeDS, item],
        dsAction: 'push'
    })),

    popDS: () => set((state) => {
        if (state.activeDS.length === 0) return {};
        const newDS = [...state.activeDS];
        newDS.shift(); // Remove from front for Queue visualization? 
        // Wait, for Stack it's pop(), for Queue it's shift().
        // The visualization might need to handle this differently or we just receive the *new* state.
        // Actually, for better animations, we might want to know *what* was popped.
        // But for simplicity, let's trust the 'updateDS' or specific push/pop.

        // However, the visualizer usually just renders the array. 
        // To animate 'pop', we might need to know which one left?
        // Let's stick to updateDS regarding the array content if complex, 
        // but push/pop actions are useful for triggers.
        return {
            activeDS: newDS,
            dsAction: 'pop'
        };
    }),

    // Generic update for replacing content (e.g. after a pop effectively)
    updateDS: (newDS, action = 'update') => set({
        activeDS: newDS,
        dsAction: action
    }),

    addBackEdge: (edge) => set((state) => ({
        backEdges: [...state.backEdges, edge]
    })),

    resetDS: () => set({
        activeDS: [],
        dsAction: null,
        backEdges: [],
        routingTable: {},
        activeTableNodeId: null,
        lsdb: []
    }),

    updateRoutingTable: (table) => set({
        routingTable: table
    }),

    setActiveTableNodeId: (id) => set({
        activeTableNodeId: id
    }),

    addLsa: (lsa) => set(state => ({
        lsdb: [...state.lsdb, lsa]
    })),
}));

export default useGraphStore;
