<script lang="ts">
  import { getBezierPath, BaseEdge, EdgeLabel } from "@xyflow/svelte";
  import type { EdgeProps } from "@xyflow/svelte";
  import { parseDiffFromFile } from "@pierre/diffs";
  import Trash from "@tabler/icons-svelte-runes/icons/trash";
  import GitCompare from "@tabler/icons-svelte-runes/icons/git-compare";
  import { Tooltip, TooltipTrigger, TooltipContent } from "@ui-sdk/svelte/tooltip";
  import { graphStore } from "~/stores/graph.svelte";
  import { diffStore } from "~/stores/diff.svelte";
  import { i18n } from "~/stores/i18n.svelte";

  let {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerStart,
    style,
  }: EdgeProps = $props();

  $effect(() => {
    return () => {
      if (graphStore.hoveredEdgeId === id) {
        graphStore.setHoveredEdge(null);
      }
    };
  });

  const [edgePath, labelX, labelY] = $derived(
    getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    }),
  );

  const sourceNode = $derived(graphStore.nodes.find((n) => n.id === source));
  const targetNode = $derived(graphStore.nodes.find((n) => n.id === target));
  const sourceJson = $derived(sourceNode?.data?.json ?? "{}");
  const targetJson = $derived(targetNode?.data?.json ?? "{}");

  const diffMeta = $derived.by(() => {
    if (!sourceNode || !targetNode) return null;
    try {
      if (sourceJson.trim()) JSON.parse(sourceJson);
      if (targetJson.trim()) JSON.parse(targetJson);
      const oldFile = {
        name: (sourceNode.data.label || "source") + ".json",
        contents: sourceJson,
      };
      const newFile = {
        name: (targetNode.data.label || "target") + ".json",
        contents: targetJson,
      };
      return parseDiffFromFile(oldFile, newFile);
    } catch (e) {
      return null;
    }
  });

  const isValid = $derived(diffMeta !== null);

  const isEdgeActive = $derived(graphStore.connectedEdgeIds.has(id));
  const isDimmed = $derived(graphStore.hasFocus && !isEdgeActive);
  const tooltipText = $derived(
    `${sourceNode?.data?.label || "Source"} → ${targetNode?.data?.label || "Target"}`,
  );
  const markerId = $derived(`diffy-arrow-${id}`);
</script>

<!-- SVG Defs for crisp directional arrow marker -->
<svg style="position: absolute; width: 0; height: 0; pointer-events: none;">
  <defs>
    <marker
      id={markerId}
      viewBox="0 0 10 10"
      refX="7"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path
        d="M 0 1.5 L 8.5 5 L 0 8.5 z"
        fill={isEdgeActive ? "var(--edge-stroke-active)" : "var(--edge-stroke)"}
      />
    </marker>
  </defs>
</svg>

<!-- Edge path -->
<BaseEdge
  path={edgePath}
  markerEnd="url(#{markerId})"
  {markerStart}
  style="{style ?? ''}; {isEdgeActive
    ? 'stroke: var(--edge-stroke-active) !important; stroke-width: 1.75px !important; opacity: 1 !important; z-index: 10 !important;'
    : isDimmed
      ? 'opacity: 0.2 !important; stroke-width: 1.25px !important;'
      : ''}"
/>

<!-- Edge label badge -->
<EdgeLabel x={labelX} y={labelY} transparent>
  <div
    role="group"
    onmouseenter={() => graphStore.setHoveredEdge(id)}
    onmouseleave={() => graphStore.setHoveredEdge(null)}
    class="pill nodrag nopan flex items-center gap-0.5 p-0.5 rounded-[8px] bg-[var(--surface)] border border-[var(--border-color)] transition-colors duration-150"
    class:pill-highlighted={isEdgeActive}
    class:pill-invalid={!isValid}
    class:pill-dimmed={isDimmed}
    title={tooltipText}
  >
    <!-- Compare button -->
    <button
      type="button"
      onclick={() => {
        if (sourceNode && targetNode && isValid) {
          diffStore.openDiff(
            source,
            target,
            sourceNode.data.label,
            targetNode.data.label,
            sourceJson,
            targetJson,
          );
        }
      }}
      disabled={!isValid}
      class="compare-btn flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-[11px] font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 transition-colors duration-150 outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-active)]"
      class:compare-btn-active={isValid && isEdgeActive}
      class:compare-btn-invalid={!isValid}
      title={tooltipText}
    >
      {#if isValid}
        <GitCompare class="size-3.5 flex-none" />
      {/if}
      <span>{isValid ? i18n.t("compare") : i18n.t("invalidJson")}</span>
    </button>

    <!-- Divider -->
    <div class="w-px h-3 bg-[var(--line)] mx-0.5 flex-none"></div>

    <!-- Delete button -->
    <Tooltip>
      <TooltipTrigger
        onclick={() => graphStore.deleteEdge(id)}
        class="delete-btn w-6 h-6 rounded-[6px] grid place-items-center cursor-pointer transition-colors duration-150 outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-active)]"
        aria-label="Delete Edge"
      >
        <Trash class="size-3" />
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} class="ui-tooltip-content">
        Delete
      </TooltipContent>
    </Tooltip>
  </div>
</EdgeLabel>

<style>
  :global(.svelte-flow__edge-label) {
    background: transparent !important;
    padding: 0 !important;
  }

  .pill {
    box-shadow: var(--shadow-xs);
    transition:
      border-color 160ms ease,
      box-shadow 160ms ease,
      opacity 160ms ease;
  }

  .pill.pill-invalid {
    border-style: dashed;
    border-color: var(--border-strong);
  }

  .pill:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-popover);
  }

  .pill.pill-highlighted {
    border-color: var(--border-active);
    box-shadow: var(--shadow-popover);
  }

  .pill.pill-dimmed {
    opacity: 0.25;
  }

  .compare-btn {
    color: var(--ink-secondary);
  }

  .compare-btn.compare-btn-active {
    color: var(--ink);
  }

  .compare-btn.compare-btn-invalid {
    color: var(--ink-tertiary);
  }

  .compare-btn:hover:not(:disabled) {
    background-color: var(--hover);
    color: var(--ink);
  }

  .pill :global(.delete-btn svg) {
    color: var(--ink-tertiary);
    transition: color 120ms ease;
  }

  .pill :global(.delete-btn:hover) {
    background-color: var(--danger-bg);
  }

  .pill :global(.delete-btn:hover svg) {
    color: var(--danger) !important;
  }
</style>
