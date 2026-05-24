import type { Node, Edge } from "@xyflow/svelte";
import { storage } from "@wxt-dev/storage";

const STORAGE_KEY = "local:diffy:graph:v1";

type NodeData = {
  label: string;
  json: string;
};

export type JasonNode = Node<NodeData>;

export interface GraphData {
  nodes: JasonNode[];
  edges: Edge[];
  nodeCounter: number;
}

const DEFAULT_GRAPH: GraphData = {
  nodeCounter: 3,
  nodes: [
    {
      id: "1",
      type: "json",
      position: { x: 80, y: 100 },
      data: {
        label: "Before",
        json: JSON.stringify(
          {
            id: "usr_9k2m",
            name: "Ada Lovelace",
            email: "ada@example.com",
            role: "viewer",
            plan: "free",
            verified: false,
            createdAt: "2024-01-15T08:00:00Z",
          },
          null,
          2,
        ),
      },
    },
    {
      id: "2",
      type: "json",
      position: { x: 460, y: 100 },
      data: {
        label: "After",
        json: JSON.stringify(
          {
            id: "usr_9k2m",
            name: "Ada Lovelace",
            email: "ada@lovelace.dev",
            role: "admin",
            plan: "pro",
            verified: true,
            createdAt: "2024-01-15T08:00:00Z",
            updatedAt: "2024-11-03T14:22:10Z",
          },
          null,
          2,
        ),
      },
    },
  ],
  edges: [{ id: "e1-2", source: "1", target: "2", type: "diff", animated: true }],
};

class GraphStore {
  nodes = $state.raw<JasonNode[]>([]);
  edges = $state.raw<Edge[]>([]);
  nodeCounter = $state(DEFAULT_GRAPH.nodeCounter);
  loading = $state(true);

  private async loadGraph(): Promise<GraphData> {
    try {
      const raw = await storage.getItem<GraphData>(STORAGE_KEY);
      if (raw) return raw;
    } catch (err) {
      console.error("Failed to load graph from storage:", err);
    }
    return structuredClone(DEFAULT_GRAPH);
  }

  private async saveGraph(data: GraphData) {
    try {
      await storage.setItem(STORAGE_KEY, data);
    } catch (err) {
      console.error("Failed to save graph to storage. Quota exceeded?", err);
    }
  }

  private persist() {
    this.saveGraph({
      nodes: this.nodes,
      edges: this.edges,
      nodeCounter: this.nodeCounter,
    });
  }

  async init() {
    this.loading = true;
    const persisted = await this.loadGraph();
    this.nodes = persisted.nodes;
    this.edges = persisted.edges;
    this.nodeCounter = persisted.nodeCounter;
    this.loading = false;
  }

  setNodes(newNodes: JasonNode[]) {
    this.nodes = newNodes;
    if (!this.loading) this.persist();
  }

  setEdges(newEdges: Edge[]) {
    this.edges = newEdges;
    if (!this.loading) this.persist();
  }

  addNode(position: { x: number; y: number }) {
    const id = String(this.nodeCounter++);
    this.nodes = [
      ...this.nodes,
      {
        id,
        type: "json",
        position,
        data: { label: `Node ${id}`, json: "{}" },
      },
    ];
    this.persist();
    return id;
  }

  updateNodeData(nodeId: string, patch: Partial<{ label: string; json: string }>) {
    this.nodes = this.nodes.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n,
    );
    this.persist();
  }

  reset() {
    const fresh = structuredClone(DEFAULT_GRAPH);
    this.nodes = fresh.nodes;
    this.edges = fresh.edges;
    this.nodeCounter = fresh.nodeCounter;
    this.persist();
  }

  deleteNode(nodeId: string) {
    this.nodes = this.nodes.filter((n) => n.id !== nodeId);
    this.edges = this.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    this.persist();
  }

  exportJSON(): string {
    return JSON.stringify({ nodes: this.nodes, edges: this.edges }, null, 2);
  }

  importJSON(raw: string) {
    const parsed = JSON.parse(raw) as { nodes: JasonNode[]; edges: Edge[] };
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges))
      throw new Error("Invalid graph JSON");
    const maxId = parsed.nodes.reduce((m, n) => Math.max(m, Number(n.id) || 0), 0);
    this.nodes = parsed.nodes;
    this.edges = parsed.edges;
    this.nodeCounter = maxId + 1;
    this.persist();
  }
}

export const graphStore = new GraphStore();
