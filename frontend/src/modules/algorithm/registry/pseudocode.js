export const PSEUDOCODE = {
    dfs: [
        "function DFS(u):",           // 0
        "  mark u as Visited (Gray)", // 1
        "  for each neighbor v of u:",// 2
        "    if v is Unvisited:",     // 3
        "      DFS(v)",               // 4
        "  mark u as Finished (Black)"// 5
    ],
    bfs: [
        "function BFS(start):",       // 0
        "  create queue Q, enqueue start", // 1
        "  mark start as Visited",    // 2
        "  while Q is not empty:",    // 3
        "    u = Q.dequeue()",        // 4
        "    for each neighbor v of u:", // 5
        "      if v is Unvisited:",   // 6
        "        mark v as Visited",  // 7
        "        Q.enqueue(v)"        // 8
    ],
    dijkstra: [
        "function Dijkstra(start):",  // 0
        "  dist[start] = 0, Q.push(start)", // 1
        "  while Q is not empty:",    // 2
        "    u = Q.extractMin()",     // 3
        "    for each neighbor v of u:", // 4
        "      alt = dist[u] + weight(u, v)", // 5
        "      if alt < dist[v]:",    // 6
        "        dist[v] = alt",      // 7
        "        Q.decreaseKey(v, alt)" // 8
    ],
    floydWarshall: [
        "function FloydWarshall(G):",                 // 0
        "  initialize dist and next matrices",        // 1
        "  for each intermediate node k:",            // 2
        "    for each source i:",                     // 3
        "      for each destination j:",              // 4
        "        if dist[i][j] > dist[i][k] + dist[k][j]:", // 5
        "          dist[i][j] = dist[i][k] + dist[k][j]",   // 6
        "          next[i][j] = next[i][k]"           // 7
    ],
    prim: [
        "function Prim(start):",      // 0
        "  key[start] = 0, Q.push(start)", // 1
        "  while Q is not empty:",    // 2
        "    u = Q.extractMin()",     // 3
        "    add u to MST",           // 4
        "    for each neighbor v of u:", // 5
        "      if v not in MST and weight < key[v]:", // 6
        "        parent[v] = u",      // 7
        "        key[v] = weight",    // 8
        "        Q.decreaseKey(v, weight)" // 9
    ],
    kruskal: [
        "function Kruskal():",        // 0
        "  sort edges by weight",     // 1
        "  for each edge (u, v):",    // 2
        "    if find(u) != find(v):", // 3
        "      union(u, v)",          // 4
        "      add edge to MST"       // 5
    ],
    scc: [
        "function KosarajuSCC(G):",
        "  visited = {}, stack = []",
        "  for each vertex u in G: if not visited[u], DFS1(u)",
        "  transpose G to G^T (reverse all edges)",
        "  clear visited",
        "  while stack is not empty:",
        "    u = stack.pop()",
        "    if not visited[u]:",
        "      component = []",
        "      DFS2(G^T, u, component)",
        "      output component as one SCC"
    ],
    articulationPoints: [
        "function ArticulationPoints(G):",               // 0
        "  visit u: discovery[u] = low[u] = ++time",     // 1
        "  for each neighbor v of u:",                   // 2
        "    if v is already visited (back edge):",      // 3
        "      low[u] = min(low[u], discovery[v])",      // 4
        "    else DFS(v), then low[u] = min(low[u], low[v])", // 5
        "    if u is non-root and low[v] >= discovery[u]: u is AP", // 6
        "  if u is root and has >1 DFS children: u is AP", // 7
        "  mark u processed"                              // 8
    ],
    distanceVector: [
        "function DistanceVector(N):",       // 0
        "  Loop until converged (or N-1):",  // 1
        "    For each edge (u, v):",         // 2
        "      if dist(u) > dist(v) + w:",   // 3
        "        dist(u) = dist(v) + w",     // 4
        "        notify neighbors"           // 5
    ],
    linkState: [
        "function LinkStateRouting(routeNode):",                  // 0
        "  For each node u: discover direct neighbors",           // 1
        "  For each node u: flood LSA to build LSDB",             // 2
        "  routeNode runs Dijkstra(LSDB)",                        // 3
        "  Update routeNode forwarding table with best next hops" // 4
    ]
};
