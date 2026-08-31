<script lang="ts">
  import { Handle, Position } from "@xyflow/svelte";
  import Trash from "@tabler/icons-svelte-runes/icons/trash";
  import Code from "@tabler/icons-svelte-runes/icons/code";
  import type { NodeProps } from "@xyflow/svelte";
  import type { JasonNode } from "~/stores/graph.svelte";
  import JsonViewer from "./json-viewer.svelte";
  import { editorStore } from "~/stores/editor.svelte";
  import { graphStore } from "~/stores/graph.svelte";

  let { data, id }: NodeProps<JasonNode> = $props();

  const isConnected = $derived(graphStore.connectedNodeIds.has(id));
  const isDirectHovered = $derived(graphStore.hoveredNodeId === id);
  const isDimmed = $derived(graphStore.hasFocus && !isConnected);

  $inspect(data, id);
</script>

<div
  tabindex="0"
  role="button"
  onmouseenter={() => graphStore.setHoveredNode(id)}
  onmouseleave={() => graphStore.setHoveredNode(null)}
  class="node-card flex flex-col w-64 group outline-none transition-all duration-200"
  class:node-highlighted={isConnected}
  class:node-direct-hover={isDirectHovered}
  class:node-dimmed={isDimmed}
>
  <Handle type="target" position={Position.Left} class="handle-target" />
  <Handle type="source" position={Position.Right} class="handle-source" />

  <div class="node-header px-4 py-1.5 flex items-center justify-between min-h-11">
    <span class="node-title text-[13px] font-semibold tracking-[-0.01em] select-none">
      {data.label}
    </span>
    <div
      class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto"
    >
      <button
        onclick={() => editorStore.openEditor(id, data.label, data.json)}
        class="action-btn edit-btn grid place-items-center cursor-pointer"
        aria-label="Edit JSON"
      >
        <Code class="size-3.5" />
      </button>
      <button
        onclick={() => graphStore.deleteNode(id)}
        class="action-btn delete-btn grid place-items-center cursor-pointer"
        aria-label="Delete Node"
      >
        <Trash class="size-3.5" />
      </button>
    </div>
  </div>

  <div class="node-body overflow-hidden">
    <JsonViewer code={data.json} />
  </div>
</div>

<style>
  .node-card {
    border-radius: var(--radius-md);
    background-color: var(--color-surface);
    border: 0.5px solid var(--color-border);
    box-shadow:
      0 1px 3px var(--color-shadow),
      0 1px 2px rgba(0, 0, 0, 0.04);
    transition:
      border-color 0.2s ease-out,
      box-shadow 0.2s ease-out,
      opacity 0.2s ease-out;
  }

  .node-card:hover,
  .node-card.node-highlighted {
    border-color: var(--color-primary);
    box-shadow:
      0 6px 20px var(--color-primary-light),
      0 1px 3px rgba(0, 0, 0, 0.05),
      0 0 0 1px var(--color-primary);
  }

  .node-card.node-dimmed {
    opacity: 0.3;
  }

  .node-header {
    border-top-left-radius: var(--radius-md);
    border-top-right-radius: var(--radius-md);
    border-bottom: 0.5px solid var(--color-border);
  }

  .node-title {
    color: var(--color-text-primary);
  }

  .node-body {
    border-bottom-left-radius: var(--radius-md);
    border-bottom-right-radius: var(--radius-md);
  }

  .action-btn {
    width: 28px;
    height: 28px;
    position: relative;
    border-radius: var(--radius-sm);
    color: var(--color-text-tertiary);
    transition: all 0.12s ease;
    border: none;
    background: transparent;
  }

  /* Expand touch target to 44px+ boundary without visual changes */
  .action-btn::after {
    content: "";
    position: absolute;
    inset: -8px;
  }

  .edit-btn:hover {
    color: var(--color-primary);
    background-color: var(--color-primary-light);
  }

  .delete-btn:hover {
    color: var(--color-danger);
    background-color: var(--color-danger-bg);
  }
</style>
