export const STEP_TYPES = {
  SET_LINE: 'SET_LINE',
  LOG: 'LOG',
  CLASSIFY_EDGE: 'CLASSIFY_EDGE',
  SET_NODE_COLOR: 'SET_NODE_COLOR',
  DS_UPDATE: 'DS_UPDATE',
  ADD_BACK_EDGE: 'ADD_BACK_EDGE',
  UPDATE_VISITED: 'UPDATE_VISITED',
  UPDATE_PARENT: 'UPDATE_PARENT',
  RESET_VISITED: 'RESET_VISITED',
  RESET_PARENT: 'RESET_PARENT',
  RESET_COMPONENTS: 'RESET_COMPONENTS',
  FOUND_COMPONENT: 'FOUND_COMPONENT',
  DS_UPDATE_ROUTING_TABLE: 'DS_UPDATE_ROUTING_TABLE',
  SET_ACTIVE_TABLE_NODE: 'SET_ACTIVE_TABLE_NODE',
  ADD_LSA: 'ADD_LSA',
  SET_RESULT_DATA: 'SET_RESULT_DATA',
  SET_TRANSPOSE_VIEW: 'SET_TRANSPOSE_VIEW',
} as const;

export type StepType = (typeof STEP_TYPES)[keyof typeof STEP_TYPES];

export type AlgorithmStep =
  | { type: typeof STEP_TYPES.SET_LINE; lineIndex: number; internalState?: Record<string, unknown> }
  | { type: typeof STEP_TYPES.LOG; message: string; internalState?: Record<string, unknown> }
  | { type: typeof STEP_TYPES.CLASSIFY_EDGE; edgeId: string; classification: string; internalState?: Record<string, unknown> }
  | { type: typeof STEP_TYPES.SET_NODE_COLOR; nodeId: string; color?: string; internalState?: Record<string, unknown> }
  | { type: typeof STEP_TYPES.DS_UPDATE; data: unknown[]; action: 'push' | 'pop' | 'update'; node?: string; internalState?: Record<string, unknown> }
  | { type: typeof STEP_TYPES.ADD_BACK_EDGE; edgeId: string; source: string; target: string; classification: string; internalState?: Record<string, unknown> }
  | { type: typeof STEP_TYPES.UPDATE_VISITED; nodeId: string; internalState?: Record<string, unknown> }
  | { type: typeof STEP_TYPES.UPDATE_PARENT; childId: string; parentId: string; internalState?: Record<string, unknown> }
  | { type: typeof STEP_TYPES.RESET_VISITED; internalState?: Record<string, unknown> }
  | { type: typeof STEP_TYPES.RESET_PARENT; internalState?: Record<string, unknown> }
  | { type: typeof STEP_TYPES.RESET_COMPONENTS; internalState?: Record<string, unknown> }
  | { type: typeof STEP_TYPES.FOUND_COMPONENT; component: string[]; internalState?: Record<string, unknown> }
  | { type: typeof STEP_TYPES.DS_UPDATE_ROUTING_TABLE; table: Record<string, unknown>; internalState?: Record<string, unknown> }
  | { type: typeof STEP_TYPES.SET_ACTIVE_TABLE_NODE; nodeId: string | null; internalState?: Record<string, unknown> }
  | { type: typeof STEP_TYPES.ADD_LSA; lsa: Record<string, unknown>; internalState?: Record<string, unknown> }
  | { type: typeof STEP_TYPES.SET_RESULT_DATA; data: Record<string, unknown>; internalState?: Record<string, unknown> }
  | { type: typeof STEP_TYPES.SET_TRANSPOSE_VIEW; isTransposed: boolean; internalState?: Record<string, unknown> };

export type AlgorithmGenerator = Generator<AlgorithmStep, void, unknown>;

export const createStep = <T extends StepType>(type: T, payload: Record<string, unknown> = {}) => ({
  type,
  ...payload,
}) as AlgorithmStep;
