import type { JasonNode } from "~/stores/graph.svelte";
import type { Edge } from "@xyflow/svelte";

export interface LayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  gapX?: number;
  gapY?: number;
  startX?: number;
  startY?: number;
  componentGapY?: number;
}

/**
 * Pure DAG Layered (Sugiyama-style) Topological Auto-Layout Algorithm
 * Groups nodes into topological ranks (columns) from left-to-right,
 * vertically centers layers, and stacks disconnected subgraphs neatly.
 */
export function layoutGraph(
  nodes: JasonNode[],
  edges: Edge[],
  options: LayoutOptions = {},
): JasonNode[] {
  if (nodes.length === 0) return [];

  const {
    nodeWidth = 256,
    nodeHeight = 230,
    gapX = 140,
    gapY = 60,
    startX = 100,
    startY = 100,
    componentGapY = 90,
  } = options;

  const nodeMap = new Map<string, JasonNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  // 1. Build adjacency lists
  const adj = new Map<string, string[]>(); // directed source -> targets
  const inDegree = new Map<string, number>();
  const undirectedAdj = new Map<string, string[]>();

  for (const n of nodes) {
    adj.set(n.id, []);
    inDegree.set(n.id, 0);
    undirectedAdj.set(n.id, []);
  }

  for (const e of edges) {
    if (nodeMap.has(e.source) && nodeMap.has(e.target)) {
      adj.get(e.source)?.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      undirectedAdj.get(e.source)?.push(e.target);
      undirectedAdj.get(e.target)?.push(e.source);
    }
  }

  // 2. Discover disconnected components via BFS
  const visitedGlobal = new Set<string>();
  const components: string[][] = [];

  for (const n of nodes) {
    if (!visitedGlobal.has(n.id)) {
      const comp: string[] = [];
      const queue = [n.id];
      visitedGlobal.add(n.id);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        comp.push(curr);
        for (const neighbor of undirectedAdj.get(curr) || []) {
          if (!visitedGlobal.has(neighbor)) {
            visitedGlobal.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      components.push(comp);
    }
  }

  // 3. Layout each component
  const resultNodes: JasonNode[] = [];
  let currentY = startY;

  for (const comp of components) {
    const layer = new Map<string, number>();

    // Identify roots in this component (in-degree == 0)
    const roots = comp.filter((id) => (inDegree.get(id) || 0) === 0);
    const startNodes: string[] = roots.length > 0 ? roots : comp[0] ? [comp[0]] : [];

    const queue: { id: string; rank: number }[] = startNodes.map((id) => ({
      id,
      rank: 0,
    }));

    for (const { id } of queue) {
      layer.set(id, 0);
    }

    // Longest-path layer assignment with cycle avoidance
    while (queue.length > 0) {
      const { id, rank } = queue.shift()!;
      const children = adj.get(id) || [];

      for (const childId of children) {
        if (!comp.includes(childId)) continue;

        const nextRank = rank + 1;
        const currentRank = layer.get(childId);

        if (currentRank === undefined || nextRank > currentRank) {
          if (nextRank < comp.length) {
            layer.set(childId, nextRank);
            queue.push({ id: childId, rank: nextRank });
          }
        }
      }
    }

    for (const id of comp) {
      if (!layer.has(id)) {
        layer.set(id, 0);
      }
    }

    // Group nodes by layer
    const layersMap = new Map<number, string[]>();
    for (const id of comp) {
      const l = layer.get(id) ?? 0;
      if (!layersMap.has(l)) layersMap.set(l, []);
      layersMap.get(l)!.push(id);
    }

    const sortedLayers = Array.from(layersMap.keys()).sort((a, b) => a - b);

    // Calculate maximum row height in this component
    let maxRowsInComp = 1;
    for (const l of sortedLayers) {
      maxRowsInComp = Math.max(maxRowsInComp, layersMap.get(l)!.length);
    }

    const compTotalHeight = maxRowsInComp * nodeHeight + (maxRowsInComp - 1) * gapY;

    // Position nodes in each layer
    for (const l of sortedLayers) {
      const nodeIdsInLayer = layersMap.get(l)!;
      const x = startX + l * (nodeWidth + gapX);

      const layerHeight = nodeIdsInLayer.length * nodeHeight + (nodeIdsInLayer.length - 1) * gapY;

      // Vertically center this column relative to the component height
      const layerStartY = currentY + (compTotalHeight - layerHeight) / 2;

      nodeIdsInLayer.forEach((id, rowIndex) => {
        const y = layerStartY + rowIndex * (nodeHeight + gapY);
        const originalNode = nodeMap.get(id)!;
        resultNodes.push({
          ...originalNode,
          position: { x, y },
        });
      });
    }

    currentY += compTotalHeight + componentGapY;
  }

  return resultNodes;
}
