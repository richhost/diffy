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
  <div class="pill nodrag nopan flex items-center bg-white rounded-full">
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
      class="compare-btn px-3.5 py-2 text-[11px] font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 transition-opacity duration-150"
      style="color: {isValid ? '#0071e3' : '#aeaeb2'};"
    >
      {isValid ? "Compare" : "Invalid JSON"}
    </button>

    <!-- Divider -->
    <div class="w-px h-3 bg-black/8 flex-none"></div>

    <!-- Delete button — icon color only, no background -->
    <button
      onclick={() => graphStore.deleteEdge(id)}
      class="delete-btn w-9 h-9 grid place-items-center cursor-pointer transition-colors duration-150"
      aria-label="Delete Edge"
    >
      <Trash class="size-3 text-[#c7c7cc]" />
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
      0 2px 10px rgba(0, 0, 0, 0.09),
      0 0 0 0.5px rgba(0, 0, 0, 0.07);
  }

  /* Compare: hover slightly darkens the text, no background */
  .compare-btn:hover:not(:disabled) {
    color: #0064cc !important;
  }

  /* Delete: only the icon color changes, no background at all */
  .delete-btn:hover :global(svg) {
    color: #ff3b30 !important;
  }
</style>
