<script lang="ts">
  import { getBezierPath, BaseEdge, EdgeLabel } from "@xyflow/svelte";
  import type { EdgeProps } from "@xyflow/svelte";
  import { parseDiffFromFile } from "@pierre/diffs";
  import Trash from "@tabler/icons-svelte-runes/icons/trash";
  import { graphStore } from "~/stores/graph.svelte";
  import { diffStore } from "~/stores/diff.svelte";

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
</script>

<!-- Edge path -->
<BaseEdge path={edgePath} {markerEnd} {markerStart} {style} />

<!-- Edge label pill -->
<EdgeLabel x={labelX} y={labelY}>
  <div class="pill nodrag nopan flex items-center bg-[var(--color-surface)] rounded-full">
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
      class="compare-btn px-3.5 py-2 text-[11px] font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 transition-all duration-150"
      style="color: {isValid ? 'var(--color-primary)' : 'var(--color-text-quaternary)'};"
    >
      {isValid ? "Compare" : "Invalid JSON"}
    </button>

    <!-- Divider -->
    <div class="w-px h-3 bg-[var(--color-border)] flex-none"></div>

    <!-- Delete button — icon color only, no background -->
    <button
      onclick={() => graphStore.deleteEdge(id)}
      class="delete-btn w-9 h-9 grid place-items-center cursor-pointer transition-colors duration-150"
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
      0 2px 10px var(--color-shadow),
      0 0 0 0.5px var(--color-border);
  }

  /* Compare: hover slightly darkens the text and adds a breathing glow */
  .compare-btn:hover:not(:disabled) {
    color: var(--color-primary-hover) !important;
    text-shadow: 0 0 4px var(--color-primary-light);
  }

  .delete-btn :global(svg) {
    color: var(--color-text-tertiary);
    transition: color 0.12s ease;
  }

  /* Delete: only the icon color changes, no background at all */
  .delete-btn:hover :global(svg) {
    color: var(--color-danger) !important;
  }
</style>
