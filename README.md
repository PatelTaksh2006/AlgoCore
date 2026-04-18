# SDP Service-Based Implementation

This folder contains a service-oriented split of your app, built **only** in this directory:

- `frontend` (Vite + React UI)
- `services/gateway-service` (single entry point for clients)
- `services/graph-service` (graph state API)
- `services/algorithm-service` (algorithm execution API)
- `shared/algorithms` (reused algorithm logic)

## Service Communication

- Frontend calls `gateway-service` via `/api/*` (proxied in Vite).
- `gateway-service` forwards graph requests to `graph-service`.
- `gateway-service` forwards run requests to `algorithm-service`.
- `algorithm-service` can pull graph data directly from `graph-service` using `/run-from-graph`.

## Ports

- Gateway: `4000`
- Graph Service: `4001`
- Algorithm Service: `4002`
- Frontend (Vite): `5173`

## Run

```bash
cd C:\Users\taksh\Desktop\sdp
npm install
npm run dev
```

This starts all services and the frontend together.

## Validate Inter-Service Flow

With services running:

```bash
cd C:\Users\taksh\Desktop\sdp
npm run smoke
```

The smoke test verifies:
1. gateway health
2. graph write through gateway -> graph-service
3. algorithm run through gateway -> algorithm-service -> graph-service

## Important

No changes were made in your original `AlgoCore` folder for this implementation. All service-based code is inside this `sdp` folder.
