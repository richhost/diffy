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
      // Validate that both nodes have valid JSON
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

<!-- Renders the flow connection path -->
<BaseEdge path={edgePath} {markerEnd} {markerStart} {style} />

<!-- Renders the HTML diff badge over the connection center -->
<EdgeLabel x={labelX} y={labelY}>
  <div
    class="nodrag nopan flex items-center bg-[#0b0c0e]/95 border border-white/[0.08] hover:border-neutral-500/50 rounded-full p-1 shadow-md shadow-black/80 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 ease-out"
  >
    <!-- Diff Viewer Button -->
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
      class="group px-2.5 py-1 text-neutral-300 hover:text-white disabled:opacity-40 disabled:hover:text-neutral-300 text-[10px] font-semibold transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
    >
      <span class="group-hover:text-cyan-400">Diff</span>
      {#if !isValid}
        <span class="text-red-400/80 font-normal">invalid JSON</span>
      {/if}
    </button>

    <!-- Divider -->
    <div class="w-[1px] h-3 bg-white/[0.08] mx-0.5"></div>

    <!-- Delete Edge Button -->
    <button
      onclick={() => graphStore.deleteEdge(id)}
      class="w-5 h-5 grid place-items-center text-neutral-400 hover:text-red-400 hover:bg-red-950/30 rounded-full transition-all cursor-pointer"
      aria-label="Delete Edge"
    >
      <Trash class="size-3" />
    </button>
  </div>
</EdgeLabel>
