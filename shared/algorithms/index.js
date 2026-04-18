export * from './modules/traversal.js';
export * from './modules/shortestPath.js';
export * from './modules/mst.js';
export * from './modules/routing.js';
export * from './modules/connectivity.js';

import { dfs, bfs } from './modules/traversal.js';
import { dijkstra, floydWarshall } from './modules/shortestPath.js';
import { prim, kruskal } from './modules/mst.js';
import { distanceVector, linkState } from './modules/routing.js';
import { scc, articulationPoints } from './modules/connectivity.js';

export const algorithms = {
  dfs,
  bfs,
  dijkstra,
  prim,
  kruskal,
  scc,
  distanceVector,
  linkState,
  floydWarshall,
  articulationPoints,
};
