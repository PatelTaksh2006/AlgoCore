import { create } from 'zustand';
import { saveStoreState, loadStoreState } from '../utils/persistenceUtils';

const initialStoreState = loadStoreState() || {};

const emptySimulationState = {
  activeDS: [],
  dsAction: null,
  backEdges: [],
  routingTable: {},
  activeTableNodeId: null,
  internalState: null,
  resultData: null,
  lsdb: [],
};

const initialSimulationState = {
  activeDS: initialStoreState.activeDS ?? [],
  dsAction: null,
  backEdges: initialStoreState.backEdges ?? [],
  routingTable: initialStoreState.routingTable ?? {},
  activeTableNodeId: initialStoreState.activeTableNodeId ?? null,
  internalState: initialStoreState.internalState ?? null,
  resultData: initialStoreState.resultData ?? null,
  lsdb: initialStoreState.lsdb ?? [],
};

const useSimulationStore = create((set) => ({
  ...initialSimulationState,

  // INTERNAL: interpreter-only mutation entry point
  _applyStep: (updater) => set((prevState) => {
    const nextState = updater(prevState);
    return nextState && typeof nextState === 'object' ? nextState : {};
  }),
}));

useSimulationStore.subscribe((state) => {
  saveStoreState(state);
});

export { initialSimulationState };
export { emptySimulationState };
export default useSimulationStore;
