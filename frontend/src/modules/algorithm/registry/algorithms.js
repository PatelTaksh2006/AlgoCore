import { dfs, bfs } from '../implementations/traversal/index.js';
import { dijkstra, floydWarshall } from '../implementations/shortestPath/index.js';
import { prim, kruskal } from '../implementations/mst/index.js';
import { distanceVector, linkState } from '../implementations/routing/index.js';
import { scc, articulationPoints } from '../implementations/connectivity/index.js';

export {
  dfs,
  bfs,
  dijkstra,
  floydWarshall,
  prim,
  kruskal,
  distanceVector,
  linkState,
  scc,
  articulationPoints,
};

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
