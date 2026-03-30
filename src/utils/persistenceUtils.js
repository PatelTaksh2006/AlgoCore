/**
 * localStorage Persistence Utilities
 * Manages saving and loading all application state
 */

const STORAGE_KEYS = {
  GRAPH: 'algocore_graph',
  ALGORITHM: 'algocore_algorithm',
  STORE: 'algocore_store',
  DS_PANEL: 'algocore_ds_panel',
};

const hasStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

/**
 * Save graph state to localStorage
 */
export const saveGraphState = (nodes, edges, isDirected) => {
  if (!hasStorage()) return;
  try {
    const graphData = {
      nodes: nodes.map(n => ({
        id: n.id,
        label: n.label,
        x: n.x,
        y: n.y,
        originalPos: n.originalPos,
        treePos: n.treePos,
        color: n.color,
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        weight: e.weight,
        classification: e.classification,
      })),
      isDirected,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.GRAPH, JSON.stringify(graphData));
  } catch (error) {
    console.error('Failed to save graph state:', error);
  }
};

/**
 * Load graph state from localStorage
 */
export const loadGraphState = () => {
  if (!hasStorage()) return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.GRAPH);
    if (saved) {
      const data = JSON.parse(saved);
      return {
        nodes: data.nodes || [],
        edges: data.edges || [],
        isDirected: data.isDirected || false,
      };
    }
  } catch (error) {
    console.error('Failed to load graph state:', error);
  }
  return null;
};

/**
 * Save algorithm state to localStorage
 */
export const saveAlgorithmState = (algorithmState) => {
  if (!hasStorage()) return;
  try {
    const stateToSave = {
      selectedAlgorithm: algorithmState.selectedAlgorithm,
      startNodeId: algorithmState.startNodeId,
      targetNodeId: algorithmState.targetNodeId,
      currentStep: algorithmState.currentStep,
      history: algorithmState.history,
      logs: algorithmState.logs,
      visited: algorithmState.visited,
      parent: algorithmState.parent,
      components: algorithmState.components,
      speed: algorithmState.speed,
      isPlaying: algorithmState.isPlaying,
      currentLine: algorithmState.currentLine,
      isCompleted: algorithmState.isCompleted,
      hasStartedRun: algorithmState.hasStartedRun,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.ALGORITHM, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Failed to save algorithm state:', error);
  }
};

/**
 * Load algorithm state from localStorage
 */
export const loadAlgorithmState = () => {
  if (!hasStorage()) return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ALGORITHM);
    if (saved) {
      const data = JSON.parse(saved);
      return {
        selectedAlgorithm: data.selectedAlgorithm ?? 'dfs',
        startNodeId: data.startNodeId ?? null,
        targetNodeId: data.targetNodeId ?? null,
        currentStep: data.currentStep ?? 0,
        history: data.history ?? [],
        logs: data.logs ?? [],
        visited: data.visited ?? [],
        parent: data.parent ?? {},
        components: data.components ?? [],
        speed: data.speed ?? 1000,
        isPlaying: false,
        currentLine: data.currentLine ?? -1,
        isCompleted: data.isCompleted ?? false,
        hasStartedRun: data.hasStartedRun ?? ((data.currentStep ?? 0) > 0 && !(data.isCompleted ?? false)),
      };
    }
  } catch (error) {
    console.error('Failed to load algorithm state:', error);
  }
  return null;
};

/**
 * Save Zustand store state to localStorage
 */
export const saveStoreState = (storeState) => {
  if (!hasStorage()) return;
  try {
    const stateToSave = {
      activeDS: storeState.activeDS,
      backEdges: storeState.backEdges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        classification: e.classification,
      })),
      routingTable: storeState.routingTable,
      activeTableNodeId: storeState.activeTableNodeId,
      lsdb: storeState.lsdb,
      resultData: storeState.resultData,
      internalState: storeState.internalState,
      resultLayout: storeState.resultLayout,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.STORE, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Failed to save store state:', error);
  }
};

/**
 * Load store state from localStorage
 */
export const loadStoreState = () => {
  if (!hasStorage()) return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.STORE);
    if (saved) {
      const data = JSON.parse(saved);
      return {
        activeDS: data.activeDS ?? [],
        backEdges: data.backEdges ?? [],
        routingTable: data.routingTable ?? {},
        activeTableNodeId: data.activeTableNodeId ?? null,
        lsdb: data.lsdb ?? [],
        resultData: data.resultData ?? null,
        internalState: data.internalState ?? null,
        resultLayout: data.resultLayout ?? {},
      };
    }
  } catch (error) {
    console.error('Failed to load store state:', error);
  }
  return null;
};

/**
 * Clear all saved state
 */
export const clearAllState = () => {
  if (!hasStorage()) return;
  try {
    localStorage.removeItem(STORAGE_KEYS.GRAPH);
    localStorage.removeItem(STORAGE_KEYS.ALGORITHM);
    localStorage.removeItem(STORAGE_KEYS.STORE);
    localStorage.removeItem(STORAGE_KEYS.DS_PANEL);
  } catch (error) {
    console.error('Failed to clear state:', error);
  }
};

/**
 * Check if any state exists in localStorage
 */
export const hasPersistedState = () => {
  if (!hasStorage()) return false;
  return !!(
    localStorage.getItem(STORAGE_KEYS.GRAPH) ||
    localStorage.getItem(STORAGE_KEYS.ALGORITHM) ||
    localStorage.getItem(STORAGE_KEYS.STORE)
  );
};

export const saveDataStructurePanelState = (panelState) => {
  if (!hasStorage()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.DS_PANEL, JSON.stringify(panelState));
  } catch (error) {
    console.error('Failed to save data structure panel state:', error);
  }
};

export const loadDataStructurePanelState = () => {
  if (!hasStorage()) return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DS_PANEL);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load data structure panel state:', error);
  }
  return null;
};
