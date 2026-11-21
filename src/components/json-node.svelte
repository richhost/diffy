<script lang="ts">
  import { Handle, Position } from "@xyflow/svelte";
  import Trash from "@tabler/icons-svelte-runes/icons/trash";
  import Code from "@tabler/icons-svelte-runes/icons/code";
  import type { NodeProps } from "@xyflow/svelte";
  import { Tooltip, TooltipTrigger, TooltipContent } from "@ui-sdk/svelte/tooltip";
  import type { JasonNode } from "~/stores/graph.svelte";
  import JsonViewer from "./json-viewer.svelte";
  import { editorStore } from "~/stores/editor.svelte";
  import { graphStore } from "~/stores/graph.svelte";
  import { i18n } from "~/stores/i18n.svelte";

  let { data, id }: NodeProps<JasonNode> = $props();

  const isConnected = $derived(graphStore.connectedNodeIds.has(id));
  const isDirectHovered = $derived(graphStore.hoveredNodeId === id);
  const isDimmed = $derived(graphStore.hasFocus && !isConnected);
  const isInvalidJson = $derived.by(() => {
    if (!data.json.trim()) return false;
    try {
      JSON.parse(data.json);
      return false;
    } catch {
      return true;
    }
  });

  $effect(() => {
    return () => {
      if (graphStore.hoveredNodeId === id) {
        graphStore.setHoveredNode(null);
      }
    };
  });
</script>

<div
  tabindex="0"
  role="button"
  onmouseenter={() => graphStore.setHoveredNode(id)}
  onmouseleave={() => graphStore.setHoveredNode(null)}
  ondblclick={(e) => {
    const target = e.target as HTMLElement | null;
    const interactive = target?.closest("button, [role='button'], .svelte-flow__handle");
    if (interactive && interactive !== e.currentTarget) return;
    e.stopPropagation();
    editorStore.openEditor(id, data.label, data.json);
  }}
  onkeydown={(e) => {
    if (e.target === e.currentTarget && e.key === "Enter") {
      e.preventDefault();
      editorStore.openEditor(id, data.label, data.json);
    }
  }}
  class="node-card flex flex-col w-64 group outline-none"
  class:node-highlighted={isConnected}
  class:node-direct-hover={isDirectHovered}
  class:node-dimmed={isDimmed}
>
  <Handle type="target" position={Position.Left} class="handle-target" />
  <Handle type="source" position={Position.Right} class="handle-source" />

  <div
    class="node-header px-3.5 py-2.5 flex items-center justify-between gap-2 border-b border-[var(--line)]"
  >
    <div class="flex items-center gap-1.5 min-w-0">
      <span class="node-title text-[12.5px] font-medium tracking-[-0.01em] truncate select-none">
        {data.label}
      </span>
      {#if isInvalidJson}
        <span
          class="w-1.5 h-1.5 rounded-full bg-[var(--danger)] flex-none"
          title={i18n.t("invalidJson")}
        ></span>
      {/if}
    </div>
    <div
      class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto"
    >
      <Tooltip>
        <TooltipTrigger
          onclick={() => editorStore.openEditor(id, data.label, data.json)}
          class="action-btn edit-btn grid place-items-center cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-active)]"
          aria-label={i18n.t("editNode")}
        >
          <Code class="size-3.5" />
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6} class="ui-tooltip-content">
          {i18n.t("editNode")}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          onclick={() => graphStore.deleteNode(id)}
          class="action-btn delete-btn grid place-items-center cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-active)]"
          aria-label="Delete Node"
        >
          <Trash class="size-3.5" />
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6} class="ui-tooltip-content">
          Delete
        </TooltipContent>
      </Tooltip>
    </div>
  </div>

  <div class="node-body rounded-b-[9px] bg-[var(--surface-subtle)] overflow-hidden">
    <JsonViewer code={data.json} />
  </div>
</div>

<style>
  .node-card {
    border-radius: var(--radius-lg);
    background-color: var(--surface);
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-card);
    transition:
      border-color 160ms ease,
      box-shadow 160ms ease,
      opacity 160ms ease;
  }

  .node-card:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-card-active);
  }

  .node-card.node-highlighted {
    border-color: var(--border-active);
    box-shadow: var(--shadow-card-active);
  }

  .node-card.node-dimmed {
    opacity: 0.36;
  }

  .node-title {
    color: var(--ink);
  }

  .node-card :global(.action-btn) {
    width: 26px;
    height: 26px;
    position: relative;
    border-radius: 6px;
    color: var(--ink-tertiary);
    transition:
      background-color 120ms ease,
      color 120ms ease;
    border: none;
    background: transparent;
  }

  /* Expand touch target to 44px+ boundary without visual changes */
  .node-card :global(.action-btn::after) {
    content: "";
    position: absolute;
    inset: -9px;
  }

  .node-card :global(.edit-btn:hover) {
    color: var(--ink);
    background-color: var(--hover);
  }

  .node-card :global(.delete-btn:hover) {
    color: var(--danger);
    background-color: var(--danger-bg);
  }
</style>
