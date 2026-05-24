<script lang="ts">
  import { onMount } from "svelte";
  import Loader4 from "@tabler/icons-svelte-runes/icons/loader-4";
  import { graphStore } from "~/stores/graph.svelte";
  import { SvelteFlow, Background, MiniMap, Controls } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";
  import JsonNode from "~/components/json-node.svelte";
  import DiffEdge from "~/components/diff-edge.svelte";
  import JsonEditorDialog from "@/components/json-editor-dialog.svelte";

  const nodeTypes = { json: JsonNode };
  const edgeTypes = { diff: DiffEdge };

  onMount(() => {
    graphStore.init();
  });

  const isEmpty = $derived(graphStore.nodes.length === 0);
</script>

<div class="w-screen h-screen">
  {#if graphStore.loading}
    <div class="absolute inset-0 pointer-events-none grid place-items-center">
      <Loader4 class="size-6 animate-spin" />
    </div>
  {:else}
    <SvelteFlow
      proOptions={{ hideAttribution: true }}
      colorMode="dark"
      bind:nodes={graphStore.nodes}
      bind:edges={graphStore.edges}
      {nodeTypes}
      {edgeTypes}
      fitView
      defaultEdgeOptions={{ type: "diff", animated: true }}
    >
      <Background />
      <MiniMap />
      <Controls />

      {#if isEmpty}
        <div
          class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div>⬡</div>
          <h2>No nodes yet</h2>
          <p class="text-center leading-relaxed">
            Click <strong class="text-neutral-50">Add Node</strong> to get
            started.
            <br />
            Connect two nodes to view a
            <span class="font-semibold text-neutral-50">JSON diff</span>
          </p>
        </div>
      {/if}
    </SvelteFlow>
  {/if}
</div>
<JsonEditorDialog />
