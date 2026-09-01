<script lang="ts">
  import { getBezierPath, BaseEdge, EdgeLabel } from "@xyflow/svelte";
  import type { EdgeProps } from "@xyflow/svelte";
  import { parseDiffFromFile } from "@pierre/diffs";
  import Trash from "@tabler/icons-svelte-runes/icons/trash";
  import GitCompare from "@tabler/icons-svelte-runes/icons/git-compare";
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
    markerEnd,
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
      JSON.parse(sourceJson);
      JSON.parse(targetJson);
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
    `${sourceNode?.data?.label || "Source"} → ${targetNode?.data?.label || "Target"}`
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
        d="M 0 1.5 L 8 5 L 0 8.5 z"
        fill={isEdgeActive ? 'var(--color-primary)' : 'var(--edge-stroke, rgba(0, 0, 0, 0.25))'}
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
    ? 'stroke: var(--color-primary) !important; stroke-width: 2.5px !important; opacity: 1 !important; z-index: 10 !important;'
    : isDimmed
      ? 'opacity: 0.2 !important; stroke-width: 1px !important;'
      : ''}"
/>

<!-- Edge label pill -->
<EdgeLabel x={labelX} y={labelY}>
  <div
    role="group"
    onmouseenter={() => graphStore.setHoveredEdge(id)}
    onmouseleave={() => graphStore.setHoveredEdge(null)}
    class="pill nodrag nopan flex items-center p-0.5 bg-surface rounded-full transition-all duration-200"
    class:pill-highlighted={isEdgeActive}
    class:pill-dimmed={isDimmed}
    title={tooltipText}
  >
    <!-- Compare button -->
    <button
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
      class="compare-btn group/cmp flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 transition-all duration-150 active:scale-[0.97]"
      style="color: {isValid ? 'var(--color-primary)' : 'var(--color-text-quaternary)'};"
      title={tooltipText}
    >
      {#if isValid}
        <GitCompare class="size-3.5 flex-none" />
      {/if}
      <span>{isValid ? i18n.t("compare") : i18n.t("invalidJson")}</span>
    </button>

    <!-- Divider -->
    <div class="w-px h-3 bg-border mx-0.5 flex-none"></div>

    <!-- Delete button -->
    <button
      onclick={() => graphStore.deleteEdge(id)}
      class="delete-btn w-6 h-6 rounded-full grid place-items-center cursor-pointer transition-all duration-150 mr-0.5"
      aria-label="Delete Edge"
    >
      <Trash class="size-3" />
    </button>
  </div>
</EdgeLabel>

<style>
  /* Strip XYFlow's default EdgeLabel background entirely */
  :global(.svelte-flow__edge-label) {
    background: transparent !important;
    padding: 0 !important;
  }

  .pill {
    box-shadow:
      0 2px 8px var(--color-shadow),
      0 0 0 0.5px var(--color-border);
    transition:
      box-shadow 0.2s ease,
      transform 0.2s ease,
      opacity 0.2s ease;
  }

  .pill:hover,
  .pill.pill-highlighted {
    box-shadow:
      0 4px 18px var(--color-primary-light),
      0 0 0 1px var(--color-primary);
  }

  .pill.pill-dimmed {
    opacity: 0.25;
  }

  .compare-btn:hover:not(:disabled) {
    background-color: var(--color-primary-light);
    color: var(--color-primary-hover) !important;
  }

  .delete-btn :global(svg) {
    color: var(--color-text-tertiary);
    transition: color 0.12s ease;
  }

  .delete-btn:hover {
    background-color: var(--color-danger-bg);
  }

  .delete-btn:hover :global(svg) {
    color: var(--color-danger) !important;
  }
</style>
