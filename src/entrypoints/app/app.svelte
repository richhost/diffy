<script lang="ts">
  import { onMount } from "svelte";
  import Loader4 from "@tabler/icons-svelte-runes/icons/loader-4";
  import X from "@tabler/icons-svelte-runes/icons/x";
  import { graphStore } from "~/stores/graph.svelte";
  import {
    SvelteFlow,
    Background,
    MiniMap,
    Controls,
    Panel,
    addEdge,
  } from "@xyflow/svelte";
  import type { Connection } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";
  import Plus from "@tabler/icons-svelte-runes/icons/plus";
  import Download from "@tabler/icons-svelte-runes/icons/download";
  import Upload from "@tabler/icons-svelte-runes/icons/upload";
  import JsonNode from "~/components/json-node.svelte";
  import DiffEdge from "~/components/diff-edge.svelte";
  import JsonEditorDialog from "@/components/json-editor-dialog.svelte";
  import JsonDiffDialog from "@/components/json-diff-dialog.svelte";
  import { helpStore } from "~/stores/help.svelte";
  import HelpDialog from "@/components/help-dialog.svelte";
  import HelpCircle from "@tabler/icons-svelte-runes/icons/help-circle";

  const nodeTypes = { json: JsonNode };
  const edgeTypes = { diff: DiffEdge };

  $effect(() => {
    graphStore.init();
    helpStore.init();
  });

  const isEmpty = $derived(graphStore.nodes.length === 0);

  let viewport = $state({ x: 0, y: 0, zoom: 1 });
  let spawnCount = 0;

  function handleAddNode() {
    const offset = (spawnCount % 6) * 30;
    spawnCount++;

    const x =
      (window.innerWidth / 2 - 128 - viewport.x) / viewport.zoom + offset;
    const y =
      (window.innerHeight / 2 - 80 - viewport.y) / viewport.zoom + offset;
    graphStore.addNode({ x, y });
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
  function handleConnect(connection: Connection) {
    graphStore.setEdges(
      addEdge(
        { ...connection, type: "diff", animated: true },
        graphStore.edges,
      ),
    );
  }
  function handleNodeDragStop() {
    graphStore.setNodes(graphStore.nodes);
  }
</script>

<div class="w-screen h-screen">
  {#if graphStore.loading}
    <div class="absolute inset-0 pointer-events-none grid place-items-center">
      <Loader4 class="size-5 animate-spin text-[#aeaeb2]" />
    </div>
  {:else}
    <SvelteFlow
      proOptions={{ hideAttribution: true }}
      colorMode="light"
      bind:nodes={graphStore.nodes}
      bind:edges={graphStore.edges}
      bind:viewport
      {nodeTypes}
      {edgeTypes}
      onconnect={handleConnect}
      onnodedragstop={handleNodeDragStop}
      fitView
      fitViewOptions={{ maxZoom: 1.0, padding: 0.1 }}
      defaultEdgeOptions={{ type: "diff", animated: true }}
    >
      <Background gap={24} size={1} />
      <MiniMap />
      <Controls />

      <!-- Toolbar pill -->
      <Panel position="top-left" class="mt-4 ml-4">
        <div
          class="flex items-center bg-surface rounded-md shadow-[0_2px_8px_var(--color-shadow),0_0_0_0.5px_var(--color-border)] overflow-hidden"
        >
          <button
            onclick={handleAddNode}
            class="flex items-center gap-1.5 px-4 py-2 text-text-primary hover:bg-neutral-bg transition-colors duration-150 cursor-pointer text-[12px] font-medium tracking-tight"
          >
            <Plus class="size-3.5 text-primary" />
            Add Node
          </button>
          <div class="w-px h-4 bg-border"></div>
          <button
            onclick={handleImport}
            class="flex items-center gap-1.5 px-4 py-2 text-text-primary hover:bg-neutral-bg transition-colors duration-150 cursor-pointer text-[12px] font-medium tracking-tight"
          >
            <Upload class="size-3.5 text-text-secondary" />
            Import
          </button>
          <div class="w-px h-4 bg-border"></div>
          <button
            onclick={handleExport}
            class="flex items-center gap-1.5 px-4 py-2 text-text-primary hover:bg-neutral-bg transition-colors duration-150 cursor-pointer text-[12px] font-medium tracking-tight"
          >
            <Download class="size-3.5 text-text-secondary" />
            Export
          </button>
          <div class="w-px h-4 bg-border"></div>
          <button
            onclick={() => helpStore.openHelp()}
            class="flex items-center gap-1.5 px-4 py-2 text-text-primary hover:bg-neutral-bg transition-colors duration-150 cursor-pointer text-[12px] font-medium tracking-tight"
          >
            <HelpCircle class="size-3.5 text-text-secondary" />
            Help
          </button>
        </div>
      </Panel>

      {#if isEmpty}
        <div
          class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          <p class="text-[13px] text-text-secondary text-center leading-relaxed">
            Click <span class="text-text-primary font-medium">Add Node</span>
            to get started.<br />
            Connect two nodes to compare a
            <span class="text-text-primary font-medium">JSON diff</span>.
          </p>
        </div>
      {/if}
    </SvelteFlow>
  {/if}
</div>
<JsonEditorDialog />
<JsonDiffDialog />
<HelpDialog />

{#if graphStore.showUndoToast}
  <div
    class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 bg-text-primary text-surface rounded-md shadow-[0_4px_16px_var(--color-shadow),0_0_0_0.5px_var(--color-border)] animate-in fade-in slide-in-from-bottom-4 duration-200"
  >
    <span class="text-[12px] font-medium tracking-tight">Node deleted</span>
    <div class="w-px h-3 bg-surface opacity-20"></div>
    <button
      onclick={() => graphStore.restoreLastDeleted()}
      class="text-[12px] font-bold text-primary hover:underline cursor-pointer transition-colors duration-150"
    >
      Undo
    </button>
    <button
      onclick={() => graphStore.dismissUndoToast()}
      class="text-text-tertiary hover:text-surface ml-1 cursor-pointer transition-colors duration-150 p-0.5 rounded-full hover:bg-white/10"
      aria-label="Dismiss"
    >
      <X class="size-3" />
    </button>
  </div>
{/if}
