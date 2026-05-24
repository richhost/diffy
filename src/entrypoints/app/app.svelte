<script lang="ts">
  import { onMount } from "svelte";
  import Loader4 from "@tabler/icons-svelte-runes/icons/loader-4";
  import { graphStore } from "~/stores/graph.svelte";
  import { SvelteFlow, Background, MiniMap, Controls, Panel } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";
  import Plus from "@tabler/icons-svelte-runes/icons/plus";
  import Download from "@tabler/icons-svelte-runes/icons/download";
  import Upload from "@tabler/icons-svelte-runes/icons/upload";
  import JsonNode from "~/components/json-node.svelte";
  import DiffEdge from "~/components/diff-edge.svelte";
  import JsonEditorDialog from "@/components/json-editor-dialog.svelte";
  import JsonDiffDialog from "@/components/json-diff-dialog.svelte";

  const nodeTypes = { json: JsonNode };
  const edgeTypes = { diff: DiffEdge };


  onMount(() => {
    graphStore.init();
  });

  const isEmpty = $derived(graphStore.nodes.length === 0);

  function handleAddNode() {
    graphStore.addNode({
      x: window.innerWidth / 2 - 100,
      y: window.innerHeight / 2 - 50,
    });
  }

  function handleExport() {
    const json = graphStore.exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diffy-graph.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        graphStore.importJSON(text);
      } catch (err) {
        alert("Invalid JSON graph format");
      }
    };
    input.click();
  }
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
      <Panel position="top-left" class="flex gap-2 mt-2 ml-2">
        <button
          onclick={handleAddNode}
          class="flex items-center gap-1.5 px-3 py-1.5 bg-[#0b0c0e]/95 border border-white/[0.08] hover:border-neutral-500/50 text-neutral-300 hover:text-white rounded-md shadow-lg transition-all cursor-pointer text-[11px] font-semibold"
        >
          <Plus class="size-3.5" />
          Add Node
        </button>
        <button
          onclick={handleImport}
          class="flex items-center gap-1.5 px-3 py-1.5 bg-[#0b0c0e]/95 border border-white/[0.08] hover:border-neutral-500/50 text-neutral-300 hover:text-white rounded-md shadow-lg transition-all cursor-pointer text-[11px] font-semibold"
        >
          <Upload class="size-3.5" />
          Import
        </button>
        <button
          onclick={handleExport}
          class="flex items-center gap-1.5 px-3 py-1.5 bg-[#0b0c0e]/95 border border-white/[0.08] hover:border-neutral-500/50 text-neutral-300 hover:text-white rounded-md shadow-lg transition-all cursor-pointer text-[11px] font-semibold"
        >
          <Download class="size-3.5" />
          Export
        </button>
      </Panel>

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
<JsonDiffDialog />
