# AlgoCore

AlgoCore is a frontend-only React app for graph algorithm visualization.

## Architecture

The codebase is organized around three modules under `frontend/src/modules`:

- `graph`: graph domain model, graph state/context, and graph canvas UI.
- `algorithm`: algorithm implementations, protocol, engine, and registry.
- `simulation`: controller/interpreter and visualization panels/results.

Data flow is unidirectional:

`Graph -> Algorithm Engine -> Step Output -> Interpreter -> Store -> UI`

## Key Structure

```text
frontend/
	src/
		modules/
			algorithm/
				context/
				core/
				engine/
				implementations/
					traversal/
					shortestPath/
					mst/
					routing/
					connectivity/
				protocol/
					stepProtocol.ts
				registry/
			graph/
				model/
				context/
				components/
			simulation/
				controller/
				interpreter/
				components/
					core/
					results/
					apspResult/
					connectivityResult/
					dataStructurePanel/
					resultTree/
```

## Development

```bash
cd frontend
npm install
npm run dev
```

## Build

```bash
cd frontend
npm run build
```

## Add a New Algorithm

1. Add implementation in `frontend/src/modules/algorithm/implementations/<category>/`.
2. Export it from that category `index.js`.
3. Register it in `frontend/src/modules/algorithm/registry/algorithms.js`.
4. Add pseudocode in `frontend/src/modules/algorithm/registry/pseudocode.js`.
