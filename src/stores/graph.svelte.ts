import type { Node, Edge } from "@xyflow/svelte";
import { storage } from "@wxt-dev/storage";
import { layoutGraph } from "~/utils/layout";

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
      position: { x: 100, y: 150 },
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
      position: { x: 620, y: 150 },
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
  showUndoToast = $state(false);
  hoveredNodeId = $state<string | null>(null);
  hoveredEdgeId = $state<string | null>(null);

  setHoveredNode(id: string | null) {
    this.hoveredNodeId = id;
  }

  setHoveredEdge(id: string | null) {
    this.hoveredEdgeId = id;
  }

  get connectedNodeIds(): Set<string> {
    const set = new Set<string>();
    const isHoveredNodeValid =
      this.hoveredNodeId !== null && this.nodes.some((n) => n.id === this.hoveredNodeId);
    const isHoveredEdgeValid =
      this.hoveredEdgeId !== null && this.edges.some((e) => e.id === this.hoveredEdgeId);

    if (isHoveredNodeValid && this.hoveredNodeId) {
      set.add(this.hoveredNodeId);
      for (const e of this.edges) {
        if (e.source === this.hoveredNodeId) set.add(e.target);
        if (e.target === this.hoveredNodeId) set.add(e.source);
      }
    } else if (isHoveredEdgeValid && this.hoveredEdgeId) {
      const edge = this.edges.find((e) => e.id === this.hoveredEdgeId);
      if (edge) {
        set.add(edge.source);
        set.add(edge.target);
      }
    }
    return set;
  }

  get connectedEdgeIds(): Set<string> {
    const set = new Set<string>();
    const isHoveredNodeValid =
      this.hoveredNodeId !== null && this.nodes.some((n) => n.id === this.hoveredNodeId);
    const isHoveredEdgeValid =
      this.hoveredEdgeId !== null && this.edges.some((e) => e.id === this.hoveredEdgeId);

    if (isHoveredEdgeValid && this.hoveredEdgeId) {
      set.add(this.hoveredEdgeId);
    } else if (isHoveredNodeValid && this.hoveredNodeId) {
      for (const e of this.edges) {
        if (e.source === this.hoveredNodeId || e.target === this.hoveredNodeId) {
          set.add(e.id);
        }
      }
    }
    return set;
  }

  get hasFocus(): boolean {
    const isNodeValid =
      this.hoveredNodeId !== null && this.nodes.some((n) => n.id === this.hoveredNodeId);
    const isEdgeValid =
      this.hoveredEdgeId !== null && this.edges.some((e) => e.id === this.hoveredEdgeId);
    return isNodeValid || isEdgeValid;
  }

  private lastDeletedNode: JasonNode | null = null;
  private lastDeletedEdges: Edge[] = [];
  private toastTimer: any = null;

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
    this.nodes = [...newNodes];
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

  autoLayout() {
    this.nodes = layoutGraph(this.nodes, this.edges);
    this.persist();
  }

  reset() {
    const fresh = structuredClone(DEFAULT_GRAPH);
    this.nodes = fresh.nodes;
    this.edges = fresh.edges;
    this.nodeCounter = fresh.nodeCounter;
    this.hoveredNodeId = null;
    this.hoveredEdgeId = null;
    this.persist();
  }

  deleteNode(nodeId: string) {
    if (this.hoveredNodeId === nodeId) {
      this.hoveredNodeId = null;
    }
    const node = this.nodes.find((n) => n.id === nodeId);
    if (node) {
      this.lastDeletedNode = node;
      this.lastDeletedEdges = this.edges.filter((e) => e.source === nodeId || e.target === nodeId);
      this.showUndoToast = true;
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        this.showUndoToast = false;
        this.lastDeletedNode = null;
        this.lastDeletedEdges = [];
      }, 5000);
    }

    this.nodes = this.nodes.filter((n) => n.id !== nodeId);
    this.edges = this.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    this.persist();
  }

  restoreLastDeleted() {
    if (!this.lastDeletedNode) return;
    this.nodes = [...this.nodes, this.lastDeletedNode];
    this.edges = [...this.edges, ...this.lastDeletedEdges];
    this.lastDeletedNode = null;
    this.lastDeletedEdges = [];
    this.showUndoToast = false;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.persist();
  }

  dismissUndoToast() {
    this.showUndoToast = false;
    this.lastDeletedNode = null;
    this.lastDeletedEdges = [];
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  deleteEdge(edgeId: string) {
    if (this.hoveredEdgeId === edgeId) {
      this.hoveredEdgeId = null;
    }
    this.edges = this.edges.filter((e) => e.id !== edgeId);
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
    this.hoveredNodeId = null;
    this.hoveredEdgeId = null;
    this.persist();
  }
}

export const graphStore = new GraphStore();
