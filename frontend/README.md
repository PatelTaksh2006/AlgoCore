# AlgoCore (Folder-First Architecture)

This codebase is organized for readability, traceability, and maintainability without introducing service deployment complexity.

## Current Architecture

```text
src/
	features/
		algorithm/
			context/
				AlgorithmContext.jsx      # algorithm run state + playback orchestration
		graph/
			context/
				GraphContext.jsx          # graph state + graph mutations
	context/
		AlgorithmContext.jsx          # compatibility re-export
		GraphContext.jsx              # compatibility re-export
	algorithms/
		index.js                      # compatibility re-export to shared algorithms
		pseudocode.js                 # compatibility re-export to shared pseudocode
	components/
	services/
	store/
	utils/

shared/
	algorithms/
		core/
			helpers.js                  # common algorithm helpers
		modules/
			traversal.js                # dfs, bfs
			shortestPath.js             # dijkstra, floydWarshall
			mst.js                      # prim, kruskal
			routing.js                  # distanceVector, linkState
			connectivity.js             # scc, articulationPoints
		index.js                      # algorithm barrel + registry object
		pseudocode.js
```

## Why This Structure

1. Large files were split into focused modules.
2. Feature boundaries are explicit (`algorithm`, `graph`).
3. Backward-compatible import paths remain valid.
4. Algorithm logic has a single source of truth under `shared/algorithms`.

## Development

1. Install dependencies:
	 - `npm install`
2. Run dev server:
	 - `npm run dev`
3. Build:
	 - `npm run build`
