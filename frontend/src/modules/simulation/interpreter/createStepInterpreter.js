import useSimulationStore, { emptySimulationState } from '../../../store/useSimulationStore';
import { STEP_TYPES } from '../../algorithm/protocol/stepProtocol.ts';

export function createStepInterpreter({
  clearClassification,
  setEdgeClassification,
  setNodeColor,
  setIsTransposedView,
  setCurrentLine,
  setVisited,
  setParent,
  setComponents,
  setLogs,
}) {
  const applyStep = (stepData) => {
    if (!stepData) {
      return;
    }

    const store = useSimulationStore.getState();
    const mutate = (updater) => store._applyStep(updater);

    if (stepData.internalState) {
      mutate((prev) => ({
        internalState: stepData.internalState === null
          ? null
          : {
              ...(prev.internalState || {}),
              ...stepData.internalState,
            },
      }));
    }

    switch (stepData.type) {
      case STEP_TYPES.LOG:
        setLogs((prev) => [...prev, stepData.message]);
        break;
      case STEP_TYPES.CLASSIFY_EDGE:
        setEdgeClassification(stepData.edgeId, stepData.classification);
        break;
      case STEP_TYPES.SET_NODE_COLOR:
        setNodeColor(stepData.nodeId, stepData.color);
        break;
      case STEP_TYPES.DS_UPDATE:
        mutate(() => ({
          activeDS: stepData.data,
          dsAction: stepData.action,
        }));
        break;
      case STEP_TYPES.ADD_BACK_EDGE:
        mutate((prev) => ({
          backEdges: [
            ...prev.backEdges,
            {
              id: stepData.edgeId,
              source: stepData.source,
              target: stepData.target,
              classification: stepData.classification,
            },
          ],
        }));
        break;
      case STEP_TYPES.SET_LINE:
        setCurrentLine(stepData.lineIndex);
        break;
      case STEP_TYPES.UPDATE_VISITED:
        setVisited((prev) => {
          if (prev.includes(stepData.nodeId)) {
            return prev;
          }
          return [...prev, stepData.nodeId];
        });
        break;
      case STEP_TYPES.UPDATE_PARENT:
        setParent((prev) => ({
          ...prev,
          [stepData.childId]: stepData.parentId,
        }));
        break;
      case STEP_TYPES.RESET_VISITED:
        setVisited([]);
        break;
      case STEP_TYPES.RESET_PARENT:
        setParent({});
        break;
      case STEP_TYPES.RESET_COMPONENTS:
        setComponents([]);
        break;
      case STEP_TYPES.FOUND_COMPONENT:
        setComponents((prev) => [...prev, stepData.component]);
        break;
      case STEP_TYPES.DS_UPDATE_ROUTING_TABLE:
        mutate(() => ({ routingTable: stepData.table }));
        break;
      case STEP_TYPES.SET_ACTIVE_TABLE_NODE:
        mutate(() => ({ activeTableNodeId: stepData.nodeId }));
        break;
      case STEP_TYPES.ADD_LSA:
        mutate((prev) => ({ lsdb: [...prev.lsdb, stepData.lsa] }));
        break;
      case STEP_TYPES.SET_RESULT_DATA:
        mutate(() => ({ resultData: stepData.data }));
        break;
      case STEP_TYPES.SET_TRANSPOSE_VIEW:
        setIsTransposedView(Boolean(stepData.isTransposed));
        break;
      default:
        break;
    }
  };

  const resetVisualState = (nodes = []) => {
    clearClassification();
    setIsTransposedView(false);
    useSimulationStore.getState()._applyStep(() => ({ ...emptySimulationState }));
    nodes.forEach((node) => setNodeColor(node.id, undefined));
    setCurrentLine(-1);
    setVisited([]);
    setParent({});
    setComponents([]);
    setLogs([]);
  };

  return {
    applyStep,
    resetVisualState,
  };
}
